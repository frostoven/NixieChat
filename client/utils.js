// https://stackoverflow.com/questions/39725716/how-to-convert-javascript-array-to-binary-data-and-back-for-websocket
function stringToArrayBuffer(str) {
  return new Uint8Array(str.split('').map(c => c.charCodeAt(0)));
}

// https://stackoverflow.com/questions/39725716/how-to-convert-javascript-array-to-binary-data-and-back-for-websocket
function arrayBufferToString(ab) {
  return new Uint8Array(ab).reduce((p, c) => p + String.fromCharCode(c), '');
}

export {
  stringToArrayBuffer,
  arrayBufferToString,
};
