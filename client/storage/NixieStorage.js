import { StorageProxy } from './StorageProxy';
import { CollectionCache } from './CollectionCache';

let instance = null;

let NX;

class NixieStorage extends StorageProxy {
  static ACCOUNT_COLLECTION_KEY = 'account_collection';
  static LAST_ACTIVE_ACCOUNT_KEY = 'last_active_account';
  static SETTINGS_KEY = 'settings_collection';

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
    this.settingsCache = null;

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
    await this.fetchSettings();
    this.initialized = true;
    return this;
  }

  async _autoSetLastActiveAccount() {
    this.lastActiveAccount = await this.fetchItem(NX.LAST_ACTIVE_ACCOUNT_KEY);
    if (!this.lastActiveAccount && this.accountCollectionCache.length) {
      this.lastActiveAccount = this.accountCollectionCache.allEntryNames[0];
      await this.writeItem(NX.LAST_ACTIVE_ACCOUNT_KEY, this.lastActiveAccount);
    }
  }

  async fetchAccountStore() {
    if (!this.passesChecks) {
      return null;
    }
    const accounts = await this.fetchItem(NX.ACCOUNT_COLLECTION_KEY);
    this.accountCollectionCache.updateCache(accounts);
    return accounts;
  }

  async buildAccountCollectionCache() {
    await this.fetchAccountStore();
    await this._autoSetLastActiveAccount();
    return this.accountCollectionCache;
  }

  async writeAccount(accountName, { privateKey, publicKey }, overwrite = false) {
    if (!this.passesChecks) {
      return false;
    }
    const accounts = await this.fetchAccountStore();
    if (accounts[accountName] && !overwrite) {
      console.error(`Account with name '${accountName}' already exists.`);
      return;
    }

    accounts[accountName] = {
      accountName, privateKey, publicKey, contacts: new CollectionCache(),
    };

    this.accountCollectionCache.updateCache(accounts);
    await this.writeItem(NX.ACCOUNT_COLLECTION_KEY, accounts);
    return true;
  }

  async fetchAccountContacts() {
    const accounts = await this.buildAccountCollectionCache();
  }

  async fetchSettings() {
    this.settingsCache = await this.fetchItem(NX.SETTINGS_KEY) || {};
    return this.settingsCache;
  }

  async writeSettings(settings) {
    this.settingsCache = settings;
    await this.writeItem(NX.SETTINGS_KEY, settings);
  }
}

NX = NixieStorage;

export {
  NixieStorage,
};
