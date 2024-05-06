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
    const cache = storage.settingsCache || {};
    cache.darkModeEnabled = !!value;
    await storage.writeSettings(cache);
    if (updateUi) {
      clientEmitter.emit(clientEmitterAction.reloadApp);
    }
  }

  static async toggleDarkMode(updateUi) {
    const cache = storage.settingsCache || {};
    const darkModeEnabled = cache.darkModeEnabled;
    cache.darkModeEnabled = !darkModeEnabled;
    await storage.writeSettings(cache);
    if (updateUi) {
      clientEmitter.emit(clientEmitterAction.reloadApp);
    }
  }

  // If true, the user has chosen to have one or more accounts not use a
  // password. Internally, to keep the code simple, NixieChat still uses '0000'
  // as a password if the user has chosen to skip using a password. If this
  // flag is set, the app will attempt to decrypt all accounts with '0000'
  // during boot, only ask for password unlocks for those that fail to decrypt.
  static oneOrMoreAccountsUnencrypted() {
    const cache = storage.settingsCache || {};
    return cache.oneOrMoreAccountsUnencrypted || false;
  }

  // If true, the user has chosen to have one or more accounts not use a
  // password. Internally, to keep the code simple, NixieChat still uses '0000'
  // as a password if the user has chosen to skip using a password. If this
  // flag is set, the app will attempt to decrypt all accounts with '0000'
  // during boot, only ask for password unlocks for those that fail to decrypt.
  static async setOneOrMoreAccountsUnencrypted(value) {
    const cache = storage.settingsCache || {};
    cache.oneOrMoreAccountsUnencrypted = !!value;
    await storage.writeSettings(cache);
  }

  // If true, the user prefers seeing key randomart over PEM text.
  static preferRsaArtView() {
    const cache = storage.settingsCache || {};
    if (typeof cache.preferRsaArtView === 'undefined') {
      return true;
    }
    return cache.preferRsaArtView;
  }

  // If true, the user prefers seeing key randomart over PEM text.
  static async setPreferRsaArtView(value) {
    const cache = storage.settingsCache || {};
    cache.preferRsaArtView = !!value;
    await storage.writeSettings(cache);
  }

  // Used to track the last tab the user had open in the emoticon window.
  static lastEmoticonTab() {
    const cache = storage.settingsCache || {};
    if (typeof cache.lastEmoticonTab !== 'number') {
      // This is not a mistake - prefer the emoticon tab over the settings tab.
      return 1;
    }
    return cache.lastEmoticonTab;
  }

  // Used to track the last tab the user had open in the emoticon window.
  static async setActiveEmoticonTab(value) {
    const cache = storage.settingsCache || {};
    cache.lastEmoticonTab = value;
    await storage.writeSettings(cache);
  }

  // Used to track the last tab the user had open in the emoticon window.
  static lastActiveEmoticonStyle() {
    const cache = storage.settingsCache || {};
    if (typeof cache.lastEmoticonStyle !== 'number') {
      return 0;
    }
    return cache.lastEmoticonStyle;
  }

  // Used to track the last tab the user had open in the emoticon window.
  static async setActiveEmoticonStyle(value) {
    const cache = storage.settingsCache || {};
    cache.lastEmoticonStyle = value;
    await storage.writeSettings(cache);
  }

  // Used to track the last tab the user had open in the emoticon window.
  static richInputEnabled() {
    const cache = storage.settingsCache || {};
    if (typeof cache.richInputEnabled === 'undefined') {
      return true;
    }
    else {
      return !!cache.richInputEnabled;
    }
  }

  // Used to track the last tab the user had open in the emoticon window.
  static async setRichInputEnabled(value) {
    const cache = storage.settingsCache || {};
    cache.richInputEnabled = !!value;
    await storage.writeSettings(cache);
  }
}

window.$nixieDebugUtils.settings = Settings;

export {
  Settings,
};
