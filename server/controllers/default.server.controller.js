const path = require('path');

exports.root = (req, res) => {
	res.sendFile(path.join(__dirname + '../../../server/nginx/error.html'));
};

exports.badRequest = (req, res) => {
	// res.status(400).json({ error: true, message: "Bad request." });
	res.status(400).sendFile(path.join(__dirname + '../../../server/nginx/error.html'));
};

exports.methodNotAllowed = (req, res) => {
	res.status(405).json({ error: true, message: "Method not allowed." });
};
