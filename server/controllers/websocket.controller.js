const { generateEventSignaller } = require('../socketProcessing/generateEventSignaller');

const socketEvent = {
  ping: generateEventSignaller(),
  makeDiscoverable: generateEventSignaller(),
  sendInvitation: generateEventSignaller(),
  respondToInvite: generateEventSignaller(),
  sendDhPubKey: generateEventSignaller(),
};

function ping(socket) {
  socketEvent.ping.trigger({ socket });
}

function makeDiscoverable(socket, options, callback) {
  if (socket) {
    socketEvent.makeDiscoverable.trigger({ socket, options, callback });
  }
}

function sendInvitation(socket, options, callback) {
  if (socket) {
    socketEvent.sendInvitation.trigger({ socket, options, callback });
  }
}

function respondToInvite(socket, options, callback) {
  if (socket) {
    socketEvent.respondToInvite.trigger({ socket, options, callback });
  }
}

function sendDhPubKey(socket, options, callback) {
  if (socket) {
    socketEvent.sendDhPubKey.trigger({ socket, options, callback });
  }
}

module.exports = {
  socketEvent,
  ping,
  makeDiscoverable,
  sendInvitation,
  respondToInvite,
  sendDhPubKey,
};
