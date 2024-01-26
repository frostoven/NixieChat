import { Socket, io } from 'socket.io-client';
import EventEmitter from './EventEmitter';
import { RemoteCrypto } from '../api/RemoteCrypto';
import { clientEmitterAction } from './clientEmitterAction';
import { NixieStorage } from '../storage/NixieStorage';

let reconnectionCount = 0;
const clientEmitter = new EventEmitter();
const serverEmitter: Socket = io(`ws://${location.host}`);

async function refreshStorage() {
  const storage = new NixieStorage();
  await storage.initStorage();
  await storage.buildAccountCollectionCache();
  clientEmitter.emit(clientEmitterAction.reloadApp);
}

clientEmitter.on(clientEmitterAction.reloadStorage, async () => {
  refreshStorage().catch(console.error);
});

serverEmitter.on('connect', async () => {
  await refreshStorage();
  RemoteCrypto.initApiListeners();

  clientEmitter.emit(clientEmitterAction.clientReconnected);
  if (!reconnectionCount++) {
    console.log('Connected to server.');
  }
  else {
    console.log('Reconnected to server.');
  }
});

serverEmitter.on('disconnect', () => {
  console.log('Disconnected from server...');
  clientEmitter.emit(clientEmitterAction.clientDisconnected);
});

export {
  clientEmitter,
  serverEmitter,
};