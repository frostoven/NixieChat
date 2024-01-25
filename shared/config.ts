const sharedConfig = Object.freeze({
  greetingLimit: 160,
  invitationExpiryMs: 123000,
  maxConcurrentAccounts: 12,
  minPubNameLength: 5,
  maxPubNameLength: 36,
  maxPubKeyLength: 10240 / 8,
});

export {
  sharedConfig,
};
