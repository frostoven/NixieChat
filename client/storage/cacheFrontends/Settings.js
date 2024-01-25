import { NixieStorage } from '../NixieStorage';
import { clientEmitter } from '../../emitters/comms';
import { clientEmitterAction } from '../../emitters/clientEmitterAction';

const storage = new NixieStorage();

class Settings {
  static isDarkModeEnabled() {
    const cache = storage.settingsCache || {};
    return cache.darkModeEnabled || false;
  }

  static async setDarkModeEnabled(value, updateUi) {
    const cache = storage.settingsCache;
    cache.darkModeEnabled = value;
    await storage.writeSettings(cache);
    if (updateUi) {
      clientEmitter.emit(clientEmitterAction.reloadApp);
    }
  }

  static async toggleDarkMode(updateUi) {
    const cache = storage.settingsCache;
    const darkMode = cache.darkModeEnabled;
    cache.darkModeEnabled = !darkMode;
    await storage.writeSettings(storage.settingsCache);
    if (updateUi) {
      clientEmitter.emit(clientEmitterAction.reloadApp);
    }
  }
}

export {
  Settings,
};
