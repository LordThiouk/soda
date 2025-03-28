const channelService = require('../services/channel.service');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Contrôleur pour la gestion des chaînes radio et TV
 */
const channelController = {
  /**
   * Liste toutes les chaînes avec pagination et filtres
   */
  getAllChannels: catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type; // 'radio' ou 'tv'
    const status = req.query.status; // 'active', 'inactive', 'testing'
    
    const result = await channelService.getAllChannels(page, limit, type, status);
    
    res.status(200).json({
      status: 'success',
      data: result.channels,
      pagination: result.pagination
    });
  }),
  
  /**
   * Récupère une chaîne par son ID
   */
  getChannelById: catchAsync(async (req, res) => {
    const { id } = req.params;
    const channel = await channelService.getChannelById(id);
    
    res.status(200).json({
      status: 'success',
      data: channel
    });
  }),
  
  /**
   * Crée une nouvelle chaîne
   */
  createChannel: catchAsync(async (req, res) => {
    const channel = await channelService.createChannel(req.body);
    
    logger.info(`Nouvelle chaîne créée: ${channel.name}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Chaîne créée avec succès',
      data: channel
    });
  }),
  
  /**
   * Met à jour une chaîne existante
   */
  updateChannel: catchAsync(async (req, res) => {
    const { id } = req.params;
    const updatedChannel = await channelService.updateChannel(id, req.body);
    
    logger.info(`Chaîne mise à jour: ${updatedChannel.name}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Chaîne mise à jour avec succès',
      data: updatedChannel
    });
  }),
  
  /**
   * Supprime une chaîne
   */
  deleteChannel: catchAsync(async (req, res) => {
    const { id } = req.params;
    await channelService.deleteChannel(id);
    
    logger.info(`Chaîne supprimée: ID ${id}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Chaîne supprimée avec succès'
    });
  }),
  
  /**
   * Importe des stations radio depuis l'API RadioBrowser
   */
  importRadioStations: catchAsync(async (req, res) => {
    const overwrite = req.query.overwrite === 'true';
    const result = await channelService.importRadioStations(overwrite);
    
    logger.info(`Import de stations radio terminé: ${result.imported} stations importées, ${result.skipped} ignorées, ${result.errors} erreurs`);
    
    res.status(200).json({
      status: 'success',
      message: 'Import de stations radio terminé',
      data: result
    });
  }),
  
  /**
   * Teste la disponibilité d'une chaîne
   */
  testChannelAvailability: catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await channelService.testChannelAvailability(id);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  })
};

module.exports = channelController; 