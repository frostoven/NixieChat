const { ceil, floor, max, min } = Math;

// https://stackoverflow.com/questions/39725716/how-to-convert-javascript-array-to-binary-data-and-back-for-websocket
function stringToArrayBuffer(str) {
  return new Uint8Array(str.split('').map(c => c.charCodeAt(0)));
}

// https://stackoverflow.com/questions/39725716/how-to-convert-javascript-array-to-binary-data-and-back-for-websocket
function arrayBufferToString(ab) {
  return new Uint8Array(ab).reduce((p, c) => p + String.fromCharCode(c), '');
}

// Encodes a string as UTF-8 and then returns it in Uint8Array form.
function stringToUtf8Uint8Array(string) {
  return new TextEncoder().encode(string);
}

function uint8ArrayToHexString(uint8Array) {
  return Array.from(uint8Array).map(
    b => b.toString(16).padStart(2, '0'),
  ).join('');
}

// Intended purpose: Ephemeral message IDs.
// Returns a 256 bit string, or the equivalent Uint8Array if `false` is passed in.
function get256RandomBits(returnAsString = true) {
  const uint8Array = new Uint8Array(32);
  const rng = crypto.getRandomValues(uint8Array);
  if (returnAsString) {
    return uint8ArrayToHexString(rng);
  }
  else {
    return rng;
  }
}

// This function under the MIT license. Taken from:
// https://github.com/chancejs/chancejs/issues/232#issuecomment-182500222
// https://stackoverflow.com/questions/18230217/javascript-generate-a-random-number-within-a-range-using-crypto-getrandomvalues
function getSafeRandomIntInclusive(min, max) {
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  let randomNumber = randomBuffer[0] / (0xffffffff + 1);
  min = ceil(min);
  max = floor(max);
  return floor(randomNumber * (max - min + 1)) + min;
}

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
async function sha256(stringOrBuffer, returnAsString = true) {
  let msgBuffer;
  if (typeof stringOrBuffer === 'string') {
    // encode as UTF-8
    msgBuffer = stringToUtf8Uint8Array(stringOrBuffer);
  }
  else if (stringOrBuffer instanceof Uint8Array) {
    msgBuffer = stringOrBuffer;
  }
  else {
    const message = `[sha256] Unsupported type ${typeof stringOrBuffer}`;
    console.error(message);
    throw message;
  }

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  if (returnAsString) {
    // convert ArrayBuffer to hex string
    return uint8ArrayToHexString(new Uint8Array(hashBuffer));
  }
  else {
    return new Uint8Array(hashBuffer);
  }
}

try {
  window.$nixieDebugUtils = {
    ...window.$nixieDebugUtils,
    getRandomBits,
    get256RandomBits,
    getSafeRandomIntInclusive,
    sha256,
  };
}
catch (error) {
  // This will crash if on the server. We don't need this on the server;
  // do nothing.
}

/**
 * Merges multiple instances of Uint8Array into a single Uint8Array.
 * @param {Uint8Array[]} arrayOfArrays - An array that contains uint8 arrays.
 * @return {Uint8Array}
 */
function mergeUint8Arrays(arrayOfArrays) {
  let totalLength = 0;
  let offset = 0;

  // Unsure if there's a way of doing without looping twice, seeing as we need
  // total length upfront. Looping this way is fast anyhow.
  for (let i = 0, len = arrayOfArrays.length; i < len; i++) {
    totalLength += arrayOfArrays[i].length
  }

  // Will contain all our other arrays' contents.
  const mergedArray = new Uint8Array(totalLength);

  // Merge all arrays into mergedArray.
  for (let i = 0, len = arrayOfArrays.length; i < len; i++) {
    const uint8array = arrayOfArrays[i];
    mergedArray.set(uint8array, offset);
    offset += uint8array.length;
  }

  return mergedArray;
}

function setPromiseTimeout(delay) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}

export {
  stringToArrayBuffer,
  arrayBufferToString,
  uint8ArrayToHexString,
  get256RandomBits,
  getSafeRandomIntInclusive,
  sha256,
  mergeUint8Arrays,
  setPromiseTimeout,
};
