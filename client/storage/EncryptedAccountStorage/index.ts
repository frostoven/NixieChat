import getDbByPlatform from './driver';
import {
  StoreInterface,
  AccountCreationParamsSignature,
} from './types/StoreInterface';
import {
  sha256,
  getRandomBits,
  get256RandomBits,
  mergeUint8Arrays,
  stringToArrayBuffer,
  arrayBufferToString,
} from '../../utils';
import { aesGcmDecrypt, aesGcmEncrypt } from '../../encryption/crypto-aes-gcm';
import {
  exportRsaPrivateKey,
  exportRsaPublicKey,
  importRsaPrivateKey,
  importRsaPublicKey,
} from '../../encryption/rsa';
import { Settings } from '../cacheFrontends/Settings';
import { getPasswordStore } from './getPasswordStore';
import { clientEmitterAction } from '../../emitters/clientEmitterAction';
import { clientEmitter, initServerConnection } from '../../emitters/comms';
import { AccountCache } from './types/AccountCache';
import { InvitationInfo } from '../../api/types/InvitationInfo';
import { ContactCache, DecryptedContactData } from './types/ContactCache';

let singletonInstance: EncryptedAccountStorage;

/**
 * Used for storing and retrieving Account details.
 */
class EncryptedAccountStorage /*implements StoreInterface*/ {
  dbStore: StoreInterface | null = null;

  // Amount of accounts currently logged in.
  loginCount = 0;
  // Total amount of accounts, either encrypted or not.
  totalAccounts = 0;

  private _activeAccount: string | null = null;
  // Stores all accounts, both decrypted and pending decryption.
  private _accountCaches: { [key: string]: AccountCache } = {};
  // Stores all contacts, both decrypted and pending decryption.
  private _contactCaches: {
    [accountName: string]: { [internalContactId: string]: ContactCache }
  } = {};

  constructor() {
    if (singletonInstance) {
      return singletonInstance;
    }
    else {
      singletonInstance = this;
    }
  }

  async prepareAccountsStore() {
    if (this.dbStore) {
      return;
    }
    const DbConnector = await getDbByPlatform();
    this.dbStore = new DbConnector();
    await this.dbStore.prepareAccountsStore();
  }

  async createAccount(options: AccountCreationParamsSignature) {
    if (!options.password) {
      // When the user chooses to not have an account password, we just use
      // "0000". It's as insecure as not having a password, but offers more
      // transparent code use. Also ensures people don't pick passwordless for
      // speed improvements alone (which is ridiculous anyway; it takes on
      // average 0.7ms for an account to decrypt on my 2019 era laptop, or
      // 0.4ms post-boot).
      options.password = '0000';
      await Settings.setOneOrMoreAccountsUnencrypted(true);
    }

    // This is a way of uniquely identifying the account without needing the
    // crazy big sizes of the actual keys. The modulus is a public number that
    // uniquely identifies key pairs; we just shorten it a tad using SHA-256.
    const modulusHash = await sha256((await crypto.subtle.exportKey(
      'jwk', options.publicKey,
    )).n, true);

    const keyPair = {
      publicKey: options.publicKey,
      privateKey: options.privateKey,
    };

    const accountInfo = {
      ...options,
      accountId: get256RandomBits(true) as string,
      publicKey: await exportRsaPublicKey(keyPair, 'pem'),
      privateKey: await exportRsaPrivateKey(keyPair, 'pem'),
      contactDetachableId: getRandomBits(256, true) as string,
      privateContactIdSalt: arrayBufferToString(getRandomBits(768, false)),
      privateChatIdSalt: arrayBufferToString(getRandomBits(768, false)),
      modulusHash,
    };

    // Encrypt the account info.
    const accountBlob = await aesGcmEncrypt(
      options.password,
      JSON.stringify(accountInfo),
    );

    await this.dbStore!.createAccount({
      accountName: options.accountName,
      encryptedAccountBlob: accountBlob.ciphertext,
      encryptedAccountIv: accountBlob.iv,
    });

    // Make the root node re-read all accounts.
    clientEmitter.emit(clientEmitterAction.reloadApp);
  }

  // Checks which (if any) accounts are passwordless, and creates an object
  // with information about each account's decryption status.
  async autoLoadAllAccounts() {
    if (!this.dbStore) {
      return console.error(
        '[EncryptedAccountStorage] account auto-load failed: Database not ' +
        'ready.',
      );
    }

    const accounts = await this.dbStore.getAllEncryptedAccounts();
    if (!accounts) {
      // We will always get an array even if we have no accounts. A falsy value
      // means something went wrong.
      return console.error(
        '[EncryptedAccountStorage] account auto-load failed: Invalid ' +
        'response.',
      );
    }

    this.totalAccounts = accounts.length;
    const oneOrMoreAccountsUnencrypted = Settings.oneOrMoreAccountsUnencrypted();

    this.loginCount = 0;

    // this._accountCaches = accounts;
    for (let i = 0, len = accounts.length; i < len; i++) {
      const {
        accountName, encryptedAccountBlob, encryptedAccountIv,
      } = accounts[i];

      let accountCache = this._accountCaches[accountName];
      if (!accountCache) {
        accountCache = {
          accountName,
          encryptedAccountBlob,
          encryptedAccountIv,
          decryptedData: null,
          accountPasswordStore: getPasswordStore(),
          contactPasswordStore: getPasswordStore(),
        };
        this._accountCaches[accountName] = accountCache;
      }

      if (accountCache.accountPasswordStore.isPasswordSet()) {
        // We're already logged in. Just do the contacts. We do this one at a
        // time (via await) because we don't yet have threaded support and
        // probably shouldn't overwhelm the main thread with burst unlocks.
        // TODO: Thread me, maybe via the comlink library.
        await this.decryptAllAccountContacts(accountCache);
        this.loginCount++;
        continue;
      }

      if (oneOrMoreAccountsUnencrypted || true) {
        // If the user chose to skip password setup for one or more accounts,
        // then we check for that here. When the user skips setting a password,
        // the application uses '0000' as a password instead of nothing.
        try {
          await this.attemptAccountDecryption({
            accountName,
            password: '0000',
          });
        }
        catch (error) {
          console.error(error);
        }
      }
    }
  }

  // TODO: rename to decryptAccount.
  async attemptAccountDecryption({
    accountName, password,
  }: {
    accountName: string, password: string,
  }) {
    const account = this._accountCaches[accountName];
    const {
      encryptedAccountBlob,
      encryptedAccountIv,
    } = account;

    let decryptedData: string | null = await aesGcmDecrypt(
      password,
      encryptedAccountBlob,
      encryptedAccountIv,
      true,
    );

    if (decryptedData !== null) {
      try {
        account.decryptedData = JSON.parse(
          decryptedData,
        );
      }
      catch (error) {
        console.error(error);
        return false;
      }

      if (!account.decryptedData) {
        console.error(`Failed to decrypt "${accountName}" - skipping.`);
        return false;
      }

      // Convert stored PEM keys to CryptoKey.
      account.decryptedData.publicKey = await importRsaPublicKey(
        account.decryptedData.publicKey, 'pem',
      ) as CryptoKey;
      account.decryptedData.privateKey = await importRsaPrivateKey(
        account.decryptedData.privateKey, 'pem',
      ) as CryptoKey;

      // Retrieve stringified array buffers.
      account.decryptedData.modulusHash = stringToArrayBuffer(
        account.decryptedData.modulusHash,
      );
      account.decryptedData.privateContactIdSalt = stringToArrayBuffer(
        account.decryptedData.privateContactIdSalt,
      );
      account.decryptedData.privateChatIdSalt = stringToArrayBuffer(
        account.decryptedData.privateChatIdSalt,
      );

      account.accountPasswordStore.setPassword(password);
      account.contactPasswordStore.setPassword(await sha256(mergeUint8Arrays([
        stringToArrayBuffer(password),
        account.decryptedData.privateContactIdSalt,
      ]), true) as string);

      // Without our contacts we are nothing :'). Intentionally load contacts
      // before initiating server connection, we don't want a blank account if
      // contacts fail to load. We can possibly offer key recovery in the event
      // of destroyed contact data.
      await this.decryptAllAccountContacts(account);

      this.loginCount++;
      // This function is idempotent; it does nothing on duplicate calls.
      initServerConnection();

      const publicName = account.decryptedData.publicName;
      if (account.decryptedData.publicName) {
        console.log(`➤ Unlocked account with public name ${publicName}`);
      }
      return true;
    }
    return false;
  }

  async decryptAllAccountContacts(account: AccountCache): Promise<boolean> {
    if (!account.decryptedData) {
      console.error(
        'Cannot decrypt contacts - specified account is not unlocked:',
        account,
      );
      return false;
    }

    const contacts = await this.dbStore?.getAllContactsByOwner({
      contactDetachableId: account.decryptedData.contactDetachableId,
    });

    for (let i = 0, len = contacts.length; i < len; i++) {
      const contact: ContactCache = contacts[i];
      const decryptedText = await account.contactPasswordStore.decryptAes256Gcm(
        contact.encryptedContactBlob,
        contact.encryptedContactIv,
        false,
      ) as string;

      let decryptedData: DecryptedContactData;
      try {
        decryptedData = JSON.parse(decryptedText);
      }
      catch (error) {
        console.error(
          'Could not load a contact. Data appears to be corrupted. Error:',
          error,
        );
        continue;
      }

      const {
        initialName,
        internalContactId,
        contactPubKey,
        privateChatIdSalt,
        sharedSalt,
        initialSharedSecret,
      } = decryptedData;

      // Check the data.
      if (contact.contactDetachableId !== account.decryptedData.contactDetachableId) {
        // TODO: Save back to the DB and alert the user.
        console.warn(
          `Contact ("${initialName}") has an invalid detachable ID. Fixing.`,
        );
        decryptedData.chatDetachableId = account.decryptedData.contactDetachableId;
      }
      if (!contactPubKey || !privateChatIdSalt || !sharedSalt || !initialSharedSecret) {
        console.error(
          `Contact "${initialName}" is missing one or more required fields.`,
        );
        continue;
      }

      // Convert stored PEM key to CryptoKey.
      decryptedData.contactPubKey = await importRsaPublicKey(
        decryptedData.contactPubKey, 'pem',
      ) as CryptoKey;

      // Retrieve stringified array buffers.
      decryptedData.privateChatIdSalt = stringToArrayBuffer(
        decryptedData.privateChatIdSalt,
      );
      decryptedData.initialSharedSecret = stringToArrayBuffer(
        decryptedData.initialSharedSecret,
      );
      decryptedData.sharedSalt = stringToArrayBuffer(
        decryptedData.sharedSalt,
      );

      contact.decryptedData = decryptedData;
      this._contactCaches[account.accountName] = {
        [internalContactId]: contact,
      };
    }

    return true;
  }

  getAllAccounts() {
    return this._accountCaches;
  }

  getAllAccountsAsArray() {
    return Object.values(this._accountCaches);
  }

  getAllAccountNames() {
    return Object.keys(this._accountCaches);
  }

  getActiveAccount() {
    if (this._activeAccount === null) {
      return null;
    }
    return this._accountCaches[this._activeAccount];
  }

  setActiveAccount(accountName: string) {
    this._activeAccount = accountName;
  }

  findAccountById({ id }: { id: string }) {
    const accounts = this.getAllAccountsAsArray();
    for (let i = 0, len = accounts.length; i < len; i++) {
      const account = accounts[i];
      if (account.decryptedData?.accountId === id) {
        return account;
      }
    }
    console.warn('could not find id', id);
    return null;
  }

  /**
   * Add a contact.
   * @param info
   * @return - Returns false if the contact could not be stored.
   */
  async addContact(info: InvitationInfo): Promise<boolean> {
    if (info.error) {
      // This point shouldn't be reachable, but we add it just in case the UI
      // missed an error somewhere. Note: info.reportFatalError() forwards
      // errors to the open UI.
      info.reportFatalError('Refusing to store contact: invitation has errors.');
      return false;
    }

    const {
      isOutbound,
      localAccountName,
      localGreetingName,
      contactGreetingName,
      contactPubKey,
      localPubKey,
      initiatorSalt,
      receiverSalt,
      initiatorSocketId,
      receiverSocketId,
      sharedSecret,
    } = info;

    const account = this._accountCaches[localAccountName as string];
    if (!account || !account.decryptedData) {
      info.error = 'Account was relocked. Device memory cleared?';
      return false;
    }

    const publicKey = await importRsaPublicKey(contactPubKey!, 'raw');

    const contactInfo: any = {
      initialName: contactGreetingName,
      internalContactId: getRandomBits(256, true) as string,
      contactPubKey: await exportRsaPublicKey({ publicKey }, 'pem'),
      chatDetachableId: getRandomBits(256, true) as string,
      privateChatIdSalt: arrayBufferToString(getRandomBits(768, false)),
      initialSharedSecret: arrayBufferToString(sharedSecret!),
    };

    // This generated only once for each new contact; may as well go ham.
    contactInfo.sharedSalt = await sha256(mergeUint8Arrays([
      stringToArrayBuffer(isOutbound ? contactGreetingName : localGreetingName),
      stringToArrayBuffer(isOutbound ? localGreetingName : contactGreetingName),
      stringToArrayBuffer(initiatorSocketId),
      stringToArrayBuffer(receiverSocketId),
      isOutbound ? contactPubKey! : localPubKey!,
      isOutbound ? localPubKey! : contactPubKey!,
      initiatorSalt!,
      receiverSalt!,
    ]), true) as string;

    // Encrypt the account info.
    const contactBlob = await account.contactPasswordStore.encryptAes256Gcm(
      JSON.stringify(contactInfo),
    );

    return await this.dbStore!.addContact({
      contactDetachableId: account.decryptedData.contactDetachableId,
      encryptedContactBlob: contactBlob?.ciphertext,
      encryptedContactIv: contactBlob?.iv,
    });
  }

  getAccountsStore() {
  }

  getAccountByPublicName() {
  }

  findAccountByPublicName({ publicName }) {
    const accounts = this.getAllAccountsAsArray();
    for (let i = 0, len = accounts.length; i < len; i++) {
      const account = accounts[i];
      if (account.decryptedData?.publicName === publicName) {
        return account;
      }
    }
    return null;
  }

  retrieveAllContacts() {
  }

  retrieveContactByName() {
  }
}

export {
  EncryptedAccountStorage,
};
