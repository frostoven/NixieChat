import { EncryptedAccountStorage } from '../storage/EncryptedAccountStorage';
import { exportRsaPublicKey, importRsaPublicKey } from '../encryption/rsa';
import { clientEmitter } from '../emitters/comms';
import { showInvitationDialog } from '../modal/nixieDialogs';
import { InvitationResponse } from '../../shared/InvitationResponse';
import { getDiffieHellman } from 'diffie-hellman';
import { KeyStrengthFriendly } from '../../shared/KeyStrength';
import { clientEmitterAction } from '../emitters/clientEmitterAction';
import {
  getRandomBits,
  get256RandomBits,
  setPromiseTimeout,
  uint8ArrayToHexString,
} from '../utils';
import { logConfig } from '../config/logging';

// Note: We use this only for TS typing. The DH browser library we use mirrors
// the node:crypto API. Node calls don't actually get bundled into the client.
import { DiffieHellmanGroup } from 'node:crypto';
import { InvitationInfo } from './types/InvitationInfo';

const verbose = logConfig.verboseHandshakeLogs;
const oldestAllowedTime = 1700000000000;

/**
 * Updates are sometimes sent out at sub-millisecond speed. Where UI updates
 * are involved, it helps to pause a bit so the user doesn't see frantic UI
 * movements.
 */
const MIN_UI_TRANSITION_MS = 250;

const accountStorage = new EncryptedAccountStorage();

/**
 * Used for both inbound and outbound invitations.
 *
 * Important notes:
 * * For non-UI stuff, never reference the underscored variables at all, even
 *   from within this class. Use their getters and setters instead as they've
 *   been set up to check for possible problems and are extremely strict about
 *   preventing duplicate writes.
 * * For UI stuff, use only the getInfo() function and nothing else. It's
 *   React-friendly and assumes that we don't care about referencing different
 *   stages out of order (which doubles are a progress-checking mechanism).
 */
class Invitation {

  /* == Class vars ============================================== */

  /**
   * Stores all ContactCreator instances by ID. They are removed from this
   * object once the contact is added.
   */
  private static _instanceFromId: { [key: string]: Invitation } = {};

  /**
   * String containing an error, or null if no error has occurred thus far. If
   * this is a string, then the player should redo the contact-adding process.
   * @type {null|string}
   */
  error: string | null = null;

  /**
   * True if an invitation has been sent out.
   */
  invitationSent = false;

  /**
   * True if an invitation was received from an external party.
   */
  invitationReceived = false;

  /**
   * If true, we've sent out and invitation and received a response.
   */
  inviteResponseReceived = false;

  /**
   * The supposed real name of the contact.
   */
  contactGreeting = '';

  /**
   * The greeting message we send out.
   */
  localGreeting = '';

  /**
   * Number uniquely defining this instance.
   */
  private _id = get256RandomBits() as string;

  /**
   * 0: not yet started; 1: finished. Note that there's no public accessor for
   * this; it's exposed via getInfo() only. Currently used by the UI to update
   * status.
   */
  private _dhPrepPercentage = 0;

  /**
   * Written description of _dhPrepPercentage. Note that there's no public
   * accessor for this; it's exposed via getInfo() only. Currently used by the
   * UI to update status.
   */
  private _dhPrepStatusMessage = 'Preparing...';

  /**
   * Method computed by both parties; never shared over the network. Note that
   * there's no public accessor for this; it's exposed via getInfo() only.
   */
  private _sharedSecret: Uint8Array | null = null;

  /* == Vars referenced by accessors  =========================== */

  // Documentation for the following vars can be found with their respective
  // getters. This is done so that the IDE can offer interactive docs (e.g.
  // Ctrl+Q with a selected variable in WebStorm).

  _localAccountId: string | null = null;
  _localAccountName: string | null = null;
  _receiverName: string | null = null;
  _initiatorName: string | null = null;
  _receiverSalt: Uint8Array | null = null;
  _initiatorSalt: Uint8Array | null = null;
  _contactSocketId: string | null = null;
  _localSocketId: string | null = null;
  _contactPublicName: string | null = null;
  _contactGreetingName: string | null = null;
  _localGreetingName: string | null = null;
  _localPublicName: string | null = null;
  _rsvpAnswer: InvitationResponse | null = null;
  _isOutbound: boolean | null = null;
  _contactPubKey = null;
  _contactPemKey: string | null = null;
  _localPemKey: string | null = null;
  _contactDhPubKey = null;
  _localPubKey: Uint8Array | null = null;
  _localDhKeyExchange: DiffieHellmanGroup | null = null;
  _dhModGroup = null;
  _time = 0;

  /* == Strict getters and setters ============================== */

  get id() {
    return this._id;
  }

  set id(_) {
    console.error('[ContactCreator] Instance id is read-only.');
  }

  /**
   * Unique identifier of our own account.
   */
  get localAccountId() {
    this._localAccountId === null && this.logNullRead('localAccountId');
    return this._localAccountId;
  }

  set localAccountId(value) {
    if (this._localAccountId !== null) {
      this.logRoError('localAccountId');
      return;
    }
    this._localAccountId = value;
  }

  /**
   * Unique name of our own account.
   */
  get localAccountName() {
    this._localAccountName === null && this.logNullRead('localAccountName');
    return this._localAccountName;
  }

  set localAccountName(value) {
    if (this._localAccountName !== null) {
      this.logRoError('localAccountName');
      return;
    }
    this._localAccountName = value;
  }

  /**
   * The name the invite has been sent to. While this is usually just a public
   * name, it's nonetheless important to distinguish it as an initial ping
   * address of sorts before comms switch to socket IDs.
   *
   * This name will be same on both clients.
   * @type {null|string}
   */
  get receiverName() {
    this._receiverName === null && this.logNullRead('receiverName');
    return this._receiverName;
  }

  set receiverName(value) {
    if (this._receiverName !== null) {
      this.logRoError('receiverName');
      return;
    }
    this._receiverName = value;
  }

  /**
   * The public name of the account that send out the invite. This name will be
   * same on both clients.
   * @type {null|string}
   */
  get initiatorName() {
    this._initiatorName === null && this.logNullRead('initiatorName');
    return this._initiatorName;
  }

  set initiatorName(value) {
    if (this._initiatorName !== null) {
      this.logRoError('initiatorName');
      return;
    }
    this._initiatorName = value;
  }

  get receiverSalt() {
    this._receiverSalt === null && this.logNullRead('receiverSalt');
    return this._receiverSalt;
  }

  set receiverSalt(value) {
    if (this._receiverSalt !== null) {
      this.logRoError('receiverSalt');
      return;
    }
    this._receiverSalt = value;
  }

  get initiatorSalt() {
    this._initiatorSalt === null && this.logNullRead('initiatorSalt');
    return this._initiatorSalt;
  }

  set initiatorSalt(value) {
    if (this._initiatorSalt !== null) {
      this.logRoError('initiatorSalt');
      return;
    }
    this._initiatorSalt = value;
  }

  /**
   * Timestamp of when the person sending out the invite did so.
   * @type {number}
   */
  get time() {
    this._time === 0 && this.logNullRead('time');
    return this._time;
  }

  set time(value) {
    if (this._time !== 0) {
      this.logRoError('time');
      return;
    }
    this._time = value;
  }

  /**
   * Public name of the person we're connecting to.
   * @type {null|string}
   */
  get contactPublicName() {
    this._contactPublicName === null && this.logNullRead('contactPublicName');
    return this._contactPublicName;
  }

  set contactPublicName(value) {
    if (this._contactPublicName !== null) {
      this.logRoError('contactPublicName');
      return;
    }
    this._contactPublicName = value;
  }

  /**
   * The supposed real name of the contact.
   * @type {null|string}
   */
  get contactGreetingName() {
    this._contactGreetingName === null && this.logNullRead('contactGreetingName');
    return this._contactGreetingName;
  }

  set contactGreetingName(value) {
    if (this._contactGreetingName !== null) {
      this.logRoError('contactGreetingName');
      return;
    }
    this._contactGreetingName = value;
  }

  /**
   * The greeting name we send out.
   * @type {null|string}
   */
  get localGreetingName() {
    this._localGreetingName === null && this.logNullRead('localGreetingName');
    return this._localGreetingName;
  }

  set localGreetingName(value) {
    if (this._localGreetingName !== null) {
      this.logRoError('localGreetingName');
      return;
    }
    this._localGreetingName = value;
  }

  /**
   * Ephemeral socket ID of the contact we're adding. We won't always know this
   * immediately because it cannot simply be looked up. The person needs to
   * elect to send it to us. The contact's socket ID is required by the server
   * for later contact-adding steps.
   *
   * Note that socket IDs are lost when the device's connection is reset.
   * @type {null|string}
   */
  get contactSocketId() {
    this._contactSocketId === null && this.logNullRead('contactSocketId');
    return this._contactSocketId;
  }

  set contactSocketId(value) {
    if (this._contactSocketId !== null) {
      this.logRoError('contactSocketId');
      return;
    }
    this._contactSocketId = value;
  }

  /**
   * Ephemeral socket ID of this device. This is used for things like password
   * salting.
   *
   * Note that socket IDs are lost when the device's connection is reset.
   * @type {null|string}
   */
  get localSocketId() {
    this._localSocketId === null && this.logNullRead('localSocketId');
    return this._localSocketId;
  }

  set localSocketId(value) {
    if (this._localSocketId !== null) {
      this.logRoError('localSocketId');
      return;
    }
    this._localSocketId = value;
  }

  /**
   * The type of RSVP answer we're dealing with. This can represent us accept
   * accepting someone else's invite, or them having accepted ours.
   * @type {null|InvitationResponse}
   */
  get rsvpAnswer() {
    this._rsvpAnswer === null && this.logNullRead('rsvpAnswer');
    return this._rsvpAnswer;
  }

  set rsvpAnswer(value) {
    if (this._rsvpAnswer !== null) {
      this.logRoError('rsvpAnswer');
      return;
    }
    this._rsvpAnswer = value;
  }

  /**
   * The contact's digital signature (for account they're contacting us from).
   * @type {null|CryptoKey}
   */
  get contactPubKey() {
    this._contactPubKey === null && this.logNullRead('contactPubKey');
    return this._contactPubKey;
  }

  set contactPubKey(value) {
    if (this._contactPubKey !== null) {
      this.logRoError('contactPubKey');
      return;
    }
    this._contactPubKey = value;
  }

  /**
   * The contact's digital signature in PEM form. Useful for visualizations.
   * @type {null|string}
   */
  get contactPemKey() {
    this._contactPemKey === null && this.logNullRead('contactPemKey');
    return this._contactPemKey;
  }

  set contactPemKey(value) {
    if (this._contactPemKey !== null) {
      this.logRoError('contactPemKey');
      return;
    }
    this._contactPemKey = value;
  }

  /**
   * The local's digital signature in PEM form. Useful for visualizations.
   * @type {null|string}
   */
  get localPemKey() {
    this._localPemKey === null && this.logNullRead('localPemKey');
    return this._localPemKey;
  }

  set localPemKey(value) {
    if (this._localPemKey !== null) {
      this.logRoError('localPemKey');
      return;
    }
    this._localPemKey = value;
  }

  /**
   * Local account digital signature.
   * @type {null|CryptoKey}
   */
  get localPubKey() {
    this._localPubKey === null && this.logNullRead('localPubKey');
    return this._localPubKey;
  }

  set localPubKey(value) {
    if (this._localPubKey !== null) {
      this.logRoError('localPubKey');
      return;
    }
    this._localPubKey = value;
  }

  /**
   * The contact's DH public key (used to create the initial secret).
   * @type {null|ArrayBuffer}
   */
  get contactDhPubKey() {
    this._contactDhPubKey === null && this.logNullRead('contactDhPubKey');
    return this._contactDhPubKey;
  }

  set contactDhPubKey(value) {
    if (this._contactDhPubKey !== null) {
      this.logRoError('contactDhPubKey');
      return;
    }
    this._contactDhPubKey = value;
  }

  /**
   * This device's DH public key (used to create the initial secret).
   * @type {null|DiffieHellman}
   */
  get localDhKeyExchange() {
    this._localDhKeyExchange === null && this.logNullRead('localDhKeyExchange');
    return this._localDhKeyExchange;
  }

  set localDhKeyExchange(value) {
    if (this._localDhKeyExchange !== null) {
      this.logRoError('localDhKeyExchange');
      return;
    }
    this._localDhKeyExchange = value;
  }

  /**
   * Indicates the DH key strength.
   * @type {null|string}
   * @private
   */
  get dhModGroup() {
    this._dhModGroup === null && this.logNullRead('dhModGroup');
    return this._dhModGroup;
  }

  set dhModGroup(value) {
    if (this._dhModGroup !== null) {
      this.logRoError('dhModGroup');
      return;
    }
    this._dhModGroup = value;
  }

  /**
   * If true, we're sending an invitation to someone else. If false, someone is
   * sending us an invitation. Null means we've not yet determined this info.
   * @type {null|boolean}
   */
  get isOutbound() {
    this._isOutbound === null && this.logNullRead('isOutbound');
    return this._isOutbound;
  }

  set isOutbound(value) {
    if (this._isOutbound !== null) {
      this.logRoError('isOutbound');
      return;
    }
    this._isOutbound = value;
  }

  /**
   * Public name of the local account.
   * @type {null|string}
   */
  get localPublicName() {
    this._localPublicName === null && this.logNullRead('localPublicName');
    return this._localPublicName;
  }

  set localPublicName(value) {
    if (this._localPublicName !== null) {
      this.logRoError('localPublicName');
      return;
    }
    this._localPublicName = value;
  }

  /* == Views =================================================== */

  /**
   * Returns a one-sided React-friendly representation of this object.
   * @return InvitationInfo
   */
  getInfo(): InvitationInfo {
    // Dev note: For most of these values you should avoid referencing
    // strict-section getters from this function because they will log warnings
    // if their values are null (which exists to hint at devs that they've
    // possibly introduces bugs). These warnings are not useful within the
    // context of the UI, which should just dynamically display information as
    // it becomes available.
    return {
      /* General */
      id: this._id,
      error: this.error,
      isOutbound: this._isOutbound,
      rsvpAnswer: this._rsvpAnswer,
      sharedSecret: this._sharedSecret,

      /* UI and log vars */
      dhPrepPercentage: this.error ? 0 : this._dhPrepPercentage,
      dhPrepStatusMessage: this.error || this._dhPrepStatusMessage,

      /* Vars that should always be identical on both sides */
      time: this._time,
      initiatorName: this._initiatorName,
      initiatorSocketId:
        this._isOutbound ? this._localSocketId : this._contactSocketId,
      receiverName: this._receiverName,
      receiverSocketId:
        this._isOutbound ? this._contactSocketId : this._localSocketId,
      initiatorSalt: this._initiatorSalt,
      receiverSalt: this._receiverSalt,

      /* Contact info */
      contactSocketId: this._contactSocketId,
      contactPublicName: this._contactPublicName,
      contactGreetingName: this._contactGreetingName || '',
      contactGreetingMessage: this.contactGreeting,
      contactPubKey: this._contactPubKey,
      contactPemKey: this._contactPemKey,
      contactDhPubKey: this._contactDhPubKey,

      /* Own info */
      // The reason we store our own information despite the fact that the
      // cache stores have this first is because the user can multitask their
      // accounts screens and rapidly switch between them. Storing copies in
      // this class makes it clear which account is involved.
      localAccountId: this._localAccountId,
      localAccountName: this._localAccountName,
      localGreeting: this.localGreeting,
      localPublicName: this._localPublicName,
      localGreetingName: this._localGreetingName,
      localPubKey: this._localPubKey,
      localPemKey: this._localPemKey,
      localDhPubKey: this._localDhKeyExchange?.getPublicKey() || null,

      // If the UI detects a serious error, it can use this to destroy the
      // invite;
      reportFatalError: this.uiReportsError,
    };
  }

  uiReportsError = (error: string) => {
    this.error = `${error}`;
    clientEmitter.emit(clientEmitterAction.updateDhStatus, this.getInfo());
  };

  /* == Class methods =========================================== */

  constructor({
    localAccountId,
    localAccountName,
    localSocketId,
    localGreetingName = null,
    localGreeting,
    contactPublicName,
  }: {
    localAccountId: string,
    localAccountName: string,
    localSocketId: string,
    localGreetingName: string | null,
    localGreeting: string,
    contactPublicName: string,
  }) {
    Invitation._instanceFromId[this._id] = this;

    if (!contactPublicName || !localAccountId || !localAccountName) {
      this.error = '[ContactCreator] Received malformed invitation ';
      !contactPublicName && (this.error += `(contact name: "${contactPublicName}") `);
      !localAccountId && (this.error += `(account ID: "${localAccountId}") `);
      !localAccountName && (this.error += `(Own name: "${localAccountName}") `);
      console.error(this.error);
    }
    else {
      clientEmitter.on(
        clientEmitterAction.clientDisconnected, this.handleClientReconnected,
      );
      clientEmitter.on(
        clientEmitterAction.clientReconnected, this.handleClientReconnected,
      );

      this.localAccountId = localAccountId;
      this.localAccountName = localAccountName;
      this.contactPublicName = contactPublicName;
      this.localSocketId = localSocketId;
      this.localGreetingName = localGreetingName || null;
      this.localGreeting = localGreeting || '';

      const account = accountStorage.findAccountById({ id: localAccountId });
      if (account === null || account.decryptedData === null) {
        this.error = 'It appears your account has been logged out';
        return;
      }
      this.localPublicName = account.decryptedData.publicName;
    }
  }

  logNullRead(varName: string) {
    console.warn(`[ContactCreator] Reading ${varName} before it's been set.`);
  }

  logRoError(varName: string) {
    this.error = `${varName} may only be set once.`;
    console.error(`[ContactCreator] ${this.error}`);
  }

  handleClientReconnected = () => {
    this.error = 'Connection lost; please try again.';
    console.error('[ContactCreator] State broken due to connection reset.');
    clientEmitter.emit(clientEmitterAction.updateDhStatus, this.getInfo());
  };

  static getInstanceById(id: string): Invitation | null {
    return Invitation._instanceFromId[id] || null;
  }

  static getInfoById(id: string): InvitationInfo | null {
    const instance = Invitation._instanceFromId[id];
    if (instance) {
      return instance.getInfo();
    }
    return null;
  }

  /**
   * Prepares an invitation to be sent to another device.
   */
  async stage1_prepareInvitation() {
    if (this.error) {
      return;
    }

    if (this.invitationSent) {
      this.error = 'Failed to send invite. Please try again.';
      return console.error(
        `Cannot send invite; already sent to ${this.contactPublicName}.`,
        'Please create a new ContactCreator instance to create more contacts.',
      );
    }

    if (this.invitationReceived) {
      this.error = 'Failed to send invite. Please try again.';
      return console.error(
        `Cannot send invites from a receiving instance. `,
        'Please create a new ContactCreator instance to create more contacts.',
      );
    }

    const source = this.localPublicName?.trim();
    const localAccount = accountStorage.findAccountByPublicName({
      publicName: source,
    });

    if (!localAccount || !localAccount.decryptedData) {
      this.error =
        `You don't have any account with the public name '${source}'`;
      return console.error(this.error);
    }

    const time = this.time = Date.now();
    const target = this.contactPublicName?.trim();
    const greeting = this.localGreeting.trim();

    this.isOutbound = true;
    const localPubKey = localAccount.decryptedData.publicKey;
    this.localPubKey = await exportRsaPublicKey({
      publicKey: localPubKey,
    }) as Uint8Array;

    // Useful for visualisations.
    this.localPemKey = await exportRsaPublicKey(
      { publicKey: localPubKey },
      'pem',
    ) as string;

    this.initiatorName = this.localPublicName;
    this.receiverName = this.contactPublicName;

    this._dhPrepStatusMessage = 'Preparing key exchange, please stand by...';

    return {
      source,
      target,
      greeting,
      greetingName: this.localGreetingName,
      pubKey: this.localPubKey,
      time,
    };
  }

  /**
   * Receives an invitation from another device, and prepares a response.
   */
  async stage1_prepareInvitationResponse({
    greetingName,
    replyAddress = '',
    pubKey: contactPubKey,
    time,
    greeting,
  }) {
    if (this.error) {
      return;
    }

    if (this.invitationSent) {
      this.error = 'Failed to receive invite. Please try again.';
      return console.error(
        `Cannot send invite; already sent to ${this.contactPublicName}.`,
        'Please create a new ContactCreator instance to create more contacts.',
      );
    }

    if (this.invitationReceived) {
      this.error = 'Failed to receive invite. Please try again.';
      return console.error(
        `Cannot send invites from a receiving instance. `,
        'Please create a new ContactCreator instance to create more contacts.',
      );
    }

    // Dev note: Your IDE might complain this line shouldn't be checked for
    // string because it's always string. I disagree; we're receiving this
    // from the internet.
    if (
      typeof replyAddress !== 'string' ||
      !(contactPubKey instanceof ArrayBuffer) ||
      typeof time !== 'number'
    ) {
      console.error(
        '[ContactCreator] Received malformed invite. Dump:',
        { replyAddress, greeting, contactPubKey, time },
      );
      return;
    }

    if (time < oldestAllowedTime) {
      this.error = 'Sender\'s time is very wrong.';
      return console.error(this.error);
    }

    this.isOutbound = false;
    this._dhPrepStatusMessage = 'Awaiting the sender\'s public key...';

    this.initiatorName = this.contactPublicName;
    this.receiverName = this.localPublicName;

    if (replyAddress) {
      this.contactSocketId = replyAddress;
    }

    if (!this.contactSocketId) {
      this.error = 'Cannot receive invite; bad contact ID.';
      return console.error(this.error);
    }

    if (!contactPubKey) {
      this.error = 'Cannot receive invite; bad contact public key.';
      return console.error(this.error);
    }

    // Node sends this as an ArrayBuffer, so we wrap it in a uint8 view.
    contactPubKey = new Uint8Array(contactPubKey);

    // Useful for visualisations.
    let pemKey = await importRsaPublicKey(contactPubKey, 'raw');
    pemKey = await exportRsaPublicKey({ publicKey: pemKey }, 'pem');
    this.contactPemKey = pemKey;

    this.contactGreetingName = greetingName;
    this.contactGreeting = greeting;
    this.invitationReceived = true;
    this.contactPubKey = contactPubKey;
    this.time = time;

    // Find the account associated with the requested public name.
    const receivingAccount = accountStorage.findAccountByPublicName({
      publicName: this.localPublicName,
    });

    if (!receivingAccount || !receivingAccount.decryptedData) {
      this.error = 'Failed to receive invite. Please try again.';
      // @ts-ignore - JSDoc is not descriptive enough to appease TS.
      return window.$dialog.alert({
        header: 'Invite Response Failed',
        body: 'Could not respond to invite because none of your accounts ' +
          `appear to have the public name "${this.localPublicName}" ` +
          'associated with them. Was the name maybe deleted before the ' +
          'contact could respond?',
      });
    }

    const localPubKey = await exportRsaPublicKey({
      publicKey: receivingAccount.decryptedData.publicKey,
    }) as Uint8Array;

    this.localPubKey = localPubKey;

    // // Useful for visualisations.
    this.localPemKey = await exportRsaPublicKey({
      publicKey: receivingAccount.decryptedData.publicKey
    }, 'pem') as string;

    const ownResponse = await showInvitationDialog(this.getInfo());

    const {
      answer, greetingMessage, greetingName: localGreetingName,
    } = ownResponse;
    this.localGreeting = greetingMessage || '';
    this.localGreetingName = localGreetingName || '';

    const { block, reject, postpone, accept, verification } =
      InvitationResponse;

    if (answer === accept) {
      // Locally, an accept should spawn a verification dialog. Differently
      // put, acceptance comes from remote, and verification comes from local;
      // their two sides of the same coin.
      this.rsvpAnswer = verification;
    }
    else {
      this.rsvpAnswer = answer;
    }

    if (answer === block || answer === reject) {
      // Do not reply; this means a malicious party won't know whether or not
      // this account is online.
      // TODO: Handle block. Save block info in removeEventListener account
      //  only.
      verbose && console.log('Not replying to invite.');
    }
    else if (answer === postpone) {
      // Send rain check without acceptance extras.
      verbose && console.log(`Sending postponement to ${replyAddress}.`);
      return {
        target: replyAddress,
        answer,
      };
    }
    else if (answer === accept) {
      // The server sends us the public key as an ArrayBuffer, convert to view.
      return {
        target: replyAddress,
        answer,
        ownName: this.localPublicName,
        greetingName: this.localGreetingName,
        greetingMessage: this.localGreeting,
        pubKey: localPubKey,
      };
    }
  }

  async stage2_receiveInvitationResponse({
    answer,
    greetingName,
    greetingMessage,
    pubKey: contactPubKey,
    replyAddress,
  }) {
    if (this.error) {
      return;
    }

    if (this.inviteResponseReceived) {
      console.warn('Seems we received a duplicate invitation response.');
      return;
    }

    if (this.isOutbound !== true) {
      // If null, we've reached this point too soon. If false, an invitation
      // response doesn't make sense in any situation. Either case is a bug.
      return console.warn(
        'Received out-of-place invitation response',
        `(isOutbound = ${this.isOutbound})`,
      );
    }

    if (!contactPubKey) {
      this.error = 'Invalid contact public key specified.';
      return;
    }

    this.contactSocketId = replyAddress;
    this.contactGreetingName = greetingName || '';
    this.contactGreeting = greetingMessage || '';

    this.inviteResponseReceived = true;
    const time = this.time;

    if (isNaN(time) || !time || time < oldestAllowedTime) {
      this.error = 'System time appears to be invalid.';
      console.error('[ContactCreator] Invalid time:', time);
      // @ts-ignore - JSDoc is not descriptive enough to appease TS.
      window.$dialog.alert({
        prioritise: true,
        header: 'Error',
        body: 'An error occurred while processing the response - invalid time',
      });
      return;
    }

    // The server sends us the public key as an ArrayBuffer, convert to a view.
    contactPubKey = new Uint8Array(contactPubKey);

    // Used for visualizations.
    let contactPemKey = await importRsaPublicKey(contactPubKey, 'raw');
    contactPemKey = await exportRsaPublicKey({ publicKey: contactPemKey }, 'pem');

    this.rsvpAnswer = answer;
    this.contactPubKey = contactPubKey;
    this.contactPemKey = contactPemKey;
  }

  /**
   * This is marked as "stageless" because we don't exactly wait; we continue
   * doing DH computations etc. while we wait for the other side to send their
   * key. The originating process should trigger between stages 2 and 3, though
   * this will usually only arrive after 3 has completed.
   */
  async stageless_receiveDhPubKey({ dhPubKey, salt }) {
    if (this.error) {
      return;
    }

    const targetId = this.contactSocketId;
    dhPubKey && (this.contactDhPubKey = dhPubKey);
    if (!this.contactDhPubKey) {
      // TODO: make crypto checks more robust.
      this.error = 'Contact sent invalid handshake crypto key.';
      return console.error(`Received invalid DH public key from ${targetId}.`);
    }
    this._dhPrepStatusMessage = `Ready to connect`;
    clientEmitter.emit(clientEmitterAction.updateDhStatus, this.getInfo());

    if (this.isOutbound) {
      this.receiverSalt = new Uint8Array(salt);
    }
    else {
      this.initiatorSalt = new Uint8Array(salt);
    }
  }

  async stage3_prepareDhKey({ modGroup }) {
    if (this.error) {
      return;
    }

    if (!modGroup) {
      this.error = 'Invalid modGroup: ' + modGroup;
      return console.error('[ContactCreator] Invalid modGroup:', modGroup);
    }
    // TODO: If already generated the key, just return it.
    verbose && console.log('Starting key generation process.');

    this.dhModGroup = modGroup;
    this._dhPrepStatusMessage = 'Preparing key exchange, please stand by...';

    const targetId = this.contactSocketId;
    const groupFriendly = KeyStrengthFriendly[this.dhModGroup];

    this._dhPrepPercentage = 0.1;
    this._dhPrepStatusMessage = `(1/2) Loading ${this.dhModGroup} group...`;
    clientEmitter.emit(clientEmitterAction.updateDhStatus, this.getInfo());

    // Wait a bit so that the UI doesn't move too fast and bewilder the user.
    await setPromiseTimeout(MIN_UI_TRANSITION_MS);
    const alice = getDiffieHellman(this.dhModGroup);

    this._dhPrepPercentage = 0.25;
    this._dhPrepStatusMessage =
      `(2/2) Generating ${groupFriendly} ephemeral key pair...`;
    clientEmitter.emit(clientEmitterAction.updateDhStatus, this.getInfo());

    alice.generateKeys();
    verbose && console.log(`DH key generation complete...`);

    // Wait a bit so that the UI doesn't move too fast and bewilder the user.
    await setPromiseTimeout(MIN_UI_TRANSITION_MS);

    this._dhPrepPercentage = 0.5;
    this._dhPrepStatusMessage = `Waiting for contact DH key...`;
    clientEmitter.emit(clientEmitterAction.updateDhStatus, this.getInfo());

    this.localDhKeyExchange = alice;

    // To help with randomness, each client produces a salt for later use.
    const salt = getRandomBits(512, false) as Uint8Array;
    if (this.isOutbound) {
      this.initiatorSalt = salt;
    }
    else {
      this.receiverSalt = salt;
    }

    return {
      targetId,
      dhPubKey: alice.getPublicKey(),
      modGroup: this.dhModGroup,
      needDhReply: null,
      salt,
    };
  }

  async stage4_computeSharedSecret() {
    if (this.error) {
      return;
    }

    this._dhPrepPercentage = 0.75;
    this._dhPrepStatusMessage = `Computing shared secret...`;
    clientEmitter.emit(clientEmitterAction.updateDhStatus, this.getInfo());

    // Give the UI time to update for we lock the main thread.
    await setPromiseTimeout(50);

    if (!this.contactDhPubKey) {
      this.error = 'Contact sent invalid key.';
      return console.error(
        `[ContactCreator] Invalid DH contact key:`, this.contactDhPubKey,
      );
    }

    const alice = this.localDhKeyExchange!;
    const bobPublicKey = new Uint8Array(this.contactDhPubKey);
    // const aliceSecret = uint8ArrayToHexString(alice.computeSecret(bobPublicKey));
    const aliceSecret = alice.computeSecret(bobPublicKey);
    this._sharedSecret = aliceSecret;

    this._dhPrepPercentage = 1;
    this._dhPrepStatusMessage = `Ready`;
    clientEmitter.emit(clientEmitterAction.updateDhStatus, this.getInfo());

    verbose && console.log(
      `DH shared secret generated. Full hex string:`,
      uint8ArrayToHexString(aliceSecret),
    );

    clientEmitter.removeListener(
      clientEmitterAction.clientReconnected, this.handleClientReconnected,
    );
    clientEmitter.removeListener(
      clientEmitterAction.clientDisconnected, this.handleClientReconnected,
    );
  }
}

export {
  Invitation,
};
