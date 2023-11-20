import { StorageProxy } from './StorageProxy';
import { CollectionCache } from './CollectionCache';

let instance = null;

let NX;

class NixieStorage extends StorageProxy {
  static ACCOUNT_COLLECTION_KEY = 'account_collection';

  constructor() {
    if (!instance) {
      super();
      instance = this;
    }
    else {
      return instance;
    }

    this.accountCollectionCache = new CollectionCache();

    this.initialized = false;
  }

  async initStorage() {
    await this.createKeyIfNotExists(NX.ACCOUNT_COLLECTION_KEY, {});
    this.initialized = true;
    return this;
  }

  async getAccountStore() {
    if (!this.initialized) {
      return console.error('NixieStorage queried before initialization.');
    }
    const accounts = await this.getItem(NX.ACCOUNT_COLLECTION_KEY);
    this.accountCollectionCache.updateCache(accounts);
    return accounts;
  }

  async buildAccountCollectionCache() {
    await this.getAccountStore();
    return this.accountCollectionCache;
  }

  async storeAccount(accountName, { privateKey, publicKey }, overwrite = false) {
    const accounts = await this.getAccountStore();
    if (accounts[accountName] && !overwrite) {
      console.error(`Account with name '${accountName}' already exists.`);
      return;
    }

    accounts[accountName] = {
      accountName, privateKey, publicKey,
    };

    this.accountCollectionCache.updateCache(accounts);
    await this.setItem(NX.ACCOUNT_COLLECTION_KEY, accounts);
  }
}

NX = NixieStorage;

export {
  NixieStorage,
};
