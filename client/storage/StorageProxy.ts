import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

let storageInstance: StorageProxy | null = null;

type StorageEngine = 'unknown' | 'IndexedDb';

class StorageProxy {
  readOnly!: boolean;
  storageEngine!: StorageEngine;

  static getInstance() {
    return new StorageProxy();
  }

  static async testIndexedDbStorage() {
    try {
      const testKey = '__storage_test__';
      await idbSet(testKey, testKey);
      await idbDel(testKey);
      return true;
    }
    catch (error) {
      return false;
    }
  }

  constructor() {
    if (!storageInstance) {
      storageInstance = this;
    }
    else {
      return storageInstance;
    }

    this.readOnly = false;
    this.setStorageEngine('IndexedDb').catch(console.error);
  }

  async setStorageEngine(engineName: StorageEngine) {
    this.storageEngine = engineName;
    if (engineName === 'IndexedDb') {
      const indexedDbAllowed = await StorageProxy.testIndexedDbStorage();
      if (!indexedDbAllowed) {
        return window.$dialog.alert(
          'Your browser has blocked local DB storage. NixieChat will not ' +
          'function properly, and account details will be lost on refresh.',
        );
      }
    }
  }

  async fetchItem(keyName: any) {
    if (this.readOnly) {
      return console.warn('Not reading data - read-only flag set.');
    }

    const fnName = `_fetchItem${this.storageEngine}`;
    const reader = this[fnName];
    if (!reader) {
      this.readOnly = true;
      console.error(`Function name ${fnName} does not exist on Storage.`);
      // @ts-ignore
      return window.$dialog.alert({
        header: 'Storage Error',
        body: 'Error: Cannot read storage.',
      });
    }

    return await reader(keyName);
  }

  async writeItem(keyName: string, value: any) {
    if (this.readOnly) {
      return console.warn('Not writing data - read-only flag set.');
    }

    const fnName = `_writeItem${this.storageEngine}`;
    const writer = this[fnName];
    if (!writer) {
      this.readOnly = true;
      console.error(`Function name ${fnName} does not exist on Storage.`);
      // @ts-ignore
      return window.$dialog.alert({
        header: 'Storage Error',
        body: 'Error: Cannot write to storage.',
      });
    }

    await writer(keyName, value);
  }

  async createKeyIfNotExists(keyName: any, defaultValue: any = null) {
    if (this.readOnly) {
      return console.warn('Not writing data - read-only flag set.');
    }

    const fnName = `_createKeyIfNotExists${this.storageEngine}`;
    const writer = this[fnName];
    if (!writer) {
      this.readOnly = true;
      console.error(`Function name ${fnName} does not exist on Storage.`);
      // @ts-ignore
      return window.$dialog.alert({
        header: 'Storage Error',
        body: 'Error: Cannot write to storage.',
      });
    }

    await writer(keyName, defaultValue);
  }

  async _fetchItemIndexedDb(keyName: IDBValidKey) {
    return await idbGet(keyName);
  }

  async _writeItemIndexedDb(keyName: IDBValidKey, value: any) {
    await idbSet(keyName, value);
  }

  async _createKeyIfNotExistsIndexedDb(keyName: IDBValidKey, defaultValue: any) {
    const item = await idbGet(keyName);
    if (typeof item === 'undefined') {
      await idbSet(keyName, defaultValue);
    }
  }
}

export {
  StorageEngine,
  StorageProxy,
};
