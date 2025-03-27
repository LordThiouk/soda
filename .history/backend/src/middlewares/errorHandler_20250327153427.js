const logger = require('../utils/logger');

/**
 * Middleware de gestion des erreurs centralisée
 */
const errorHandler = (err, req, res, next) => {
  // Récupération des informations sur l'erreur
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur serveur interne';
  const stack = process.env.NODE_ENV === 'development' ? err.stack : null;
  
  // Log de l'erreur
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (stack) {
    logger.error(stack);
  }
  
  // Réponse au client
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? stack : undefined,
  });
};

/**
 * Classe pour créer des erreurs avec un code HTTP
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware pour capturer les erreurs dans les routes async
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  errorHandler,
  AppError,
  catchAsync,
}; 