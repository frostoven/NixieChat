import socketController from '../controllers/websocket.controller';

const isProd = process.env.NODE_ENV === 'production';

// We use this to automatically transform websocket.controller.js exports
// into incoming socket requests.
const canRespondTo = Object.keys(socketController);

// https://socket.io/docs/v4/index.html
export default function ioCallback(socket) {
  isProd || console.log('[Socket.io] A client has connected.');

  for (let i = 0, len = canRespondTo.length; i < len; i++) {
    const functionExport = canRespondTo[i];

    if (functionExport === 'socketEvent') {
      // socketEvent is an internal export and should not be exposed to the
      // client.
      continue;
    }

    // Middleware would go here in future. All routes share the same middleware
    // in this case.
    socket.on(functionExport, (data, callback) => socketController[functionExport](
      socket, data, callback,
    ));
  }
}
