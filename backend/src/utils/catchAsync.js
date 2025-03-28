/**
 * Wrapper pour gérer les erreurs asynchrones dans les contrôleurs Express
 * Évite d'avoir try/catch dans chaque fonction de contrôleur
 * @param {Function} fn - Fonction asynchrone à exécuter
 * @returns {Function} - Middleware Express avec gestion des erreurs
 */
const catchAsync = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync; 