import { socketEvent } from '../controllers/websocket.controller';
import { sendMessageToClient } from './outboundMessages';
import { MessageVersion } from '../../shared/MessageVersion';
import { Emitter } from '@socket.io/postgres-emitter';
import { sharedConfig } from '../../shared/config';
import { CryptoMessageType } from '../../shared/CryptoMessageType';
import { AssertReject } from '../../shared/AssertReject';
import { SocketEventParameters } from './types/SocketEventParameters';
import { getPgClusterEmitter } from '../db';
import { NixieApi } from './NixieApi';

/**
 * @param {Emitter} clusterEmitter
 */
function initSocketApi(clusterEmitter: Emitter) {
  const api = new NixieApi(clusterEmitter);
  socketEvent.ping.addListener(api.ping);
  socketEvent.makeDiscoverable.addListener(api.makeDiscoverable);
  socketEvent.sendInvitation.addListener(api.sendInvitation);
  socketEvent.respondToInvite.addListener(api.respondToInvite);
  socketEvent.sendDhPubKey.addListener(api.sendDhPubKey);
}

// --- Exports --- //

export {
  initSocketApi,
};
