const express = require('express');
const songController = require('../controllers/song.controller');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { hasRole } = require('../middlewares/roleMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { schemas } = require('../validations/schemas');

const router = express.Router();

/**
 * @swagger
 * /api/songs:
 *   get:
 *     summary: Liste toutes les chansons
 *     description: Récupère une liste paginée de toutes les chansons avec possibilité de filtrage
 *     tags: [Songs]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Terme de recherche (titre ou artiste)
 *     responses:
 *       200:
 *         description: Liste paginée des chansons
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/', isAuthenticated, songController.getAllSongs);

/**
 * @swagger
 * /api/songs/search:
 *   get:
 *     summary: Recherche des chansons
 *     description: Recherche des chansons par titre ou artiste
 *     tags: [Songs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche (titre ou artiste)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre maximum de résultats
 *     responses:
 *       200:
 *         description: Liste des chansons correspondant à la recherche
 *       400:
 *         description: Terme de recherche manquant
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/search', isAuthenticated, songController.searchSongs);

/**
 * @swagger
 * /api/songs/{id}:
 *   get:
 *     summary: Récupère une chanson par son ID
 *     description: Renvoie les détails d'une chanson spécifique
 *     tags: [Songs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la chanson
 *     responses:
 *       200:
 *         description: Détails de la chanson
 *       404:
 *         description: Chanson non trouvée
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id', isAuthenticated, songController.getSongById);

/**
 * @swagger
 * /api/songs/{id}/airplays:
 *   get:
 *     summary: Récupère les diffusions d'une chanson
 *     description: Renvoie une liste paginée des diffusions d'une chanson spécifique
 *     tags: [Songs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la chanson
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
 *     responses:
 *       200:
 *         description: Liste paginée des diffusions
 *       404:
 *         description: Chanson non trouvée
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
router.get('/:id/airplays', isAuthenticated, songController.getSongAirplays);

/**
 * @swagger
 * /api/songs:
 *   post:
 *     summary: Crée une nouvelle chanson
 *     description: Ajoute une nouvelle chanson à la base de données
 *     tags: [Songs]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SongInput'
 *     responses:
 *       201:
 *         description: Chanson créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       500:
 *         description: Erreur serveur
 */
router.post('/', 
  isAuthenticated, 
  hasRole(['admin', 'manager']), 
  validate(schemas.song), 
  songController.createSong
);

/**
 * @swagger
 * /api/songs/{id}:
 *   put:
 *     summary: Met à jour une chanson
 *     description: Modifie les informations d'une chanson existante
 *     tags: [Songs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la chanson
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SongInput'
 *     responses:
 *       200:
 *         description: Chanson mise à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Chanson non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.put('/:id', 
  isAuthenticated, 
  hasRole(['admin', 'manager']), 
  validate(schemas.song), 
  songController.updateSong
);

/**
 * @swagger
 * /api/songs/{id}:
 *   delete:
 *     summary: Supprime une chanson
 *     description: Supprime une chanson de la base de données
 *     tags: [Songs]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la chanson
 *     responses:
 *       200:
 *         description: Chanson supprimée avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Chanson non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.delete('/:id', 
  isAuthenticated, 
  hasRole(['admin']), 
  songController.deleteSong
);

module.exports = router; 