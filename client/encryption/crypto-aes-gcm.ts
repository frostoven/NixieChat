/**
 * This file was taken from here:
 * https://gist.github.com/chrisveness/43bcda93af9f646d083fad678071b90a
 * The author has released it under the MIT license.
 *
 * Some minor modifications were made:
 * - File was converted to TypeScript.
 * - Some comments were made slightly more descriptive.
 * - Base64 functionality removed as it's not relevant to this project.
 * - The original author converts buffers to strings. The version keeps
 *   everything in buffer form.
 *
 * Further reading:
 * * https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf#%5B%7B%22num%22%3A65%2C%22gen%22%3A0%7D%2C%7B%22name%22%3A%22XYZ%22%7D%2C0%2C792%2Cnull%5D
 * * https://csrc.nist.gov/pubs/sp/800/38/d/final
 * * https://developer.mozilla.org/en-US/docs/Web/API/AesKeyGenParams
 * * https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
 */

const VERBOSE = false;

/**
 * Encrypts plaintext using AES-GCM with supplied password, for decryption with aesGcmDecrypt().
 *                                                                      (c) Chris Veness MIT Licence
 *
 * @param   {String} password - Password to use to encrypt plaintext.
 * @param   {String} plaintext - Plaintext to be encrypted.
 *
 * @example
 *   const ciphertext = await aesGcmEncrypt('my secret text', 'pw');
 *   aesGcmEncrypt('my secret text', 'pw').then(function(ciphertext) { console.log(ciphertext); });
 */
async function aesGcmEncrypt(password: string, plaintext: string) {
  const start = performance.now();

  // Encode password as UTF-8.
  const pwUtf8 = new TextEncoder().encode(password);
  // Hash the password.
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);

  // Get a 96-bit random IV (initialization vector). Note: The IV is a nonce.
  // That is, what you use as its value doesn't matter *so long as it's used
  // only once per key*. Using the same nonce twice is a big problem.
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Algorithm parameters.
  const alg: AesGcmParams = { name: 'AES-GCM', iv: iv };

  // Generate a key from the password.
  const key = await crypto.subtle.importKey(
    'raw', pwHash, alg, false, [ 'encrypt' ],
  );

  // Encode the plaintext as a UTF-8 string.
  const ptUint8 = new TextEncoder().encode(plaintext);
  // Encrypt plaintext using the key.
  const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8);

  // Convert the ciphertext to a string.
  // const ctArray = Array.from(new Uint8Array(ctBuffer));
  // const ctStr = ctArray.map(byte => String.fromCharCode(byte)).join('');

  const ciphertext = new Uint8Array(ctBuffer);

  // @ts-ignore: Length does indeed exist.
  const keyLength = key.algorithm.length;
  VERBOSE && console.log(
    `[AES-GCM] Encryption took ${performance.now() - start}ms for a key ` +
    `of length ${keyLength} and plaintext of length ${plaintext.length}.`,
  );

  return {
    iv,
    ciphertext,
  };
}


/**
 * Decrypts ciphertext encrypted with aesGcmEncrypt() using supplied password.
 *                                                                      (c) Chris Veness MIT Licence
 *
 * @param   {String} password - Password to use to decrypt ciphertext.
 * @param   {Uint8Array} ciphertext - Ciphertext to be decrypted.
 * @param   {Uint8Array} iv - Ciphertext to be decrypted.
 * @param   [silenceDecryptError]
 * @returns {String} Decrypted plaintext.
 *
 * @example
 *   const plaintext = await aesGcmDecrypt(ciphertext, 'pw');
 *   aesGcmDecrypt(ciphertext, 'pw').then(function(plaintext) { console.log(plaintext); });
 */
async function aesGcmDecrypt(
  password: string, ciphertext: Uint8Array, iv: Uint8Array,
  silenceDecryptError = false,
) {
  const start = performance.now();

  // Encode password as UTF-8.
  const pwUtf8 = new TextEncoder().encode(password);
  // Hash the password.
  const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);

  // const ivStr = atob(ciphertext).slice(0, 12);
  // const iv = new Uint8Array(Array.from(ivStr).map(ch => ch.charCodeAt(0)));

  // Algorithm parameters.
  const alg = { name: 'AES-GCM', iv: iv };

  // Generate the key.
  const key = await crypto.subtle.importKey(
    'raw', pwHash, alg, false, [ 'decrypt' ],
  );

  // const ctStr = atob(ciphertext).slice(12);
  // const ctUint8 = new Uint8Array(Array.from(ctStr).map(ch => ch.charCodeAt(0)));
  // note: why doesn't ctUint8 = new TextEncoder().encode(ctStr) work?

  try {
    // Decrypt and return the message.
    const plainBuffer = await crypto.subtle.decrypt(alg, key, ciphertext);

    // @ts-ignore: Length does indeed exist.
    const keyLength = key.algorithm.length;
    VERBOSE && console.log(
      `[AES-GCM] Decryption took ${performance.now() - start}ms for a key ` +
      `of length ${keyLength} and plaintext of length ${plainBuffer.byteLength}.`,
    );

    return new TextDecoder().decode(plainBuffer);
  }
  catch (error) {
    (!silenceDecryptError) && console.error('[AES-GCM] Decrypt failed:', error);
    return null;
  }
}

export {
  aesGcmEncrypt,
  aesGcmDecrypt,
};
