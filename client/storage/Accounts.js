import { NixieStorage } from './NixieStorage';
import { clientEmitter } from '../emitters/comms';
import { clientEmitterAction } from '../emitters/clientEmitterAction';

const storage = new NixieStorage();

class Accounts {
  static getAccountCollection() {
    return storage.accountCollectionCache;
  }


  /**
   * @returns {{
   *   accountName: string,
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

  static async createAccount(accountName, keyPairs, overwrite = false, updateUi = false) {
    await storage.writeAccount(accountName, keyPairs, overwrite);
    if (updateUi) {
      clientEmitter.emit(clientEmitterAction.hardReloadApp);
    }
  }
}

export {
  Accounts,
};
