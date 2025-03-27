const express = require('express');
const detectionController = require('../controllers/detection.controller');
const { isAuthenticated, hasRole, checkApiKey } = require('../middlewares/auth');
const { validate, schemas } = require('../utils/validator');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Détection
 *   description: Routes pour la détection et l'identification des chansons
 */

/**
 * @swagger
 * /api/detection/identify:
 *   post:
 *     summary: Identifie une chanson à partir d'un échantillon audio en base64
 *     tags: [Détection]
 *     security:
 *       - bearerAuth: []
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - channel_id
 *               - audio_sample
 *             properties:
 *               channel_id:
 *                 type: integer
 *                 description: ID de la chaîne
 *               audio_sample:
 *                 type: string
 *                 format: byte
 *                 description: Échantillon audio en base64
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Horodatage de la détection
 *     responses:
 *       200:
 *         description: Chanson identifiée avec succès
 *       404:
 *         description: Aucune chanson n'a été identifiée
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post(
  '/identify',
  checkApiKey,
  validate(schemas.detection),
  detectionController.identifySong
);

/**
 * @swagger
 * /api/detection/identify-file:
 *   post:
 *     summary: Identifie une chanson à partir d'un fichier audio
 *     tags: [Détection]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio_sample:
 *                 type: string
 *                 format: binary
 *                 description: Fichier audio
 *               channel_id:
 *                 type: integer
 *                 description: ID de la chaîne
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *                 description: Horodatage de la détection
 *     responses:
 *       200:
 *         description: Chanson identifiée avec succès
 *       404:
 *         description: Aucune chanson n'a été identifiée
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post(
  '/identify-file',
  isAuthenticated,
  detectionController.uploadAudioFile,
  detectionController.parseAudioFile,
  detectionController.identifySong
);

/**
 * @swagger
 * /api/detection/recent:
 *   get:
 *     summary: Récupère les détections récentes avec pagination et filtres
 *     tags: [Détection]
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
 *           default: 20
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: channel_id
 *         schema:
 *           type: integer
 *         description: Filtrer par chaîne
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de début
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de fin
 *     responses:
 *       200:
 *         description: Liste des détections
 *       401:
 *         description: Non autorisé
 */
router.get(
  '/recent',
  isAuthenticated,
  detectionController.getRecentDetections
);

/**
 * @swagger
 * /api/detection/{detection_id}/correction:
 *   post:
 *     summary: Applique une correction manuelle à une détection
 *     tags: [Détection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: detection_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la détection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - song_id
 *             properties:
 *               song_id:
 *                 type: integer
 *                 description: ID de la chanson correcte
 *               reason:
 *                 type: string
 *                 description: Raison de la correction
 *     responses:
 *       200:
 *         description: Correction appliquée avec succès
 *       404:
 *         description: Détection ou chanson non trouvée
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permissions insuffisantes
 */
router.post(
  '/:detection_id/correction',
  isAuthenticated,
  hasRole('admin', 'manager'),
  detectionController.applyManualCorrection
);

module.exports = router; 