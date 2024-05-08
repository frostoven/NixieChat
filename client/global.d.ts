import Modal from './modal/Modal';
import {
  get256RandomBits,
  getRandomBits,
  getSafeRandomIntInclusive,
  sha256,
} from './utils';
import {
  UnencryptedSettings,
} from './storage/cacheFrontends/UnencryptedSettings';

declare global {
  interface Window {
    $dialog: Modal;
    $floatingForm: Modal;
    $nixieDebugUtils: {
      // Allows experimenting with general settings.
      settings: UnencryptedSettings,
      // Useful util stuff.
      getRandomBits: typeof getRandomBits,
      get256RandomBits: typeof get256RandomBits,
      getSafeRandomIntInclusive: typeof getSafeRandomIntInclusive,
      sha256: typeof sha256,
    };
  }
}
