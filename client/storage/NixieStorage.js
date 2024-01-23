import { StorageProxy } from './StorageProxy';
import { CollectionCache } from './types/CollectionCache';
import { get256RandomBits, sha256 } from '../utils';

let instance = null;

let NX;

class NixieStorage extends StorageProxy {
  static DEVICE_TAG_KEY = 'device_tag';
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

    // TODO: consider whether or not we need this. It could maybe be used as a
    //  persistent salt, but it really seems pointless at this stage.
    this.lastKnownDeviceTag = null;
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
    await this.setupDeviceTag();
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

  async setupDeviceTag() {
    const tag = await this.fetchItem(NX.DEVICE_TAG_KEY);
    if (!tag) {
      // The device tag is 64 bits (8 bytes).
      const byteArray = new Uint8Array(8);
      const deviceTag = crypto.getRandomValues(byteArray);
      this.lastKnownDeviceTag = deviceTag;
      await this.writeItem(NX.DEVICE_TAG_KEY, deviceTag);
    }
    else {
      this.lastKnownDeviceTag = tag;
    }
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

  async writeSettings(settings) {
    this.settingsCache = settings;
    await this.writeItem(NX.SETTINGS_KEY, settings);
  }
}

NX = NixieStorage;

export {
  NixieStorage,
};
