let storageInstance = null;

const StorageEngine = {
  localStorage: 'LocalStorage',
};

class StorageProxy {
  static getInstance() {
    return new StorageProxy();
  }

  static testLocalStorage() {
    // https://stackoverflow.com/questions/16427636/check-if-localstorage-is-available
    try {
      const storage = window['localStorage'];
      if (!storage) {
        return false;
      }
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    }
    catch(error) {
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
    this.setStorageEngine(StorageEngine.localStorage);
  }

  setStorageEngine(engineName) {
    this.storageEngine = engineName;
    if (engineName === StorageEngine.localStorage) {
      const localStorageAllowed = StorageProxy.testLocalStorage();
      if (!localStorageAllowed) {
        return $modal.alert(
          'Your browser has blocked local storage. Local storage is ' +
          'required for game login'
        );
      }
    }
  }

  /**
   * @param keyName
   * @return {*}
   */
  getItem(keyName) {
    if (this.readOnly) {
      return console.warn('Not reading data - read-only flag set.');
    }

    const fnName = `_getItem${this.storageEngine}`;
    const reader = this[fnName];
    if (!reader) {
      this.readOnly = true;
      console.error(`Function name ${fnName} does not exist on NixieStorage.`);
      return $modal.alert({
        header: 'Storage Error',
        body: 'Error: Cannot read storage.',
      });
    }

    return reader(keyName);
  }

  /**
   * @param keyName
   * @param value
   * @return {*}
   */
  setItem(keyName, value) {
    if (this.readOnly) {
      return console.warn('Not writing data - read-only flag set.');
    }

    const fnName = `_setItem${this.storageEngine}`;
    const writer = this[fnName];
    if (!writer) {
      this.readOnly = true;
      console.error(`Function name ${fnName} does not exist on NixieStorage.`);
      return $modal.alert({
        header: 'Storage Error',
        body: 'Error: Cannot write to storage.',
      });
    }

    writer(keyName, value);
  }

  /**
   * @param keyName
   * @param defaultValue
   */
  createKeyIfNotExists(keyName, defaultValue = null) {
    if (this.readOnly) {
      return console.warn('Not writing data - read-only flag set.');
    }

    const fnName = `_createKeyIfNotExists${this.storageEngine}`;
    const writer = this[fnName];
    console.log(this, fnName);
    if (!writer) {
      this.readOnly = true;
      console.error(`Function name ${fnName} does not exist on NixieStorage.`);
      return $modal.alert({
        header: 'Storage Error',
        body: 'Error: Cannot write to storage.',
      });
    }

    writer(keyName, defaultValue);
  }

  /**
   * @param keyName
   * @return {*}
   */
  _getItemLocalStorage(keyName) {
    return localStorage.getItem(keyName);
  }

  /**
   * @param keyName
   * @param value
   * @return {*}
   */
  _setItemLocalStorage(keyName, value) {
    localStorage.setItem(keyName, value);
  }

  /**
   * @param keyName
   * @param defaultValue
   * @return {*}
   */
  _createKeyIfNotExistsLocalStorage(keyName, defaultValue) {
    const item = localStorage.getItem(keyName);
    if (item === null) {
      localStorage.setItem(keyName, defaultValue);
    }
  }
}

export {
  StorageEngine,
  StorageProxy,
}
