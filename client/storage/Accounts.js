import { NixieStorage } from './NixieStorage';
import { clientEmitter } from '../emitters/comms';
import { clientEmitterAction } from '../emitters/clientEmitterAction';

const storage = new NixieStorage();

class Accounts {
  static getAccounts() {
    return storage.accountCollectionCache;
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
