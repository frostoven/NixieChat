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
import { PlainMessageType } from '../../shared/PlainMessageType';

function sendMessageToClient({ message, color = null, socket } = {}) {
  socket.emit(PlainMessageType.message, { message, color });
}

// Sends a generic error to the client.
function sendErrorToClient({ message, socket } = {}) {
  socket.emit(PlainMessageType.error, { message });
}

// Tells the client that the server has rebooted.
function sendServerReadyNoticeToClient({ socket }) {
  socket.emit(PlainMessageType.notifyServerReady);
}

export {
  sendMessageToClient,
  sendErrorToClient,
  sendServerReadyNoticeToClient,
};
