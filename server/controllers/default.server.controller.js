import path from 'path';

function root(_, res) {
  res.sendFile(path.join(__dirname + '../../../server/nginx/error.html'));
}

function badRequest(_, res) {
  // res.status(400).json({ error: true, message: "Bad request." });
  res.status(400).sendFile(path.join(__dirname + '../../../server/nginx/error.html'));
}

function methodNotAllowed(_, res) {
  res.status(405).json({ error: true, message: 'Method not allowed.' });
}

const controller = {
  root,
  badRequest,
  methodNotAllowed,
};

export default controller;
