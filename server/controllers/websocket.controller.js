const { generateEventSignaller } = require('../socketProcessing/generateEventSignaller');

const socketEvent = {
  ping: generateEventSignaller(),
};

function ping(socket) {
  socketEvent.ping.trigger({ socket });
}

module.exports = {
  socketEvent,
  ping,
};
