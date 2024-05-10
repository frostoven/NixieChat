/**
 * This file is a web worker. Access is via CryptPool.
 */

import { aesGcmEncrypt, aesGcmDecrypt } from '../crypto-aes-gcm';

onmessage = ({ data }) => {
  if (data.action === 'aesGcmEncrypt') {
    const { password, plaintext } = data;
    aesGcmEncrypt(password, plaintext)
      .then(self.postMessage)
      .catch((reason) => {
        console.error(reason);
        self.postMessage(null);
      });
  }
  else if (data.action === 'aesGcmDecrypt') {
    const { password, ciphertext, iv, silenceDecryptError } = data;
    aesGcmDecrypt(password, ciphertext, iv, silenceDecryptError)
      .then(self.postMessage)
      .catch((reason) => {
        console.error(reason);
        self.postMessage(null);
      });
  }
};
