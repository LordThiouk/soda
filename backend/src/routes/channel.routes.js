const express = require('express');
const channelController = require('../controllers/channel.controller');
const isAuthenticated = require('../middlewares/isAuthenticated');
const hasRole = require('../middlewares/hasRole');
const { validate, schemas } = require('../validations');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chaînes
 *   description: Routes pour la gestion des chaînes radio et TV
 */

/**
 * @swagger
 * /api/channels:
 *   get:
 *     summary: Liste toutes les chaînes avec pagination et filtres
 *     tags: [Chaînes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [radio, tv]
 *         description: Type de chaîne
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, testing]
 *         description: Statut de la chaîne
 *     responses:
 *       200:
 *         description: Liste des chaînes
 *       401:
 *         description: Non autorisé
 */
router.get('/', isAuthenticated, channelController.getAllChannels);

/**
 * @swagger
 * /api/channels/{id}:
 *   get:
 *     summary: Récupère une chaîne par son ID
 *     tags: [Chaînes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la chaîne
 *     responses:
 *       200:
 *         description: Chaîne trouvée
 *       404:
 *         description: Chaîne non trouvée
 *       401:
 *         description: Non autorisé
 */
router.get('/:id', isAuthenticated, channelController.getChannelById);

/**
 * @swagger
 * /api/channels:
 *   post:
 *     summary: Crée une nouvelle chaîne
 *     tags: [Chaînes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Channel'
 *     responses:
 *       201:
 *         description: Chaîne créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permissions insuffisantes
 */
router.post(
  '/',
  isAuthenticated,
  hasRole('admin', 'manager'),
  validate(schemas.channel),
  channelController.createChannel
);

/**
 * @swagger
 * /api/channels/{id}:
 *   put:
 *     summary: Met à jour une chaîne existante
 *     tags: [Chaînes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la chaîne
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Channel'
 *     responses:
 *       200:
 *         description: Chaîne mise à jour avec succès
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Chaîne non trouvée
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permissions insuffisantes
 */
router.put(
  '/:id',
  isAuthenticated,
  hasRole('admin', 'manager'),
  validate(schemas.channel),
  channelController.updateChannel
);

/**
 * @swagger
 * /api/channels/{id}:
 *   delete:
 *     summary: Supprime une chaîne
 *     tags: [Chaînes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la chaîne
 *     responses:
 *       200:
 *         description: Chaîne supprimée avec succès
 *       404:
 *         description: Chaîne non trouvée
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permissions insuffisantes
 */
router.delete(
  '/:id',
  isAuthenticated,
  hasRole('admin'),
  channelController.deleteChannel
);

/**
 * @swagger
 * /api/channels/import/radio:
 *   post:
 *     summary: Importe des stations radio depuis l'API RadioBrowser
 *     tags: [Chaînes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: overwrite
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Écraser les stations existantes
 *     responses:
 *       200:
 *         description: Import terminé
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permissions insuffisantes
 */
router.post(
  '/import/radio',
  isAuthenticated,
  hasRole('admin', 'manager'),
  channelController.importRadioStations
);

/**
 * @swagger
 * /api/channels/{id}/test:
 *   get:
 *     summary: Teste la disponibilité d'une chaîne
 *     tags: [Chaînes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la chaîne
 *     responses:
 *       200:
 *         description: Résultat du test
 *       404:
 *         description: Chaîne non trouvée
 *       401:
 *         description: Non autorisé
 */
router.get(
  '/:id/test',
  isAuthenticated,
  channelController.testChannelAvailability
);

module.exports = router; 