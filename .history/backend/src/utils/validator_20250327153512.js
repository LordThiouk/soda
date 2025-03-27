const Joi = require('joi');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Middleware pour valider les requêtes avec Joi
 * @param {Object} schema - Schéma de validation Joi
 * @param {string} source - Source des données ('body', 'query', 'params')
 * @returns {function} Middleware Express
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(`Erreur de validation: ${message}`, 400));
    }
    
    // Remplacer les données par les données validées
    req[source] = value;
    next();
  };
};

// Schémas de validation courants
const schemas = {
  // Schéma pour l'authentification
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),
  
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    full_name: Joi.string().required(),
    organization: Joi.string().allow('', null)
  }),
  
  // Schéma pour les chansons
  song: Joi.object({
    title: Joi.string().required(),
    artist: Joi.string().required(),
    album: Joi.string().allow('', null),
    isrc: Joi.string().allow('', null),
    fingerprint: Joi.string().allow('', null),
    duration: Joi.number().integer().min(0).allow(null),
    release_year: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null),
    genre: Joi.string().allow('', null),
    album_art_url: Joi.string().uri().allow('', null)
  }),
  
  // Schéma pour les chaînes radio/TV
  channel: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('radio', 'tv').required(),
    url: Joi.string().uri().required(),
    logo_url: Joi.string().uri().allow('', null),
    country: Joi.string().default('Sénégal'),
    language: Joi.string().default('Français'),
    status: Joi.string().valid('active', 'inactive', 'testing').default('active')
  }),
  
  // Schéma pour une détection audio
  detection: Joi.object({
    channel_id: Joi.number().integer().required(),
    audio_sample: Joi.string().required(), // Base64
    timestamp: Joi.date().iso().default(Date.now)
  }),
  
  // Schéma pour les clés API
  apiKey: Joi.object({
    name: Joi.string().required(),
    permissions: Joi.object().default({}),
    expires_at: Joi.date().iso().allow(null)
  }),
  
  // Schéma pour les rapports
  report: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().required(),
    parameters: Joi.object({
      start_date: Joi.date().iso().required(),
      end_date: Joi.date().iso().required(),
      channels: Joi.array().items(Joi.number().integer()).default([]),
      format: Joi.string().valid('csv', 'pdf', 'xlsx').default('pdf')
    }).required()
  }),
};

module.exports = {
  validate,
  schemas
}; 