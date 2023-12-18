// https://nodejs.org/api/crypto.html#class-diffiehellmangroup
const KeyStrength = {
  // modp18 is 8192 bits.
  messagingModGroup: 'modp18',
};

const KeyStrengthFriendly = {
  'modp18': '8192-bit',
};

module.exports = {
  KeyStrength,
  KeyStrengthFriendly,
};
