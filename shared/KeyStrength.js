// https://nodejs.org/api/crypto.html#class-diffiehellmangroup
const KeyStrength = {
  // modp18 is 8192 bits.
  messagingModGroup: 'modp18',
};

const KeyStrengthFriendly = {
  modp14: '2048-bit',
  modp15: '3072-bit',
  modp16: '4096-bit',
  modp17: '6144-bit',
  modp18: '8192-bit',
};

module.exports = {
  KeyStrength,
  KeyStrengthFriendly,
};
