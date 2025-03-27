const { supabase, supabaseAdmin, executeSupabaseQuery } = require('../utils/supabase');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Service d'authentification
 */
class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Object} Utilisateur créé
   */
  async register(userData) {
    const { email, password, full_name, organization } = userData;
    
    try {
      // Création de l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            organization
          }
        }
      });
      
      if (authError) {
        logger.error('Erreur lors de la création du compte:', authError);
        throw new AppError(authError.message, 400);
      }
      
      if (!authData.user) {
        logger.error('Utilisateur non créé', authData);
        throw new AppError('Erreur lors de la création du compte', 500);
      }
      
      // Création des informations utilisateur dans la table utilisateurs
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email,
            full_name,
            organization,
            role: 'user' // Rôle par défaut
          }
        ])
        .select()
        .single();
        
      if (userError) {
        logger.error('Erreur lors de la création des données utilisateur:', userError);
        
        // En cas d'erreur, tenter de supprimer l'utilisateur créé dans Auth
        if (supabaseAdmin) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        }
        
        throw new AppError('Erreur lors de la création du profil utilisateur', 500);
      }
      
      return {
        user: userData,
        session: authData.session
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erreur non gérée lors de l\'inscription:', error);
      throw new AppError('Erreur lors de l\'inscription', 500);
    }
  }
  
  /**
   * Connexion d'un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Object} Informations de session
   */
  async login(email, password) {
    try {
      // Connexion via Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        logger.warn(`Échec de connexion pour ${email}:`, error.message);
        throw new AppError('Email ou mot de passe incorrect', 401);
      }
      
      if (!data.user || !data.session) {
        logger.error('Réponse de connexion invalide', data);
        throw new AppError('Erreur lors de la connexion', 500);
      }
      
      // Récupération des informations détaillées de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (userError) {
        logger.error('Erreur lors de la récupération des données utilisateur:', userError);
        throw new AppError('Erreur lors de la récupération du profil utilisateur', 500);
      }
      
      return {
        user: {
          ...data.user,
          ...userData
        },
        session: data.session
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erreur non gérée lors de la connexion:', error);
      throw new AppError('Erreur lors de la connexion', 500);
    }
  }
  
  /**
   * Déconnexion
   * @param {string} token - Token JWT
   */
  async logout(token) {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Erreur lors de la déconnexion:', error);
        throw new AppError('Erreur lors de la déconnexion', 500);
      }
      
      return true;
    } catch (error) {
      logger.error('Erreur non gérée lors de la déconnexion:', error);
      throw new AppError('Erreur lors de la déconnexion', 500);
    }
  }
  
  /**
   * Récupération des informations de l'utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Object} Informations de l'utilisateur
   */
  async getUserProfile(userId) {
    try {
      return await executeSupabaseQuery(() => 
        supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
      );
    } catch (error) {
      logger.error('Erreur lors de la récupération du profil:', error);
      throw new AppError('Erreur lors de la récupération du profil utilisateur', 500);
    }
  }
  
  /**
   * Réinitialisation du mot de passe
   * @param {string} email - Email de l'utilisateur
   * @returns {boolean} Succès de l'opération
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.PASSWORD_RESET_URL || 'http://localhost:3000/reset-password',
      });
      
      if (error) {
        logger.error('Erreur lors de la réinitialisation du mot de passe:', error);
        throw new AppError('Erreur lors de la réinitialisation du mot de passe', 500);
      }
      
      return true;
    } catch (error) {
      logger.error('Erreur non gérée lors de la réinitialisation du mot de passe:', error);
      throw new AppError('Erreur lors de la réinitialisation du mot de passe', 500);
    }
  }
  
  /**
   * Mise à jour du mot de passe
   * @param {string} userId - ID de l'utilisateur
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {boolean} Succès de l'opération
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        logger.error('Erreur lors de la mise à jour du mot de passe:', error);
        throw new AppError('Erreur lors de la mise à jour du mot de passe', 500);
      }
      
      return true;
    } catch (error) {
      logger.error('Erreur non gérée lors de la mise à jour du mot de passe:', error);
      throw new AppError('Erreur lors de la mise à jour du mot de passe', 500);
    }
  }
  
  /**
   * Mise à jour du profil utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} userData - Données à mettre à jour
   * @returns {Object} Profil mis à jour
   */
  async updateProfile(userId, userData) {
    try {
      // Mise à jour des données utilisateur dans Supabase Auth si nécessaire
      if (userData.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: userData.email
        });
        
        if (authError) {
          logger.error('Erreur lors de la mise à jour de l\'email:', authError);
          throw new AppError('Erreur lors de la mise à jour de l\'email', 500);
        }
      }
      
      // Mise à jour du profil dans la table utilisateurs
      return await executeSupabaseQuery(() => 
        supabase
          .from('users')
          .update({
            full_name: userData.full_name,
            organization: userData.organization,
            avatar_url: userData.avatar_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single()
      );
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil:', error);
      throw new AppError('Erreur lors de la mise à jour du profil utilisateur', 500);
    }
  }
}

// Exporter une instance du service
module.exports = new AuthService(); 