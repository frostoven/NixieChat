import { NixieStorage } from '../NixieStorage';
import { clientEmitter } from '../../emitters/comms';
import { clientEmitterAction } from '../../emitters/clientEmitterAction';

const storage = new NixieStorage();

class Accounts {
  /**
   * @return {CollectionCache}
   */
  static getAccountCollection() {
    return storage.accountCollectionCache;
  }

  // Returns the first local account matching the specified public name, or
  // null if the requested name does not exist.
  static findAccountByPublicName({ publicName }) {
    const accounts = Accounts.getAccountCollection().asArray;
    for (let i = 0, len = accounts.length; i < len; i++) {
      const account = accounts[i];
      if (account.publicName === publicName) {
        return account;
      }
    }
    return null;
  }

  /**
   * @returns {{
   *   accountName: string,
   *   personalName: string,
   *   publicName: string,
   *   contacts: CollectionCache,
   *   privateKey: CryptoKey,
   *   publicKey: CryptoKey
   * }|null}
   */
  static getActiveAccount() {
    const lastActiveAccount = storage.lastActiveAccount;
    if (!lastActiveAccount) {
      return null;
    }
    return Accounts.getAccountCollection().entryByName[lastActiveAccount];
  }

  static async createAccount({
    accountName,
    personalName,
    publicName,
    keyPair,
    overwrite = false,
    updateUi = false,
  }) {
    await storage.writeAccount({
      accountName,
      personalName,
      publicName,
      keyPair,
      overwrite,
    });
    if (updateUi) {
      clientEmitter.emit(clientEmitterAction.hardReloadApp);
    }
  }
}

export {
  Accounts,
};
