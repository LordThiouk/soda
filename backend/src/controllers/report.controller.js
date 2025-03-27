const { supabase, executeSupabaseQuery } = require('../utils/supabase');
const { catchAsync, AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Contrôleur pour la gestion des rapports
 */
const reportController = {
  /**
   * Récupère tous les rapports avec pagination
   */
  getAllReports: catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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
    
    res.status(200).json({
      status: 'success',
      data: data,
      pagination: {
        total: count,
        page,
        limit,
        totalPages
      }
    });
  }),
  
  /**
   * Récupère un rapport par son ID
   */
  getReportById: catchAsync(async (req, res) => {
    const { id } = req.params;
    
    // Récupérer les détails du rapport
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
    
    res.status(200).json({
      status: 'success',
      data: report
    });
  }),
  
  /**
   * Génère un nouveau rapport
   */
  generateReport: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { name, type, parameters } = req.body;
    
    // Créer l'entrée du rapport
    const reportData = {
      name,
      type,
      parameters,
      status: 'pending',
      generated_by: userId
    };
    
    // Insérer dans la base de données
    const report = await executeSupabaseQuery(() => 
      supabase
        .from('reports')
        .insert([reportData])
        .select()
        .single()
    );
    
    logger.info(`Nouveau rapport généré: ${name} (${type}) par l'utilisateur ${userId}`);
    
    // Dans un environnement de production réel, on déclencherait ici un job de génération asynchrone
    // Pour l'instant, on met à jour le statut pour simuler le processus
    setTimeout(async () => {
      try {
        // Simuler la génération du rapport
        await supabase
          .from('reports')
          .update({
            status: 'completed',
            file_url: `https://example.com/reports/${report.id}.${parameters.format || 'pdf'}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', report.id);
          
        logger.info(`Rapport ${report.id} généré avec succès`);
      } catch (error) {
        logger.error(`Erreur lors de la génération du rapport ${report.id}:`, error);
        
        await supabase
          .from('reports')
          .update({
            status: 'error'
          })
          .eq('id', report.id);
      }
    }, 5000); // Simuler un délai de 5 secondes pour la génération
    
    res.status(201).json({
      status: 'success',
      message: 'Génération de rapport lancée',
      data: {
        id: report.id,
        name: report.name,
        status: report.status
      }
    });
  }),
  
  /**
   * Supprime un rapport
   */
  deleteReport: catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
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
    if (req.user.role !== 'admin' && report.generated_by !== userId) {
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
    
    res.status(200).json({
      status: 'success',
      message: 'Rapport supprimé avec succès'
    });
  }),
  
  /**
   * Obtient les statistiques générales pour le tableau de bord
   */
  getDashboardStats: catchAsync(async (req, res) => {
    const userId = req.user.id;
    
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
    
    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalSongs,
          activeChannels,
          totalDetections,
          last24hDetections
        },
        topChannels,
        topSongs
      }
    });
  })
};

module.exports = reportController; 