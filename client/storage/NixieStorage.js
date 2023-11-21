import { StorageProxy } from './StorageProxy';
import { CollectionCache } from './CollectionCache';

let instance = null;

let NX;

class NixieStorage extends StorageProxy {
  static ACCOUNT_COLLECTION_KEY = 'account_collection';
  static LAST_ACTIVE_ACCOUNT_KEY = 'last_active_account';

  constructor() {
    if (!instance) {
      super();
      instance = this;
    }
    else {
      return instance;
    }

    this.lastActiveAccount = '';
    this.accountCollectionCache = new CollectionCache();

    this.initialized = false;
  }

  passesChecks() {
    if (!this.initialized) {
      console.error('NixieStorage queried before initialization.');
      return false;
    }
    return true;
  }

  async initStorage() {
    await this.createKeyIfNotExists(NX.LAST_ACTIVE_ACCOUNT_KEY, '');
    await this.createKeyIfNotExists(NX.ACCOUNT_COLLECTION_KEY, {});
    await this.buildAccountCollectionCache();
    this.initialized = true;
    return this;
  }

  async _autoSetLastActiveAccount() {
    this.lastActiveAccount = await this.getItem(NX.LAST_ACTIVE_ACCOUNT_KEY);
    if (!this.lastActiveAccount && this.accountCollectionCache.length) {
      this.lastActiveAccount = this.accountCollectionCache.allEntryNames[0];
      await this.setItem(NX.LAST_ACTIVE_ACCOUNT_KEY, this.lastActiveAccount);
    }
  }

  async getAccountStore() {
    if (!this.passesChecks) {
      return null;
    }
    const accounts = await this.getItem(NX.ACCOUNT_COLLECTION_KEY);
    this.accountCollectionCache.updateCache(accounts);
    return accounts;
  }

  async buildAccountCollectionCache() {
    await this.getAccountStore();
    await this._autoSetLastActiveAccount();
    return this.accountCollectionCache;
  }

  async storeAccount(accountName, { privateKey, publicKey }, overwrite = false) {
    if (!this.passesChecks) {
      return false;
    }
    const accounts = await this.getAccountStore();
    if (accounts[accountName] && !overwrite) {
      console.error(`Account with name '${accountName}' already exists.`);
      return;
    }

    accounts[accountName] = {
      accountName, privateKey, publicKey, contacts: new CollectionCache(),
    };

    this.accountCollectionCache.updateCache(accounts);
    await this.setItem(NX.ACCOUNT_COLLECTION_KEY, accounts);
    return true;
  }

  async getAccountContacts() {
    const accounts = await this.buildAccountCollectionCache();
  }
}

NX = NixieStorage;

export {
  NixieStorage,
};
