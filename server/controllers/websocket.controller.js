const { generateEventSignaller } = require('../socketProcessing/generateEventSignaller');

const socketEvent = {
  ping: generateEventSignaller(),
  makeDiscoverable: generateEventSignaller(),
  findContact: generateEventSignaller(),
};

function ping(socket) {
  socketEvent.ping.trigger({ socket });
}

function makeDiscoverable(socket, options, callback) {
  if (socket) {
    socketEvent.makeDiscoverable.trigger({ socket, options, callback });
  }
}

function findContact(socket, options, callback) {
  if (socket) {
    socketEvent.findContact.trigger({ socket, options, callback });
  }
}

module.exports = {
  socketEvent,
  ping,
  makeDiscoverable,
  findContact,
};
