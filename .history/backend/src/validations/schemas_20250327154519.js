const Joi = require('joi');

/**
 * Schémas de validation pour les différentes entités de l'application
 */
const schemas = {
  /**
   * Schéma de validation pour l'enregistrement d'un utilisateur
   */
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'L\'email doit être une adresse email valide',
      'string.empty': 'L\'email est obligatoire',
      'any.required': 'L\'email est obligatoire'
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.empty': 'Le mot de passe est obligatoire',
      'any.required': 'Le mot de passe est obligatoire'
    }),
    full_name: Joi.string().required().messages({
      'string.empty': 'Le nom complet est obligatoire',
      'any.required': 'Le nom complet est obligatoire'
    }),
    organization: Joi.string().required().messages({
      'string.empty': 'L\'organisation est obligatoire',
      'any.required': 'L\'organisation est obligatoire'
    })
  }),

  /**
   * Schéma de validation pour la connexion d'un utilisateur
   */
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'L\'email doit être une adresse email valide',
      'string.empty': 'L\'email est obligatoire',
      'any.required': 'L\'email est obligatoire'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Le mot de passe est obligatoire',
      'any.required': 'Le mot de passe est obligatoire'
    })
  }),

  /**
   * Schéma de validation pour la mise à jour du profil utilisateur
   */
  profile: Joi.object({
    full_name: Joi.string().required().messages({
      'string.empty': 'Le nom complet est obligatoire',
      'any.required': 'Le nom complet est obligatoire'
    }),
    organization: Joi.string().required().messages({
      'string.empty': 'L\'organisation est obligatoire',
      'any.required': 'L\'organisation est obligatoire'
    }),
    avatar_url: Joi.string().uri().allow('', null).messages({
      'string.uri': 'L\'URL de l\'avatar doit être une URL valide'
    })
  }),

  /**
   * Schéma de validation pour la réinitialisation du mot de passe
   */
  resetPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'L\'email doit être une adresse email valide',
      'string.empty': 'L\'email est obligatoire',
      'any.required': 'L\'email est obligatoire'
    })
  }),

  /**
   * Schéma de validation pour la mise à jour du mot de passe
   */
  updatePassword: Joi.object({
    password: Joi.string().min(8).required().messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.empty': 'Le mot de passe est obligatoire',
      'any.required': 'Le mot de passe est obligatoire'
    })
  }),

  /**
   * Schéma de validation pour les chaînes
   */
  channel: Joi.object({
    name: Joi.string().required().messages({
      'string.empty': 'Le nom de la chaîne est obligatoire',
      'any.required': 'Le nom de la chaîne est obligatoire'
    }),
    type: Joi.string().valid('radio', 'tv').required().messages({
      'string.empty': 'Le type de chaîne est obligatoire',
      'any.required': 'Le type de chaîne est obligatoire',
      'any.only': 'Le type de chaîne doit être "radio" ou "tv"'
    }),
    url: Joi.string().uri().required().messages({
      'string.uri': 'L\'URL de streaming doit être une URL valide',
      'string.empty': 'L\'URL de streaming est obligatoire',
      'any.required': 'L\'URL de streaming est obligatoire'
    }),
    logo_url: Joi.string().uri().allow('', null).messages({
      'string.uri': 'L\'URL du logo doit être une URL valide'
    }),
    description: Joi.string().allow('', null),
    country: Joi.string().allow('', null),
    language: Joi.string().allow('', null),
    tags: Joi.array().items(Joi.string()).allow(null),
    active: Joi.boolean().default(true)
  }),

  /**
   * Schéma de validation pour l'identification de chanson
   */
  identify: Joi.object({
    channel_id: Joi.string().required().messages({
      'string.empty': 'L\'ID de la chaîne est obligatoire',
      'any.required': 'L\'ID de la chaîne est obligatoire'
    }),
    audio_sample: Joi.string().required().messages({
      'string.empty': 'L\'échantillon audio est obligatoire',
      'any.required': 'L\'échantillon audio est obligatoire'
    })
  }),

  /**
   * Schéma de validation pour la correction manuelle d'une détection
   */
  correction: Joi.object({
    song_id: Joi.string().required().messages({
      'string.empty': 'L\'ID de la chanson est obligatoire',
      'any.required': 'L\'ID de la chanson est obligatoire'
    })
  }),

  /**
   * Schéma de validation pour la génération de rapport
   */
  report: Joi.object({
    name: Joi.string().required().messages({
      'string.empty': 'Le nom du rapport est obligatoire',
      'any.required': 'Le nom du rapport est obligatoire'
    }),
    type: Joi.string().valid('daily', 'weekly', 'monthly', 'custom').required().messages({
      'string.empty': 'Le type de rapport est obligatoire',
      'any.required': 'Le type de rapport est obligatoire',
      'any.only': 'Le type de rapport doit être "daily", "weekly", "monthly" ou "custom"'
    }),
    parameters: Joi.object({
      start_date: Joi.date().iso().when('type', {
        is: 'custom',
        then: Joi.required(),
        otherwise: Joi.optional()
      }).messages({
        'date.format': 'La date de début doit être au format ISO',
        'any.required': 'La date de début est obligatoire pour un rapport personnalisé'
      }),
      end_date: Joi.date().iso().when('type', {
        is: 'custom',
        then: Joi.required(),
        otherwise: Joi.optional()
      }).messages({
        'date.format': 'La date de fin doit être au format ISO',
        'any.required': 'La date de fin est obligatoire pour un rapport personnalisé'
      }),
      channel_ids: Joi.array().items(Joi.string()).allow(null)
    }).required().messages({
      'any.required': 'Les paramètres du rapport sont obligatoires'
    })
  }),

  /**
   * Schéma de validation pour les chansons
   */
  song: Joi.object({
    title: Joi.string().required().messages({
      'string.empty': 'Le titre de la chanson est obligatoire',
      'any.required': 'Le titre de la chanson est obligatoire'
    }),
    artist: Joi.string().required().messages({
      'string.empty': 'L\'artiste est obligatoire',
      'any.required': 'L\'artiste est obligatoire'
    }),
    album: Joi.string().allow('', null),
    release_year: Joi.number().integer().min(1900).max(new Date().getFullYear()).allow(null).messages({
      'number.base': 'L\'année de sortie doit être un nombre',
      'number.integer': 'L\'année de sortie doit être un nombre entier',
      'number.min': 'L\'année de sortie doit être supérieure à 1900',
      'number.max': 'L\'année de sortie ne peut pas être dans le futur'
    }),
    duration: Joi.number().positive().allow(null).messages({
      'number.base': 'La durée doit être un nombre',
      'number.positive': 'La durée doit être positive'
    }),
    genre: Joi.string().allow('', null),
    isrc: Joi.string().allow('', null),
    cover_url: Joi.string().uri().allow('', null).messages({
      'string.uri': 'L\'URL de la pochette doit être une URL valide'
    }),
    acoustid: Joi.string().allow('', null),
    metadata: Joi.object().allow(null)
  }),

  /**
   * Schéma de validation pour les clés API
   */
  apiKey: Joi.object({
    name: Joi.string().required().messages({
      'string.empty': 'Le nom de la clé API est obligatoire',
      'any.required': 'Le nom de la clé API est obligatoire'
    }),
    permissions: Joi.array().items(
      Joi.string().valid('read', 'write', 'identify')
    ).min(1).required().messages({
      'array.min': 'Au moins une permission est requise',
      'any.required': 'Les permissions sont obligatoires'
    }),
    expires_at: Joi.date().iso().allow(null).messages({
      'date.format': 'La date d\'expiration doit être au format ISO'
    })
  })
};

module.exports = {
  schemas
}; 