const { socketEvent } = require('../controllers/websocket.controller');
const { sendErrorToClient } = require('./outboundMessages');

// --- Boot section --- //

function bootServer() {
  socketEvent.ping.addListener(({ socket } = {}) => {
    return sendErrorToClient({
      message: 'Received.', socket,
    });
  });
  socketEvent.ping.addListener(
    /**
     * @param {Object} payload
     * @param {Socket} payload.socket
     * @param {Object} payload.options
     * @param {Function} payload.callback
     */
    ({ socket, options = {}, callback = nop } = {}) => {
      return sendMessageToClient({
        message: 'Received.', socket,
      });
    });

  /**
   * @param {Object} payload
   * @param {Socket} payload.socket
   * @param {Object} payload.options
   * @param {Function} payload.callback
   */
  socketEvent.makeDiscoverable.addListener(
    /**
     * @param {Object} payload
     * @param {Socket} payload.socket
     * @param {Object} payload.options
     * @param {Function} payload.callback
     */
    ({ socket, options = {}, callback = nop } = {}) => {
      const { userRooms, v } = options;
      console.log(`[makeDiscoverable] socket.id: ${socket.id}, v: ${v}, userRooms:`, userRooms);
      if (
        v !== MessageVersion.messageExchangeV1 ||
        !Array.isArray(userRooms)
      ) {
        callback({
          error: '[makeDiscoverable] Unsupported options or version.',
        });
        return;
      }

      if (!socket.data.pubNames) {
        socket.data.pubNames = {};
      }

      const rejected = [];
      for (let i = 0, len = userRooms.length; i < len; i++) {
        const pubName = userRooms[i].pubName;

        if (typeof pubName !== 'string' || pubName.length < 5 || pubName.length > 36) {
          rejected.push(i);
          continue;
        }

        console.log('-> Client joins invite room', pubName);
        socket.join(pubName);
      }

      callback({ rejected });
    });
}

// --- Exports --- //

module.exports = {
  bootServer,
};
