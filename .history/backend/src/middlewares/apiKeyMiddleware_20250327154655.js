const apiKeyService = require('../services/apiKey.service');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * Middleware pour vérifier les clés API
 * @param {Array} requiredPermissions - Permissions requises pour accéder à la ressource
 * @returns {Function} Middleware Express
 */
const checkApiKey = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      // Récupérer la clé API depuis l'en-tête
      const apiKey = req.header('X-API-Key');
      
      if (!apiKey) {
        return next(new AppError('Clé API manquante', 401));
      }
      
      // Vérifier la clé API et les permissions
      const { apiKey: keyData, user } = await apiKeyService.verifyApiKey(apiKey, requiredPermissions);
      
      // Ajouter les informations de l'utilisateur et de la clé API à la requête
      req.apiKey = keyData;
      req.user = user;
      
      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }
      
      logger.error('Erreur lors de la vérification de la clé API:', error);
      next(new AppError('Erreur lors de la vérification de la clé API', 500));
    }
  };
};

module.exports = {
  checkApiKey
}; 