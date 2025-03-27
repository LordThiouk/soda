const { supabase, executeSupabaseQuery } = require('../utils/supabase');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Service pour la gestion des clés API
 */
class ApiKeyService {
  /**
   * Génère une clé API unique
   * @returns {string} Clé API générée
   */
  generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Récupère toutes les clés API d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Array} Liste des clés API
   */
  async getAllApiKeys(userId) {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, permissions, created_at, expires_at, last_used_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        logger.error(`Erreur lors de la récupération des clés API pour l'utilisateur ${userId}:`, error);
        throw new AppError('Erreur lors de la récupération des clés API', 500);
      }
      
      return data.map(key => ({
        ...key,
        key: `${key.key_prefix}...`  // Ne jamais renvoyer la clé complète
      }));
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Erreur non gérée lors de la récupération des clés API:`, error);
      throw new AppError('Erreur lors de la récupération des clés API', 500);
    }
  }
  
  /**
   * Crée une nouvelle clé API
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} apiKeyData - Données de la clé API
   * @returns {Object} Clé API créée
   */
  async createApiKey(userId, apiKeyData) {
    try {
      // Générer la clé API
      const apiKey = this.generateApiKey();
      const keyPrefix = apiKey.substring(0, 8);
      
      // Créer la clé API dans la base de données
      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          user_id: userId,
          name: apiKeyData.name,
          key: apiKey,
          key_prefix: keyPrefix,
          permissions: apiKeyData.permissions,
          expires_at: apiKeyData.expires_at || null,
          created_at: new Date().toISOString()
        }])
        .select('id, name, key_prefix, permissions, created_at, expires_at')
        .single();
      
      if (error) {
        logger.error('Erreur lors de la création de la clé API:', error);
        throw new AppError('Erreur lors de la création de la clé API', 500);
      }
      
      // Renvoyer la clé complète une seule fois lors de la création
      // C'est la seule fois où la clé complète est renvoyée au client
      return {
        ...data,
        key: apiKey
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erreur non gérée lors de la création de la clé API:', error);
      throw new AppError('Erreur lors de la création de la clé API', 500);
    }
  }
  
  /**
   * Vérifie une clé API
   * @param {string} apiKey - Clé API à vérifier
   * @param {Array} requiredPermissions - Permissions requises
   * @returns {Object} Informations sur la clé API et l'utilisateur associé
   */
  async verifyApiKey(apiKey, requiredPermissions = []) {
    try {
      // Rechercher la clé API
      const { data: keyData, error: keyError } = await supabase
        .from('api_keys')
        .select(`
          id, user_id, permissions, expires_at,
          users (id, email, full_name, role)
        `)
        .eq('key', apiKey)
        .single();
      
      if (keyError || !keyData) {
        logger.warn('Tentative d\'accès avec une clé API invalide');
        throw new AppError('Clé API invalide', 401);
      }
      
      // Vérifier si la clé a expiré
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        logger.warn(`Tentative d'accès avec une clé API expirée (ID: ${keyData.id})`);
        throw new AppError('Clé API expirée', 401);
      }
      
      // Vérifier les permissions
      if (requiredPermissions.length > 0) {
        const hasRequiredPermissions = requiredPermissions.every(
          permission => keyData.permissions.includes(permission)
        );
        
        if (!hasRequiredPermissions) {
          logger.warn(`Tentative d'accès avec des permissions insuffisantes (ID: ${keyData.id})`);
          throw new AppError('Permissions insuffisantes', 403);
        }
      }
      
      // Mettre à jour la date de dernière utilisation
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', keyData.id);
      
      // Renvoyer les informations de la clé et de l'utilisateur
      return {
        apiKey: {
          id: keyData.id,
          permissions: keyData.permissions
        },
        user: keyData.users
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Erreur non gérée lors de la vérification de la clé API:', error);
      throw new AppError('Erreur lors de la vérification de la clé API', 500);
    }
  }
  
  /**
   * Supprime une clé API
   * @param {string} userId - ID de l'utilisateur
   * @param {string} keyId - ID de la clé API
   * @returns {boolean} Succès de l'opération
   */
  async deleteApiKey(userId, keyId) {
    try {
      // Vérifier si la clé appartient à l'utilisateur
      const { data: keyData, error: keyError } = await supabase
        .from('api_keys')
        .select('id')
        .eq('id', keyId)
        .eq('user_id', userId)
        .single();
      
      if (keyError || !keyData) {
        throw new AppError('Clé API non trouvée ou non autorisée', 404);
      }
      
      // Supprimer la clé API
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);
      
      if (error) {
        logger.error(`Erreur lors de la suppression de la clé API ${keyId}:`, error);
        throw new AppError('Erreur lors de la suppression de la clé API', 500);
      }
      
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Erreur non gérée lors de la suppression de la clé API ${keyId}:`, error);
      throw new AppError('Erreur lors de la suppression de la clé API', 500);
    }
  }
}

// Exporter une instance du service
module.exports = new ApiKeyService(); 