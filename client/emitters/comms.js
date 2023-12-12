import EventEmitter from './EventEmitter';
import config from '../config/server';

const clientEmitter = new EventEmitter();
/** @type Socket */
const serverEmitter = io(`ws://${location.host}`);

serverEmitter.on('connect', () => {
  console.log('WebSocket ID:', serverEmitter.id);
});

export {
  clientEmitter,
  serverEmitter,
}
