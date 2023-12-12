'use strict';

const fs = require('fs');
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
const { createAdapter } = require('@socket.io/postgres-adapter');
const { Pool } = require('pg');

// const io = new Server(server, {
// https://socket.io/docs/v4/using-multiple-nodes/#why-is-sticky-session-required
// Note: in that case, there is no fallback to long-polling
// transports: [ 'websocket' ], // or [ "websocket", "polling" ] (the order matters)
// });

let secretsFile = {
  pgConnection: {
    host: null,
    user: null,
    database: null,
    password: null,
    port: null,
  },
};

try {
  const data = fs.readFileSync('./.secrets.json');
  secretsFile = JSON.parse(data);
}
catch (error) {
  console.error(error.toString());
  console.error();
  console.error(
    'Could not read secrets file. Please save a copy of ' +
    '".secrets.example.json" as ".secrets.json" and modify it as needed.',
  );
  // TODO: make db-based connections optional.
  process.exit(1);
}

const secretStat = fs.statSync('./.secrets.json');
// Here, parseInt returns octal permissions that look like this: 100644. This
// allows us to determine permissions. We assume here that group reads are ok,
// so we check only the world permissions (the last digit). We can probably add
// a flag at some stage that lets users decide whether or not group reads are
// acceptable.
const secretsPermission = `${parseInt(secretStat.mode.toString(8), 10)}`.slice(2);
console.log('\nPermissions of .secrets.json is', secretsPermission);
const worldPermission = Number(secretsPermission[secretsPermission.length - 1]);
if (worldPermission === 1) {
  // The reason this isn't an actual problem is that execute permissions
  // without read permissions does not actually allow execution; you still get
  // "permission denied."
  console.warn(
    '.secrets.json is world-executable. Not really a problem, though it is ' +
    'strange and likely an administrative mistake.',
  );
}
else if (worldPermission >= 4) {
  console.error(
    '.secrets.json is world-readable. This means unauthorised parties can ' +
    'read your passwords.\n\n' +
    'Please fix your .secrets.json permissions and try again. A good ' +
    'solution is running a command such as "chmod 600 .secrets.json"'
  );
  process.exit(1);
}
else if (worldPermission >= 2) {
  console.error(
    '.secrets.json is world-writable. This means unauthorised parties can ' +
    'make NixieChat contact the wrong databases.\n\n' +
    'Please fix your .secrets.json permissions and try again. A good ' +
    'solution is running a command such as "chmod 600 .secrets.json"'
  );
  process.exit(1);
}

console.log('=================================================================');
const pg = secretsFile.pgConnection;
console.log(
  `Initiating PG connection: ${pg.user}@${pg.host}:${pg.port}/${pg.database}`,
);
const pool = new Pool(secretsFile.pgConnection);

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
console.log('=================================================================');
console.log('Client can be accessed at:\n',
  `http://localhost:${config.server.listeningPort}`,
);
if (process.env.NODE_ENV === 'development') {
  console.log('Note: WebPack will need a bit of time to finish booting.');
}
console.log('=================================================================');

// Readies the websocket listeners.
bootServer(emitter);

const lookupSocketRoute = require('./routes/websocket.route');

// Client / server communication.
io.on('connection', (socket) => {
  lookupSocketRoute(socket);
});

server.listen(config.server.listeningPort);

module.exports = app;
