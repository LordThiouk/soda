const { createClient } = require('@supabase/supabase-js');
const { AppError } = require('./errorHandler');
const catchAsync = require('../utils/catchAsync');

// Initialisation du client Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * Middleware pour vérifier si l'utilisateur est authentifié
 */
const isAuthenticated = catchAsync(async (req, res, next) => {
  // Récupération du token JWT
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Non autorisé. Veuillez vous connecter.', 401));
  }
  
  const token = authHeader.split(' ')[1];
  
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
});

module.exports = isAuthenticated; 