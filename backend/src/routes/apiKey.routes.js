const express = require('express');
const apiKeyController = require('../controllers/apiKey.controller');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { schemas } = require('../validations/schemas');
const { checkApiKey } = require('../middlewares/apiKeyMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/api-keys:
 *   get:
 *     summary: Liste toutes les clés API de l'utilisateur
 *     description: Récupère la liste des clés API pour l'utilisateur authentifié
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des clés API
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/', isAuthenticated, apiKeyController.getAllApiKeys);

/**
 * @swagger
 * /api/api-keys/test:
 *   get:
 *     summary: Teste la validité d'une clé API
 *     description: Vérifie si une clé API est valide
 *     tags: [API Keys]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Clé API valide
 *       401:
 *         description: Clé API invalide ou expirée
 *       500:
 *         description: Erreur serveur
 */
router.get('/test', 
  checkApiKey(), 
  apiKeyController.testApiKey
);

/**
 * @swagger
 * /api/api-keys:
 *   post:
 *     summary: Crée une nouvelle clé API
 *     description: Génère une nouvelle clé API pour l'utilisateur authentifié
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiKeyInput'
 *     responses:
 *       201:
 *         description: Clé API créée avec succès (contient la clé complète, à ne pas perdre)
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.post('/', 
  isAuthenticated, 
  validate(schemas.apiKey), 
  apiKeyController.createApiKey
);

/**
 * @swagger
 * /api/api-keys/{id}:
 *   delete:
 *     summary: Supprime une clé API
 *     description: Supprime une clé API appartenant à l'utilisateur authentifié
 *     tags: [API Keys]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la clé API
 *     responses:
 *       200:
 *         description: Clé API supprimée avec succès
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Clé API non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', isAuthenticated, apiKeyController.deleteApiKey);

module.exports = router; 