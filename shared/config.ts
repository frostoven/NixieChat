const sharedConfig = Object.freeze({
  greetingLimit: 160,
  maxConcurrentAccounts: 12,
  minPubNameLength: 5,
  maxPubNameLength: 36,
  maxPubKeyLength: 10240 / 8,
});

export {
  sharedConfig,
};
