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
 * Contrôleur pour les fonctionnalités de détection de chansons
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
   * Identifie une chanson à partir d'un échantillon audio en base64
   */
  identifySong: catchAsync(async (req, res) => {
    const { channel_id, audio_sample } = req.body;
    
    if (!channel_id || !audio_sample) {
      throw new AppError('Les paramètres channel_id et audio_sample sont requis', 400);
    }
    
    const result = await detectionService.identifySong({
      channel_id,
      audio_sample,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json(result);
  }),
  
  /**
   * Identifie une chanson à partir d'un fichier audio uploadé
   */
  identifyFromFile: catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError('Aucun fichier audio n\'a été fourni', 400);
    }
    
    const { channel_id } = req.body;
    
    if (!channel_id) {
      throw new AppError('Le paramètre channel_id est requis', 400);
    }
    
    // Traitement du fichier audio
    // Dans une implémentation réelle, convertir le fichier en empreinte audio
    const audio_sample = `file_fingerprint_${Date.now()}`;
    
    const result = await detectionService.identifySong({
      channel_id,
      audio_sample,
      timestamp: new Date().toISOString()
    });
    
    res.status(200).json(result);
  }),
  
  /**
   * Récupère les détections récentes avec pagination et filtres
   */
  getRecentDetections: catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const channelId = req.query.channel_id || null;
    const startDate = req.query.start_date || null;
    const endDate = req.query.end_date || null;
    
    if (limit > 100) {
      throw new AppError('La limite maximale par page est de 100 détections', 400);
    }
    
    const results = await detectionService.getRecentDetections(
      page,
      limit,
      channelId,
      startDate,
      endDate
    );
    
    res.status(200).json(results);
  }),
  
  /**
   * Applique une correction manuelle à une détection
   */
  applyManualCorrection: catchAsync(async (req, res) => {
    const { detection_id } = req.params;
    const { song_id } = req.body;
    const reason = req.body.reason || 'Correction manuelle';
    
    if (!detection_id || !song_id) {
      throw new AppError('Les paramètres detection_id et song_id sont requis', 400);
    }
    
    const userId = req.user.id;
    
    const result = await detectionService.applyManualCorrection(
      detection_id,
      song_id,
      reason,
      userId
    );
    
    res.status(200).json(result);
  }),
  
  /**
   * Démarre une session de surveillance en temps réel pour une chaîne
   */
  startRealTimeDetection: catchAsync(async (req, res) => {
    const { channel_id } = req.params;
    const { interval_seconds, callback_url } = req.body;
    
    if (!channel_id) {
      throw new AppError('Le paramètre channel_id est requis', 400);
    }
    
    const options = {
      intervalSeconds: interval_seconds || 60,
      callbackUrl: callback_url || null
    };
    
    const result = await detectionService.startRealTimeDetection(
      parseInt(channel_id, 10),
      options
    );
    
    res.status(200).json(result);
  }),
  
  /**
   * Arrête une session de surveillance en temps réel
   */
  stopRealTimeDetection: catchAsync(async (req, res) => {
    const { channel_id } = req.params;
    
    if (!channel_id) {
      throw new AppError('Le paramètre channel_id est requis', 400);
    }
    
    const result = await detectionService.stopRealTimeDetection(
      parseInt(channel_id, 10)
    );
    
    res.status(200).json(result);
  }),
  
  /**
   * Récupère toutes les sessions de surveillance actives
   */
  getActiveMonitoringSessions: catchAsync(async (req, res) => {
    const result = await detectionService.getActiveMonitoringSessions();
    res.status(200).json(result);
  }),
  
  /**
   * Récupère les détails d'une session de surveillance spécifique
   */
  getMonitoringSessionDetails: catchAsync(async (req, res) => {
    const { session_id } = req.params;
    
    if (!session_id) {
      throw new AppError('Le paramètre session_id est requis', 400);
    }
    
    const { data: session, error } = await supabase
      .from('monitoring_sessions')
      .select(`
        id,
        channel_id,
        channels (
          id,
          name,
          url,
          logo_url
        ),
        interval_seconds,
        callback_url,
        status,
        started_at,
        ended_at,
        last_detection_at,
        detection_count
      `)
      .eq('id', session_id)
      .single();
      
    if (error) {
      logger.error('Erreur lors de la récupération des détails de la session:', error);
      throw new AppError('Erreur lors de la récupération des détails de la session', 500);
    }
    
    if (!session) {
      throw new AppError('Session de surveillance non trouvée', 404);
    }
    
    // Récupérer les détections associées à cette session
    const { data: detections, error: detectionsError } = await supabase
      .from('monitoring_detections')
      .select(`
        id,
        detection_id,
        detected_at,
        airplay_logs (
          song_id,
          songs (
            title,
            artist,
            album,
            isrc
          )
        )
      `)
      .eq('session_id', session_id)
      .order('detected_at', { ascending: false })
      .limit(10);
      
    if (detectionsError) {
      logger.error('Erreur lors de la récupération des détections de la session:', detectionsError);
      throw new AppError('Erreur lors de la récupération des détections de la session', 500);
    }
    
    // Récupérer les erreurs associées à cette session
    const { data: errors, error: errorsError } = await supabase
      .from('monitoring_errors')
      .select('id, error_message, occurred_at')
      .eq('session_id', session_id)
      .order('occurred_at', { ascending: false })
      .limit(10);
      
    if (errorsError) {
      logger.error('Erreur lors de la récupération des erreurs de la session:', errorsError);
      throw new AppError('Erreur lors de la récupération des erreurs de la session', 500);
    }
    
    res.status(200).json({
      success: true,
      session: {
        id: session.id,
        channel: {
          id: session.channel_id,
          name: session.channels?.name,
          url: session.channels?.url,
          logo_url: session.channels?.logo_url
        },
        interval_seconds: session.interval_seconds,
        callback_url: session.callback_url,
        status: session.status,
        started_at: session.started_at,
        ended_at: session.ended_at,
        last_detection_at: session.last_detection_at,
        detection_count: session.detection_count
      },
      detections: detections.map(detection => ({
        id: detection.id,
        detection_id: detection.detection_id,
        detected_at: detection.detected_at,
        song: detection.airplay_logs?.songs ? {
          title: detection.airplay_logs.songs.title,
          artist: detection.airplay_logs.songs.artist,
          album: detection.airplay_logs.songs.album,
          isrc: detection.airplay_logs.songs.isrc
        } : null
      })),
      errors: errors
    });
  })
};

module.exports = detectionController; 