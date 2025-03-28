const axios = require('axios');
const { supabase, executeSupabaseQuery } = require('../config/supabase');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { validateISRC, normalizeISRC, formatISRC } = require('../utils/isrc');
const channelService = require('./channel.service');
const os = require('os'); // Pour la surveillance des ressources système

// Configuration globale pour la gestion des ressources
const RESOURCE_LIMITS = {
  MAX_CONCURRENT_SESSIONS: parseInt(process.env.MAX_CONCURRENT_SESSIONS, 10) || 10,
  CPU_THRESHOLD: parseFloat(process.env.CPU_THRESHOLD) || 0.8, // 80% d'utilisation CPU max
  MEMORY_THRESHOLD: parseFloat(process.env.MEMORY_THRESHOLD) || 0.8, // 80% d'utilisation mémoire max
  RESOURCE_CHECK_INTERVAL: parseInt(process.env.RESOURCE_CHECK_INTERVAL, 10) || 60000, // Vérification toutes les 60 secondes
};

/**
 * Service pour la détection et l'identification des chansons
 */
class DetectionService {
  constructor() {
    this.activeMonitoringSessions = new Map();
    this.monitoringIntervals = new Map();
    this.resourceCheckInterval = null;
    this.detectionQueue = [];
    this.processingQueue = false;
    this.failedDetections = new Map(); // Pour le back-off exponentiel
    
    // Démarrer la surveillance des ressources
    this.startResourceMonitoring();
    
    // Restaurer les sessions de surveillance au démarrage
    this.restoreMonitoringSessions();
    
    // Démarrer le traitement de la file d'attente
    this.startQueueProcessing();
  }
  
  /**
   * Démarre le traitement de la file d'attente des détections
   */
  startQueueProcessing() {
    // Traiter la file d'attente toutes les 2 secondes
    setInterval(() => {
      this.processDetectionQueue();
    }, 2000);
    
    logger.info('Traitement de la file d\'attente de détection démarré');
  }
  
  /**
   * Traite la file d'attente des détections
   */
  async processDetectionQueue() {
    // Éviter les traitements parallèles
    if (this.processingQueue || this.detectionQueue.length === 0) {
      return;
    }
    
    this.processingQueue = true;
    
    try {
      // Récupérer la prochaine tâche
      const task = this.detectionQueue.shift();
      
      // Vérifier si la tâche est encore valide
      if (!task || !this.activeMonitoringSessions.has(task.channelId)) {
        this.processingQueue = false;
        return;
      }
      
      logger.info(`Traitement de la détection en file d'attente pour ${task.channelName} (ID: ${task.channelId})`);
      
      // Vérifier si cette chaîne a récemment échoué et appliquer le back-off
      const now = Date.now();
      const failureInfo = this.failedDetections.get(task.channelId);
      
      if (failureInfo) {
        const { lastFailure, failureCount, nextAttempt } = failureInfo;
        
        // Si nous sommes avant le moment de la prochaine tentative, remettre la tâche en file d'attente pour plus tard
        if (now < nextAttempt) {
          logger.info(`Back-off pour ${task.channelName} - prochaine tentative dans ${Math.round((nextAttempt - now) / 1000)}s`);
          
          // Remettre à la fin de la file d'attente
          this.detectionQueue.push(task);
          this.processingQueue = false;
          return;
        }
      }
      
      // Exécuter la détection
      try {
        // Récupérer un échantillon audio
        const audioSample = await this.captureAudioSample(task.streamUrl);
        
        // Si l'échantillon est valide, procéder à l'identification
        if (audioSample) {
          const detectionResult = await this.identifySong({
            channel_id: task.channelId,
            audio_sample: audioSample,
            timestamp: new Date().toISOString()
          });
          
          // Mettre à jour les informations de session
          const sessionInfo = this.activeMonitoringSessions.get(task.channelId);
          if (sessionInfo) {
            sessionInfo.lastDetectionTime = new Date().toISOString();
            sessionInfo.detectionCount += 1;
            
            if (detectionResult.success) {
              // Réinitialiser les informations d'échec
              this.failedDetections.delete(task.channelId);
              
              sessionInfo.lastDetectedSong = {
                title: detectionResult.song.title,
                artist: detectionResult.song.artist,
                detection_id: detectionResult.detection_id
              };
              
              // Enregistrer la détection dans la base de données
              await supabase
                .from('monitoring_detections')
                .insert([{
                  session_id: sessionInfo.sessionId,
                  detection_id: detectionResult.detection_id,
                  detected_at: sessionInfo.lastDetectionTime
                }]);
              
              // Si une URL de callback est spécifiée, envoyer une notification
              if (sessionInfo.callbackUrl) {
                try {
                  await axios.post(sessionInfo.callbackUrl, {
                    event: 'song_detected',
                    channel_id: task.channelId,
                    channel_name: task.channelName,
                    timestamp: sessionInfo.lastDetectionTime,
                    detection: detectionResult
                  });
                } catch (callbackError) {
                  logger.error(`Erreur lors de l'envoi de la notification au callback:`, callbackError);
                }
              }
            } else {
              // Pas de chanson détectée, mais pas d'échec
              logger.info(`Aucune chanson détectée pour ${task.channelName}`);
            }
            
            // Mettre à jour les informations de session dans la base de données
            await supabase
              .from('monitoring_sessions')
              .update({
                last_detection_at: sessionInfo.lastDetectionTime,
                detection_count: sessionInfo.detectionCount
              })
              .eq('id', sessionInfo.sessionId);
          }
        } else {
          // Échec de capture d'échantillon
          this.registerFailure(task.channelId, task.channelName, 'Échec de capture d\'échantillon audio');
        }
      } catch (error) {
        // Erreur lors de la détection
        this.registerFailure(task.channelId, task.channelName, error.message || 'Erreur de détection');
        
        // Enregistrer l'erreur dans la base de données
        const sessionInfo = this.activeMonitoringSessions.get(task.channelId);
        if (sessionInfo) {
          await supabase
            .from('monitoring_errors')
            .insert([{
              session_id: sessionInfo.sessionId,
              error_message: error.message || 'Erreur inconnue',
              error_stack: error.stack,
              occurred_at: new Date().toISOString()
            }]);
        }
      }
    } catch (error) {
      logger.error('Erreur lors du traitement de la file d\'attente:', error);
    } finally {
      this.processingQueue = false;
      
      // Continuer à traiter si d'autres tâches sont en attente
      if (this.detectionQueue.length > 0) {
        setTimeout(() => this.processDetectionQueue(), 500);
      }
    }
  }
  
  /**
   * Enregistre un échec de détection et calcule le délai de back-off
   * @param {number} channelId - ID de la chaîne
   * @param {string} channelName - Nom de la chaîne (pour journalisation)
   * @param {string} errorMessage - Message d'erreur
   */
  registerFailure(channelId, channelName, errorMessage) {
    logger.warn(`Échec de détection pour ${channelName}: ${errorMessage}`);
    
    const now = Date.now();
    const failureInfo = this.failedDetections.get(channelId) || {
      lastFailure: 0,
      failureCount: 0,
      nextAttempt: 0
    };
    
    // Mettre à jour les informations d'échec
    failureInfo.lastFailure = now;
    failureInfo.failureCount += 1;
    
    // Calculer le délai de back-off exponentiel (2^n secondes, max 5 minutes)
    const backoffSeconds = Math.min(Math.pow(2, failureInfo.failureCount), 300);
    failureInfo.nextAttempt = now + (backoffSeconds * 1000);
    
    logger.info(`Back-off pour ${channelName}: ${backoffSeconds}s (échec #${failureInfo.failureCount})`);
    
    // Sauvegarder les informations d'échec
    this.failedDetections.set(channelId, failureInfo);
  }
  
  /**
   * Ajoute une tâche de détection à la file d'attente
   * @param {Object} task - Informations sur la tâche
   */
  queueDetectionTask(task) {
    this.detectionQueue.push(task);
    logger.debug(`Tâche de détection ajoutée à la file d'attente pour ${task.channelName} (ID: ${task.channelId})`);
  }
  
  /**
   * Démarre la surveillance des ressources système
   */
  startResourceMonitoring() {
    // Arrêter tout intervalle existant
    if (this.resourceCheckInterval) {
      clearInterval(this.resourceCheckInterval);
    }
    
    // Configurer un nouvel intervalle pour vérifier les ressources
    this.resourceCheckInterval = setInterval(() => {
      this.checkSystemResources();
    }, RESOURCE_LIMITS.RESOURCE_CHECK_INTERVAL);
    
    logger.info('Surveillance des ressources système démarrée');
  }
  
  /**
   * Vérifie les ressources système et prend des mesures si nécessaire
   */
  async checkSystemResources() {
    try {
      // Mesurer l'utilisation CPU (moyenne sur tous les cœurs)
      const cpuUsage = os.loadavg()[0] / os.cpus().length;
      
      // Mesurer l'utilisation mémoire
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const memoryUsage = (totalMemory - freeMemory) / totalMemory;
      
      logger.debug(`Utilisation des ressources - CPU: ${(cpuUsage * 100).toFixed(2)}%, Mémoire: ${(memoryUsage * 100).toFixed(2)}%`);
      
      // Vérifier si les seuils sont dépassés
      const cpuOverloaded = cpuUsage > RESOURCE_LIMITS.CPU_THRESHOLD;
      const memoryOverloaded = memoryUsage > RESOURCE_LIMITS.MEMORY_THRESHOLD;
      
      if (cpuOverloaded || memoryOverloaded) {
        logger.warn(`Surcharge système détectée - CPU: ${(cpuUsage * 100).toFixed(2)}%, Mémoire: ${(memoryUsage * 100).toFixed(2)}%`);
        
        // Prendre des mesures pour réduire la charge
        await this.reduceSystemLoad(cpuOverloaded, memoryOverloaded);
      }
    } catch (error) {
      logger.error('Erreur lors de la vérification des ressources système:', error);
    }
  }
  
  /**
   * Réduit la charge système en ajustant les sessions de surveillance
   * @param {boolean} cpuOverloaded - Indique si le CPU est surchargé
   * @param {boolean} memoryOverloaded - Indique si la mémoire est surchargée
   */
  async reduceSystemLoad(cpuOverloaded, memoryOverloaded) {
    try {
      // Si trop de sessions sont actives, arrêter les moins prioritaires
      if (this.activeMonitoringSessions.size > 0) {
        // Obtenir toutes les sessions triées par importance (détection récente)
        const sessions = Array.from(this.activeMonitoringSessions.values())
          .sort((a, b) => {
            // Trier par date de dernière détection (les plus anciennes en premier)
            const dateA = a.lastDetectionTime ? new Date(a.lastDetectionTime) : new Date(0);
            const dateB = b.lastDetectionTime ? new Date(b.lastDetectionTime) : new Date(0);
            return dateA - dateB;
          });
        
        // Calculer combien de sessions arrêter (au moins 1)
        const sessionsToStop = Math.max(1, Math.floor(sessions.length * 0.2)); // 20% des sessions
        
        logger.warn(`Réduction de la charge système - Arrêt de ${sessionsToStop} sessions sur ${sessions.length}`);
        
        // Arrêter les sessions les moins actives
        for (let i = 0; i < sessionsToStop; i++) {
          if (i < sessions.length) {
            const session = sessions[i];
            logger.info(`Arrêt de la session de surveillance pour ${session.channelName} (ID: ${session.channelId}) en raison de la surcharge système`);
            
            // Arrêter la session
            await this.stopRealTimeDetection(session.channelId);
            
            // Mettre à jour le motif dans la base de données
            await supabase
              .from('monitoring_sessions')
              .update({
                status: 'stopped',
                ended_at: new Date().toISOString(),
                status_reason: 'Arrêt automatique en raison de la surcharge système'
              })
              .eq('id', session.sessionId);
          }
        }
      }
    } catch (error) {
      logger.error('Erreur lors de la réduction de la charge système:', error);
    }
  }
  
  /**
   * Restaure les sessions de surveillance actives depuis la base de données
   */
  async restoreMonitoringSessions() {
    try {
      logger.info('Restauration des sessions de surveillance...');
      
      // Récupérer toutes les sessions actives de la base de données
      const { data: activeSessions, error } = await supabase
        .from('monitoring_sessions')
        .select(`
          id,
          channel_id,
          interval_seconds,
          callback_url,
          started_at,
          last_detection_at,
          detection_count,
          channels (
            id,
            name,
            url
          )
        `)
        .eq('status', 'active');
        
      if (error) {
        logger.error('Erreur lors de la récupération des sessions de surveillance:', error);
        return;
      }
      
      if (!activeSessions || activeSessions.length === 0) {
        logger.info('Aucune session de surveillance active à restaurer');
        return;
      }
      
      logger.info(`${activeSessions.length} sessions de surveillance actives trouvées`);
      
      // Restaurer chaque session
      for (const session of activeSessions) {
        const channelId = session.channel_id;
        const channel = session.channels;
        
        // Créer une entrée pour la session de surveillance
        const sessionInfo = {
          sessionId: session.id,
          channelId,
          channelName: channel.name,
          startTime: session.started_at,
          intervalSeconds: session.interval_seconds,
          callbackUrl: session.callback_url,
          lastDetectionTime: session.last_detection_at,
          detectionCount: session.detection_count,
          lastDetectedSong: null, // Sera mis à jour lors de la prochaine détection
          status: 'active'
        };
        
        // Stocker les informations de session
        this.activeMonitoringSessions.set(channelId, sessionInfo);
        
        // Créer une fonction de détection pour cette chaîne (même code que dans startRealTimeDetection)
        const detectFunction = async () => {
          try {
            logger.info(`Exécution de la détection programmée pour ${channel.name} (ID: ${channelId})`);
            
            // Récupérer un échantillon audio de la chaîne
            const audioSample = await this.captureAudioSample(channel.url);
            
            // Si l'échantillon est valide, procéder à l'identification
            if (audioSample) {
              const detectionResult = await this.identifySong({
                channel_id: channelId,
                audio_sample: audioSample,
                timestamp: new Date().toISOString()
              });
              
              // Mettre à jour les informations de session
              const sessionInfo = this.activeMonitoringSessions.get(channelId);
              if (sessionInfo) {
                sessionInfo.lastDetectionTime = new Date().toISOString();
                sessionInfo.detectionCount += 1;
                
                if (detectionResult.success) {
                  sessionInfo.lastDetectedSong = {
                    title: detectionResult.song.title,
                    artist: detectionResult.song.artist,
                    detection_id: detectionResult.detection_id
                  };
                  
                  // Enregistrer la détection dans la base de données
                  await supabase
                    .from('monitoring_detections')
                    .insert([{
                      session_id: sessionInfo.sessionId,
                      detection_id: detectionResult.detection_id,
                      detected_at: sessionInfo.lastDetectionTime
                    }]);
                  
                  // Si une URL de callback est spécifiée, envoyer une notification
                  if (sessionInfo.callbackUrl) {
                    try {
                      await axios.post(sessionInfo.callbackUrl, {
                        event: 'song_detected',
                        channel_id: channelId,
                        channel_name: channel.name,
                        timestamp: sessionInfo.lastDetectionTime,
                        detection: detectionResult
                      });
                    } catch (callbackError) {
                      logger.error(`Erreur lors de l'envoi de la notification au callback:`, callbackError);
                    }
                  }
                }
                
                // Mettre à jour les informations de session dans la base de données
                await supabase
                  .from('monitoring_sessions')
                  .update({
                    last_detection_at: sessionInfo.lastDetectionTime,
                    detection_count: sessionInfo.detectionCount
                  })
                  .eq('id', sessionInfo.sessionId);
              }
            }
          } catch (error) {
            logger.error(`Erreur lors de la détection automatique pour ${channel.name}:`, error);
            
            // Enregistrer l'erreur dans la base de données
            await supabase
              .from('monitoring_errors')
              .insert([{
                session_id: this.activeMonitoringSessions.get(channelId)?.sessionId,
                error_message: error.message || 'Erreur inconnue',
                error_stack: error.stack,
                occurred_at: new Date().toISOString()
              }]);
          }
        };
        
        // Configurer l'intervalle de détection
        const intervalId = setInterval(detectFunction, session.interval_seconds * 1000);
        this.monitoringIntervals.set(channelId, intervalId);
        
        logger.info(`Session de surveillance restaurée pour la chaîne ${channel.name} (ID: ${channelId})`);
      }
      
      logger.info('Restauration des sessions de surveillance terminée');
    } catch (error) {
      logger.error('Erreur lors de la restauration des sessions de surveillance:', error);
    }
  }
  
  /**
   * Identifie une chanson à partir d'un échantillon audio
   * @param {Object} detectionData - Données de détection
   * @returns {Object} Résultat de l'identification
   */
  async identifySong(detectionData) {
    const { channel_id, audio_sample, timestamp = new Date().toISOString(), playback_position = 0 } = detectionData;
    
    try {
      // Vérifier si la chaîne existe
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channel_id)
        .single();
        
      if (channelError || !channel) {
        logger.error('Chaîne non trouvée:', channelError);
        throw new AppError('Chaîne non trouvée', 404);
      }
      
      // Tentative d'identification avec Acoustid (service principal)
      let identificationResult = await this.identifyWithAcoustid(audio_sample);
      
      // Si Acoustid échoue, essayer avec Audd (service de secours)
      if (!identificationResult.success) {
        logger.info('Acoustid n\'a pas trouvé de correspondance, tentative avec Audd');
        identificationResult = await this.identifyWithAudd(audio_sample);
      }
      
      // Enregistrer le résultat de la détection
      if (identificationResult.success) {
        // Vérifier si la chanson existe déjà dans la base de données
        let songId = await this.findOrCreateSong(identificationResult.song);
        
        // Calculer la position exacte de l'échantillon dans la chanson (en secondes)
        const samplePosition = identificationResult.song.sample_position || 0;
        
        // Estimer l'heure exacte de début de la chanson
        const playTimestamp = new Date(timestamp);
        const startTimestamp = new Date(playTimestamp.getTime() - (samplePosition * 1000));
        
        // Calculer l'heure de fin estimée (basée sur la durée de la chanson si disponible)
        let endTimestamp = null;
        if (identificationResult.song.duration) {
          endTimestamp = new Date(startTimestamp.getTime() + (identificationResult.song.duration * 1000));
        }
        
        // Enregistrer la diffusion avec des informations précises sur le temps de jeu
        const airplayData = {
          song_id: songId,
          channel_id,
          play_timestamp: startTimestamp.toISOString(), // Heure de début précise
          end_timestamp: endTimestamp ? endTimestamp.toISOString() : null, // Heure de fin estimée
          duration: identificationResult.song.duration || null,
          confidence: identificationResult.confidence,
          playback_position: samplePosition,
          detected_at: timestamp, // Conserver l'heure exacte de la détection
          fingerprint_data: identificationResult.raw_data
        };
        
        const { data: airplay, error: airplayError } = await supabase
          .from('airplay_logs')
          .insert([airplayData])
          .select()
          .single();
          
        if (airplayError) {
          logger.error('Erreur lors de l\'enregistrement de la diffusion:', airplayError);
          throw new AppError('Erreur lors de l\'enregistrement de la diffusion', 500);
        }
        
        return {
          success: true,
          detection_id: airplay.id,
          song: identificationResult.song,
          channel,
          confidence: identificationResult.confidence,
          playback_info: {
            start_time: airplay.play_timestamp,
            end_time: airplay.end_timestamp,
            duration: airplay.duration,
            detected_at: airplay.detected_at
          }
        };
      } else {
        // Aucune correspondance trouvée
        return {
          success: false,
          error: 'Aucune chanson n\'a été identifiée dans l\'échantillon audio'
        };
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erreur lors de l\'identification de la chanson:', error);
      throw new AppError('Erreur lors de l\'identification de la chanson', 500);
    }
  }
  
  /**
   * Identification avec Acoustid
   * @param {string} audioSample - Échantillon audio en base64
   * @returns {Object} Résultat de l'identification
   */
  async identifyWithAcoustid(audioSample) {
    try {
      // Vérifier la clé API Acoustid
      const acoustidApiKey = process.env.ACOUSTID_API_KEY;
      if (!acoustidApiKey) {
        logger.error('Clé API Acoustid non configurée');
        return { success: false, error: 'Service de reconnaissance non configuré' };
      }
      
      // Préparer les données pour l'API Acoustid
      const formData = new FormData();
      formData.append('client', acoustidApiKey);
      formData.append('fingerprint', audioSample);
      // Demander un maximum de métadonnées, y compris les codes ISRC
      formData.append('meta', 'recordings recordings+sources+releasegroups+releases+tracks+compress musicbrainz');
      formData.append('duration', '30'); // Durée estimée de l'échantillon en secondes
      
      // Appel à l'API Acoustid
      const response = await axios.post(
        'https://api.acoustid.org/v2/lookup',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Traiter la réponse
      if (response.data && response.data.results && response.data.results.length > 0) {
        // Trouver le résultat avec le meilleur score
        const bestMatch = response.data.results.reduce((best, current) => {
          return (current.score > best.score) ? current : best;
        }, { score: 0 });
        
        // Si le score est trop faible, considérer qu'il n'y a pas de correspondance
        if (bestMatch.score < 0.6) {
          logger.info(`Score Acoustid trop faible: ${bestMatch.score}`);
          return { success: false, error: 'Score de confiance trop faible' };
        }
        
        // Extraire les informations de la chanson
        if (bestMatch.recordings && bestMatch.recordings.length > 0) {
          const recording = bestMatch.recordings[0];
          
          // Extraire la position temporelle estimée de l'échantillon dans la chanson
          // AcoustID fournit des informations de position dans certains cas
          let samplePosition = 0;
          if (bestMatch.offset) {
            samplePosition = bestMatch.offset;
          }
          
          // Extraire les codes ISRC (peut être dans plusieurs endroits)
          let isrc = null;
          let isrcs = [];
          
          // Méthode 1: Chercher dans les sources
          if (recording.sources) {
            // Parcourir toutes les sources pour trouver tous les ISRC
            for (const source of recording.sources) {
              if (source.source_data && source.source_data.isrc) {
                const sourceIsrc = source.source_data.isrc;
                // Vérifier et normaliser l'ISRC
                if (validateISRC(sourceIsrc)) {
                  const normalizedIsrc = normalizeISRC(sourceIsrc);
                  if (!isrcs.includes(normalizedIsrc)) {
                    isrcs.push(normalizedIsrc);
                  }
                }
              }
            }
          }
          
          // Méthode 2: Chercher dans les releases et tracks
          if (recording.releases) {
            for (const release of recording.releases) {
              if (release.mediums) {
                for (const medium of release.mediums) {
                  if (medium.tracks) {
                    for (const track of medium.tracks) {
                      if (track.isrcs && track.isrcs.length > 0) {
                        for (const trackIsrc of track.isrcs) {
                          // Vérifier et normaliser l'ISRC
                          if (validateISRC(trackIsrc)) {
                            const normalizedIsrc = normalizeISRC(trackIsrc);
                            if (!isrcs.includes(normalizedIsrc)) {
                              isrcs.push(normalizedIsrc);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          
          // Enlever les doublons (déjà fait pendant la normalisation)
          // isrcs = [...new Set(isrcs)];
          
          // Sélectionner le premier ISRC disponible (s'il y en a)
          if (isrcs.length > 0) {
            isrc = isrcs[0];
            logger.info(`ISRC récupéré depuis Acoustid: ${formatISRC(isrc)}`);
          }
          
          // Construction des données de la chanson
          const songData = {
            title: recording.title,
            artist: recording.artists ? recording.artists.map(a => a.name).join(', ') : 'Inconnu',
            album: recording.releasegroups ? recording.releasegroups[0].title : null,
            isrc: isrc,
            duration: recording.duration,
            fingerprint: audioSample,
            sample_position: samplePosition, // Position de l'échantillon dans la chanson
            release_year: recording.releasegroups ? recording.releasegroups[0].year : null,
            // Extraire plus de métadonnées et conserver tous les ISRC trouvés
            metadata: {
              acoustid_id: bestMatch.id,
              musicbrainz_id: recording.id,
              score: bestMatch.score,
              isrcs: isrcs.length > 0 ? isrcs : null
            }
          };
          
          return {
            success: true,
            song: songData,
            confidence: bestMatch.score * 100,
            raw_data: response.data
          };
        }
      }
      
      return { success: false, error: 'Aucune correspondance trouvée' };
    } catch (error) {
      logger.error('Erreur lors de l\'identification avec Acoustid:', error);
      return { success: false, error: 'Erreur du service de reconnaissance Acoustid' };
    }
  }
  
  /**
   * Identification avec Audd (service de secours)
   * @param {string} audioSample - Échantillon audio en base64
   * @returns {Object} Résultat de l'identification
   */
  async identifyWithAudd(audioSample) {
    try {
      // Vérifier la clé API Audd
      const auddApiKey = process.env.AUDD_API_KEY;
      if (!auddApiKey) {
        logger.error('Clé API Audd non configurée');
        return { success: false, error: 'Service de reconnaissance de secours non configuré' };
      }
      
      // Préparer les données pour l'API Audd
      const formData = new FormData();
      formData.append('api_token', auddApiKey);
      formData.append('audio', audioSample);
      // Demander toutes les métadonnées disponibles
      formData.append('return', 'spotify,apple_music,deezer,musicbrainz');
      formData.append('offset', 'true'); // Demander la position de l'échantillon dans la chanson
      
      // Appel à l'API Audd
      const response = await axios.post(
        'https://api.audd.io/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Traiter la réponse
      if (response.data && response.data.result) {
        const result = response.data.result;
        
        // Récupérer la position de l'échantillon dans la chanson (en secondes)
        // Audd retourne cette information dans le champ "offset" s'il est disponible
        const samplePosition = result.offset ? parseFloat(result.offset) : 0;
        
        // Récupérer la durée de la chanson depuis Spotify ou autre service si disponible
        let duration = null;
        if (result.spotify && result.spotify.duration_ms) {
          duration = Math.round(result.spotify.duration_ms / 1000);
        } else if (result.apple_music && result.apple_music.duration_ms) {
          duration = Math.round(result.apple_music.duration_ms / 1000);
        } else if (result.deezer && result.deezer.duration) {
          duration = result.deezer.duration;
        }
        
        // Extraire et valider l'ISRC
        let isrc = null;
        let isrcs = [];

        // Méthode 1: ISRC directement dans le résultat
        if (result.isrc) {
          const resultIsrc = result.isrc;
          if (validateISRC(resultIsrc)) {
            const normalizedIsrc = normalizeISRC(resultIsrc);
            isrc = normalizedIsrc;
            isrcs.push(normalizedIsrc);
            logger.info(`ISRC récupéré depuis Audd (direct): ${formatISRC(normalizedIsrc)}`);
          }
        }
        
        // Méthode 2: ISRC depuis Spotify
        if (result.spotify && result.spotify.external_ids && result.spotify.external_ids.isrc) {
          const spotifyIsrc = result.spotify.external_ids.isrc;
          if (validateISRC(spotifyIsrc)) {
            const normalizedIsrc = normalizeISRC(spotifyIsrc);
            if (!isrcs.includes(normalizedIsrc)) {
              isrcs.push(normalizedIsrc);
              if (!isrc) isrc = normalizedIsrc;
              logger.info(`ISRC récupéré depuis Audd (Spotify): ${formatISRC(normalizedIsrc)}`);
            }
          }
        }
        
        // Méthode 3: ISRC depuis Apple Music
        if (result.apple_music && result.apple_music.isrc) {
          const appleIsrc = result.apple_music.isrc;
          if (validateISRC(appleIsrc)) {
            const normalizedIsrc = normalizeISRC(appleIsrc);
            if (!isrcs.includes(normalizedIsrc)) {
              isrcs.push(normalizedIsrc);
              if (!isrc) isrc = normalizedIsrc;
              logger.info(`ISRC récupéré depuis Audd (Apple Music): ${formatISRC(normalizedIsrc)}`);
            }
          }
        }
        
        // Méthode 4: ISRC depuis MusicBrainz
        if (result.musicbrainz && result.musicbrainz.isrcs && result.musicbrainz.isrcs.length > 0) {
          for (const mbIsrc of result.musicbrainz.isrcs) {
            if (validateISRC(mbIsrc)) {
              const normalizedIsrc = normalizeISRC(mbIsrc);
              if (!isrcs.includes(normalizedIsrc)) {
                isrcs.push(normalizedIsrc);
                if (!isrc) isrc = normalizedIsrc;
              }
            }
          }
          if (isrcs.length > 0) {
            logger.info(`ISRC récupéré depuis Audd (MusicBrainz): ${isrcs.map(formatISRC).join(', ')}`);
          }
        }
        
        // Construction des données de la chanson
        const songData = {
          title: result.title,
          artist: result.artist,
          album: result.album,
          isrc: isrc,
          duration: duration,
          fingerprint: audioSample,
          sample_position: samplePosition, // Position de l'échantillon dans la chanson
          release_year: result.release_date ? parseInt(result.release_date.split('-')[0]) : null,
          album_art_url: result.spotify && result.spotify.album && result.spotify.album.images.length > 0 
            ? result.spotify.album.images[0].url 
            : null,
          // Stocker plus de métadonnées
          metadata: {
            audd_score: result.score || null,
            spotify_id: result.spotify ? result.spotify.id : null,
            apple_music_id: result.apple_music ? result.apple_music.id : null,
            deezer_id: result.deezer ? result.deezer.id : null,
            musicbrainz_id: result.musicbrainz ? result.musicbrainz.id : null,
            isrcs: isrcs.length > 0 ? isrcs : null
          }
        };
        
        return {
          success: true,
          song: songData,
          confidence: result.score ? result.score * 100 : 80, // Audd peut fournir un score dans certains cas
          raw_data: response.data
        };
      }
      
      return { success: false, error: 'Aucune correspondance trouvée' };
    } catch (error) {
      logger.error('Erreur lors de l\'identification avec Audd:', error);
      return { success: false, error: 'Erreur du service de reconnaissance Audd' };
    }
  }
  
  /**
   * Recherche une chanson dans la base de données ou en crée une nouvelle
   * @param {Object} songData - Données de la chanson
   * @returns {number} ID de la chanson
   */
  async findOrCreateSong(songData) {
    try {
      // Normaliser l'ISRC si présent
      if (songData.isrc && validateISRC(songData.isrc)) {
        songData.isrc = normalizeISRC(songData.isrc);
        logger.info(`ISRC normalisé: ${formatISRC(songData.isrc)}`);
      }
      
      // Rechercher par fingerprint si disponible
      if (songData.fingerprint) {
        const { data: existingSongs, error: fingerprintError } = await supabase
          .from('songs')
          .select('id, isrc')
          .eq('fingerprint', songData.fingerprint)
          .limit(1);
          
        if (!fingerprintError && existingSongs.length > 0) {
          // Si on a trouvé une chanson par fingerprint mais qu'elle n'a pas d'ISRC et que nous en avons un,
          // on met à jour son ISRC
          if (songData.isrc && !existingSongs[0].isrc) {
            await supabase
              .from('songs')
              .update({ 
                isrc: songData.isrc,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingSongs[0].id);
            
            logger.info(`ISRC ajouté à la chanson existante ID ${existingSongs[0].id}: ${formatISRC(songData.isrc)}`);
          }
          
          return existingSongs[0].id;
        }
      }
      
      // Rechercher par ISRC si disponible
      if (songData.isrc) {
        const { data: existingSongs, error: isrcError } = await supabase
          .from('songs')
          .select('id')
          .eq('isrc', songData.isrc)
          .limit(1);
          
        if (!isrcError && existingSongs.length > 0) {
          // Si on a trouvé par ISRC mais qu'on a un fingerprint qu'on n'avait pas avant,
          // on peut mettre à jour le fingerprint
          if (songData.fingerprint) {
            await supabase
              .from('songs')
              .update({
                fingerprint: songData.fingerprint,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingSongs[0].id);
            
            logger.info(`Fingerprint ajouté à la chanson existante ID ${existingSongs[0].id}`);
          }
          
          return existingSongs[0].id;
        }
      }
      
      // Rechercher par titre et artiste
      const { data: existingSongs, error: titleArtistError } = await supabase
        .from('songs')
        .select('id, isrc, fingerprint')
        .eq('title', songData.title)
        .eq('artist', songData.artist)
        .limit(1);
        
      if (!titleArtistError && existingSongs.length > 0) {
        // Mise à jour de l'ISRC ou du fingerprint si nécessaire
        const updates = {};
        let needsUpdate = false;
        
        if (songData.isrc && !existingSongs[0].isrc) {
          updates.isrc = songData.isrc;
          needsUpdate = true;
        }
        
        if (songData.fingerprint && !existingSongs[0].fingerprint) {
          updates.fingerprint = songData.fingerprint;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          updates.updated_at = new Date().toISOString();
          await supabase
            .from('songs')
            .update(updates)
            .eq('id', existingSongs[0].id);
          
          logger.info(`Informations supplémentaires ajoutées à la chanson existante ID ${existingSongs[0].id}`);
        }
        
        return existingSongs[0].id;
      }
      
      // Si aucune correspondance, créer une nouvelle chanson
      const { data: newSong, error: insertError } = await supabase
        .from('songs')
        .insert([songData])
        .select()
        .single();
        
      if (insertError) {
        logger.error('Erreur lors de la création de la chanson:', insertError);
        throw new AppError('Erreur lors de la création de la chanson', 500);
      }
      
      logger.info(`Nouvelle chanson créée avec ID ${newSong.id}${songData.isrc ? ', ISRC: ' + formatISRC(songData.isrc) : ''}`);
      
      return newSong.id;
    } catch (error) {
      logger.error('Erreur lors de la recherche/création de la chanson:', error);
      throw error;
    }
  }
  
  /**
   * Récupère les détections récentes avec pagination
   * @param {number} page - Numéro de page
   * @param {number} limit - Nombre d'éléments par page
   * @param {number} channelId - Filtrer par chaîne
   * @param {string} startDate - Date de début
   * @param {string} endDate - Date de fin
   * @returns {Array} Liste des détections
   */
  async getRecentDetections(page = 1, limit = 20, channelId = null, startDate = null, endDate = null) {
    try {
      // Calculer l'offset pour la pagination
      const offset = (page - 1) * limit;
      
      // Requête de base
      let query = supabase
        .from('airplay_logs')
        .select(`
          *,
          songs(*),
          channels(*)
        `, { count: 'exact' });
      
      // Ajouter les filtres
      if (channelId) {
        query = query.eq('channel_id', channelId);
      }
      
      if (startDate) {
        query = query.gte('play_timestamp', startDate);
      }
      
      if (endDate) {
        query = query.lte('play_timestamp', endDate);
      }
      
      // Ajouter la pagination et le tri
      query = query
        .order('play_timestamp', { ascending: false })
        .range(offset, offset + limit - 1);
      
      // Exécuter la requête
      const { data, count, error } = await query;
      
      if (error) {
        logger.error('Erreur lors de la récupération des détections:', error);
        throw new AppError('Erreur lors de la récupération des détections', 500);
      }
      
      // Calculer le nombre total de pages
      const totalPages = Math.ceil(count / limit);
      
      return {
        detections: data,
        pagination: {
          total: count,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erreur non gérée lors de la récupération des détections:', error);
      throw new AppError('Erreur lors de la récupération des détections', 500);
    }
  }
  
  /**
   * Applique une correction manuelle à une détection
   * @param {number} detectionId - ID de la détection
   * @param {number} correctSongId - ID de la chanson correcte
   * @param {string} reason - Raison de la correction
   * @param {string} userId - ID de l'utilisateur qui fait la correction
   * @returns {Object} Résultat de la correction
   */
  async applyManualCorrection(detectionId, correctSongId, reason, userId) {
    try {
      // Vérifier si la détection existe
      const { data: detection, error: detectionError } = await supabase
        .from('airplay_logs')
        .select('*')
        .eq('id', detectionId)
        .single();
        
      if (detectionError || !detection) {
        logger.error('Détection non trouvée:', detectionError);
        throw new AppError('Détection non trouvée', 404);
      }
      
      // Vérifier si la chanson correcte existe
      const { data: correctSong, error: songError } = await supabase
        .from('songs')
        .select('*')
        .eq('id', correctSongId)
        .single();
        
      if (songError || !correctSong) {
        logger.error('Chanson de correction non trouvée:', songError);
        throw new AppError('Chanson de correction non trouvée', 404);
      }
      
      // Créer la correction
      const correctionData = {
        airplay_log_id: detectionId,
        corrected_song_id: correctSongId,
        correction_reason: reason,
        corrected_by: userId
      };
      
      const { data: correction, error: correctionError } = await supabase
        .from('manual_corrections')
        .insert([correctionData])
        .select()
        .single();
        
      if (correctionError) {
        logger.error('Erreur lors de la création de la correction:', correctionError);
        throw new AppError('Erreur lors de la création de la correction', 500);
      }
      
      return {
        success: true,
        correction,
        message: 'Correction appliquée avec succès'
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erreur non gérée lors de l\'application de la correction:', error);
      throw new AppError('Erreur lors de l\'application de la correction', 500);
    }
  }
  
  /**
   * Démarre une session de surveillance en temps réel pour une chaîne spécifique
   * @param {number} channelId - ID de la chaîne à surveiller
   * @param {Object} options - Options de surveillance (intervalSeconds, callbackUrl)
   * @returns {Object} Informations sur la session de surveillance
   */
  async startRealTimeDetection(channelId, options = {}) {
    try {
      // Vérifier si le maximum de sessions simultanées est atteint
      if (this.activeMonitoringSessions.size >= RESOURCE_LIMITS.MAX_CONCURRENT_SESSIONS) {
        logger.error(`Impossible de démarrer la surveillance: nombre maximum de sessions atteint (${RESOURCE_LIMITS.MAX_CONCURRENT_SESSIONS})`);
        throw new AppError(`Nombre maximum de sessions de surveillance atteint (${RESOURCE_LIMITS.MAX_CONCURRENT_SESSIONS})`, 429);
      }
      
      // Vérifier les ressources système disponibles
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const memoryUsage = (totalMemory - freeMemory) / totalMemory;
      const cpuUsage = os.loadavg()[0] / os.cpus().length;
      
      if (cpuUsage > RESOURCE_LIMITS.CPU_THRESHOLD || memoryUsage > RESOURCE_LIMITS.MEMORY_THRESHOLD) {
        logger.error(`Impossible de démarrer la surveillance: ressources système insuffisantes (CPU: ${(cpuUsage * 100).toFixed(2)}%, Mémoire: ${(memoryUsage * 100).toFixed(2)}%)`);
        throw new AppError('Ressources système insuffisantes pour démarrer une nouvelle session de surveillance', 503);
      }
      
      // Récupérer les informations de la chaîne
      const { data: channel, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();
        
      if (channelError || !channel) {
        logger.error(`Impossible de démarrer la surveillance: chaîne ${channelId} non trouvée`);
        throw new AppError('Chaîne non trouvée', 404);
      }
      
      // Vérifier si la chaîne est disponible
      const isAvailable = await channelService.testChannelAvailability(channelId);
      if (!isAvailable.status) {
        logger.error(`Impossible de démarrer la surveillance: chaîne ${channelId} non disponible`);
        throw new AppError(`La chaîne ${channel.name} n'est pas disponible pour la surveillance en temps réel`, 400);
      }
      
      // Si une session de surveillance existe déjà pour cette chaîne, l'arrêter
      if (this.activeMonitoringSessions.has(channelId)) {
        await this.stopRealTimeDetection(channelId);
      }
      
      // Configurer les options de surveillance
      const intervalSeconds = options.intervalSeconds || 60; // Par défaut: échantillonnage toutes les 60 secondes
      const callbackUrl = options.callbackUrl || null; // URL de callback pour notification (optionnel)
      
      // Créer une entrée pour la session de surveillance
      const sessionInfo = {
        channelId,
        channelName: channel.name,
        startTime: new Date().toISOString(),
        intervalSeconds,
        callbackUrl,
        lastDetectionTime: null,
        detectionCount: 0,
        lastDetectedSong: null,
        status: 'active'
      };
      
      // Sauvegarder les informations de session
      const { data: session, error: sessionError } = await supabase
        .from('monitoring_sessions')
        .insert([{
          channel_id: channelId,
          interval_seconds: intervalSeconds,
          callback_url: callbackUrl,
          status: 'active',
          started_at: sessionInfo.startTime
        }])
        .select()
        .single();
        
      if (sessionError) {
        logger.error('Erreur lors de la création de la session de surveillance:', sessionError);
        throw new AppError('Erreur lors de la création de la session de surveillance', 500);
      }
      
      // Ajouter l'ID de session aux informations
      sessionInfo.sessionId = session.id;
      
      // Stocker les informations de session
      this.activeMonitoringSessions.set(channelId, sessionInfo);
      
      // Configurer l'intervalle de détection
      const intervalFunction = () => {
        // Au lieu d'exécuter directement la détection, ajouter à la file d'attente
        if (this.activeMonitoringSessions.has(channelId)) {
          const sessionInfo = this.activeMonitoringSessions.get(channelId);
          this.queueDetectionTask({
            channelId,
            channelName: channel.name,
            streamUrl: channel.url,
            sessionId: sessionInfo.sessionId
          });
        }
      };
      
      const intervalId = setInterval(intervalFunction, intervalSeconds * 1000);
      this.monitoringIntervals.set(channelId, intervalId);
      
      // Exécuter une première détection immédiatement en l'ajoutant à la file
      intervalFunction();
      
      return {
        success: true,
        message: `Surveillance en temps réel démarrée pour ${channel.name}`,
        session: {
          id: sessionInfo.sessionId,
          channel_id: channelId,
          channel_name: channel.name,
          start_time: sessionInfo.startTime,
          interval_seconds: intervalSeconds,
          status: 'active'
        }
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erreur lors du démarrage de la surveillance en temps réel:', error);
      throw new AppError('Erreur lors du démarrage de la surveillance en temps réel', 500);
    }
  }
  
  /**
   * Arrête une session de surveillance en temps réel
   * @param {number} channelId - ID de la chaîne à arrêter
   * @param {string} reason - Raison de l'arrêt (optionnel)
   * @returns {Object} Résultat de l'opération
   */
  async stopRealTimeDetection(channelId, reason = 'Arrêt manuel') {
    try {
      // Vérifier si une session de surveillance existe pour cette chaîne
      if (!this.activeMonitoringSessions.has(channelId)) {
        throw new AppError('Aucune session de surveillance active pour cette chaîne', 404);
      }
      
      // Récupérer les informations de session
      const sessionInfo = this.activeMonitoringSessions.get(channelId);
      
      // Arrêter l'intervalle de détection
      clearInterval(this.monitoringIntervals.get(channelId));
      this.monitoringIntervals.delete(channelId);
      
      // Mettre à jour le statut de la session dans la base de données
      const { error: updateError } = await supabase
        .from('monitoring_sessions')
        .update({
          status: 'stopped',
          ended_at: new Date().toISOString(),
          status_reason: reason
        })
        .eq('id', sessionInfo.sessionId);
        
      if (updateError) {
        logger.error('Erreur lors de la mise à jour du statut de la session:', updateError);
      }
      
      // Supprimer la session des sessions actives
      this.activeMonitoringSessions.delete(channelId);
      
      return {
        success: true,
        message: `Surveillance en temps réel arrêtée pour ${sessionInfo.channelName}`,
        session: {
          id: sessionInfo.sessionId,
          channel_id: channelId,
          status: 'stopped',
          end_time: new Date().toISOString(),
          reason: reason
        }
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erreur lors de l\'arrêt de la surveillance en temps réel:', error);
      throw new AppError('Erreur lors de l\'arrêt de la surveillance en temps réel', 500);
    }
  }
  
  /**
   * Récupère toutes les sessions de surveillance actives
   * @returns {Array} Liste des sessions de surveillance
   */
  async getActiveMonitoringSessions() {
    try {
      const { data: sessions, error } = await supabase
        .from('monitoring_sessions')
        .select(`
          id,
          channel_id,
          channels (
            name
          ),
          interval_seconds,
          status,
          started_at,
          last_detection_at,
          detection_count
        `)
        .eq('status', 'active');
        
      if (error) {
        logger.error('Erreur lors de la récupération des sessions de surveillance:', error);
        throw new AppError('Erreur lors de la récupération des sessions de surveillance', 500);
      }
      
      return {
        success: true,
        sessions: sessions.map(session => ({
          id: session.id,
          channel_id: session.channel_id,
          channel_name: session.channels?.name,
          interval_seconds: session.interval_seconds,
          started_at: session.started_at,
          last_detection_at: session.last_detection_at,
          detection_count: session.detection_count,
          status: session.status
        }))
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erreur lors de la récupération des sessions de surveillance:', error);
      throw new AppError('Erreur lors de la récupération des sessions de surveillance', 500);
    }
  }
  
  /**
   * Capture un échantillon audio d'un flux radio
   * @param {string} streamUrl - URL du flux à échantillonner
   * @returns {string} Échantillon audio en base64 ou null en cas d'erreur
   */
  async captureAudioSample(streamUrl) {
    try {
      const { spawn } = require('child_process');
      const fs = require('fs');
      const path = require('path');
      const crypto = require('crypto');
      
      // Générer un nom de fichier unique pour l'échantillon
      const uniqueId = crypto.randomBytes(8).toString('hex');
      const tempDir = path.join(__dirname, '../../uploads/temp');
      const tempFilePath = path.join(tempDir, `sample_${uniqueId}.mp3`);
      
      // Créer le répertoire temporaire s'il n'existe pas
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      logger.info(`Capture d'un échantillon audio de ${streamUrl}`);
      
      // Configuration de l'échantillonnage (30 secondes d'audio à 128kbps)
      const duration = 30; // 30 secondes
      const bitrate = '128k'; // bitrate standard pour une qualité suffisante pour la reconnaissance
      
      // Créer un processus FFmpeg pour capturer l'échantillon
      return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-y',                // Écraser le fichier de sortie si existant
          '-i', streamUrl,      // URL du flux
          '-t', duration.toString(), // Durée
          '-ab', bitrate,      // Bitrate audio
          '-ac', '2',          // 2 canaux audio (stéréo)
          '-ar', '44100',      // Fréquence d'échantillonnage
          '-vn',               // Ignorer la vidéo
          tempFilePath         // Fichier de sortie
        ]);
        
        // Journaliser les erreurs
        ffmpeg.stderr.on('data', (data) => {
          logger.debug(`FFmpeg: ${data.toString()}`);
        });
        
        // Gérer la fin du processus
        ffmpeg.on('close', (code) => {
          if (code !== 0) {
            logger.error(`FFmpeg a échoué avec le code: ${code}`);
            resolve(null);
            return;
          }
          
          try {
            // Lire le fichier échantillon
            const audioBuffer = fs.readFileSync(tempFilePath);
            
            // Convertir en fingerprint audio ou en base64 selon l'implémentation d'Acoustid/Audd
            // Pour cet exemple, nous utilisons simplement base64
            const base64Data = audioBuffer.toString('base64');
            
            // Supprimer le fichier temporaire
            fs.unlinkSync(tempFilePath);
            
            resolve(base64Data);
          } catch (error) {
            logger.error(`Erreur lors du traitement du fichier audio: ${error.message}`);
            resolve(null);
          }
        });
        
        // Gérer les erreurs du processus
        ffmpeg.on('error', (err) => {
          logger.error(`Erreur FFmpeg: ${err.message}`);
          resolve(null);
        });
      });
      
    } catch (error) {
      logger.error(`Erreur lors de la capture d'échantillon audio de ${streamUrl}:`, error);
      return null;
    }
  }
}

// Exporter une instance du service
module.exports = new DetectionService(); 