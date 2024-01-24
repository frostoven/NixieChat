// https://nodejs.org/api/crypto.html#class-diffiehellmangroup
const KeyStrengthFriendly = {
  modp14: '2048-bit',
  modp15: '3072-bit',
  modp16: '4096-bit',
  modp17: '6144-bit',
  modp18: '8192-bit',
};

const KeyStrength = {
  // messagingModGroup: 'modp17',
  messagingModGroup: 'modp16',
};

module.exports = {
  KeyStrength,
  KeyStrengthFriendly,
};
