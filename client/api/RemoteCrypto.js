import { clientEmitter, serverEmitter } from '../emitters/comms';
import { CryptoMessageType as Socket } from '../../shared/CryptoMessageType';
import { MessageVersion } from '../../shared/MessageVersion';
import { Accounts } from '../storage/cacheFrontends/Accounts';
import { exportRsaPublicKey, importRsaPublicKey } from '../encryption/rsa';
import { showInvitationDialog } from '../modal/nixieDialogs';
import { InvitationResponse } from '../../shared/InvitationResponse';
import { getDiffieHellman } from 'diffie-hellman';
import { KeyStrength } from '../../shared/KeyStrength';
import { ClientMessageType } from '../emitters/ClientMessageType';

const nop = () => {
};

class RemoteCrypto {
  static namesPendingInvites = {};

  /**
   * This function should run when the application boots. This currently
   * happens in client/index.js.
   */
  static initApiListeners() {
    // Socket.io creates a room for each socket id by default. Within the
    // context of NixieChat, we use direct id message as an invitation response
    // system. If we're not expecting invitation responses, we silently reject
    // the messages.
    serverEmitter.on(serverEmitter.id, RemoteCrypto.receiveInviteResponse);
  }

  // Makes you visible to the network so that you may receive invitations.
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
        serverEmitter.on(publicName, (args) => RemoteCrypto.receiveInvite(publicName, args));
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

  // Sends an invitation to someone.
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

    // Keep track of pending invite names. If we receive an RSVP response from
    // someone we didn't send an invitation to then treat them as spam.
    RemoteCrypto.namesPendingInvites[target] = { name: target };

    serverEmitter.timeout(120000).emit(
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

  // Called when we receive an invitation from someone.
  static async receiveInvite(ownName, {
    requestId,
    source,
    greeting,
    pubKey,
    time,
  }) {
    // TODO: toast that invite was received, in case user is in another modal.

    console.log('[invite]', {
      ownName, requestId, source, greeting, pubKey, time,
    });

    const response = await showInvitationDialog({
      ownName, requestId, source, greeting, pubKey, time,
    });

    // Find the account associated with the requested public name.
    const receivingAccount = Accounts.findAccountByPublicName({
      publicName: ownName,
    });

    if (!receivingAccount) {
      return $modal.alert({
        header: 'Invite Response Failed',
        body: 'Could not respond to invite because none of your accounts ' +
          `appear to have the public name "${ownName}" associated with  ` +
          'them. Was the name maybe deleted before the contact could respond?',
      });
    }

    const { answer } = response;

    const { block, reject, postpone, accept } = InvitationResponse;
    if (answer === block || answer === reject) {
      // Do not reply; this means a malicious party won't know whether or not
      // this account is online.
      // TODO: Handle block. Save block info in removeEventListener account
      //  only.
      console.log('Not replying to invite.');
    }
    else if (answer === postpone) {
      // Send rain check without acceptance extras.
      console.log(`Sending postponement to ${requestId}.`);
      serverEmitter.emit(Socket.respondToInvite, {
        target: requestId,
        answer,
      });
    }
    else if (answer === accept) {
      // The server sends us the public key as an ArrayBuffer, convert to view.
      pubKey = new Uint8Array(pubKey);

      const { greetingName, greetingMessage } = response;

      console.log(`Sending response ${response} to ${requestId}.`);
      serverEmitter.emit(Socket.respondToInvite, {
        target: requestId,
        answer,
        ownName,
        greetingName,
        greetingMessage,
        pubKey: await exportRsaPublicKey({
          publicKey: receivingAccount.publicKey,
        }),
      });
    }
  }

  // Called when we send out an invitation and got a response.
  static async receiveInviteResponse({
    answer,
    sourceId,
    publicName,
    greetingName,
    greetingMessage,
    pubKey,
  } = {}) {
    // TODO: save these in a global log.
    if (sourceId !== serverEmitter.id) {
      return console.warn('Ignoring RSVP to invalid id', sourceId);
    }
    else if (!RemoteCrypto.namesPendingInvites[publicName]) {
      return console.warn('Ignoring RSVP from uninvited guest', publicName);
    }
    else if (!(pubKey instanceof ArrayBuffer)) {
      return console.warn('Ignoring RSVP from guest with weird public key:', {
        pubKey,
      });
    }

    // Ticket used up; forget.
    delete RemoteCrypto.namesPendingInvites[publicName];

    // The server sends us the public key as an ArrayBuffer, convert to a view.
    pubKey = new Uint8Array(pubKey);

    // Used for visualizations.
    let pemKey = await importRsaPublicKey(pubKey, 'raw');
    pemKey = await exportRsaPublicKey({ publicKey: pemKey }, 'pem');

    console.log('=> got invite response:', {
      answer,
      sourceId,
      publicName,
      pubKey,
    });

    const bob = getDiffieHellman(KeyStrength.messagingModGroup);
    // console.log(`Generating ${KeyStrength.messagingModGroup} DH keys.`);
    // bob.generateKeys();
    // console.log(`DH key generation complete.`);
    // console.log(`Generating DH secret.`);
    // const bobSecret = bob.computeSecret(pubKey);
    // console.log(`DH secret generation complete.`);
    // console.log({ bobSecret });

    clientEmitter.emit(ClientMessageType.receiveRsvpResponse, {
      answer,
      sourceId,
      publicName,
      pubKey,
      pemKey,
    });
  }
}

export {
  RemoteCrypto,
};
