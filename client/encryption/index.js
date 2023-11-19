import {
  exportRsaPrivateKey,
  exportRsaPublicKey,
  generateRsaKey,
} from './rsa';
import * as WebCrypto from 'easy-web-crypto';

/**
 * Creates and returns the specified types of key pairs.
 * @param {Array<string>} types - An array of types of key pairs to generate.
 * Default is [ 'rsa' ]. [ 'ecdsa' ] is supported as well.
 * @returns {Promise<{rsa, ecdsa}>}
 */
async function createKeyPairs(types = [ 'rsa' ]) {
  const result = {};
  types.includes('rsa') && (result.rsa = await generateRsaKey());
  types.includes('ecdsa') && (result.ecdsa = await WebCrypto.genKeyPair());
  return result;
}

/**
 * Exports RSA and ECDSA keys.
 * @param {Object} keysPairs An object that contains rsa and ecdsa keys.
 * @param {Object} [keysPairs.rsa] RSA key pair.
 * @param {Object} [keysPairs.ecdsa] ECDSA key pair.
 * @param {string} [format='raw'] A string that indicates the format of
 * exporting. Default value is 'raw'.
 * @returns {Promise<{rsa:{private, public}, ecdsa:{private, public}}>}
 */
async function exportKeys({ rsa, ecdsa } = {}, format = 'raw') {
  const result = {};

  if (rsa) {
    const publicRsaKeyBuffer = await exportRsaPublicKey(rsa, 'raw');
    const privateRsaKeyBuffer = await exportRsaPrivateKey(rsa, 'raw');
    result.rsa = {
      public: publicRsaKeyBuffer,
      private: privateRsaKeyBuffer,
    };
  }

  if (ecdsa) {
    const publicEcdsaKeyBuffer = await WebCrypto.exportPublicKey(ecdsa.publicKey, 'raw');
    const privateEcdsaKeyBuffer = await WebCrypto.exportPrivateKey(ecdsa.privateKey, 'raw');
    result.ecdsa = {
      public: publicEcdsaKeyBuffer,
      private: privateEcdsaKeyBuffer,
    };
  }

  return result;
}

export {
  createKeyPairs,
  exportKeys,
};
