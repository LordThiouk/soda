const songService = require('../services/song.service');
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Contrôleur pour la gestion des chansons
 */
const songController = {
  /**
   * Récupère toutes les chansons avec pagination et filtres
   */
  getAllSongs: catchAsync(async (req, res) => {
    const { page = 1, limit = 20, search } = req.query;
    
    logger.info(`Récupération des chansons - Page: ${page}, Limit: ${limit}, Search: ${search || 'None'}`);
    
    const result = await songService.getAllSongs(
      parseInt(page, 10),
      parseInt(limit, 10),
      search
    );
    
    res.status(200).json(result);
  }),
  
  /**
   * Récupère une chanson par son ID
   */
  getSongById: catchAsync(async (req, res) => {
    const { id } = req.params;
    
    logger.info(`Récupération de la chanson avec l'ID: ${id}`);
    
    const song = await songService.getSongById(id);
    
    if (!song) {
      throw new AppError('Chanson non trouvée', 404);
    }
    
    res.status(200).json(song);
  }),
  
  /**
   * Récupère les diffusions d'une chanson
   */
  getSongAirplays: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    logger.info(`Récupération des diffusions pour la chanson ${id} - Page: ${page}, Limit: ${limit}`);
    
    const result = await songService.getSongAirplays(
      id,
      parseInt(page, 10),
      parseInt(limit, 10)
    );
    
    res.status(200).json(result);
  }),
  
  /**
   * Crée une nouvelle chanson
   */
  createSong: catchAsync(async (req, res) => {
    const songData = req.body;
    
    logger.info('Création d\'une nouvelle chanson');
    logger.debug('Données de la chanson:', songData);
    
    // Vérifier que les champs obligatoires sont présents
    if (!songData.title || !songData.artist) {
      throw new AppError('Le titre et l\'artiste sont obligatoires', 400);
    }
    
    const song = await songService.createSong({
      ...songData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    logger.info(`Chanson créée avec l'ID ${song.id}`);
    
    res.status(201).json(song);
  }),
  
  /**
   * Met à jour une chanson
   */
  updateSong: catchAsync(async (req, res) => {
    const { id } = req.params;
    const songData = req.body;
    
    logger.info(`Mise à jour de la chanson ${id}`);
    logger.debug('Données de mise à jour:', songData);
    
    // Vérifier que les champs obligatoires sont présents si fournis
    if (songData.title === '' || songData.artist === '') {
      throw new AppError('Le titre et l\'artiste ne peuvent pas être vides', 400);
    }
    
    const updatedSong = await songService.updateSong(id, songData);
    
    logger.info(`Chanson ${id} mise à jour avec succès`);
    
    res.status(200).json(updatedSong);
  }),
  
  /**
   * Supprime une chanson
   */
  deleteSong: catchAsync(async (req, res) => {
    const { id } = req.params;
    
    logger.info(`Suppression de la chanson ${id}`);
    
    await songService.deleteSong(id);
    
    logger.info(`Chanson ${id} supprimée avec succès`);
    
    res.status(200).json({
      success: true,
      message: 'Chanson supprimée avec succès'
    });
  }),
  
  /**
   * Recherche des chansons
   */
  searchSongs: catchAsync(async (req, res) => {
    const { query, limit = 10 } = req.query;
    
    if (!query) {
      throw new AppError('Le terme de recherche est obligatoire', 400);
    }
    
    logger.info(`Recherche de chansons avec "${query}" (limite: ${limit})`);
    
    const songs = await songService.searchSongs(
      query,
      parseInt(limit, 10)
    );
    
    res.status(200).json(songs);
  })
};

module.exports = songController; 