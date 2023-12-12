import { serverEmitter } from '../emitters/comms';
import { PlainMessageType } from '../../shared/PlainMessageType';

class RemotePlaintext {
  /**
   * This function should run when the application boots. This currently
   * happens in client/index.js.
   */
  static initApiListeners() {
    serverEmitter.on(PlainMessageType.message, console.log);
    serverEmitter.on(PlainMessageType.error, console.error);
    serverEmitter.on(PlainMessageType.notifyServerReady, console.log);
  }
}

export {
  RemotePlaintext,
};
