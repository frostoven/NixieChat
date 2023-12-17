import React from 'react';
import { serverEmitter } from '../emitters/comms';
import { CryptoMessageType as Socket } from '../../shared/CryptoMessageType';
import { MessageVersion } from '../../shared/MessageVersion';
import { Accounts } from '../storage/cacheFrontends/Accounts';
import { exportRsaPublicKey } from '../encryption/rsa';
import { showInvitationDialog } from '../modal/nixieDialogs';
import { InvitationResponse } from '../../shared/InvitiationResponse';
import { getDiffieHellman } from 'diffie-hellman';
import { KeyStrength } from '../../shared/KeyStrength';

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

    // Keep track of pending invite names. If we receive an RSVP from someone
    // we didn't send an invitation to, then we want to treat them as spam.
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
    console.log({ requestId, source, greeting });
    // TODO: toast that invite was received, in case user is in another modal.

    console.log('[invite]', {
      ownName, requestId, source, greeting, pubKey, time,
    });

    const response = await showInvitationDialog({
      ownName, requestId, source, greeting, pubKey, time,
    });

    // serverCallback(response);
    // Find the account associated with the requested public name.
    let receivingAccount = null;
    const accounts = Accounts.getAccountCollection().asArray;
    for (let i = 0, len = accounts.length; i < len; i++) {
      const account = accounts[i];
      if (account.publicName === ownName) {
        receivingAccount = account;
        break;
      }
    }

    if (!receivingAccount) {
      return $modal.alert({
        header: 'Invite Response Failed',
        body: 'Could not respond to invite because none of your accounts ' +
          `appear to have the public name "${ownName}" associated with  ` +
          'them. Was the name maybe deleted before the contact could respond?',
      });
    }

    const { block, reject, postpone, accept } = InvitationResponse;
    if (response === block || response === reject) {
      // Do not reply; this means a malicious party won't know whether or not
      // this account is online.
      // TODO: Handle block. Save block info in removeEventListener account
      //  only.
      console.log('Not replying to invite.');
    }
    else if (response === postpone) {
      // Send rain check without acceptance extras.
      console.log(`Sending postponement to ${requestId}.`);
      serverEmitter.emit(Socket.respondToInvite, {
        target: requestId,
        resp: response,
        ownName,
      });
    }
    else if (response === accept) {
      // The server sends us the public key as an ArrayBuffer, convert to view.
      pubKey = new Uint8Array(pubKey);

      // Seeing as someone sent us an invitation, and we've indicated we want
      // to connect, we may as well do DH now and respond.
      // TODO: benchmark on old devices, make sure that there's enough time. If
      //  not, we'll need an additional reply step. Maybe simply ping the other
      //  device telling it to stall its timer, and then start.
      const alice = getDiffieHellman(KeyStrength.messagingModGroup);
      console.log(`Generating ${KeyStrength.messagingModGroup} DH keys.`);
      alice.generateKeys();
      // console.log(`DH key generation complete.`);
      // console.log(`Generating DH secret.`);
      // const aliceSecret = alice.computeSecret(pubKey);
      // console.log(`DH secret generation complete.`);
      // console.log({ aliceSecret });

      console.log(`Sending response ${response} to ${requestId}.`);
      serverEmitter.emit(Socket.respondToInvite, {
        target: requestId,
        resp: response,
        ownName,
        pubKey: await exportRsaPublicKey({
          publicKey: receivingAccount.publicKey,
        }),
      });
    }
  }

  }
}

export {
  RemoteCrypto,
};
