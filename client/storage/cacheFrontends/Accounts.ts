import { NixieStorage } from '../NixieStorage';
import { clientEmitter } from '../../emitters/comms';
import { clientEmitterAction } from '../../emitters/clientEmitterAction';
import { CollectionCache } from '../types/CollectionCache';
import { Account } from './types/Account';

const storage = new NixieStorage();

type ObjectOfStrings = {
  [key: string]: string,
};

class Accounts {
  /**
   * @return {CollectionCache}
   */
  static getAccountCollection(): CollectionCache | undefined {
    return storage.accountCollectionCache;
  }

  /**
   * Returns the first local account matching the specified public name, or
   * null if the requested name does not exist.
   */
  static findAccountByPublicName({ publicName }: ObjectOfStrings): Account | null {
    const collection = Accounts.getAccountCollection();
    if (!collection) {
      return null;
    }

    const accounts = collection.asArray;
    for (let i = 0, len = accounts.length; i < len; i++) {
      const account: Account = accounts[i];
      if (account.publicName === publicName) {
        return account;
      }
    }
    return null;
  }

  /**
   * Returns the first local account matching the specified id, or null if the
   * requested name does not exist.
   */
  static findAccountById({ id }): Account | null {
    const collection = Accounts.getAccountCollection();
    if (!collection) {
      return null;
    }

    const accounts = collection.asArray;
    for (let i = 0, len = accounts.length; i < len; i++) {
      const account: Account = accounts[i];
      if (account.accountId === id) {
        return account;
      }
    }
    return null;
  }

  static getActiveAccount(): Account | null {
    const lastActiveAccount = storage.lastActiveAccount;
    if (!lastActiveAccount) {
      return null;
    }
    const collection = Accounts.getAccountCollection();
    if (!collection) {
      return null;
    }
    return collection.entryByName[lastActiveAccount];
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
      clientEmitter.emit(clientEmitterAction.reloadApp);
    }
  }
}

window.$nixieDebugUtils.accounts = Accounts;

export {
  Accounts,
};
