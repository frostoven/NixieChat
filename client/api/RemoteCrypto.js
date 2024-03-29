import { clientEmitter, serverEmitter } from '../emitters/comms';
import { CryptoMessageType as Socket } from '../../shared/CryptoMessageType';
import { MessageVersion } from '../../shared/MessageVersion';
import { EncryptedAccountStorage } from '../storage/EncryptedAccountStorage';
import { ClientMessageType } from '../emitters/ClientMessageType';
import {
  clientEmitterAction as Action,
} from '../emitters/clientEmitterAction';
import { Invitation } from './Invitation';
import { logConfig } from '../config/logging';

const verbose = logConfig.verboseHandshakeLogs;

const nop = () => {
};

const accountStorage = new EncryptedAccountStorage();

class RemoteCrypto {
  static namesPendingInvites = {};
  static trackedInvitesById = {};

  /**
   * This function should run when the application boots. This currently
   * happens in client/index.js.
   */
  static initApiListeners() {
    // Socket.io creates a room for each socket id by default. Within the
    // context of NixieChat, we use direct id message as an invitation response
    // system. If we're not expecting invitation responses, we silently reject
    // the messages.
    serverEmitter.on(serverEmitter.id, RemoteCrypto.receiveInvitationResponse);

    // We've received a DH key from someone we're in the process of becoming
    // contacts with.
    serverEmitter.on(Socket.sendDhPubKey, RemoteCrypto.receiveDhPubKey);

    // Allows us to be reached by other clients.
    RemoteCrypto.makeDiscoverable();
  }

  // Makes you visible to the network so that you may receive invitations.
  static makeDiscoverable() {
    /** @type {AccountCache[]} */
    const accounts = accountStorage.getAllAccountsAsArray();
    if (!accounts.length) {
      return console.log('No accounts on this device; skipping registration.');
    }

    const userRooms = [];

    for (let i = 0, len = accounts.length; i < len; i++) {
      /** @type {AccountCache} */
      const accountCache = accounts[i];
      if (!accountCache.decryptedData) {
        console.log(`-> Skipping registration of '${accountCache.accountName}' - not logged in.`);
        continue;
      }
      const {
        accountName, publicName, privateKey, publicKey, modulusHash,
      } = accountCache.decryptedData;
      if (publicName) {
        userRooms.push({
          pubName: publicName,
        });
        // Treat our own public name as a chat room. This allows us to receive
        // invitations in a very natural fashion.
        serverEmitter.on(publicName, (args) => RemoteCrypto.receiveInvitation(publicName, args));
      }
    }

    const options = {
      userRooms,
      v: MessageVersion.deviceRegistrationV1,
    };

    serverEmitter.timeout(10000).emit(
      Socket.makeDiscoverable,
      options,
      (socketError, { error, rejected = [] } = {}) => {
        if (socketError) {
          console.error('Socket error:', socketError);
        }
        else if (error) {
          console.error('Server error:', error);
        }
        else if (!rejected.length) {
          verbose && console.log('[makeDiscoverable] Success.');
        }
        else {
          console.warn(
            '[makeDiscoverable] Server rejected some public names. Indexes:',
            rejected,
          );
        }
      },
    );
  }

  // Sends an invitation to someone.
  // Used to be called findContact.
  static async sendInvitation(
    localAccountId, localAccountName, contactPublicName, localGreeting,
    localGreetingName, callback = nop,
  ) {
    // Sending out an invitation is a first (local) contact creation step, so
    // create a new instance to track it.
    const contactCreator = new Invitation({
      localAccountId,
      localAccountName,
      localSocketId: serverEmitter.id,
      localGreetingName,
      localGreeting,
      contactPublicName,
    });

    if (contactCreator.error) {
      // TODO: Toast a friendly version of this, or post it in a user-visible system
      //  chat.
      return console.error(
        'Received a contact invitation, but could not initiate the process.',
        'Error:', contactCreator.error,
      )
    }

    // Keep track of pending invite names. If we receive an RSVP response from
    // someone we didn't send an invitation to then treat them as spam. This
    // allows looking them up by public name.
    // TODO: check from class instead.
    RemoteCrypto.namesPendingInvites[contactPublicName] = contactCreator;

    const responseObject = await contactCreator.stage1_prepareInvitation();
    responseObject.v = MessageVersion.sendInvitationV1;

    serverEmitter.timeout(20000).emit(
      Socket.sendInvitation,
      responseObject,
      (socketError, { error, results = [] } = {}) => {
        // TODO: Toast these errors.
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
  static async receiveInvitation(receiverName, {
    source, greetingName, greeting, pubKey, time, replyAddress,
  }) {
    const account = accountStorage.findAccountByPublicName({
      publicName: receiverName,
    });

    if (!account) {
      return console.error(
        'Received an invite for which we have no matching public name ' +
        `(${receiverName}). Stale info server-side?`,
      );
    }

    verbose && console.log('Received invitation from', replyAddress);

    // Receiving an invitation at random is a first (local) contact creation
    // step, so create a new instance to track it.
    const contactCreator = new Invitation({
      localAccountId: account.decryptedData.accountId,
      localAccountName: account.decryptedData.accountName,
      localSocketId: serverEmitter.id,
      contactPublicName: source,
    });

    // Store by sender's public name for later use.
    RemoteCrypto.trackedInvitesById[replyAddress] = contactCreator;

    const responseObject = await contactCreator.stage1_prepareInvitationResponse({
      replyAddress, pubKey, time, greetingName, greeting,
    });

    verbose && console.log('Sending invitation response.');
    clientEmitter.emit(Action.updateContactCreatorViews, contactCreator.getInfo());
    serverEmitter.emit(Socket.respondToInvite, responseObject);
  }

  // Called when we've sent out an invitation and got a response.
  static async receiveInvitationResponse({
    answer,
    sourceId,
    publicName,
    greetingName,
    greetingMessage,
    pubKey,
    replyAddress,
  } = {}) {
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
    else {
      verbose && console.log('Received RSVP from', sourceId);
    }

    /** @type Invitation */
    const contactCreator = RemoteCrypto.namesPendingInvites[publicName];
    // Ticket used up; forget.
    // TODO: maybe with new system instead set flag? or maybe not.
    delete RemoteCrypto.namesPendingInvites[publicName];
    RemoteCrypto.trackedInvitesById[replyAddress] = contactCreator;

    await contactCreator.stage2_receiveInvitationResponse({
      answer,
      greetingMessage,
      greetingName,
      pubKey,
      replyAddress,
    });

    clientEmitter.emit(ClientMessageType.receiveRsvpResponse, contactCreator.getInfo());
  }

  /**
   * Generates a DH public key and passes sends it to the specified target
   * socket ID. Returns the generated key.
   */
  static async createAndSendDhPubKey({ targetId, modGroup }) {
    /** @type Invitation */
    const contactCreator = RemoteCrypto.trackedInvitesById[targetId];
    if (!contactCreator) {
      return console.error(
        `No creator instance exists for id '${targetId}'. Ignoring request. ` +
        `trackedInvitesById dump:`, RemoteCrypto.trackedInvitesById,
      );
    }

    const responseObject = await contactCreator.stage3_prepareDhKey({
      modGroup,
    });
    responseObject.needDhReply = true;

    RemoteCrypto.trackedInvitesById[contactCreator.contactSocketId] = contactCreator;

    clientEmitter.emit(Action.updateContactCreatorViews, contactCreator.getInfo());
    verbose && console.log(`Sending DH key to prospective contact (automatic).`);
    serverEmitter.emit(Socket.sendDhPubKey, responseObject);
  }

  // We've received a DH key from someone that we're in the process of becoming
  // contacts with.
  static async receiveDhPubKey(options) {
    const { sourceId, dhPubKey, needDhReply, modGroup, salt } = options;

    /** @type Invitation */
    const contactCreator = RemoteCrypto.trackedInvitesById[sourceId];
    if (!contactCreator) {
      return console.error(
        `Received DH key from ID '${sourceId}', but we're not currently ` +
        'waiting for any such keys. Perhaps they suffered a connection reset?',
        'trackedInvitesById dump:', RemoteCrypto.trackedInvitesById,
      );
    }
    else {
      verbose && console.log('Received DH public key from', sourceId);
    }

    await contactCreator.stageless_receiveDhPubKey({
      dhPubKey, salt,
    });

    if (needDhReply) {
      const responseObject = await contactCreator.stage3_prepareDhKey({
        modGroup,
      });
      responseObject.needDhReply = false;

      verbose && console.log(`Sending DH key to prospective contact (as per request).`);
      clientEmitter.emit(Action.updateContactCreatorViews, contactCreator.getInfo());
      serverEmitter.emit(Socket.sendDhPubKey, responseObject);
    }
    else {
      clientEmitter.emit(Action.updateContactCreatorViews, contactCreator.getInfo());
    }
  }

  static async startVerification({ creatorId }) {
    const contactCreator = Invitation.getInstanceById(creatorId);
    const id = contactCreator.contactSocketId;
    if (!RemoteCrypto.trackedInvitesById[contactCreator.contactSocketId]) {
      console.error('[RemoteCrypto] Cannot start verification - ID mismatch.');
      return;
    }

    await contactCreator.stage4_computeSharedSecret();
    verbose && console.log('Final handshake state:', contactCreator.getInfo());
  }
}

export {
  RemoteCrypto,
};
