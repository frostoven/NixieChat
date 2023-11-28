// https://stackoverflow.com/questions/39725716/how-to-convert-javascript-array-to-binary-data-and-back-for-websocket
function stringToArrayBuffer(str) {
  return new Uint8Array(str.split('').map(c => c.charCodeAt(0)));
}

// https://stackoverflow.com/questions/39725716/how-to-convert-javascript-array-to-binary-data-and-back-for-websocket
function arrayBufferToString(ab) {
  return new Uint8Array(ab).reduce((p, c) => p + String.fromCharCode(c), '');
}

// This function under the MIT license. Taken from:
// https://github.com/chancejs/chancejs/issues/232#issuecomment-182500222
// https://stackoverflow.com/questions/18230217/javascript-generate-a-random-number-within-a-range-using-crypto-getrandomvalues
function getSafeRandomIntInclusive(min, max) {
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  let randomNumber = randomBuffer[0] / (0xffffffff + 1);
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(randomNumber * (max - min + 1)) + min;
}

export {
  stringToArrayBuffer,
  arrayBufferToString,
  getSafeRandomIntInclusive,
};
