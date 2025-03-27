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
                isrcs.push(source.source_data.isrc);
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
                        isrcs = isrcs.concat(track.isrcs);
                      }
                    }
                  }
                }
              }
            }
          }
          
          // Enlever les doublons
          isrcs = [...new Set(isrcs)];
          
          // Sélectionner le premier ISRC disponible (s'il y en a)
          if (isrcs.length > 0) {
            isrc = isrcs[0];
            logger.info(`ISRC récupéré depuis Acoustid: ${isrc}`);
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
          isrc = result.isrc;
          isrcs.push(result.isrc);
          logger.info(`ISRC récupéré depuis Audd (direct): ${isrc}`);
        }
        
        // Méthode 2: ISRC depuis Spotify
        if (result.spotify && result.spotify.external_ids && result.spotify.external_ids.isrc) {
          const spotifyIsrc = result.spotify.external_ids.isrc;
          if (!isrcs.includes(spotifyIsrc)) {
            isrcs.push(spotifyIsrc);
            if (!isrc) isrc = spotifyIsrc;
            logger.info(`ISRC récupéré depuis Audd (Spotify): ${spotifyIsrc}`);
          }
        }
        
        // Méthode 3: ISRC depuis Apple Music
        if (result.apple_music && result.apple_music.isrc) {
          const appleIsrc = result.apple_music.isrc;
          if (!isrcs.includes(appleIsrc)) {
            isrcs.push(appleIsrc);
            if (!isrc) isrc = appleIsrc;
            logger.info(`ISRC récupéré depuis Audd (Apple Music): ${appleIsrc}`);
          }
        }
        
        // Méthode 4: ISRC depuis MusicBrainz
        if (result.musicbrainz && result.musicbrainz.isrcs && result.musicbrainz.isrcs.length > 0) {
          for (const mbIsrc of result.musicbrainz.isrcs) {
            if (!isrcs.includes(mbIsrc)) {
              isrcs.push(mbIsrc);
              if (!isrc) isrc = mbIsrc;
            }
          }
          logger.info(`ISRC récupéré depuis Audd (MusicBrainz): ${isrcs.join(', ')}`);
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