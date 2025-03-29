const { supabase, executeSupabaseQuery } = require('../config/supabase');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const { eventEmitter, EVENT_TYPES } = require('../utils/events');

/**
 * Service pour la gestion des rapports
 */
class ReportService {
  /**
   * Récupère tous les rapports avec pagination
   * @param {number} page - Numéro de la page
   * @param {number} limit - Nombre d'éléments par page
   * @returns {Object} Rapports paginés
   */
  async getAllReports(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // Requête de base
      let query = supabase
        .from('reports')
        .select(`
          *,
          users:generated_by (id, email, full_name)
        `, { count: 'exact' });
      
      // Ajouter la pagination et le tri
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      // Exécuter la requête
      const { data, count, error } = await query;
      
      if (error) {
        logger.error('Erreur lors de la récupération des rapports:', error);
        throw new AppError('Erreur lors de la récupération des rapports', 500);
      }
      
      // Calculer le nombre total de pages
      const totalPages = Math.ceil(count / limit);
      
      return {
        data,
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
      logger.error('Erreur non gérée lors de la récupération des rapports:', error);
      throw new AppError('Erreur lors de la récupération des rapports', 500);
    }
  }
  
  /**
   * Récupère un rapport par son ID
   * @param {string} id - ID du rapport
   * @returns {Object} Rapport trouvé
   */
  async getReportById(id) {
    try {
      const report = await executeSupabaseQuery(() => 
        supabase
          .from('reports')
          .select(`
            *,
            users:generated_by (id, email, full_name)
          `)
          .eq('id', id)
          .single()
      );
      
      if (!report || (report.error && !report.data)) {
        throw new AppError('Rapport non trouvé', 404);
      }
      
      return report.data || report;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Erreur lors de la récupération du rapport ${id}:`, error);
      throw new AppError('Erreur lors de la récupération du rapport', 500);
    }
  }
  
  /**
   * Génère un nouveau rapport
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} reportData - Données du rapport
   * @returns {Object} Rapport créé
   */
  async generateReport(userId, reportData) {
    try {
      const { name, type, parameters } = reportData;
      
      // Créer l'entrée du rapport
      const newReportData = {
        name,
        type,
        parameters,
        status: 'pending',
        generated_by: userId,
        created_at: new Date().toISOString()
      };
      
      // Insérer dans la base de données
      const report = await executeSupabaseQuery(() => 
        supabase
          .from('reports')
          .insert([newReportData])
          .select()
          .single()
      );
      
      logger.info(`Nouveau rapport généré: ${name} (${type}) par l'utilisateur ${userId}`);
      
      // Dans un environnement de production réel, on déclencherait ici un job de génération asynchrone
      // Ici, on simule le processus (à adapter pour l'implémentation réelle)
      this.processReportGeneration(report.id, parameters, userId, name);
      
      return report.data || report;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erreur lors de la génération du rapport:', error);
      throw new AppError('Erreur lors de la génération du rapport', 500);
    }
  }
  
  /**
   * Traite la génération asynchrone d'un rapport (simulation)
   * @param {string} reportId - ID du rapport
   * @param {Object} parameters - Paramètres du rapport
   * @param {string} userId - ID de l'utilisateur
   * @param {string} reportName - Nom du rapport
   */
  async processReportGeneration(reportId, parameters, userId, reportName) {
    // Cette méthode simule la génération asynchrone du rapport
    // Dans une implémentation réelle, cela pourrait être un job de fond
    setTimeout(async () => {
      try {
        // Simuler la génération du rapport
        await supabase
          .from('reports')
          .update({
            status: 'completed',
            file_url: `https://example.com/reports/${reportId}.${parameters.format || 'pdf'}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', reportId);
          
        logger.info(`Rapport ${reportId} généré avec succès`);
        
        // Émettre un événement de rapport généré
        eventEmitter.emit(EVENT_TYPES.REPORT_GENERATED, {
          reportId,
          reportName,
          userId,
          timestamp: new Date().toISOString(),
          format: parameters.format || 'pdf'
        });
      } catch (error) {
        logger.error(`Erreur lors de la génération du rapport ${reportId}:`, error);
        
        await supabase
          .from('reports')
          .update({
            status: 'error'
          })
          .eq('id', reportId);
        
        // Émettre un événement d'échec de génération de rapport
        eventEmitter.emit(EVENT_TYPES.REPORT_FAILED, {
          reportId,
          reportName,
          userId,
          timestamp: new Date().toISOString(),
          error: error.message || 'Erreur lors de la génération du rapport'
        });
      }
    }, 5000); // Simuler un délai de 5 secondes pour la génération
  }
  
  /**
   * Supprime un rapport
   * @param {string} id - ID du rapport
   * @param {string} userId - ID de l'utilisateur
   * @param {string} userRole - Rôle de l'utilisateur
   * @returns {boolean} Succès de l'opération
   */
  async deleteReport(id, userId, userRole) {
    try {
      // Vérifier si le rapport existe et appartient à l'utilisateur
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();
        
      if (reportError || !report) {
        logger.error('Rapport non trouvé:', reportError);
        throw new AppError('Rapport non trouvé', 404);
      }
      
      // Si l'utilisateur n'est pas admin, vérifier qu'il est bien le propriétaire
      if (userRole !== 'admin' && report.generated_by !== userId) {
        throw new AppError('Vous n\'êtes pas autorisé à supprimer ce rapport', 403);
      }
      
      // Supprimer le rapport
      await executeSupabaseQuery(() => 
        supabase
          .from('reports')
          .delete()
          .eq('id', id)
      );
      
      logger.info(`Rapport ${id} supprimé par l'utilisateur ${userId}`);
      
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Erreur lors de la suppression du rapport ${id}:`, error);
      throw new AppError('Erreur lors de la suppression du rapport', 500);
    }
  }
  
  /**
   * Obtient les statistiques pour le tableau de bord
   * @returns {Object} Statistiques du tableau de bord
   */
  async getDashboardStats() {
    try {
      // Nombre total de chansons
      const { count: totalSongs, error: songsError } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true });
        
      if (songsError) {
        logger.error('Erreur lors du comptage des chansons:', songsError);
        throw new AppError('Erreur lors de la récupération des statistiques', 500);
      }
      
      // Nombre total de chaînes actives
      const { count: activeChannels, error: channelsError } = await supabase
        .from('channels')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
        
      if (channelsError) {
        logger.error('Erreur lors du comptage des chaînes:', channelsError);
        throw new AppError('Erreur lors de la récupération des statistiques', 500);
      }
      
      // Nombre total de détections
      const { count: totalDetections, error: detectionsError } = await supabase
        .from('airplay_logs')
        .select('*', { count: 'exact', head: true });
        
      if (detectionsError) {
        logger.error('Erreur lors du comptage des détections:', detectionsError);
        throw new AppError('Erreur lors de la récupération des statistiques', 500);
      }
      
      // Détections des dernières 24 heures
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: last24hDetections, error: last24hError } = await supabase
        .from('airplay_logs')
        .select('*', { count: 'exact', head: true })
        .gte('play_timestamp', yesterday.toISOString());
        
      if (last24hError) {
        logger.error('Erreur lors du comptage des détections récentes:', last24hError);
        throw new AppError('Erreur lors de la récupération des statistiques', 500);
      }
      
      // Top 5 des chaînes avec le plus de détections
      const { data: topChannels, error: topChannelsError } = await supabase
        .from('airplay_logs')
        .select(`
          channels (id, name, type),
          count: count(*)
        `)
        .group('channels.id, channels.name, channels.type')
        .order('count', { ascending: false })
        .limit(5);
        
      if (topChannelsError) {
        logger.error('Erreur lors de la récupération des meilleures chaînes:', topChannelsError);
        throw new AppError('Erreur lors de la récupération des statistiques', 500);
      }
      
      // Top 5 des chansons détectées
      const { data: topSongs, error: topSongsError } = await supabase
        .from('airplay_logs')
        .select(`
          songs (id, title, artist),
          count: count(*)
        `)
        .group('songs.id, songs.title, songs.artist')
        .order('count', { ascending: false })
        .limit(5);
        
      if (topSongsError) {
        logger.error('Erreur lors de la récupération des meilleures chansons:', topSongsError);
        throw new AppError('Erreur lors de la récupération des statistiques', 500);
      }
      
      return {
        summary: {
          totalSongs,
          activeChannels,
          totalDetections,
          last24hDetections
        },
        topChannels,
        topSongs
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erreur non gérée lors de la récupération des statistiques:', error);
      throw new AppError('Erreur lors de la récupération des statistiques', 500);
    }
  }
}

module.exports = new ReportService(); 