const { generateEventSignaller } = require('../socketProcessing/generateEventSignaller');

const socketEvent = {
  ping: generateEventSignaller(),
  makeDiscoverable: generateEventSignaller(),
};

function ping(socket) {
  socketEvent.ping.trigger({ socket });
}

function makeDiscoverable(socket, options, callback) {
  if (socket) {
    socketEvent.makeDiscoverable.trigger({ socket, options, callback });
  }
}

module.exports = {
  socketEvent,
  ping,
  makeDiscoverable,
};
