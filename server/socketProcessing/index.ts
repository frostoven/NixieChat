import { socketEvent } from '../controllers/websocket.controller';
import { sendMessageToClient } from './outboundMessages';
import { MessageVersion } from '../../shared/MessageVersion';
import { Emitter } from '@socket.io/postgres-emitter';
import { sharedConfig } from '../../shared/config';
import { CryptoMessageType } from '../../shared/CryptoMessageType';
import { AssertReject } from '../../shared/AssertReject';
import { SocketEventParameters } from './types/SocketEventParameters';

const nop = () => {
};

// Some basic anonymous stats so we have an idea of how many active users we
// have per server.
const runtimeStats = {
  // pings: 0,
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

// Used to auto-gen error responses.
const assertReject = new AssertReject((
  logTitle: string, failedCheck: string, onError: Function,
) => {
  if (runtimeStats.usageErrors[logTitle]) {
    runtimeStats.usageErrors[logTitle]++;
  }
  else {
    runtimeStats.usageErrors[logTitle] = 1;
  }

  onError({ error: `${logTitle} ${failedCheck}` });
  return false;
});

// --- Boot section --- //

/**
 * @param {Emitter} clusterEmitter
 */
function bootServer(clusterEmitter: Emitter) {
  socketEvent.ping.addListener(
    /**
     * @param {Object} payload
     * @param {Socket} payload.socket
     */
    ({ socket }: SocketEventParameters) => {
      return sendMessageToClient({
        message: 'Received.', socket: socket.id,
      });
    });

  socketEvent.makeDiscoverable.addListener(
    /**
     * @param {Object} payload
     * @param {Socket} payload.socket
     * @param {Object} payload.options
     * @param {Function} payload.callback
     */
    ({ socket, options = {}, callback = nop }: SocketEventParameters) => {
      runtimeStats.makeDiscoverable++;
      if (!options) {
        return callback({ error: '[makeDiscoverable] Malformed options.' });
      }

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

      const rejected: number[] = [];
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

  socketEvent.sendInvitation.addListener(
    /**
     * @param {Object} payload
     * @param {Socket} payload.socket
     * @param {Object} payload.options
     * @param {Function} payload.callback
     */
    ({ socket, options = {}, callback = nop }: SocketEventParameters) => {
      runtimeStats.sendInvitation++;
      if (!options) {
        return callback({ error: '[sendInvitation] Malformed options.' });
      }

      console.log(`=> socket.id: ${socket.id}`);
      const {
        source, target, greeting, greetingName, pubKey, time, v,
      } = options;
      console.log(`[sendInvitation] socket.id: ${socket.id}, v: ${v}, source: ${source}, target: ${target}`);

      if (v !== MessageVersion.sendInvitationV1 || !source || !target) {
        callback({ error: '[sendInvitation] Unsupported options or version.' });
        return;
      }

      // Requirement: Must be string or null, no larger than greetingLimit.
      if (!assertReject.stringOrNull(
        '[sendInvitation] "greeting"', greeting, sharedConfig.greetingLimit,
        callback,
      )) {
        return;
      }

      // TODO: check greeting limits

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
        source,
        greeting,
        greetingName,
        pubKey,
        time,
        replyAddress: socket.id,
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
    ({ socket, options = {}, callback = nop }: SocketEventParameters) => {
      runtimeStats.respondToInvite++;
      if (!options) {
        return callback({ error: '[respondToInvite] Malformed options.' });
      }

      console.log('=> receiveInvitationResponse:', options);
      const {
        target, answer, ownName, greetingName, greetingMessage, pubKey,
      } = options;
      clusterEmitter.to(target).emit(target, {
        answer,
        sourceId: target,
        publicName: ownName,
        greetingName,
        greetingMessage,
        pubKey,
        replyAddress: socket.id,
      });
    });

  socketEvent.sendDhPubKey.addListener(
    /**
     * @param {Object} payload
     * @param {Socket} payload.socket
     * @param {Object} payload.options
     * @param {Function} payload.callback
     */
    ({ socket, options = {}, callback = nop }: SocketEventParameters) => {
      runtimeStats.sendDhPubKey++;
      if (!options) {
        return callback({ error: '[sendDhPubKey] Malformed options.' });
      }

      console.log('--> Server received sendDhPubKey. Options:', options);
      const { targetId, dhPubKey, needDhReply, modGroup } = options;

      if (!targetId || typeof targetId !== 'string') {
        callback({ error: '[sendDhPubKey] Invalid target.' });
        return;
      }

      if (!dhPubKey) {
        callback({ error: '[sendDhPubKey] Missing key.' });
        return;
      }

      if (!modGroup) {
        callback({ error: '[sendDhPubKey] Missing mod group.' });
        return;
      }

      clusterEmitter.to(targetId).emit(CryptoMessageType.sendDhPubKey, {
        sourceId: socket.id,
        dhPubKey,
        needDhReply,
        modGroup,
      });
    });
}

// --- Exports --- //

export {
  bootServer,
};
