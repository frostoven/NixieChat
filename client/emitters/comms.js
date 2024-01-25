import EventEmitter from './EventEmitter';
import { RemoteCrypto } from '../api/RemoteCrypto';

const clientEmitter = new EventEmitter();
/** @type Socket */
const serverEmitter = io(`ws://${location.host}`);

serverEmitter.on('connect', () => {
  console.log('WebSocket ID:', serverEmitter.id);
  RemoteCrypto.initApiListeners();
});

export {
  clientEmitter,
  serverEmitter,
}
