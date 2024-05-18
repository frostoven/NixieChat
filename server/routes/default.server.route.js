/**
 * Routes used if no prior definitions are found.
 */

import express from 'express';
import defaultController from '../controllers/default.server.controller';

const router = express.Router();

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

export default router;
