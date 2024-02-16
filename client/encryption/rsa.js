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

function generateKey(alg, scope) {
  return new Promise(function(resolve) {
    var genkey = crypto.subtle.generateKey(alg, true, scope);
    genkey.then(function(pair) {
      resolve(pair);
    });
  });
}

function arrayBufferToBase64String(arrayBuffer) {
  var byteArray = new Uint8Array(arrayBuffer);
  var byteString = '';
  for (var i = 0; i < byteArray.byteLength; i++) {
    byteString += String.fromCharCode(byteArray[i]);
  }
  return btoa(byteString);
}

function base64StringToArrayBuffer(b64str) {
  var byteStr = atob(b64str);
  var bytes = new Uint8Array(byteStr.length);
  for (var i = 0; i < byteStr.length; i++) {
    bytes[i] = byteStr.charCodeAt(i);
  }
  return bytes.buffer;
}

function textToArrayBuffer(str) {
  var buf = unescape(encodeURIComponent(str)); // 2 bytes for each char
  var bufView = new Uint8Array(buf.length);
  for (var i = 0; i < buf.length; i++) {
    bufView[i] = buf.charCodeAt(i);
  }
  return bufView;
}

function arrayBufferToText(arrayBuffer) {
  var byteArray = new Uint8Array(arrayBuffer);
  var str = '';
  for (var i = 0; i < byteArray.byteLength; i++) {
    str += String.fromCharCode(byteArray[i]);
  }
  return str;
}


function arrayBufferToBase64(arr) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(arr)));
}

function convertBinaryToPem(binaryData, label) {
  var base64Cert = arrayBufferToBase64String(binaryData);
  var pemCert = '-----BEGIN ' + label + '-----\n';
  var nextIndex = 0;
  var lineLength;
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

function convertPemToBinary(pem) {
  var lines = pem.split('\n');
  var encoded = '';
  for (var i = 0; i < lines.length; i++) {
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

function importPublicKey(pemKey, sourceFormat = 'pem') {
  if (sourceFormat === 'pem') {
    pemKey = convertPemToBinary(pemKey);
  }
  return new Promise(function(resolve) {
    var importer = crypto.subtle.importKey('spki', pemKey, rsaSignAlgorithm, true, [ 'verify' ]);
    importer.then(function(key) {
      resolve(key);
    });
  });
}

function importPrivateKey(pemKey, sourceFormat = 'pem') {
  if (sourceFormat === 'pem') {
    pemKey = convertPemToBinary(pemKey);
  }
  return new Promise(function(resolve) {
    var importer = crypto.subtle.importKey('pkcs8', pemKey, rsaSignAlgorithm, true, [ 'sign' ]);
    importer.then(function(key) {
      resolve(key);
    });
  });
}

async function exportPublicKeyRaw(keys) {
  const buffer = await window.crypto.subtle.exportKey('spki', keys.publicKey);
  return new Uint8Array(buffer);
}

async function exportPrivateKeyRaw(keys) {
  const buffer = await window.crypto.subtle.exportKey('pkcs8', keys.privateKey);
  return new Uint8Array(buffer);
}

function exportPublicKeyString(keys) {
  return new Promise(function(resolve) {
    window.crypto.subtle.exportKey('spki', keys.publicKey).then(function(spki) {
      resolve(convertBinaryToPem(spki, 'RSA PUBLIC KEY'));
    });
  });
}

function exportPrivateKeyString(keys) {
  return new Promise(function(resolve) {
    var expK = window.crypto.subtle.exportKey('pkcs8', keys.privateKey);
    expK.then(function(pkcs8) {
      resolve(convertBinaryToPem(pkcs8, 'RSA PRIVATE KEY'));
    });
  });
}

function exportPemKeys(keys) {
  return new Promise(function(resolve) {
    exportPublicKeyString(keys).then(function(pubKey) {
      exportPrivateKeyString(keys).then(function(privKey) {
        resolve({ publicKey: pubKey, privateKey: privKey });
      });
    });
  });
}

async function signData(key, data) {
  if (typeof data === 'string') {
    data = textToArrayBuffer(data);
  }
  return await window.crypto.subtle.sign(
    rsaSignAlgorithm, key, data,
  );
}

function testVerifySig(pub, sig, data) {
  return crypto.subtle.verify(rsaSignAlgorithm, pub, sig, data);
}

function encryptData(vector, key, data) {
  return crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
      iv: vector,
    },
    key,
    textToArrayBuffer(data),
  );
}

function decryptData(vector, key, data) {
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

/**
 * @return {Promise<Uint8Array|string>}
 */
async function exportPublicKey(keys, format = 'raw') {
  if (format === 'raw') {
    return await exportPublicKeyRaw(keys);
  }
  else if (format === 'pem' || !format) {
    return await exportPublicKeyString(keys);
  }
  else {
    console.error('Support export formats params are "raw" and null.');
  }
}

/**
 @return {Promise<Uint8Array|string>}
 */
async function exportPrivateKey(keys, format = 'raw') {
  if (format === 'raw') {
    return await exportPrivateKeyRaw(keys);
  }
  else if (format === 'pem' || !format) {
    return await exportPrivateKeyString(keys);
  }
  else {
    console.error('Support export formats params are "raw" and null.');
  }
}

export {
  generateRsaEncryptionKey,
  generateRsaSigningKey,
  signDataRsa,
  exportPemKeys as exportRsaPemKeys,
  importPublicKey as importRsaPublicKey,
  importPrivateKey as importRsaPrivateKey,
  exportPublicKey as exportRsaPublicKey,
  exportPrivateKey as exportRsaPrivateKey,
};
