import { StorageProxy } from './StorageProxy';

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

    this.accountCollectionCache = {
      accountByName: {},
      length: 0,
      asArray: [],
      accountNames: [],
    };

    this.initialized = false;
  }

  async initStorage() {
    await this.createKeyIfNotExists(NX.ACCOUNT_COLLECTION_KEY, {});
    this.initialized = true;
    return this;
  }

  _updateAccountCollectionCache(accountCollection) {
    const asArray = Object.values(accountCollection);
    this.accountCollectionCache = {
      accountByName: accountCollection,
      length: asArray.length,
      asArray,
      accountNames: Object.keys(accountCollection),
    };
  }

  async getAccountStore() {
    if (!this.initialized) {
      return console.error('NixieStorage queried before initialization.');
    }
    const accounts = await this.getItem(NX.ACCOUNT_COLLECTION_KEY);
    this._updateAccountCollectionCache(accounts);
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

    this._updateAccountCollectionCache(accounts);
    await this.setItem(NX.ACCOUNT_COLLECTION_KEY, accounts);
  }
}

NX = NixieStorage;

export {
  NixieStorage,
};
