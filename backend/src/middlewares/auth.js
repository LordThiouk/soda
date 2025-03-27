const { createClient } = require('@supabase/supabase-js');
const { AppError } = require('./errorHandler');

// Initialisation du client Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Middleware pour vérifier si l'utilisateur est authentifié
 */
const isAuthenticated = async (req, res, next) => {
  // Récupération du token JWT
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Non autorisé. Veuillez vous connecter.', 401));
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Vérifier le token avec Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return next(new AppError('Token invalide ou expiré. Veuillez vous reconnecter.', 401));
    }
    
    // Récupération des informations détaillées de l'utilisateur
    const { data: userDetails, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (userError || !userDetails) {
      return next(new AppError('Utilisateur non trouvé dans la base de données.', 404));
    }
    
    // Ajouter l'utilisateur à la requête
    req.user = {
      ...user,
      ...userDetails
    };
    
    next();
  } catch (error) {
    next(new AppError('Erreur lors de la vérification de l\'authentification.', 500));
  }
};

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 * @param {...string} roles - Les rôles autorisés
 * @returns {function} Middleware
 */
const hasRole = (...roles) => {
  return (req, res, next) => {
    // Vérifier si l'utilisateur a été authentifié
    if (!req.user) {
      return next(new AppError('Non autorisé. Veuillez vous connecter.', 401));
    }
    
    // Vérifier si le rôle de l'utilisateur fait partie des rôles autorisés
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Vous n\'avez pas les permissions nécessaires pour cette action.', 403));
    }
    
    next();
  };
};

/**
 * Middleware pour vérifier la clé API
 */
const checkApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return next(new AppError('Clé API manquante', 401));
  }
  
  try {
    // Vérifier la clé API dans la base de données
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('*, users(*)')
      .eq('key', apiKey)
      .eq('active', true)
      .single();
    
    if (error || !keyData) {
      return next(new AppError('Clé API invalide ou désactivée', 401));
    }
    
    // Vérifier si la clé n'est pas expirée
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return next(new AppError('Clé API expirée', 401));
    }
    
    // Mettre à jour la date de dernière utilisation
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);
    
    // Ajouter les informations de l'utilisateur à la requête
    req.user = keyData.users;
    req.apiKey = {
      id: keyData.id,
      name: keyData.name,
      permissions: keyData.permissions
    };
    
    next();
  } catch (error) {
    next(new AppError('Erreur lors de la vérification de la clé API', 500));
  }
};

module.exports = {
  isAuthenticated,
  hasRole,
  checkApiKey
}; 