import { NixieStorage } from '../NixieStorage';

const storage = new NixieStorage();

class Device {
  static getDeviceTag() {
    return storage.lastKnownDeviceTag;
  }
}

export {
  Device,
};
