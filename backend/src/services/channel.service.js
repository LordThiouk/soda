const axios = require('axios');
const { supabase, executeSupabaseQuery } = require('../config/supabase');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Service pour la gestion des chaînes radio et TV
 */
class ChannelService {
  /**
   * Récupère toutes les chaînes avec pagination
   * @param {number} page - Numéro de page
   * @param {number} limit - Nombre d'éléments par page
   * @param {string} type - Type de chaîne (radio, tv, ou tous)
   * @param {string} status - Statut des chaînes (active, inactive, testing, ou tous)
   * @returns {Array} Liste des chaînes
   */
  async getAllChannels(page = 1, limit = 10, type = null, status = null) {
    try {
      // Calculer l'offset pour la pagination
      const offset = (page - 1) * limit;
      
      // Requête de base
      let query = supabase
        .from('channels')
        .select('*', { count: 'exact' });
      
      // Ajouter les filtres si spécifiés
      if (type) {
        query = query.eq('type', type);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      // Ajouter la pagination
      query = query
        .order('name')
        .range(offset, offset + limit - 1);
      
      // Exécuter la requête
      const { data, count, error } = await query;
      
      if (error) {
        logger.error('Erreur lors de la récupération des chaînes:', error);
        throw new AppError('Erreur lors de la récupération des chaînes', 500);
      }
      
      // Calculer le nombre total de pages
      const totalPages = Math.ceil(count / limit);
      
      return {
        channels: data,
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
      logger.error('Erreur non gérée lors de la récupération des chaînes:', error);
      throw new AppError('Erreur lors de la récupération des chaînes', 500);
    }
  }
  
  /**
   * Récupère une chaîne par son ID
   * @param {number} id - ID de la chaîne
   * @returns {Object} Chaîne
   */
  async getChannelById(id) {
    try {
      return await executeSupabaseQuery(() => 
        supabase
          .from('channels')
          .select('*')
          .eq('id', id)
          .single()
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la chaîne ${id}:`, error);
      throw new AppError('Chaîne non trouvée', 404);
    }
  }
  
  /**
   * Crée une nouvelle chaîne
   * @param {Object} channelData - Données de la chaîne
   * @returns {Object} Chaîne créée
   */
  async createChannel(channelData) {
    try {
      return await executeSupabaseQuery(() => 
        supabase
          .from('channels')
          .insert([channelData])
          .select()
          .single()
      );
    } catch (error) {
      logger.error('Erreur lors de la création de la chaîne:', error);
      throw new AppError('Erreur lors de la création de la chaîne', 500);
    }
  }
  
  /**
   * Met à jour une chaîne
   * @param {number} id - ID de la chaîne
   * @param {Object} channelData - Données à mettre à jour
   * @returns {Object} Chaîne mise à jour
   */
  async updateChannel(id, channelData) {
    try {
      // Vérifier si la chaîne existe
      const channel = await this.getChannelById(id);
      
      if (!channel) {
        throw new AppError('Chaîne non trouvée', 404);
      }
      
      // Mettre à jour la chaîne
      return await executeSupabaseQuery(() => 
        supabase
          .from('channels')
          .update({
            ...channelData,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()
      );
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Erreur lors de la mise à jour de la chaîne ${id}:`, error);
      throw new AppError('Erreur lors de la mise à jour de la chaîne', 500);
    }
  }
  
  /**
   * Supprime une chaîne
   * @param {number} id - ID de la chaîne
   * @returns {boolean} Succès de l'opération
   */
  async deleteChannel(id) {
    try {
      // Vérifier si la chaîne existe
      const channel = await this.getChannelById(id);
      
      if (!channel) {
        throw new AppError('Chaîne non trouvée', 404);
      }
      
      // Vérifier si la chaîne a des diffusions associées
      const { count, error: countError } = await supabase
        .from('airplay_logs')
        .select('*', { count: 'exact' })
        .eq('channel_id', id)
        .limit(1);
        
      if (countError) {
        logger.error(`Erreur lors de la vérification des diffusions pour la chaîne ${id}:`, countError);
        throw new AppError('Erreur lors de la suppression de la chaîne', 500);
      }
      
      if (count > 0) {
        throw new AppError('Impossible de supprimer cette chaîne car elle a des diffusions associées', 400);
      }
      
      // Supprimer la chaîne
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);
        
      if (error) {
        logger.error(`Erreur lors de la suppression de la chaîne ${id}:`, error);
        throw new AppError('Erreur lors de la suppression de la chaîne', 500);
      }
      
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Erreur non gérée lors de la suppression de la chaîne ${id}:`, error);
      throw new AppError('Erreur lors de la suppression de la chaîne', 500);
    }
  }
  
  /**
   * Importe des stations radio depuis l'API RadioBrowser
   * @param {boolean} overwrite - Écraser les stations existantes
   * @returns {Object} Résultat de l'importation
   */
  async importRadioStations(overwrite = false) {
    try {
      // Utiliser le serveur recommandé par RadioBrowser (meilleure pratique)
      const serversResponse = await axios.get('https://all.api.radio-browser.info/json/servers');
      if (!serversResponse.data || !Array.isArray(serversResponse.data) || serversResponse.data.length === 0) {
        throw new AppError('Impossible de récupérer les serveurs RadioBrowser', 500);
      }
      
      // Utiliser le premier serveur disponible (généralement le plus rapide)
      const randomServer = serversResponse.data[0].name;
      logger.info(`Utilisation du serveur RadioBrowser: ${randomServer}`);
      
      // Récupérer les stations radio du Sénégal depuis l'API RadioBrowser
      // Utiliser l'API avancée pour obtenir plus de détails
      const response = await axios.get(`https://${randomServer}/json/stations/bycountry/senegal`, {
        params: {
          hidebroken: true,  // Ignorer les stations en panne
          order: 'clickcount', // Trier par popularité
          reverse: true,     // Ordre décroissant
          limit: 100         // Limiter à 100 stations
        }
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new AppError('Erreur lors de la récupération des stations depuis RadioBrowser', 500);
      }
      
      const stations = response.data;
      
      logger.info(`${stations.length} stations sénégalaises trouvées sur RadioBrowser`);
      
      const importResults = {
        imported: 0,
        skipped: 0,
        errors: 0
      };
      
      // Traiter chaque station
      for (const station of stations) {
        try {
          // Vérifier si la station existe déjà
          const { data: existingStations, error: checkError } = await supabase
            .from('channels')
            .select('id')
            .eq('name', station.name)
            .eq('type', 'radio');
            
          if (checkError) {
            logger.error(`Erreur lors de la vérification de la station ${station.name}:`, checkError);
            importResults.errors++;
            continue;
          }
          
          // Si la station existe et qu'on ne veut pas écraser, passer à la suivante
          if (existingStations.length > 0 && !overwrite) {
            logger.info(`Station ${station.name} déjà existante, ignorée`);
            importResults.skipped++;
            continue;
          }
          
          // Extraire les langues (si disponibles)
          const languages = station.language ? station.language.split(',').map(l => l.trim()).join(', ') : 'Français';
          
          // Extraire les tags (si disponibles)
          const tags = station.tags ? station.tags.split(',').map(t => t.trim()) : [];
          
          // Préparer les données de la station avec plus de métadonnées
          const stationData = {
            name: station.name,
            type: 'radio',
            url: station.url_resolved || station.url, // Utiliser l'URL résolue si disponible
            logo_url: station.favicon || null,
            country: 'Sénégal',
            language: languages,
            status: 'active',
            description: station.tags || '',
            bitrate: station.bitrate ? parseInt(station.bitrate, 10) : null,
            codec: station.codec || null,
            homepage: station.homepage || null,
            metadata: {
              radiobrowser_id: station.stationuuid,
              click_count: station.clickcount,
              vote_count: station.votes,
              tags: tags,
              geo_lat: station.geo_lat,
              geo_long: station.geo_long
            },
            updated_at: new Date().toISOString()
          };
          
          // Insérer ou mettre à jour la station
          if (existingStations.length > 0 && overwrite) {
            const { error: updateError } = await supabase
              .from('channels')
              .update(stationData)
              .eq('id', existingStations[0].id);
              
            if (updateError) {
              logger.error(`Erreur lors de la mise à jour de la station ${station.name}:`, updateError);
              importResults.errors++;
              continue;
            }
            
            logger.info(`Station ${station.name} mise à jour avec succès`);
            importResults.imported++;
          } else {
            const { error: insertError } = await supabase
              .from('channels')
              .insert([stationData]);
              
            if (insertError) {
              logger.error(`Erreur lors de l'insertion de la station ${station.name}:`, insertError);
              importResults.errors++;
              continue;
            }
            
            logger.info(`Station ${station.name} importée avec succès`);
            importResults.imported++;
          }
        } catch (stationError) {
          logger.error(`Erreur lors du traitement de la station ${station.name}:`, stationError);
          importResults.errors++;
        }
      }
      
      return importResults;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erreur non gérée lors de l\'importation des stations radio:', error);
      throw new AppError('Erreur lors de l\'importation des stations radio', 500);
    }
  }
  
  /**
   * Teste la disponibilité d'une chaîne
   * @param {number} id - ID de la chaîne
   * @returns {Object} Résultat du test
   */
  async testChannelAvailability(id) {
    try {
      // Récupérer la chaîne
      const channel = await this.getChannelById(id);
      
      if (!channel) {
        throw new AppError('Chaîne non trouvée', 404);
      }
      
      let isAvailable = false;
      let statusCode = null;
      let responseTime = null;
      
      try {
        // Mesurer le temps de réponse
        const startTime = Date.now();
        
        // Tester l'URL avec un timeout de 5 secondes
        const response = await axios.head(channel.url, {
          timeout: 5000,
          validateStatus: () => true // Accepter tous les codes d'état
        });
        
        const endTime = Date.now();
        responseTime = endTime - startTime;
        
        statusCode = response.status;
        isAvailable = response.status >= 200 && response.status < 400;
      } catch (testError) {
        logger.warn(`Erreur lors du test de la chaîne ${channel.name}:`, testError.message);
        isAvailable = false;
        statusCode = testError.response?.status || null;
      }
      
      // Enregistrer le résultat du test dans la base de données
      const currentTime = new Date().toISOString();
      
      await supabase
        .from('channels')
        .update({
          last_check_status: isAvailable,
          last_check_time: currentTime,
          updated_at: currentTime
        })
        .eq('id', id);
      
      return {
        id: channel.id,
        name: channel.name,
        url: channel.url,
        isAvailable,
        statusCode,
        responseTime,
        testedAt: currentTime
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Erreur non gérée lors du test de la chaîne ${id}:`, error);
      throw new AppError('Erreur lors du test de la chaîne', 500);
    }
  }
}

// Exporter une instance du service
module.exports = new ChannelService(); 