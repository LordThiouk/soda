const apiKeyService = require('../services/apiKey.service');
const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');
const catchAsync = require('../utils/catchAsync');

/**
 * Middleware pour vérifier les clés API
 * @param {Array} requiredPermissions - Permissions requises pour accéder à la ressource
 * @returns {Function} Middleware Express
 */
const checkApiKey = (requiredPermissions = []) => {
  return catchAsync(async (req, res, next) => {
    // Récupérer la clé API depuis l'en-tête
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      return next(new AppError('Clé API manquante', 401));
    }
    
    // Vérifier la clé API et les permissions
    const { valid, key: keyData, user } = await apiKeyService.verifyApiKey(apiKey, requiredPermissions);
    
    if (!valid) {
      return next(new AppError('Clé API invalide ou permissions insuffisantes', 401));
    }
    
    // Ajouter les informations de l'utilisateur et de la clé API à la requête
    req.apiKey = keyData;
    req.user = user;
    
    next();
  });
};

module.exports = checkApiKey; 