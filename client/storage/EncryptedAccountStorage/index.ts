import getDbByPlatform from './driver';
import {
  StoreInterface,
  InitialStoreParamCreateAccount,
} from './types/StoreInterface';
import {
  get256RandomBits,
  getRandomBits,
  sha256,
} from '../../utils';
import { aesGcmDecrypt, aesGcmEncrypt } from '../../encryption/crypto-aes-gcm';
import {
  exportRsaPrivateKey,
  exportRsaPublicKey, importRsaPrivateKey,
  importRsaPublicKey,
} from '../../encryption/rsa';
import { Settings } from '../cacheFrontends/Settings';
import { getPasswordStore } from './getPasswordStore';
import { clientEmitterAction } from '../../emitters/clientEmitterAction';
import { clientEmitter, initServerConnection } from '../../emitters/comms';
import { AccountCache } from './types/AccountCache';

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

  async createAccount(options: InitialStoreParamCreateAccount) {
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

    const blob = {
      ...options,
      accountId: get256RandomBits(true) as string,
      publicKey: await exportRsaPublicKey(keyPair, 'pem'),
      privateKey: await exportRsaPrivateKey(keyPair, 'pem'),
      privateContactIdSalt: getRandomBits(768, true) as string,
      privateChatIdSalt: getRandomBits(768, true) as string,
    };

    // Encrypt the account info.
    const accountBlob = await aesGcmEncrypt(
      options.password,
      JSON.stringify(blob),
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
          passwordStore: getPasswordStore(),
        };
        this._accountCaches[accountName] = accountCache;
      }

      if (accountCache.passwordStore.isPasswordSet()) {
        // We're already logged in. Skip.
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
      );
      account.decryptedData.privateKey = await importRsaPrivateKey(
        account.decryptedData.privateKey, 'pem',
      );

      account.passwordStore.setPassword(password);
      this.loginCount++;
      // This function is idempotent; it does nothing on duplicate calls.
      initServerConnection();
      return true;
    }
    return false;
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
    return null;
  }

  addContact() {
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
