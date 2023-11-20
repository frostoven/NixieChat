/**
 * Routes used if no prior definitions are found.
 */

const router = require('express').Router();
const defaultController = require("../controllers/default.server.controller");

router.get('/', defaultController.root);

router.get('*', (req, res) => {
	defaultController.badRequest(req, res);
});
router.post('*', (req, res) => {
	defaultController.badRequest(req, res);
});
router.put('*', (req, res) => {
	defaultController.badRequest(req, res);
});
router.patch('*', (req, res) => {
	defaultController.badRequest(req, res);
});
router.delete('*', (req, res) => {
	defaultController.badRequest(req, res);
});
router.all('*', (req, res) => {
	defaultController.methodNotAllowed(req, res);
});

module.exports = router;
