const express = require('express');
const reportController = require('../controllers/report.controller');
const { isAuthenticated, hasRole } = require('../middlewares/auth');
const { validate, schemas } = require('../utils/validator');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rapports
 *   description: Routes pour la gestion des rapports
 */

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Liste tous les rapports avec pagination
 *     tags: [Rapports]
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
 *     responses:
 *       200:
 *         description: Liste des rapports
 *       401:
 *         description: Non autorisé
 */
router.get('/', isAuthenticated, reportController.getAllReports);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Récupère un rapport par son ID
 *     tags: [Rapports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du rapport
 *     responses:
 *       200:
 *         description: Rapport trouvé
 *       404:
 *         description: Rapport non trouvé
 *       401:
 *         description: Non autorisé
 */
router.get('/:id', isAuthenticated, reportController.getReportById);

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Génère un nouveau rapport
 *     tags: [Rapports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - parameters
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom du rapport
 *               type:
 *                 type: string
 *                 description: Type de rapport
 *               parameters:
 *                 type: object
 *                 description: Paramètres de génération
 *                 properties:
 *                   start_date:
 *                     type: string
 *                     format: date-time
 *                   end_date:
 *                     type: string
 *                     format: date-time
 *                   channels:
 *                     type: array
 *                     items:
 *                       type: integer
 *                   format:
 *                     type: string
 *                     enum: [csv, pdf, xlsx]
 *     responses:
 *       201:
 *         description: Génération de rapport lancée
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post(
  '/',
  isAuthenticated,
  validate(schemas.report),
  reportController.generateReport
);

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Supprime un rapport
 *     tags: [Rapports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du rapport
 *     responses:
 *       200:
 *         description: Rapport supprimé avec succès
 *       404:
 *         description: Rapport non trouvé
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permissions insuffisantes
 */
router.delete(
  '/:id',
  isAuthenticated,
  reportController.deleteReport
);

/**
 * @swagger
 * /api/reports/dashboard/stats:
 *   get:
 *     summary: Récupère les statistiques pour le tableau de bord
 *     tags: [Rapports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *       401:
 *         description: Non autorisé
 */
router.get(
  '/dashboard/stats',
  isAuthenticated,
  reportController.getDashboardStats
);

module.exports = router; 