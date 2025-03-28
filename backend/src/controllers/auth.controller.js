const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Contrôleur pour les fonctionnalités d'authentification
 */
const authController = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  register: catchAsync(async (req, res) => {
    const result = await authService.register(req.body);
    
    logger.info(`Nouvel utilisateur inscrit: ${result.user.email}`);
    
    res.status(201).json({
      status: 'success',
      message: 'Compte créé avec succès',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.full_name,
          role: result.user.role
        },
        token: result.session.access_token,
        expires_at: result.session.expires_at
      }
    });
  }),
  
  /**
   * Connexion d'un utilisateur
   */
  login: catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    logger.info(`Utilisateur connecté: ${email}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Connexion réussie',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          full_name: result.user.full_name,
          role: result.user.role
        },
        token: result.session.access_token,
        expires_at: result.session.expires_at
      }
    });
  }),
  
  /**
   * Déconnexion
   */
  logout: catchAsync(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    await authService.logout(token);
    
    res.status(200).json({
      status: 'success',
      message: 'Déconnexion réussie'
    });
  }),
  
  /**
   * Récupération du profil utilisateur
   */
  getProfile: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const userProfile = await authService.getUserProfile(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          full_name: userProfile.full_name,
          organization: userProfile.organization,
          role: userProfile.role,
          avatar_url: userProfile.avatar_url,
          created_at: userProfile.created_at
        }
      }
    });
  }),
  
  /**
   * Mise à jour du profil utilisateur
   */
  updateProfile: catchAsync(async (req, res) => {
    const userId = req.user.id;
    const updatedProfile = await authService.updateProfile(userId, req.body);
    
    res.status(200).json({
      status: 'success',
      message: 'Profil mis à jour avec succès',
      data: {
        user: updatedProfile
      }
    });
  }),
  
  /**
   * Réinitialisation du mot de passe
   */
  resetPassword: catchAsync(async (req, res) => {
    const { email } = req.body;
    await authService.resetPassword(email);
    
    res.status(200).json({
      status: 'success',
      message: 'Si l\'adresse email existe, un email de réinitialisation a été envoyé'
    });
  }),
  
  /**
   * Mise à jour du mot de passe
   */
  updatePassword: catchAsync(async (req, res) => {
    const { password } = req.body;
    await authService.updatePassword(password);
    
    res.status(200).json({
      status: 'success',
      message: 'Mot de passe mis à jour avec succès'
    });
  })
};

module.exports = authController; 