const { supabase, executeSupabaseQuery } = require('../config/supabase');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Service pour la gestion des chansons
 */
class SongService {
  /**
   * Récupère toutes les chansons avec pagination et filtres
   * @param {number} page - Numéro de page
   * @param {number} limit - Nombre d'éléments par page
   * @param {string} search - Terme de recherche (artiste ou titre)
   * @returns {Object} Liste des chansons avec pagination
   */
  async getAllSongs(page = 1, limit = 20, search = null) {
    try {
      // Calculer l'offset pour la pagination
      const offset = (page - 1) * limit;
      
      // Requête de base
      let query = supabase
        .from('songs')
        .select('*', { count: 'exact' });
      
      // Ajouter la recherche si spécifiée
      if (search) {
        query = query.or(`title.ilike.%${search}%,artist.ilike.%${search}%`);
      }
      
      // Ajouter la pagination et le tri
      query = query
        .order('title')
        .range(offset, offset + limit - 1);
      
      // Exécuter la requête
      const { data, count, error } = await query;
      
      if (error) {
        logger.error('Erreur lors de la récupération des chansons:', error);
        throw new AppError('Erreur lors de la récupération des chansons', 500);
      }
      
      // Calculer le nombre total de pages
      const totalPages = Math.ceil(count / limit);
      
      return {
        songs: data,
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
      logger.error('Erreur non gérée lors de la récupération des chansons:', error);
      throw new AppError('Erreur lors de la récupération des chansons', 500);
    }
  }
  
  /**
   * Récupère une chanson par son ID
   * @param {number} id - ID de la chanson
   * @returns {Object} Chanson trouvée
   */
  async getSongById(id) {
    try {
      return await executeSupabaseQuery(() => 
        supabase
          .from('songs')
          .select('*')
          .eq('id', id)
          .single()
      );
    } catch (error) {
      logger.error(`Erreur lors de la récupération de la chanson ${id}:`, error);
      throw new AppError('Chanson non trouvée', 404);
    }
  }
  
  /**
   * Récupère les diffusions d'une chanson
   * @param {number} id - ID de la chanson
   * @param {number} page - Numéro de page
   * @param {number} limit - Nombre d'éléments par page
   * @returns {Object} Liste des diffusions avec pagination
   */
  async getSongAirplays(id, page = 1, limit = 20) {
    try {
      // Vérifier si la chanson existe
      const song = await this.getSongById(id);
      
      if (!song) {
        throw new AppError('Chanson non trouvée', 404);
      }
      
      // Calculer l'offset pour la pagination
      const offset = (page - 1) * limit;
      
      // Requête pour récupérer les diffusions
      const { data, count, error } = await supabase
        .from('airplay_logs')
        .select(`
          *,
          channels (id, name, type)
        `, { count: 'exact' })
        .eq('song_id', id)
        .order('play_timestamp', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) {
        logger.error(`Erreur lors de la récupération des diffusions pour la chanson ${id}:`, error);
        throw new AppError('Erreur lors de la récupération des diffusions', 500);
      }
      
      // Calculer le nombre total de pages
      const totalPages = Math.ceil(count / limit);
      
      return {
        airplays: data,
        song,
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
      logger.error(`Erreur non gérée lors de la récupération des diffusions pour la chanson ${id}:`, error);
      throw new AppError('Erreur lors de la récupération des diffusions', 500);
    }
  }
  
  /**
   * Crée une nouvelle chanson
   * @param {Object} songData - Données de la chanson
   * @returns {Object} Chanson créée
   */
  async createSong(songData) {
    try {
      return await executeSupabaseQuery(() => 
        supabase
          .from('songs')
          .insert([songData])
          .select()
          .single()
      );
    } catch (error) {
      logger.error('Erreur lors de la création de la chanson:', error);
      throw new AppError('Erreur lors de la création de la chanson', 500);
    }
  }
  
  /**
   * Met à jour une chanson
   * @param {number} id - ID de la chanson
   * @param {Object} songData - Données à mettre à jour
   * @returns {Object} Chanson mise à jour
   */
  async updateSong(id, songData) {
    try {
      // Vérifier si la chanson existe
      const song = await this.getSongById(id);
      
      if (!song) {
        throw new AppError('Chanson non trouvée', 404);
      }
      
      // Mettre à jour la chanson
      return await executeSupabaseQuery(() => 
        supabase
          .from('songs')
          .update({
            ...songData,
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
      logger.error(`Erreur lors de la mise à jour de la chanson ${id}:`, error);
      throw new AppError('Erreur lors de la mise à jour de la chanson', 500);
    }
  }
  
  /**
   * Supprime une chanson
   * @param {number} id - ID de la chanson
   * @returns {boolean} Succès de l'opération
   */
  async deleteSong(id) {
    try {
      // Vérifier si la chanson existe
      const song = await this.getSongById(id);
      
      if (!song) {
        throw new AppError('Chanson non trouvée', 404);
      }
      
      // Vérifier si la chanson a des diffusions associées
      const { count, error: countError } = await supabase
        .from('airplay_logs')
        .select('*', { count: 'exact', head: true })
        .eq('song_id', id);
        
      if (countError) {
        logger.error(`Erreur lors de la vérification des diffusions pour la chanson ${id}:`, countError);
        throw new AppError('Erreur lors de la suppression de la chanson', 500);
      }
      
      if (count > 0) {
        throw new AppError('Impossible de supprimer cette chanson car elle a des diffusions associées', 400);
      }
      
      // Supprimer la chanson
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id);
        
      if (error) {
        logger.error(`Erreur lors de la suppression de la chanson ${id}:`, error);
        throw new AppError('Erreur lors de la suppression de la chanson', 500);
      }
      
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Erreur non gérée lors de la suppression de la chanson ${id}:`, error);
      throw new AppError('Erreur lors de la suppression de la chanson', 500);
    }
  }
  
  /**
   * Recherche des chansons
   * @param {string} query - Terme de recherche
   * @param {number} limit - Nombre maximum de résultats
   * @returns {Array} Liste des chansons trouvées
   */
  async searchSongs(query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        throw new AppError('Le terme de recherche doit contenir au moins 2 caractères', 400);
      }
      
      const cleanQuery = query.trim();
      
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .or(`title.ilike.%${cleanQuery}%,artist.ilike.%${cleanQuery}%`)
        .order('title')
        .limit(limit);
        
      if (error) {
        logger.error(`Erreur lors de la recherche de chansons avec "${cleanQuery}":`, error);
        throw new AppError('Erreur lors de la recherche de chansons', 500);
      }
      
      return data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Erreur non gérée lors de la recherche de chansons:`, error);
      throw new AppError('Erreur lors de la recherche de chansons', 500);
    }
  }
}

// Exporter une instance du service
module.exports = new SongService(); 