'use strict';

let config = {

	server: Object.freeze({
		name: "NixieChat",
		listeningPort: 42069,
	}),

	logging: Object.freeze({
		verbose: process.env.NODE_ENV === 'development'
	}),
};

module.exports = config;
