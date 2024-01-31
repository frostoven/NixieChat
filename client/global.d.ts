import Modal from './modal/Modal';
import { Accounts } from './storage/cacheFrontends/Accounts';
import {
  genChatId,
  get256RandomBits,
  getRandomBits,
  getSafeRandomIntInclusive, sha256,
} from './utils';
import { Settings } from './storage/cacheFrontends/Settings';

declare global {
  interface Window {
    $dialog: Modal;
    $floatingForm: Modal;
    $nixieDebugUtils: {
      // Account cache front-end. Useful for console experimentation.
      accounts: Accounts,
      // Allows experimenting with general settings.
      settings: Settings,
      // Useful util stuff.
      getRandomBits: typeof getRandomBits,
      get256RandomBits: typeof get256RandomBits,
      getSafeRandomIntInclusive: typeof getSafeRandomIntInclusive,
      sha256: typeof sha256,
      genChatId: typeof genChatId,
    };
  }
}
