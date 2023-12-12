'use strict';

let config = Object.freeze({
  server: Object.freeze({
    name: 'NixieChat',
    listeningPort: process.env.NODE_PORT || 42069,
  }),

  logging: Object.freeze({
    verbose: process.env.NODE_ENV === 'development',
  }),
});

module.exports = config;
