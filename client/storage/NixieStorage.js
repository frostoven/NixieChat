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
    return await this.getItem(NX.ACCOUNT_COLLECTION_KEY);
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

    await this.setItem(NX.ACCOUNT_COLLECTION_KEY, accounts);
  }
}

NX = NixieStorage;

export {
  NixieStorage,
};
