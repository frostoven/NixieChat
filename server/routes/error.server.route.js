/**
 * Catchall for uncaught errors.
 */

const errorController = require("../controllers/error.server.controller");

// Handle uncaught errors.
module.exports = errorController.handleErrors;
