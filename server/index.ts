'use strict';

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { configFile } from './db/configFile';
import { getPgClusterEmitter, initPgConnection } from './db/postgres';
import { initSocketApi } from './socketProcessing';
import { Emitter } from '@socket.io/postgres-emitter';
import { ascii } from './utils/ascii';

if (process.env.NODE_ENV === 'development') {
  // Force unhandled promise rejections to throw errors during dev testing.
  process.on('unhandledRejection', unhandledRejection => {
    throw unhandledRejection;
  });
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  serveClient: false,
});

// Potentially increase socket amount:
// * https://stackoverflow.com/questions/15872788/maximum-concurrent-socket-io-connections
// * https://socket.io/docs/v4/using-multiple-nodes/#why-is-sticky-session-required
// Note: in that case, there is no fallback to long-polling
// transports: [ 'websocket' ], // or [ "websocket", "polling" ] (the order matters)
// });

async function initDb() {
  if (configFile.dbType === 'postgres') {
    await initPgConnection(io);
    return getPgClusterEmitter();
  }
  else {
    return null;
  }
}

function buildRoutes(clusterEmitter: Emitter | null) {
  // Our custom routes.
  app.use(require('./routes/assets.server.route'));
  app.use(require('./routes/default.server.route'));

  // Error handler.
  app.use(require('./routes/error.server.route'));

  // Show boot message.
  ascii.log('').dark().drawLine().reset();
  console.log('Client can be accessed at:');
  ascii.bold().green().log(
    ` http://localhost:${configFile.serverPort}`,
  ).reset();

  if (process.env.NODE_ENV === 'development') {
    ascii.italic().log(
      'Note: WebPack will need a bit of time to finish booting.',
    ).reset();
  }

  ascii.dark().drawLine().reset().log('');

  // Readies the websocket listeners.
  initSocketApi(clusterEmitter);

  const lookupSocketRoute = require('./routes/websocket.route');

  // Client / server communication.
  io.on('connection', (socket) => {
    lookupSocketRoute(socket);
  });

  server.listen(configFile.serverPort);
}

(function start() {
  initDb().then(buildRoutes).catch((error) => {
    console.error(error);
    process.exit(1);
  });
})();

export default app;
