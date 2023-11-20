'use strict';

const express = require('express');
const config = require('./config/server');
const { bootServer } = require('./socketProcessing');

if (process.env.NODE_ENV === 'development'){
	// Force unhandled promise rejections to throw errors during dev testing.
	process.on('unhandledRejection', unhandledRejection => { throw unhandledRejection });
}

const app = express();
const server = require('http').createServer(app);
const websocket = require('socket.io')(server);

// Our custom routes.
app.use(require('./routes/assets.server.route'));
app.use(require('./routes/default.server.route'));

// Error handler.
app.use(require('./routes/error.server.route'));

// Show boot message.
console.log('=============================================================');
console.log('Client can be accessed at:\n',
	`http://localhost:${config.server.listeningPort}`
);
console.log('Note: WebPack will need a bit of time to finish booting.');
console.log('=============================================================');

// Readies the websocket listeners.
bootServer();

// Client / server communication.
websocket.on('connection', (socket) => {
	require('./routes/websocket.route')(socket);
});

server.listen(config.server.listeningPort);

module.exports = app;
