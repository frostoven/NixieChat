import { StorageProxy } from './StorageProxy';

let instance = null;

let NX;

class NixieStorage extends StorageProxy {
  static ACCOUNT_ARRAY_KEY = 'account_array_key';

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

  initStorage() {
    this.createKeyIfNotExists(NX.ACCOUNT_ARRAY_KEY, []);
    this.initialized = true;
    return this;
  }

  getAccountList() {
    if (!this.initialized) {
      return console.error('NixieStorage queried before initialization.');
    }
    return this.getItem(NX.ACCOUNT_ARRAY_KEY);
  }
}

NX = NixieStorage;

export {
  NixieStorage,
};
