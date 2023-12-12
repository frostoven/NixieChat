import React from 'react';
import { serverEmitter } from '../emitters/comms';
import { CryptoMessageType as Socket } from '../../shared/CryptoMessageType';
import { MessageVersion } from '../../shared/MessageVersion';
import { Accounts } from '../storage/cacheFrontends/Accounts';
import { exportRsaPublicKey, importRsaPublicKey } from '../encryption/rsa';
import {
  ReceiveInvitation,
} from '../components/ContactComponents/ReceiveInvitation';

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

  static async receiveInvite(ownName, {
    requestId,
    source,
    greeting,
    pubKey,
    time,
  } = {}) {
    console.log({ requestId, source, greeting });
    // TODO: toast that invite was received, in case user is in another modal.

    if (
      typeof requestId !== 'string' ||
      typeof source !== 'string' ||
      typeof greeting !== 'string' ||
      !(pubKey instanceof ArrayBuffer) ||
      typeof time !== 'number'
    ) {
      console.log(
        '[receiveInvite] Received malformed invite. Dump:',
        { requestId, source, greeting, pubKey, time },
      );
      return;
    }

    // Node sends this as an ArrayBuffer, so we wrap it in a uint8 view.
    pubKey = new Uint8Array(pubKey);

    // Useful for visualisations.
    let pemKey = await importRsaPublicKey(pubKey, 'raw');
    pemKey = await exportRsaPublicKey({ publicKey: pemKey }, 'pem');

    const dialog = $modal.alert({
      header: 'Contact Invite',
      body: 'Loading invite...',
      hideStackCounter: true,
    });

    dialog.onDimmerClick = () => {
      // Prevent accidentally closing invitations.
      const confirmation = $modal.confirm({
        header: 'Invite',
        body: 'Are you sure you want to reject the invite?',
        prioritise: true,
        hideStackCounter: true,
      }, (proceed) => {
        if (proceed) {
          $modal.deactivateModalById(confirmation.id);
          $modal.deactivateModalById(dialog.id);
        }
        else {
          $modal.deactivateModalById(confirmation.id);
        }
      });
    };

    // We create this after $modal.alert() so that we can safely pass in the
    // dialog options object.
    dialog.body = (
      <ReceiveInvitation
        dialog={dialog}
        source={source}
        ownName={ownName}
        greeting={greeting}
        pubKey={pubKey}
        pemKey={pemKey}
        time={time}
      />
    );

    // Force the dialog to recognise the body change.
    $modal.invalidate();
  }
}

export {
  RemoteCrypto,
};
