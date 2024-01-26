import { StorageProxy } from './StorageProxy';
import { CollectionCache } from './types/CollectionCache';
import { get256RandomBits, sha256 } from '../utils';

let instance: NixieStorage | null = null;

let NX: typeof NixieStorage;

class NixieStorage extends StorageProxy {
  static DEVICE_TAG_KEY = 'device_tag';
  static ACCOUNT_COLLECTION_KEY = 'account_collection';
  static LAST_ACTIVE_ACCOUNT_KEY: string | null = 'last_active_account';
  static SETTINGS_KEY = 'settings_collection';

  initialized!: boolean;
  lastActiveAccount!: string;
  accountCollectionCache!: CollectionCache;
  settingsCache!: object | null;

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
    // Ensure all root keys exist upfront.
    await this.createKeyIfNotExists(NX.DEVICE_TAG_KEY, null);
    await this.createKeyIfNotExists(NX.LAST_ACTIVE_ACCOUNT_KEY, '');
    await this.createKeyIfNotExists(NX.ACCOUNT_COLLECTION_KEY, {});

    // Set up default values.
    await this.buildAccountCollectionCache();
    await this.fetchSettings();

    // Conclude.
    this.initialized = true;
    return this;
  }

  async _autoSetLastActiveAccount() {
    this.lastActiveAccount = await this.fetchItem(NX.LAST_ACTIVE_ACCOUNT_KEY);
    if (!this.lastActiveAccount && this.accountCollectionCache.length) {
      this.lastActiveAccount = this.accountCollectionCache.allEntryNames[0];
      await this.writeItem(NX.LAST_ACTIVE_ACCOUNT_KEY as string, this.lastActiveAccount);
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

  async writeAccount({
    accountName,
    personalName,
    publicName,
    keyPair: { privateKey, publicKey },
    overwrite = false,
  }) {
    if (!this.passesChecks) {
      return false;
    }
    const accounts = await this.fetchAccountStore();
    if (accounts[accountName] && !overwrite) {
      console.error(`Account with name '${accountName}' already exists.`);
      return;
    }

    // This is a way of uniquely identifying the account without needing the
    // crazy big sizes of the actual keys. The modulus is a public number that
    // uniquely identifies key pairs; we just shorten it a tad using SHA-256.
    const modulusHash = await sha256((await crypto.subtle.exportKey(
      'jwk', publicKey,
    )).n, false);

    accounts[accountName] = {
      accountName,
      accountId: get256RandomBits(),
      personalName,
      publicName,
      publicKey,
      privateKey,
      modulusHash,
      contacts: new CollectionCache(),
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

  async writeSettings(settings: object) {
    this.settingsCache = settings;
    await this.writeItem(NX.SETTINGS_KEY, settings);
  }
}

NX = NixieStorage;

export {
  NixieStorage,
};
