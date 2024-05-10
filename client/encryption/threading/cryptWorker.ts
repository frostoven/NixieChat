import { aesGcmEncrypt, aesGcmDecrypt } from '../crypto-aes-gcm';

onmessage = ({ data }) => {
  if (data.action === 'aesGcmEncrypt') {
    setTimeout(() => {
    const { password, plaintext } = data;
    aesGcmEncrypt(password, plaintext)
      .then(self.postMessage)
      .catch((reason) => {
        console.error(reason);
        self.postMessage(null);
      });
    }, 3000);
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
