/*
 * Server-to-client message functions
 *
 * The client and the server need to agree on the 'name' of a message before
 * they can communicate. This file formally defines those names (via commsType)
 * as sent to the client.
 *
 * Note that it does not mean the client can send the server these same
 * messages; it's a one-way server-to-client definition only.
 */

// Sends a generic message to the client.
function sendMessageToClient({ message, color = null, socket } = {}) {
  const commsType = 'messageFromServer';
  socket.emit(commsType, { commsType, message, color });
}

// Sends a generic error to the client.
function sendErrorToClient({ message, socket } = {}) {
  const commsType = 'errorFromServer';
  socket.emit(commsType, { commsType, message });
}

// Tells the client that the server has rebooted.
function sendServerReadyNoticeToClient({ socket }) {
  const commsType = 'notifyServerReady';
  socket.emit(commsType, { commsType });
}

module.exports = {
  sendMessageToClient,
  sendErrorToClient,
  sendServerReadyNoticeToClient,
};
