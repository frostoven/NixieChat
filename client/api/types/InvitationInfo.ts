import { InvitationResponse } from '../../../shared/InvitationResponse';

/**
 * Represents a one-sided React-friendly representation of a ContactCreator
 * object.
 */
interface InvitationInfo {
  id: (string),
  error: (string | null),
  time: number,
  isOutbound: (boolean | null),
  receiverName: (null | string),
  initiatorName: (null | string),
  initiatorSocketId: (null | string),
  receiverSocketId: (null | string),
  initiatorSalt: (null | Uint8Array),
  receiverSalt: (null | Uint8Array),
  localAccountId: string,
  localAccountName: string,
  contactGreetingName: (string | null),
  contactPubKey: (CryptoKey | null),
  contactSocketId: (null | string),
  contactPublicName: (string | null),
  localPublicName: (string | null),
  greeting: string,
  localPubKey: (Buffer | null),
  rsvpAnswer: (typeof InvitationResponse | null),
  dhPrepPercentage: (number),
  dhPrepStatusMessage: (string),
  localDhPubKey: (null | ArrayBuffer),
  contactDhPubKey: (null | ArrayBuffer),
  localGreetingName: (null | string),
  contactGreetingMessage: (string),
  localGreeting: string,
  contactPemKey: (null | string),
  sharedSecret: (null | Uint8Array),
}

export {
  InvitationInfo,
};
