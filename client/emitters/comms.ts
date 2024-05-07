import { Socket, io } from 'socket.io-client';
import EventEmitter from './EventEmitter';
import { RemoteCrypto } from '../api/RemoteCrypto';
import { clientEmitterAction } from './clientEmitterAction';
import { UnencryptedSettingsStore } from '../storage/UnencryptedSettingsStore';

let reconnectionCount = 0;
const clientEmitter = new EventEmitter();
let serverEmitter: Socket | null = null;

const protocol = {
  'http:': 'ws:',
  'https:': 'wss:',
};

function initServerConnection() {
  if (serverEmitter) {
    // Init has already been done; quit out.
    // TODO: make RemoteCrypto re-assess new connections.
    return;
  }

  serverEmitter = io(`${protocol[location.protocol]}//${location.host}`);

  async function refreshStorage() {
    // TODO: Decide if this still makes sense. UnencryptedSettingsStore is shared between
    //  accounts, and as such is initialised early on. The class is a singleton
    //  and the init is idempotent, so this is effectively as no-op.
    const storage = new UnencryptedSettingsStore();
    await storage.initStorage();
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
}

export {
  clientEmitter,
  serverEmitter,
  initServerConnection,
};
