import {
  exportRsaPrivateKey,
  exportRsaPublicKey,
  generateRsaSigningKey,
} from './rsa';
import * as WebCrypto from 'easy-web-crypto';

/**
 * Creates and returns the specified types of key pairs.
 * @param {string} type - Type of key pair to generate. Default is
 * 'rsa'; 'ecdsa' is supported but not currently used.
 * @returns {Promise<{rsa, ecdsa}>}
 */
async function createSigningKeyPair(type = 'rsa') {
  if (type === 'rsa') {
    return await generateRsaSigningKey();
  }
  else {
    return await WebCrypto.genKeyPair();
  }
}

/**
 * Exports RSA key pairs.
 * @param keyPair
 * @param {string} format - Raw or string.
 * @returns {Promise<{rsa:{private, public}, ecdsa:{private, public}}>}
 */
async function exportKeys(keyPair, format = 'raw') {
  const publicRsaKeyBuffer = await exportRsaPublicKey(keyPair, format);
  const privateRsaKeyBuffer = await exportRsaPrivateKey(keyPair, format);
  return {
    public: publicRsaKeyBuffer,
    private: privateRsaKeyBuffer,
  };
}

export {
  createSigningKeyPair,
  exportKeys,
};
