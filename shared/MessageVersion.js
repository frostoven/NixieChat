// Really just here for future compatibility, represents the authentication
// version / type for whatever crypto exchange is happening.
const MessageVersion = {
  discoverableRequestV1: 'v1',
  deviceRegistrationV1: 'v1',
  messageExchangeV1: 'v1',
  sendInvitationV1: 'v1',
};

module.exports = {
  MessageVersion: MessageVersion,
};
