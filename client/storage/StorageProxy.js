import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

let storageInstance = null;

const StorageEngine = {
  indexedDb: 'IndexedDb',
};

class StorageProxy {
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
    this.setStorageEngine(StorageEngine.indexedDb).catch(console.error);
  }

  async setStorageEngine(engineName) {
    this.storageEngine = engineName;
    if (engineName === StorageEngine.indexedDb) {
      const indexedDbAllowed = await StorageProxy.testIndexedDbStorage();
      if (!indexedDbAllowed) {
        return $modal.alert(
          'Your browser has blocked local DB storage. NixieChat will not ' +
          'function properly, and account details will be lost on refresh.',
        );
      }
    }
  }

  /**
   * @param keyName
   * @return {*}
   */
  async fetchItem(keyName) {
    if (this.readOnly) {
      return console.warn('Not reading data - read-only flag set.');
    }

    const fnName = `_fetchItem${this.storageEngine}`;
    const reader = this[fnName];
    if (!reader) {
      this.readOnly = true;
      console.error(`Function name ${fnName} does not exist on Storage.`);
      return $modal.alert({
        header: 'Storage Error',
        body: 'Error: Cannot read storage.',
      });
    }

    return await reader(keyName);
  }

  /**
   * @param keyName
   * @param value
   * @return {*}
   */
  async writeItem(keyName, value) {
    if (this.readOnly) {
      return console.warn('Not writing data - read-only flag set.');
    }

    const fnName = `_writeItem${this.storageEngine}`;
    const writer = this[fnName];
    if (!writer) {
      this.readOnly = true;
      console.error(`Function name ${fnName} does not exist on Storage.`);
      return $modal.alert({
        header: 'Storage Error',
        body: 'Error: Cannot write to storage.',
      });
    }

    await writer(keyName, value);
  }

  /**
   * @param keyName
   * @param defaultValue
   */
  async createKeyIfNotExists(keyName, defaultValue = null) {
    if (this.readOnly) {
      return console.warn('Not writing data - read-only flag set.');
    }

    const fnName = `_createKeyIfNotExists${this.storageEngine}`;
    const writer = this[fnName];
    if (!writer) {
      this.readOnly = true;
      console.error(`Function name ${fnName} does not exist on Storage.`);
      return $modal.alert({
        header: 'Storage Error',
        body: 'Error: Cannot write to storage.',
      });
    }

    await writer(keyName, defaultValue);
  }

  /**
   * @param keyName
   * @return {*}
   */
  async _fetchItemIndexedDb(keyName) {
    return await idbGet(keyName);
  }

  /**
   * @param keyName
   * @param value
   * @return {*}
   */
  async _writeItemIndexedDb(keyName, value) {
    await idbSet(keyName, value);
  }

  /**
   * @param keyName
   * @param defaultValue
   * @return {*}
   */
  async _createKeyIfNotExistsIndexedDb(keyName, defaultValue) {
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
