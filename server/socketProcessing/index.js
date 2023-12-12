const { socketEvent } = require('../controllers/websocket.controller');
const { Socket } = require('socket.io');
const {
  sendMessageToClient,
} = require('./outboundMessages');
const { MessageVersion } = require('../../shared/MessageVersion');
const { Emitter } = require('@socket.io/postgres-emitter');
const { sharedConfig } = require('../../shared/config');

const nop = () => {
};

// --- Boot section --- //

/**
 * @param {Emitter} clusterEmitter
 */
function bootServer(clusterEmitter) {
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

  socketEvent.findContact.addListener(
    /**
     * @param {Object} payload
     * @param {Socket} payload.socket
     * @param {Object} payload.options
     * @param {Function} payload.callback
     */
    ({ socket, options = {}, callback = nop } = {}) => {
      console.log(`=> socket.id: ${socket.id}`);
      const { source, target, greeting, pubKey, time, v } = options;
      console.log(`[findContact] socket.id: ${socket.id}, v: ${v}, source: ${source}, target: ${target}`);
      if (v !== MessageVersion.findContactV1 || !source || !target) {
        callback({
          error: '[findContact] Unsupported options or version.',
        });
        return;
      }

      if (greeting.length > sharedConfig.greetingLimit) {
        callback({
          error: '[findContact] Greeting character limit exceeded.',
        });
        return;
      }

      clusterEmitter.emit(target, {
        requestId: socket.id,
        source,
        greeting,
        pubKey,
        time,
      });

      callback({ status: 'test' });
    });
}

// --- Exports --- //

module.exports = {
  bootServer,
};
