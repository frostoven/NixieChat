import websocketController from '../controllers/websocket.controller';
import { Emitter } from '@socket.io/postgres-emitter';
import { NixieApi } from './NixieApi';

const { socketEvent } = websocketController;

// --- Start server API --- //

/**
 * @param {Emitter} clusterEmitter
 */
function initSocketApi(clusterEmitter: Emitter | null) {
  const api = new NixieApi(clusterEmitter);
  socketEvent.ping.addListener(api.ping.bind(api));
  socketEvent.makeDiscoverable.addListener(api.makeDiscoverable.bind(api));
  socketEvent.sendInvitation.addListener(api.sendInvitation.bind(api));
  socketEvent.respondToInvite.addListener(api.respondToInvite.bind(api));
  socketEvent.sendDhPubKey.addListener(api.sendDhPubKey.bind(api));
}

// --- Exports --- //

export {
  initSocketApi,
};
