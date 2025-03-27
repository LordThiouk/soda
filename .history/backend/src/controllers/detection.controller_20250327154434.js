const detectionService = require('../services/detection.service');
const { catchAsync } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { AppError } = require('../middlewares/errorHandler');

// Configuration de Multer pour le stockage temporaire des fichiers audio
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour accepter uniquement les fichiers audio
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new AppError('Seuls les fichiers audio sont acceptés', 400), false);
  }
};

// Limite de taille du fichier (10 MB par défaut)
const limits = {
  fileSize: process.env.UPLOAD_FILE_SIZE_LIMIT || 10 * 1024 * 1024
};

// Initialisation de Multer
const upload = multer({
  storage,
  fileFilter,
  limits
});

/**
 * Contrôleur pour la détection et l'identification des chansons
 */
const detectionController = {
  /**
   * Middleware Multer pour l'upload de fichier audio
   */
  uploadAudioFile: upload.single('audio_sample'),
  
  /**
   * Middleware pour parser le fichier audio en base64
   */
  parseAudioFile: catchAsync(async (req, res, next) => {
    if (!req.file) {
      return next(new AppError('Aucun fichier audio fourni', 400));
    }
    
    try {
      // Lire le fichier et le convertir en base64
      const filePath = req.file.path;
      const fileData = fs.readFileSync(filePath);
      const base64Data = fileData.toString('base64');
      
      // Ajouter les données base64 à la requête
      req.body.audio_sample = base64Data;
      
      // Supprimer le fichier temporaire
      fs.unlinkSync(filePath);
      
      next();
    } catch (error) {
      logger.error('Erreur lors du traitement du fichier audio:', error);
      return next(new AppError('Erreur lors du traitement du fichier audio', 500));
    }
  }),
  
  /**
   * Identifie une chanson à partir d'un échantillon audio
   */
  identifySong: catchAsync(async (req, res) => {
    const result = await detectionService.identifySong(req.body);
    
    if (result.success) {
      logger.info(`Chanson identifiée: "${result.song.title}" par ${result.song.artist} (confiance: ${result.confidence.toFixed(2)}%)`);
      
      res.status(200).json({
        status: 'success',
        message: 'Chanson identifiée avec succès',
        data: result
      });
    } else {
      logger.info(`Aucune chanson n'a été identifiée dans l'échantillon audio`);
      
      res.status(404).json({
        status: 'fail',
        message: result.error || 'Aucune chanson n\'a été identifiée dans l\'échantillon audio'
      });
    }
  }),
  
  /**
   * Récupère les détections récentes avec pagination et filtres
   */
  getRecentDetections: catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const channelId = req.query.channel_id ? parseInt(req.query.channel_id) : null;
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;
    
    const result = await detectionService.getRecentDetections(
      page, 
      limit, 
      channelId, 
      startDate, 
      endDate
    );
    
    res.status(200).json({
      status: 'success',
      data: result.detections,
      pagination: result.pagination
    });
  }),
  
  /**
   * Applique une correction manuelle à une détection
   */
  applyManualCorrection: catchAsync(async (req, res) => {
    const { detection_id } = req.params;
    const { song_id, reason } = req.body;
    const userId = req.user.id;
    
    const result = await detectionService.applyManualCorrection(
      parseInt(detection_id),
      parseInt(song_id),
      reason,
      userId
    );
    
    logger.info(`Correction manuelle appliquée à la détection ${detection_id} par l'utilisateur ${userId}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Correction appliquée avec succès',
      data: result.correction
    });
  })
};

module.exports = detectionController; 