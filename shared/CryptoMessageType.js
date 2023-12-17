const CryptoMessageType = {
  nop: null,
  // Signature: { userRooms: [{ pubName: 'name#0000' }, ...], v }
  makeDiscoverable: 'makeDiscoverable',
  // Signature: { source, target, greeting, pubKey, time, v }
  findContact: 'findContact',
  respondToInvite: 'respondToInvite',
};

module.exports = {
  CryptoMessageType,
};
