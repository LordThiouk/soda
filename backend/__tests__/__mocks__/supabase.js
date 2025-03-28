/**
 * Fichier de mocks pour les tests utilisant Supabase
 */

// Mock de l'objet supabase
const supabase = {
  from: jest.fn(() => {
    return {
      select: jest.fn(() => {
        return {
          eq: jest.fn(() => {
            return {
              single: jest.fn().mockResolvedValue({ data: null, error: null, ok: true }),
              in: jest.fn().mockResolvedValue({ data: [], error: null, ok: true }),
              order: jest.fn(() => {
                return {
                  range: jest.fn().mockResolvedValue({ data: [], error: null, ok: true })
                };
              }),
              range: jest.fn().mockResolvedValue({ data: [], error: null, ok: true })
            };
          }),
          gte: jest.fn(() => {
            return {
              lte: jest.fn(() => {
                return {
                  order: jest.fn(() => {
                    return {
                      range: jest.fn().mockResolvedValue({ data: [], error: null, ok: true })
                    };
                  })
                };
              })
            };
          }),
          lte: jest.fn().mockResolvedValue({ data: [], error: null, ok: true }),
          ilike: jest.fn(() => {
            return {
              order: jest.fn(() => {
                return {
                  range: jest.fn().mockResolvedValue({ data: [], error: null, ok: true })
                };
              })
            };
          }),
          in: jest.fn(() => {
            return {
              order: jest.fn(() => {
                return {
                  range: jest.fn().mockResolvedValue({ data: [], error: null, ok: true })
                };
              })
            };
          }),
          count: jest.fn().mockResolvedValue({ data: 0, error: null, ok: true }),
          order: jest.fn(() => {
            return {
              range: jest.fn().mockResolvedValue({ data: [], error: null, ok: true })
            };
          }),
          range: jest.fn().mockResolvedValue({ data: [], error: null, ok: true }),
          limit: jest.fn().mockResolvedValue({ data: [], error: null, ok: true }),
          or: jest.fn().mockResolvedValue({ data: [], error: null, ok: true }),
          single: jest.fn().mockResolvedValue({ data: null, error: null, ok: true }),
          group: jest.fn().mockReturnThis()
        };
      }),
      insert: jest.fn(() => {
        return {
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null, ok: true })
        };
      }),
      update: jest.fn(() => {
        return {
          eq: jest.fn(() => {
            return {
              select: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null, ok: true })
            };
          }),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null, ok: true })
        };
      }),
      delete: jest.fn(() => {
        return {
          eq: jest.fn().mockResolvedValue({ data: null, error: null, ok: true })
        };
      }),
      rpc: jest.fn().mockResolvedValue({ data: null, error: null, ok: true })
    };
  }),
  auth: {
    // Définir les méthodes d'authentification comme des fonctions mock
    signUp: jest.fn().mockImplementation((params) => {
      return Promise.resolve({
        data: {
          user: {
            id: 'user-123',
            email: params.email,
            user_metadata: params.options?.data || {
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
    
    signInWithPassword: jest.fn().mockImplementation((params) => {
      return Promise.resolve({
        data: {
          user: {
            id: 'user-123',
            email: params.email,
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
          user: {
            id: 'user-123',
            email: 'user@example.com',
            user_metadata: {
              full_name: 'Test User'
            }
          }
        },
        error: null
      });
    }),
    
    getSession: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        data: {
          session: {
            access_token: 'mock-token',
            user: {
              id: 'user-123',
              email: 'user@example.com'
            }
          }
        },
        error: null
      });
    }),
    
    resetPasswordForEmail: jest.fn().mockImplementation((email, options) => {
      return Promise.resolve({ error: null });
    }),
    
    updateUser: jest.fn().mockImplementation((updates) => {
      return Promise.resolve({
        data: { user: { id: 'user-123' } },
        error: null
      });
    })
  },
  storage: {
    from: jest.fn(() => {
      return {
        upload: jest.fn().mockResolvedValue({ data: { path: 'path/to/file' }, error: null, ok: true }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test.pdf' },
          error: null,
          ok: true
        }),
        remove: jest.fn().mockResolvedValue({ data: null, error: null, ok: true })
      };
    })
  }
};

/**
 * Configure un mock pour une chaîne de méthodes Supabase
 * @param {Array} methods - Liste de méthodes appelées dans la chaîne
 * @param {Object} returnValue - Valeur à retourner à la fin de la chaîne
 */
const mockSupabaseReturn = (methods, returnValue) => {
  // Reset previous mocks for the chain
  let currentObject = supabase;
  
  for (let i = 0; i < methods.length; i++) {
    const method = methods[i];
    
    // Make sure the method exists on the current object
    if (typeof currentObject[method] !== 'function') {
      currentObject[method] = jest.fn().mockReturnThis();
    }
    
    // For the last method in the chain, configure it to return our value
    if (i === methods.length - 1) {
      // Ensure that returned value has the 'ok' property
      const enhancedReturnValue = returnValue.ok !== undefined ? 
        returnValue : 
        { ...returnValue, ok: true };
      
      currentObject[method].mockResolvedValue(enhancedReturnValue);
      break;
    }
    
    // For intermediate methods, make sure they return an object that can continue the chain
    const nextObject = {};
    currentObject[method].mockReturnValue(nextObject);
    currentObject = nextObject;
  }
};

// Helper to mock executeSupabaseQuery
const mockExecuteSupabaseQuery = (returnValue) => {
  // Ensure that returned value has the 'ok' property
  const enhancedReturnValue = returnValue.ok !== undefined ? 
    returnValue : 
    { ...returnValue, ok: true };
    
  return jest.fn().mockResolvedValue(enhancedReturnValue);
};

// Exporter les mocks
module.exports = {
  supabase,
  mockSupabaseReturn,
  mockExecuteSupabaseQuery
}; 