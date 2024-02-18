/**
 * This file released under the MIT license.
 *
 * Directly based on the gist by deiu:
 * https://gist.github.com/deiu/2c3208c89fbc91d23226
 *
 * It has since been modified.
 */

  // This is a big int. 1,0,1 translates to 65537, or 00000001 00000000 00000001.
  // See:
  // * https://crypto.stackexchange.com/questions/3110/impacts-of-not-using-rsa-exponent-of-65537
  // * https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/generateKey
  // * https://stackoverflow.com/questions/51168408/how-can-i-use-publicexponent-as-65537-in-rsa-oaep-algorithm-in-javascript
const exponent65537 = new Uint8Array([ 1, 0, 1 ]);

function generateKey(
  alg: RsaHashedKeyGenParams | EcKeyGenParams, scope: readonly KeyUsage[],
) {
  return new Promise(function(resolve) {
    const genkey = crypto.subtle.generateKey(alg, true, scope);
    genkey.then(function(pair) {
      resolve(pair);
    });
  });
}

function arrayBufferToBase64String(arrayBuffer: ArrayBuffer) {
  const byteArray = new Uint8Array(arrayBuffer);
  let byteString = '';
  for (let i = 0; i < byteArray.byteLength; i++) {
    byteString += String.fromCharCode(byteArray[i]);
  }
  return window.btoa(byteString);
}

function base64StringToArrayBuffer(b64str: string) {
  const byteStr = window.atob(b64str);
  const bytes = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) {
    bytes[i] = byteStr.charCodeAt(i);
  }
  return bytes.buffer;
}

function textToArrayBuffer(str: string) {
  // TODO: test if unescape can be replaced with decodeURIComponent.
  const buf = unescape(encodeURIComponent(str)); // 2 bytes for each char
  const bufView = new Uint8Array(buf.length);
  for (let i = 0; i < buf.length; i++) {
    bufView[i] = buf.charCodeAt(i);
  }
  return bufView;
}

// TODO: consider replacing with function from utils.
function arrayBufferToText(arrayBuffer: ArrayBuffer) {
  const byteArray = new Uint8Array(arrayBuffer);
  let str = '';
  for (let i = 0; i < byteArray.byteLength; i++) {
    str += String.fromCharCode(byteArray[i]);
  }
  return str;
}


function arrayBufferToBase64(arr: ArrayBuffer) {
  return window.btoa(
    // @ts-ignore - TODO: this is supposedly a type error; investigate.
    String.fromCharCode.apply(null, new Uint8Array(arr)),
  );
}

function convertBinaryToPem(binaryData: ArrayBuffer, label: string) {
  const base64Cert = arrayBufferToBase64String(binaryData);
  let pemCert = '-----BEGIN ' + label + '-----\n';
  let nextIndex = 0;
  while (nextIndex < base64Cert.length) {
    if (nextIndex + 64 <= base64Cert.length) {
      pemCert += base64Cert.substr(nextIndex, 64) + '\n';
    }
    else {
      pemCert += base64Cert.substr(nextIndex) + '\n';
    }
    nextIndex += 64;
  }
  pemCert += '-----END ' + label + '-----\n';
  return pemCert;
}

function convertPemToBinary(pem: string) {
  const lines = pem.split('\n');
  let encoded = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().length > 0 &&
      lines[i].indexOf('-BEGIN RSA PRIVATE KEY-') < 0 &&
      lines[i].indexOf('-BEGIN RSA PUBLIC KEY-') < 0 &&
      lines[i].indexOf('-END RSA PRIVATE KEY-') < 0 &&
      lines[i].indexOf('-END RSA PUBLIC KEY-') < 0) {
      encoded += lines[i].trim();
    }
  }
  return base64StringToArrayBuffer(encoded);
}

function importPublicKey(
  pemKey: string | ArrayBuffer | ArrayBufferView | CryptoKey,
  sourceFormat = 'pem',
) {
  let key: ArrayBuffer | ArrayBufferView;
  if (sourceFormat === 'pem') {
    key = convertPemToBinary(pemKey as string);
  }
  else {
    key = pemKey as ArrayBufferLike;
  }

  return new Promise(function(resolve) {
    const importer = crypto.subtle.importKey(
      'spki', key, rsaSignAlgorithm, true, [ 'verify' ],
    );
    importer.then(function(key) {
      resolve(key);
    });
  });
}

function importPrivateKey(
  pemKey: string | ArrayBuffer | ArrayBufferView | CryptoKey,
  sourceFormat = 'pem',
) {
  let key: ArrayBuffer | ArrayBufferView;
  if (sourceFormat === 'pem') {
    key = convertPemToBinary(pemKey as string);
  }
  else {
    key = pemKey as ArrayBufferLike;
  }

  return new Promise(function(resolve) {
    const importer = crypto.subtle.importKey(
      'pkcs8', key, rsaSignAlgorithm, true, [ 'sign' ],
    );
    importer.then(function(key) {
      resolve(key);
    });
  });
}

async function exportPublicKeyRaw(keys: { publicKey: CryptoKey; }) {
  const buffer = await window.crypto.subtle.exportKey('spki', keys.publicKey);
  return new Uint8Array(buffer);
}

async function exportPrivateKeyRaw(keys: { privateKey: CryptoKey; }) {
  const buffer = await window.crypto.subtle.exportKey('pkcs8', keys.privateKey);
  return new Uint8Array(buffer);
}

function exportPublicKeyString(publicKey: CryptoKey) {
  return new Promise(function(resolve) {
    window.crypto.subtle.exportKey('spki', publicKey).then(function(spki) {
      resolve(convertBinaryToPem(spki, 'RSA PUBLIC KEY'));
    });
  });
}

function exportPrivateKeyString(privateKey: CryptoKey) {
  return new Promise(function(resolve) {
    var expK = window.crypto.subtle.exportKey('pkcs8', privateKey);
    expK.then(function(pkcs8) {
      resolve(convertBinaryToPem(pkcs8, 'RSA PRIVATE KEY'));
    });
  });
}

function exportPemKeys(keys: {
  publicKey?: CryptoKey;
  privateKey?: CryptoKey;
}) {
  return new Promise(function(resolve) {
    exportPublicKeyString(keys.publicKey!).then(function(pubKey) {
      exportPrivateKeyString(keys.publicKey!).then(function(privKey) {
        resolve({ publicKey: pubKey, privateKey: privKey });
      });
    });
  });
}

async function signData(key: CryptoKey, data: string | BufferSource) {
  if (typeof data === 'string') {
    data = textToArrayBuffer(data);
  }
  return await window.crypto.subtle.sign(
    rsaSignAlgorithm, key, data,
  );
}

function testVerifySig(pub: CryptoKey, sig: BufferSource, data: BufferSource) {
  return crypto.subtle.verify(rsaSignAlgorithm, pub, sig, data);
}

function encryptData(vector: any, key: CryptoKey, data: string) {
  return crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
      iv: vector,
    },
    key,
    textToArrayBuffer(data),
  );
}

function decryptData(vector: any, key: CryptoKey, data: BufferSource) {
  return crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
      iv: vector,
    },
    key,
    data,
  );
}

const rsaSignAlgorithm = {
  // name: 'RSASSA-PKCS1-v1_5',
  name: 'RSA-PSS',
  // name: 'RSASSA-PSS',
  hash: {
    name: 'SHA-384',
  },
  modulusLength: 4096,
  extractable: true,
  publicExponent: exponent65537,
};

const rsaEncryptAlgorithm = {
  name: 'RSA-OAEP',
  modulusLength: 4096,
  publicExponent: exponent65537,
  extractable: true,
  hash: {
    name: 'SHA-384',
  },
};

// const rsaSignAlgorithm = {
//   name: 'RSASSA-PKCS1-v1_5',
//   hash: {
//     name: 'SHA-256',
//   },
//   modulusLength: 2048,
//   extractable: false,
//   publicExponent: exponent65537,
// };
//
// const rsaEncryptAlgorithm = {
//   name: 'RSA-OAEP',
//   modulusLength: 2048,
//   publicExponent: exponent65537,
//   extractable: false,
//   hash: {
//     name: 'SHA-256',
//   },
// };

/** Generates a 4096 bit RSA-OAEP encryption key with SHA-384 hashing. */
function generateRsaEncryptionKey() {
  return generateKey(rsaEncryptAlgorithm, [ 'encrypt', 'decrypt' ]);
}

/** Generates a 4096 bit RSASSA-PKCS1-v1_5 signing key with SHA-384 hashing. */
function generateRsaSigningKey() {
  return generateKey(rsaSignAlgorithm, [ 'sign', 'verify' ]);
}

function signDataRsa(privateKey, data) {
  return signData(privateKey, data);
}

async function exportPublicKey(
  keys: { publicKey: any; privateKey?: CryptoKey; }, format = 'raw',
): Promise<Uint8Array | string | null> {
  if (format === 'raw') {
    return await exportPublicKeyRaw(keys);
  }
  else if (format === 'pem' || !format) {
    return await exportPublicKeyString(keys.publicKey) as string;
  }
  else {
    console.error('Support export formats params are "raw" and null.');
    return null;
  }
}

async function exportPrivateKey(
  keys: { publicKey?: CryptoKey; privateKey: any; }, format = 'raw',
): Promise<Uint8Array | string | null> {
  if (format === 'raw') {
    return await exportPrivateKeyRaw(keys);
  }
  else if (format === 'pem' || !format) {
    return await exportPrivateKeyString(keys.privateKey) as string;
  }
  else {
    console.error('Support export formats params are "raw" and null.');
    return null;
  }
}

export {
  generateRsaEncryptionKey,
  generateRsaSigningKey,
  signDataRsa,
  importPublicKey as importRsaPublicKey,
  importPrivateKey as importRsaPrivateKey,
  exportPublicKey as exportRsaPublicKey,
  exportPrivateKey as exportRsaPrivateKey,
};
