/**
 * Mock du module @supabase/supabase-js
 * Ce mock est conçu pour être utilisé automatiquement par Jest
 * lorsque les tests importent @supabase/supabase-js
 */

// Mock basique des réponses
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

// Fonctions de mock pour l'authentification
const authMock = {
  signUp: jest.fn(({ email, password, options }) => {
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
  
  signInWithPassword: jest.fn(({ email, password }) => {
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
  
  signOut: jest.fn(() => {
    return Promise.resolve({ error: null });
  }),
  
  getUser: jest.fn(() => {
    return Promise.resolve({
      data: {
        user: mockUser
      },
      error: null
    });
  }),
  
  getSession: jest.fn(() => {
    return Promise.resolve({
      data: {
        session: mockSession
      },
      error: null
    });
  }),
  
  resetPasswordForEmail: jest.fn((email, options) => {
    return Promise.resolve({ error: null });
  }),
  
  updateUser: jest.fn((updates) => {
    return Promise.resolve({
      data: { user: { id: 'user-123' } },
      error: null
    });
  })
};

// Mock pour supabase.from() et les opérations de base de données
const createQueryBuilder = () => {
  const queryBuilder = {
    select: jest.fn(() => queryBuilder),
    eq: jest.fn(() => queryBuilder),
    in: jest.fn(() => queryBuilder),
    gte: jest.fn(() => queryBuilder),
    lte: jest.fn(() => queryBuilder),
    ilike: jest.fn(() => queryBuilder),
    order: jest.fn(() => queryBuilder),
    range: jest.fn(() => queryBuilder),
    limit: jest.fn(() => queryBuilder),
    or: jest.fn(() => queryBuilder),
    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    count: jest.fn(() => Promise.resolve({ data: 0, error: null })),
    group: jest.fn(() => queryBuilder),
    update: jest.fn(() => queryBuilder),
    insert: jest.fn(() => {
      return {
        select: jest.fn(() => {
          return {
            single: jest.fn(() => Promise.resolve({ data: { id: 'mock-id' }, error: null }))
          };
        })
      };
    }),
    delete: jest.fn(() => {
      return {
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      };
    }),
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null }))
  };
  return queryBuilder;
};

// Mock du client Supabase
const mockClient = {
  auth: authMock,
  from: jest.fn(() => createQueryBuilder()),
  storage: {
    from: jest.fn(() => {
      return {
        upload: jest.fn(() => Promise.resolve({ data: { path: 'path/to/file' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/test.pdf' }, error: null })),
        remove: jest.fn(() => Promise.resolve({ data: null, error: null }))
      };
    })
  }
};

// Fonction createClient mockée
const createClient = jest.fn(() => mockClient);

module.exports = {
  createClient
}; 