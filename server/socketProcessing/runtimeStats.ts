// Some basic anonymous stats so we have an idea of how many active users we
// have per server.
const runtimeStats = {
  ping: 0,
  makeDiscoverable: 0,
  sendInvitation: 0,
  respondToInvite: 0,
  sendDhPubKey: 0,
  usageErrors: {},
};

// TODO: Expose as API instead, perhaps Prometheus style.
// Log stats every 60 seconds, but only if it's changed.
let _previousStats = JSON.stringify(runtimeStats);
setInterval(() => {
  const statsStringified = JSON.stringify(runtimeStats);
  if (statsStringified === _previousStats) {
    return;
  }
  _previousStats = statsStringified;
  console.log('Runtime stats:', runtimeStats);
}, 60000);

export {
  runtimeStats,
};
