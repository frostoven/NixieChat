const { socketEvent } = require('../controllers/websocket.controller');
const { sendErrorToClient } = require('./outboundMessages');

// --- Boot section --- //

function bootServer() {
  socketEvent.ping.addListener(({ socket } = {}) => {
    return sendErrorToClient({
      message: 'Received.', socket,
    });
  });
}

// --- Exports --- //

module.exports = {
  bootServer,
};
