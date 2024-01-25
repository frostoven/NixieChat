import { socketEvent } from '../controllers/websocket.controller';
import { sendMessageToClient } from './outboundMessages';
import { MessageVersion } from '../../shared/MessageVersion';
import { Emitter } from '@socket.io/postgres-emitter';
import { sharedConfig } from '../../shared/config';
import { CryptoMessageType } from '../../shared/CryptoMessageType';
import { AssertReject } from '../../shared/AssertReject';
import { SocketEventParameters } from './types/SocketEventParameters';

const {
  greetingLimit,
  maxConcurrentAccounts,
  minPubNameLength,
  maxPubNameLength,
  maxPubKeyLength,
} = sharedConfig;

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
  // Note on runtime type checks: We do type checking where not doing so can
  // harm the server or its performance. For example, if a script kiddie sends
  // us '{ object: null }' but we expect '{ object: {} }', then the server will
  // crash when we try to access 'object'. While we do automatically restart
  // crashed instances, it nonetheless drastically hurts performance doing so.
  //
  // For cases where bad values can harm the client but not the server (such as
  // passing bad values through), the server should not care. The client should
  // do its own checks for the values it cares about. We do care about variable
  // size abuse (for example sending a name of 2MB) but we manage that from the
  // internet-facing web server rather than from Node.

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

      // Requirement: 'options' must be non-null object. Arrays disallowed.
      if (!assertReject.nonNullObject(
        '[makeDiscoverable] "options"', options, callback,
      )) {
        return;
      }

      const { userRooms, v } = options;

      if (v !== MessageVersion.messageExchangeV1) {
        callback({
          error: '[makeDiscoverable] Unsupported version.',
        });
        return;
      }

      // Requirement: 'userRooms' must be and array and must contain items.
      if (!assertReject.nonEmptyArray(
        '[makeDiscoverable] "userRooms"', userRooms, callback,
      )) {
        return;
      }

      const rejected: number[] = [];
      const len = Math.min(userRooms.length, maxConcurrentAccounts);
      for (let i = 0; i < len; i++) {
        const pubName = userRooms[i].pubName;

        if (
          typeof pubName !== 'string' ||
          pubName.length < minPubNameLength ||
          pubName.length > maxPubNameLength
        ) {
          rejected.push(i);
          continue;
        }

        console.log('-> Client joins invite room', pubName);
        socket.join(pubName);
      }

      callback({ rejected, ignored: userRooms.length - len });
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

      // Requirement: 'options' must be non-null object. Arrays disallowed.
      if (!assertReject.nonNullObject('[sendInvitation] "options"', options, callback)) {
        return;
      }

      const {
        source, target, greeting, greetingName, pubKey, time, v,
      } = options;

      if (v !== MessageVersion.sendInvitationV1) {
        callback({ error: '[sendInvitation] Unsupported version.' });
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

      // Requirement: 'options' must be non-null object. Arrays disallowed.
      if (!assertReject.nonNullObject(
        '[respondToInvite] "options"', options, callback,
      )) {
        return;
      }

      const {
        target, answer, ownName, greetingName, greetingMessage, pubKey,
      } = options;

      // Requirement: 'target' must be string. Cannot be empty.
      if (!assertReject.nonEmptyString(
        '[sendInvitation] "target"', target, maxPubNameLength, callback,
      )) {
        return;
      }

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

      // Requirement: 'options' must be non-null object. Arrays disallowed.
      if (!assertReject.nonNullObject(
        '[respondToInvite] "options"', options, callback,
      )) {
        return;
      }

      const { targetId, dhPubKey, needDhReply, modGroup } = options;

      // Requirement: 'target' must be string. Cannot be empty.
      if (!assertReject.nonEmptyString(
        '[sendDhPubKey] "targetId"', targetId, maxPubNameLength, callback,
      )) {
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
