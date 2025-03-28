const { supabase, executeSupabaseQuery } = require('../config/supabase');
const reportService = require('../services/report.service');
const detectionService = require('../services/detection.service');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../middlewares/errorHandler');
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
    
    const result = await reportService.getAllReports(page, limit);
    
    res.status(200).json({
      status: 'success',
      data: result.data,
      pagination: result.pagination
    });
  }),
  
  /**
   * Récupère un rapport par son ID
   */
  getReportById: catchAsync(async (req, res) => {
    const { id } = req.params;
    
    const report = await reportService.getReportById(id);
    
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
    const reportData = req.body;
    
    const report = await reportService.generateReport(userId, reportData);
    
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
    const userRole = req.user.role;
    
    await reportService.deleteReport(id, userId, userRole);
    
    res.status(200).json({
      status: 'success',
      message: 'Rapport supprimé avec succès'
    });
  }),
  
  /**
   * Obtient les statistiques générales pour le tableau de bord
   */
  getDashboardStats: catchAsync(async (req, res) => {
    const stats = await reportService.getDashboardStats();
    
    res.status(200).json({
      status: 'success',
      data: stats
    });
  })
};

module.exports = reportController; 