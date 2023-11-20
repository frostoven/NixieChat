import EventEmitter from './EventEmitter';
import config from './config/server';

const clientEmitter = new EventEmitter();
const serverEmitter = io('ws://localhost:' + config.server.webSocket);

const clientPresets = {
  ping: ({ graveZone, description, className }) => {
    // TODO: populate me.
  },
};

export {
  clientEmitter,
  serverEmitter,
  clientPresets,
}
