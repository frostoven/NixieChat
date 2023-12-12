import { serverEmitter } from '../emitters/comms';
import { CryptoMessageType as Socket } from '../../shared/CryptoMessageType';
import { MessageVersion } from '../../shared/MessageVersion';
import { Accounts } from '../storage/cacheFrontends/Accounts';
import { exportRsaPublicKey } from '../encryption/rsa';

const nop = () => {
};

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
    /** @type CollectionCache */
    const accountCollection = Accounts.getAccountCollection();
    if (!accountCollection.length) {
      return console.log('No accounts on this device; skipping registration.');
    }

    const userRooms = [];

    const accounts = accountCollection.asArray;
    for (let i = 0, len = accounts.length; i < len; i++) {
      const {
        accountName, publicName, privateKey, publicKey, modulusHash,
      } = accounts[i];
      console.log(`-> Account "${accountName}" info:`, accounts[i]);
      if (publicName) {
        userRooms.push({
          pubName: publicName,
        });
        // Treat our own public name as a chat room. This allows us to receive
        // invitations in a very natural fashion.
        serverEmitter.on(publicName, (args) => this.receiveInvite(publicName, args));
      }
    }

    const options = {
      userRooms,
      v: MessageVersion.deviceRegistrationV1,
    };

    console.log(userRooms);
    serverEmitter.timeout(10000).emit(
      Socket.makeDiscoverable,
      options,
      (socketError, { error, rejected = [] } = {}) => {
        if (socketError) {
          console.error('Socket error:', socketError);
        }
        else if (error) {
          console.error('Error:', error);
        }
        else if (!rejected.length) {
          console.log('[makeDiscoverable] Success.');
        }
        else {
          console.log(
            '[makeDiscoverable] Some public names were rejected. Indexes:',
            rejected,
          );
        }
      },
    );
  }

  static async findContact(source, target, greeting, callback = nop) {
    const activeAccount = Accounts.getActiveAccount();

    const options = {
      source,
      target,
      greeting,
      pubKey: await exportRsaPublicKey({ publicKey: activeAccount.publicKey }),
      time: Date.now(),
      v: MessageVersion.findContactV1,
    };
    console.log('[findContact] Sending:', options);

    // TODO: set to correct value once dev work concludes.
    // serverEmitter.timeout(120000).emit(
    serverEmitter.timeout(1500).emit(
      Socket.findContact,
      options,
      (socketError, { error, results = [] } = {}) => {
        if (socketError) {
          console.error('Socket error:', socketError);
          callback('Socket error:' + socketError.toString());
        }
        else if (error) {
          console.error('Error:', error);
          callback('Error:' + error);
        }
        else {
          callback(null, results);
        }
      },
    );
  }

  static async receiveInvite() {
  }
}

export {
  RemoteCrypto,
};
