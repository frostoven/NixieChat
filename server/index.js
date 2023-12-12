'use strict';

const express = require('express');
const config = require('./config/server');
const { bootServer } = require('./socketProcessing');

if (process.env.NODE_ENV === 'development') {
  // Force unhandled promise rejections to throw errors during dev testing.
  process.on('unhandledRejection', unhandledRejection => {
    throw unhandledRejection;
  });
}

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Potentially increase socket amount:
// https://stackoverflow.com/questions/15872788/maximum-concurrent-socket-io-connections
// const io = require('socket.io');

const { Emitter } = require('@socket.io/postgres-emitter');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/postgres-adapter');
const { Pool } = require('pg');

// const io = new Server(server, {
// https://socket.io/docs/v4/using-multiple-nodes/#why-is-sticky-session-required
// Note: in that case, there is no fallback to long-polling
// transports: [ 'websocket' ], // or [ "websocket", "polling" ] (the order matters)
// });


const pool = new Pool({
  // TODO: Create a .secrets.json file to read this from.
  host: '127.0.0.1',
  user: 'YOUR_USER_HERE',
  database: 'YOUR_DB_HERE',
  password: 'YOUR_PASS_HERE',
  port: 5432,
});

pool.query(`
  CREATE TABLE IF NOT EXISTS socket_io_attachments (
      id          bigserial UNIQUE,
      created_at  timestamptz DEFAULT NOW(),
      payload     bytea
  );
`);

io.adapter(createAdapter(pool));
const emitter = new Emitter(pool);

// Our custom routes.
app.use(require('./routes/assets.server.route'));
app.use(require('./routes/default.server.route'));

// Error handler.
app.use(require('./routes/error.server.route'));

// Show boot message.
console.log('=============================================================');
console.log('Client can be accessed at:\n',
  `http://localhost:${config.server.listeningPort}`,
);
console.log('Note: WebPack will need a bit of time to finish booting.');
console.log('=============================================================');

// Readies the websocket listeners.
bootServer(emitter);

const lookupSocketRoute = require('./routes/websocket.route');

// Client / server communication.
io.on('connection', (socket) => {
  lookupSocketRoute(socket);
});

server.listen(config.server.listeningPort);

module.exports = app;
