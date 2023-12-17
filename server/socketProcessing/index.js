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

      // It's important to know how we use socket.id because we actually use
      // it for many different things simultaneously. Socket.io automatically
      // creates a room for each id, meaning it's there and ready to use. We
      // use it here as a reply address. At the same time, once we've
      // broadcast the id, anyone listening on that public name now knows how
      // to find us, which is a privacy issue (especially if the contact we're
      // actually trying to reach shares the id). We could instead create
      // temporary rooms and use those as reply addresses, but that introduces
      // a lot of complexity as we'd then need to keep track of room expiration
      // across clusters (which, far as I can tell, Socket.io does not support
      // natively). Instead, once the contact accepts the invite (or the invite
      // times out), the client triggers generation of a new socket id by
      // closing the current connection and establishing a new one (after
      // waiting a small but random amount of time). This allows us to fully
      // utilize built-ins but still have a different reply address with each
      // new invite. This also drives home the idea that ids should not be
      // relied on for permanence, as per Socket.io docs recommendation.
      clusterEmitter.to(target).emit(target, {
        requestId: socket.id,
        source,
        greeting,
        pubKey,
        time,
      });

      callback({ status: 'received' });
    },
  );

  socketEvent.respondToInvite.addListener(
    /**
     * @param {Object} payload
     * @param {Socket} payload.socket
     * @param {Object} payload.options
     * @param {Function} payload.callback
     */
    ({ socket, options = {}, callback = nop } = {}) => {
      console.log('====> receiveInviteResponse:', options);
      const { target, resp, ownName, pubKey } = options;
      clusterEmitter.to(target).emit(target, {
        resp,
        sourceId: target,
        contactName: ownName,
        pubKey,
      });
    });
}

// --- Exports --- //

module.exports = {
  bootServer,
};
