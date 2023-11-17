import {
  exportRsaPrivateKey,
  exportRsaPublicKey,
  generateRsaKey,
} from './rsa';
import * as WebCrypto from 'easy-web-crypto';

async function createKeyPairs() {
  const rsaKeyPair = await generateRsaKey();
  const ecdsaKeyPair = await WebCrypto.genKeyPair();

  return {
    rsa: rsaKeyPair,
    ecdsa: ecdsaKeyPair,
  };
}

async function exportKeys({ rsa, ecdsa }, format = 'raw') {
  const publicRsaKeyBuffer = await exportRsaPublicKey(rsa, 'raw');
  const privateRsaKeyBuffer = await exportRsaPrivateKey(rsa, 'raw');
  const publicEcdsaKeyBuffer = await WebCrypto.exportPublicKey(ecdsa.publicKey, 'raw');
  const privateEcdsaKeyBuffer = await WebCrypto.exportPrivateKey(ecdsa.privateKey, 'raw');

  return {
    rsa: {
      public: publicRsaKeyBuffer,
      private: privateRsaKeyBuffer,
    },
    ecdsa: {
      public: publicEcdsaKeyBuffer,
      private: privateEcdsaKeyBuffer,
    }
  };
}

export {
  createKeyPairs,
  exportKeys,
};
