const apiKeyService = require('../services/apiKey.service');
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Contrôleur pour la gestion des clés API
 */
const apiKeyController = {
  /**
   * Récupère toutes les clés API de l'utilisateur connecté
   */
  getAllApiKeys: catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    logger.info(`Récupération des clés API pour l'utilisateur ${userId}`);
    
    const apiKeys = await apiKeyService.getAllApiKeys(userId);
    
    res.status(200).json(apiKeys);
  }),
  
  /**
   * Crée une nouvelle clé API pour l'utilisateur connecté
   */
  createApiKey: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const apiKeyData = req.body;
    
    logger.info(`Création d'une nouvelle clé API pour l'utilisateur ${userId}`);
    logger.debug('Données de la clé API:', apiKeyData);
    
    // La validation est déjà effectuée par le middleware de validation
    
    const apiKey = await apiKeyService.createApiKey(userId, apiKeyData);
    
    logger.info(`Clé API créée avec succès pour l'utilisateur ${userId}`);
    
    // Renvoyer la clé complète (une seule fois)
    res.status(201).json(apiKey);
  }),
  
  /**
   * Supprime une clé API
   */
  deleteApiKey: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    
    logger.info(`Suppression de la clé API ${id} pour l'utilisateur ${userId}`);
    
    await apiKeyService.deleteApiKey(userId, id);
    
    logger.info(`Clé API ${id} supprimée avec succès`);
    
    res.status(200).json({
      success: true,
      message: 'Clé API supprimée avec succès'
    });
  }),
  
  /**
   * Teste la validité d'une clé API (pour la route de test uniquement)
   */
  testApiKey: catchAsync(async (req, res) => {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      throw new AppError('Clé API manquante', 401);
    }
    
    logger.info('Test de validité d\'une clé API');
    
    const result = await apiKeyService.verifyApiKey(apiKey);
    
    res.status(200).json({
      success: true,
      message: 'Clé API valide',
      user: {
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.full_name,
        role: result.user.role
      },
      permissions: result.apiKey.permissions
    });
  })
};

module.exports = apiKeyController; 