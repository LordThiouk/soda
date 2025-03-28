/**
 * Mock du module de validation
 */

// Mock de l'objet schemas avec toutes les validations
const schemas = {
  register: {
    validate: jest.fn().mockReturnValue({ value: {}, error: null })
  },
  login: {
    validate: jest.fn().mockReturnValue({ value: {}, error: null })
  },
  profile: {
    validate: jest.fn().mockReturnValue({ value: {}, error: null })
  },
  resetPassword: {
    validate: jest.fn().mockReturnValue({ value: {}, error: null })
  },
  updatePassword: {
    validate: jest.fn().mockReturnValue({ value: {}, error: null })
  },
  channel: {
    validate: jest.fn().mockReturnValue({ value: {}, error: null })
  },
  identify: {
    validate: jest.fn().mockReturnValue({ value: {}, error: null })
  },
  correction: {
    validate: jest.fn().mockReturnValue({ value: {}, error: null })
  },
  report: {
    validate: jest.fn().mockReturnValue({ value: {}, error: null })
  },
  song: {
    validate: jest.fn().mockReturnValue({ value: {}, error: null })
  },
  apiKey: {
    validate: jest.fn().mockReturnValue({ value: {}, error: null })
  }
};

// Mock de la fonction validate (middleware)
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    // Simuler une validation réussie et passer à la suite
    next();
  };
};

module.exports = {
  validate,
  schemas
}; 