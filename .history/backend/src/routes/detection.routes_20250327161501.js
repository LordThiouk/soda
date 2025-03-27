const express = require('express');
const detectionController = require('../controllers/detection.controller');
const isAuthenticated = require('../middlewares/isAuthenticated');
const hasRole = require('../middlewares/hasRole');
const checkApiKey = require('../middlewares/apiKeyMiddleware');
const { validate, schemas } = require('../validations');

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
 *     description: Utilise Acoustid et Audd pour identifier une chanson à partir d'un échantillon audio
 *     tags: [Detection]
 *     security:
 *       - BearerAuth: []
 *       - ApiKeyAuth: []
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
 *                 description: Échantillon audio en base64
 *     responses:
 *       200:
 *         description: Chanson identifiée avec succès
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Aucune chanson identifiée
 *       500:
 *         description: Erreur serveur
 */
router.post('/identify', checkApiKey(['detection']), detectionController.identifySong);

/**
 * @swagger
 * /api/detection/identify-file:
 *   post:
 *     summary: Identifie une chanson à partir d'un fichier audio
 *     description: Identifie une chanson à partir d'un fichier audio uploadé
 *     tags: [Detection]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio_file
 *               - channel_id
 *             properties:
 *               audio_file:
 *                 type: string
 *                 format: binary
 *                 description: Fichier audio à analyser
 *               channel_id:
 *                 type: integer
 *                 description: ID de la chaîne
 *     responses:
 *       200:
 *         description: Chanson identifiée avec succès
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Aucune chanson identifiée
 *       500:
 *         description: Erreur serveur
 */
router.post('/identify-file', isAuthenticated, detectionController.identifyFromFile);

/**
 * @swagger
 * /api/detection/recent:
 *   get:
 *     summary: Récupère les détections récentes
 *     description: Récupère les détections récentes avec pagination et filtres
 *     tags: [Detection]
 *     security:
 *       - BearerAuth: []
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
 *         description: Filtrer par ID de chaîne
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de début (format ISO)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de fin (format ISO)
 *     responses:
 *       200:
 *         description: Liste des détections
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/recent', isAuthenticated, detectionController.getRecentDetections);

/**
 * @swagger
 * /api/detection/{detection_id}/correction:
 *   post:
 *     summary: Applique une correction manuelle à une détection
 *     description: Permet de corriger une chanson mal identifiée
 *     tags: [Detection]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: detection_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la détection à corriger
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
 *       400:
 *         description: Paramètres invalides
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Détection non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.post('/:detection_id/correction', isAuthenticated, hasRole(['admin', 'manager']), detectionController.applyManualCorrection);

/**
 * @swagger
 * /api/detection/monitoring/channels/{channel_id}/start:
 *   post:
 *     summary: Démarre une session de surveillance en temps réel
 *     description: Démarre la surveillance automatique d'une chaîne à intervalles réguliers
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channel_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la chaîne à surveiller
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interval_seconds:
 *                 type: integer
 *                 description: Intervalle entre les détections en secondes (défaut: 60)
 *                 default: 60
 *               callback_url:
 *                 type: string
 *                 description: URL pour les notifications de détection (optionnelle)
 *     responses:
 *       200:
 *         description: Surveillance démarrée avec succès
 *       400:
 *         description: Paramètres invalides ou chaîne non disponible
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Chaîne non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.post('/monitoring/channels/:channel_id/start', isAuthenticated, hasRole(['admin', 'manager']), detectionController.startRealTimeDetection);

/**
 * @swagger
 * /api/detection/monitoring/channels/{channel_id}/stop:
 *   post:
 *     summary: Arrête une session de surveillance en temps réel
 *     description: Arrête la surveillance automatique d'une chaîne
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channel_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la chaîne à arrêter
 *     responses:
 *       200:
 *         description: Surveillance arrêtée avec succès
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Session de surveillance non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.post('/monitoring/channels/:channel_id/stop', isAuthenticated, hasRole(['admin', 'manager']), detectionController.stopRealTimeDetection);

/**
 * @swagger
 * /api/detection/monitoring/sessions:
 *   get:
 *     summary: Récupère toutes les sessions de surveillance actives
 *     description: Liste toutes les sessions de surveillance en cours
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des sessions de surveillance
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/monitoring/sessions', isAuthenticated, detectionController.getActiveMonitoringSessions);

/**
 * @swagger
 * /api/detection/monitoring/sessions/{session_id}:
 *   get:
 *     summary: Récupère les détails d'une session de surveillance
 *     description: Obtient les informations détaillées sur une session avec les détections et erreurs récentes
 *     tags: [Monitoring]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: session_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la session de surveillance
 *     responses:
 *       200:
 *         description: Détails de la session
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Session non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get('/monitoring/sessions/:session_id', isAuthenticated, detectionController.getMonitoringSessionDetails);

module.exports = router; 