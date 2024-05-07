import { StorageProxy } from './StorageProxy';
import { CollectionCache } from './types/CollectionCache';

let instance: UnencryptedSettingsStore | null = null;

let NX: typeof UnencryptedSettingsStore;

// TODO: Rename to UnencryptedSettingsStore?

/**
 * Basic storage for situations where key-value pairs suffice (such as whether
 * or not dark mode is enabled, which isn't an account setting). This storage
 * is shared between accounts.
 */
class UnencryptedSettingsStore extends StorageProxy {
  static LAST_ACTIVE_ACCOUNT_KEY: string | null = 'last_active_account';
  static SETTINGS_KEY = 'settings_collection';

  initialized!: boolean;
  lastActiveAccount!: string;
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
    this.settingsCache = null;

    this.initialized = false;
  }

  passesChecks() {
    if (!this.initialized) {
      console.error('UnencryptedSettingsStore queried before initialization.');
      return false;
    }
    return true;
  }

  async initStorage() {
    // Ensure all root keys exist upfront.
    await this.createKeyIfNotExists(NX.LAST_ACTIVE_ACCOUNT_KEY, '');

    // Set up default values.
    await this.fetchSettings();

    // Conclude.
    this.initialized = true;
    return this;
  }

  async _autoSetLastActiveAccount() {
    this.lastActiveAccount = await this.fetchItem(NX.LAST_ACTIVE_ACCOUNT_KEY);
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

NX = UnencryptedSettingsStore;

export {
  UnencryptedSettingsStore,
};
