import { NixieStorage } from '../NixieStorage';
import { clientEmitter } from '../../emitters/comms';
import { clientEmitterAction } from '../../emitters/clientEmitterAction';

const storage = new NixieStorage();

class Accounts {
  static getAccountCollection() {
    return storage.accountCollectionCache;
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
