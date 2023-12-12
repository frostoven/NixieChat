import { serverEmitter } from '../emitters/comms';

class RemoteCrypto {
  /**
   * This function should run when the application boots. This currently
   * happens in client/index.js.
   */
  static initApiListeners() {
    // socket.io makes our own socket IDs a room by default. While this may be
    // useful in future, we have no use for it now, so just call it
    // 'malformed'.
    serverEmitter.on(serverEmitter.id, (...message) => {
      console.log(
        '[General Socket Message] Malformed message received:', message,
      );
    });
  }

  static makeDiscoverable() {
  }

  static async findContact() {
  }

  static async receiveInvite() {
  }
}

export {
  RemoteCrypto,
};
