/**
 * This file released by Frostoven under the MIT License.
 */

import { aesGcmDecrypt, aesGcmEncrypt } from '../../encryption/crypto-aes-gcm';
import { FrozenPasswordStore } from './types/PasswordStore';

/**
 * This adds a *tiny* bit of security in terms of reading passwords from a web
 * page.
 *
 * It essentially stops basic scripts from reading passwords in plaintext, but
 * can still be easily attacked via debugging tools (for example via F12).
 *
 * This function allows storing passwords in RAM. It won't store anything on
 * disk.
 */
function getPasswordStore(): FrozenPasswordStore {
  // This is the closest thing JS offers to private variables. It's accessible
  // by the methods this function returns, but not accessible by code that uses
  // those methods.
  let _savedPassword: string | null = null;

  return Object.freeze({
    // Returns true if a password is set, false if not.
    isPasswordSet: () => {
      return _savedPassword !== null;
    },

    // Stores the specified password in RAM for later use.
    setPassword: (password: string) => {
      _savedPassword = password;
    },

    // Encrypts a string using the last known password for this store.
    encryptAes256Gcm: async (plaintext: string) => {
      if (_savedPassword === null) {
        return console.error(
          '[PasswordStore] Encryption failed: Password not set.'
        );
      }

      return await aesGcmEncrypt(_savedPassword, plaintext);
    },

    // Decrypts a string using the last known password for this store.
    decryptAes256Gcm: async (
      cyphertext: Uint8Array, iv: Uint8Array, silenceDecryptError: boolean,
    ) => {
      if (_savedPassword === null) {
        return console.error(
          '[PasswordStore] Decryption failed: Password not set.'
        );
      }

      return await aesGcmDecrypt(
        _savedPassword, cyphertext, iv, silenceDecryptError,
      );
    },
  });
}

export {
  getPasswordStore,
};
