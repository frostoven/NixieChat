'use strict';

let config = Object.freeze({
  server: Object.freeze({
    name: 'NixieChat',
  }),

  logging: Object.freeze({
    verbose: process.env.NODE_ENV === 'development',
  }),
});

export default config;
