const axios = require('axios');
const { supabase, executeSupabaseQuery } = require('../utils/supabase');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Service pour la détection et l'identification des chansons
 */
class DetectionService {
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
      formData.append('meta', 'recordings recordings+sources');
      
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
        if (bestMatch.score < 0.7) {
          logger.info(`Score Acoustid trop faible: ${bestMatch.score}`);
          return { success: false, error: 'Score de confiance trop faible' };
        }
        
        // Extraire les informations de la chanson
        if (bestMatch.recordings && bestMatch.recordings.length > 0) {
          const recording = bestMatch.recordings[0];
          
          // Construction des données de la chanson
          const songData = {
            title: recording.title,
            artist: recording.artists ? recording.artists.map(a => a.name).join(', ') : 'Inconnu',
            album: recording.releasegroups ? recording.releasegroups[0].title : null,
            isrc: recording.sources ? recording.sources.find(s => s.source_data && s.source_data.isrc)?.source_data.isrc : null,
            duration: recording.duration,
            fingerprint: audioSample
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
      formData.append('return', 'spotify');
      
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
        
        // Construction des données de la chanson
        const songData = {
          title: result.title,
          artist: result.artist,
          album: result.album,
          isrc: null, // Audd ne fournit pas l'ISRC directement
          duration: null, // Audd ne fournit pas la durée directement
          fingerprint: audioSample,
          release_year: result.release_date ? parseInt(result.release_date.split('-')[0]) : null,
          album_art_url: result.spotify && result.spotify.album && result.spotify.album.images.length > 0 
            ? result.spotify.album.images[0].url 
            : null
        };
        
        return {
          success: true,
          song: songData,
          confidence: 80, // Audd ne fournit pas de score de confiance, on utilise une valeur arbitraire
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
      // Rechercher par fingerprint si disponible
      if (songData.fingerprint) {
        const { data: existingSongs, error: fingerprintError } = await supabase
          .from('songs')
          .select('id')
          .eq('fingerprint', songData.fingerprint)
          .limit(1);
          
        if (!fingerprintError && existingSongs.length > 0) {
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
          return existingSongs[0].id;
        }
      }
      
      // Rechercher par titre et artiste
      const { data: existingSongs, error: titleArtistError } = await supabase
        .from('songs')
        .select('id')
        .eq('title', songData.title)
        .eq('artist', songData.artist)
        .limit(1);
        
      if (!titleArtistError && existingSongs.length > 0) {
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
}

// Exporter une instance du service
module.exports = new DetectionService(); 