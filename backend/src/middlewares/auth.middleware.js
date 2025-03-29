/**
 * Ce fichier centralise les middlewares liés à l'authentification
 * pour faciliter l'importation dans les routes
 */

const { isAuthenticated } = require('./isAuthenticated');
const { hasRole } = require('./hasRole');
const { validateApiKey } = require('./apiKeyMiddleware');

module.exports = {
  isAuthenticated,
  hasRole,
  validateApiKey
}; 