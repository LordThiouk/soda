/**
 * Utilitaires pour faciliter les tests
 */

const jwt = require('jsonwebtoken');

/**
 * Crée un mock complet pour Supabase
 * @returns {Object} Mock de Supabase
 */
const createSupabaseMock = () => {
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    user_metadata: {
      full_name: 'Test User'
    }
  };

  const mockSession = {
    access_token: 'mock-token',
    user: mockUser
  };

  // Mock pour les opérations de base de données
  const createQueryBuilder = () => {
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({ data: [], error: null }),
      limit: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      count: jest.fn().mockResolvedValue({ data: [{ count: 0 }], error: null }),
      group: jest.fn().mockReturnThis(),
      insert: jest.fn().mockImplementation(() => {
        return {
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null })
        };
      }),
      update: jest.fn().mockImplementation(() => {
        return {
          eq: jest.fn().mockImplementation(() => {
            return {
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null })
            };
          })
        };
      }),
      delete: jest.fn().mockImplementation(() => {
        return {
          eq: jest.fn().mockResolvedValue({ data: null, error: null })
        };
      }),
      rpc: jest.fn().mockResolvedValue({ data: null, error: null })
    };
  };

  // Mock pour l'authentification
  const authMock = {
    signUp: jest.fn().mockImplementation(({ email, password, options }) => {
      return Promise.resolve({
        data: {
          user: {
            id: 'user-123',
            email,
            user_metadata: options?.data || {
              full_name: 'Test User'
            }
          },
          session: {
            access_token: 'mock-token'
          }
        },
        error: null
      });
    }),
    
    signInWithPassword: jest.fn().mockImplementation(({ email, password }) => {
      return Promise.resolve({
        data: {
          user: {
            id: 'user-123',
            email,
            user_metadata: {
              full_name: 'Test User'
            }
          },
          session: {
            access_token: 'mock-token'
          }
        },
        error: null
      });
    }),
    
    signOut: jest.fn().mockImplementation(() => {
      return Promise.resolve({ error: null });
    }),
    
    getUser: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        data: {
          user: mockUser
        },
        error: null
      });
    }),
    
    getSession: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        data: {
          session: mockSession
        },
        error: null
      });
    }),
    
    resetPasswordForEmail: jest.fn().mockImplementation((email) => {
      return Promise.resolve({ error: null });
    }),
    
    updateUser: jest.fn().mockImplementation((updates) => {
      return Promise.resolve({
        data: { user: { id: 'user-123' } },
        error: null
      });
    })
  };

  // Mock pour le stockage
  const storageMock = {
    from: jest.fn(() => {
      return {
        upload: jest.fn().mockResolvedValue({ data: { path: 'path/to/file' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.pdf' }, error: null }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null })
      };
    })
  };

  return {
    from: jest.fn(() => createQueryBuilder()),
    auth: authMock,
    storage: storageMock
  };
};

/**
 * Crée un token JWT pour les tests
 * @param {Object} payload - Données à inclure dans le token
 * @returns {string} Token JWT
 */
const createTestToken = (payload = {}) => {
  const defaultPayload = {
    id: 'user-123',
    email: 'user@example.com',
    role: 'user'
  };
  
  return jwt.sign(
    { ...defaultPayload, ...payload },
    process.env.JWT_SECRET || 'test-jwt-secret',
    { expiresIn: '1h' }
  );
};

module.exports = {
  createSupabaseMock,
  createTestToken
}; 