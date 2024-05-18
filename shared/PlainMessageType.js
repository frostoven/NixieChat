const PlainMessageType = {
  nop: 0,
  // Signature: { tag: Uint8Array, publicKey: CryptoKey }
  error: 1,
  message: 2,
  notifyServerReady: 3,
};

export {
  PlainMessageType,
};
