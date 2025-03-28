const Joi = require('joi');
const schemas = require('./schemas');
const logger = require('../utils/logger');

/**
 * Middleware de validation pour les requêtes
 * @param {Object} schema - Schéma Joi à utiliser pour la validation
 * @param {string} property - Propriété de la requête à valider (body, params, query)
 * @returns {Function} Middleware Express
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req[property], { 
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        const errorDetails = error.details.map(detail => ({
          message: detail.message,
          path: detail.path.join('.'),
          type: detail.type
        }));
        
        logger.debug(`Validation error: ${JSON.stringify(errorDetails)}`, { 
          service: 'validation',
          path: req.path
        });
        
        return res.status(400).json({
          status: 'error',
          message: 'Validation error',
          errors: errorDetails
        });
      }
      
      // Remplace les données validées dans la requête
      req[property] = value;
      return next();
    } catch (err) {
      logger.error(`Validation middleware error: ${err.message}`, { 
        service: 'validation',
        path: req.path
      });
      return res.status(500).json({
        status: 'error',
        message: 'Internal validation error'
      });
    }
  };
};

module.exports = {
  validate,
  schemas
}; 