const { AppError } = require('./errorHandler');

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

module.exports = hasRole; 