const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

/**
 * Configuration Supabase
 * Utilise la version 2.x de Supabase JS Client
 * Cette version utilise auth.signUp et auth.signInWithPassword pour l'authentification
 */

// Informations de connexion
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

// Vérification des variables d'environnement
if (!supabaseUrl || !supabaseKey) {
  logger.error('Les variables d\'environnement SUPABASE_URL et SUPABASE_KEY sont requises');
  process.exit(1);
}

// Client Supabase pour les requêtes authentifiées
const supabase = createClient(supabaseUrl, supabaseKey);

// Client Supabase avec le rôle de service pour les opérations administratives
const supabaseAdmin = supabaseServiceRole 
  ? createClient(supabaseUrl, supabaseServiceRole)
  : null;

if (!supabaseAdmin) {
  logger.warn('La variable d\'environnement SUPABASE_SERVICE_ROLE n\'est pas définie. Les opérations administratives pourraient ne pas fonctionner.');
}

/**
 * Fonction pour effectuer une requête à Supabase et gérer les erreurs
 * @param {function} operation - Fonction qui effectue l'opération sur Supabase
 * @returns {Promise} Résultat de l'opération
 */
const executeSupabaseQuery = async (operation) => {
  try {
    const result = await operation();
    
    if (result.error) {
      logger.error('Erreur Supabase:', result.error);
      throw result.error;
    }
    
    return result.data;
  } catch (error) {
    logger.error('Erreur lors de l\'exécution de la requête Supabase:', error);
    throw error;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  executeSupabaseQuery,
}; 