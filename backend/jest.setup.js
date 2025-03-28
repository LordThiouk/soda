// Mock des variables d'environnement
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SUPABASE_URL = 'https://fake-supabase-url.supabase.co';
process.env.SUPABASE_KEY = 'fake-supabase-key';
process.env.API_URL = 'http://localhost:5000';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.ACOUSTID_API_KEY = 'fake-acoustid-key';
process.env.AUDD_API_KEY = 'fake-audd-key';
process.env.PORT = '5000';

// Augmenter le timeout pour les tests d'intégration
jest.setTimeout(30000);

// Supprimer les avertissements liés à Supabase et aux messages dépréciés
console.warn = jest.fn();
console.error = jest.fn();

// Créer un mock global pour fetch
global.fetch = jest.fn();

// Fonction pour créer un token JWT pour les tests
global.createTestToken = (role = 'user', userId = 'test-user-id') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { 
      id: userId, 
      email: 'user@example.com',
      role: role
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Mock de Supabase pour les tests
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => {
      // Mock pour l'authentification
      const auth = {
        signUp: jest.fn(({ email, password, options }) => {
          // Vérifier si l'email est fourni
          if (!email) {
            return Promise.resolve({
              data: null,
              error: {
                message: 'Email is required',
                status: 400
              }
            });
          }

          // Vérifier si le mot de passe est fourni
          if (!password) {
            return Promise.resolve({
              data: null,
              error: {
                message: 'Password is required',
                status: 400
              }
            });
          }

          // Cas spécial pour simuler un email déjà enregistré
          if (email === 'existing@example.com') {
            return Promise.resolve({
              data: null,
              error: {
                message: 'User already registered',
                status: 409
              }
            });
          }

          // Récupérer les données supplémentaires de l'utilisateur depuis options
          const userData = options?.data || {};

          return Promise.resolve({
            data: {
              user: {
                id: 'mock-id',
                email: email,
                full_name: userData.full_name || 'Test User',
                role: 'user'
              },
              session: {
                access_token: 'mock-token',
                expires_at: new Date(Date.now() + 3600000).toISOString()
              }
            },
            error: null
          });
        }),

        signInWithPassword: jest.fn(({ email, password }) => {
          // Vérifier si l'email est fourni
          if (!email || !password) {
            return Promise.resolve({
              data: null,
              error: {
                message: 'Email and password are required',
                status: 400
              }
            });
          }

          // Simuler des informations d'identification invalides
          if (password === 'wrongpassword') {
            return Promise.resolve({
              data: null,
              error: {
                message: 'Invalid login credentials',
                status: 401
              }
            });
          }

          return Promise.resolve({
            data: {
              user: {
                id: 'mock-id',
                email: email,
                full_name: 'Test User',
                role: 'user'
              },
              session: {
                access_token: 'mock-token',
                expires_at: new Date(Date.now() + 3600000).toISOString()
              }
            },
            error: null
          });
        }),

        signOut: jest.fn(() => {
          return Promise.resolve({
            error: null
          });
        }),

        getUser: jest.fn(() => {
          // Simuler un utilisateur authentifié
          return Promise.resolve({
            data: {
              user: {
                id: 'mock-id',
                email: 'user@example.com',
                role: 'user'
              }
            },
            error: null
          });
        }),

        getSession: jest.fn(() => {
          // Simuler une session active
          return Promise.resolve({
            data: {
              session: {
                access_token: 'mock-token',
                user: {
                  id: 'mock-id',
                  email: 'user@example.com',
                  role: 'user'
                }
              }
            },
            error: null
          });
        }),

        resetPasswordForEmail: jest.fn(() => {
          return Promise.resolve({
            data: {},
            error: null
          });
        }),

        updateUser: jest.fn(() => {
          return Promise.resolve({
            data: {
              user: {
                id: 'mock-id',
                email: 'user@example.com',
                role: 'user'
              }
            },
            error: null
          });
        })
      };

      // Créer une fonction qui génère un objet chainable pour les requêtes de base de données
      const createChainableQuery = (defaultData = [], error = null) => {
        // Stocker l'état interne de la requête
        let state = {
          data: defaultData,
          error: error,
          filters: [],
          sorting: [],
          pagination: {},
          selectedFields: '*'
        };
        
        const mockReturn = (value) => Promise.resolve({ data: value, error: state.error });
        
        const chainableObject = {
          // Méthodes de sélection
          select: jest.fn((fields) => {
            state.selectedFields = fields || '*';
            return chainableObject;
          }),
          
          // Méthodes de filtrage
          eq: jest.fn((column, value) => {
            state.filters.push({ type: 'eq', column, value });
            return chainableObject;
          }),
          neq: jest.fn((column, value) => {
            state.filters.push({ type: 'neq', column, value });
            return chainableObject;
          }),
          gt: jest.fn((column, value) => {
            state.filters.push({ type: 'gt', column, value });
            return chainableObject;
          }),
          lt: jest.fn((column, value) => {
            state.filters.push({ type: 'lt', column, value });
            return chainableObject;
          }),
          gte: jest.fn((column, value) => {
            state.filters.push({ type: 'gte', column, value });
            return chainableObject;
          }),
          lte: jest.fn((column, value) => {
            state.filters.push({ type: 'lte', column, value });
            return chainableObject;
          }),
          like: jest.fn((column, value) => {
            state.filters.push({ type: 'like', column, value });
            return chainableObject;
          }),
          ilike: jest.fn((column, value) => {
            state.filters.push({ type: 'ilike', column, value });
            return chainableObject;
          }),
          is: jest.fn((column, value) => {
            state.filters.push({ type: 'is', column, value });
            return chainableObject;
          }),
          in: jest.fn((column, values) => {
            state.filters.push({ type: 'in', column, value: values });
            return chainableObject;
          }),
          contains: jest.fn((column, value) => {
            state.filters.push({ type: 'contains', column, value });
            return chainableObject;
          }),
          containedBy: jest.fn((column, value) => {
            state.filters.push({ type: 'containedBy', column, value });
            return chainableObject;
          }),
          filter: jest.fn((column, operator, value) => {
            state.filters.push({ type: 'filter', column, operator, value });
            return chainableObject;
          }),
          not: jest.fn((column, operator, value) => {
            state.filters.push({ type: 'not', column, operator, value });
            return chainableObject;
          }),
          or: jest.fn((conditions) => {
            state.filters.push({ type: 'or', conditions });
            return chainableObject;
          }),
          match: jest.fn((query) => {
            state.filters.push({ type: 'match', query });
            return chainableObject;
          }),
          
          // Méthodes de tri
          order: jest.fn((column, options) => {
            state.sorting.push({ column, ...options });
            return chainableObject;
          }),
          
          // Méthodes de pagination
          limit: jest.fn((count) => {
            state.pagination.limit = count;
            return chainableObject;
          }),
          range: jest.fn((from, to) => {
            state.pagination.range = { from, to };
            return chainableObject;
          }),
          
          // Méthodes d'exécution
          single: jest.fn(() => {
            // Simuler le retour d'un seul élément
            const item = Array.isArray(state.data) && state.data.length > 0 
              ? state.data[0] 
              : state.data;
            return mockReturn(item);
          }),
          maybeSingle: jest.fn(() => {
            // Similaire à single mais peut retourner null
            const item = Array.isArray(state.data) && state.data.length > 0 
              ? state.data[0] 
              : null;
            return mockReturn(item);
          }),
          
          // Méthodes de manipulation
          insert: jest.fn((items) => {
            // Simuler l'insertion et retourner les éléments insérés
            const insertedItems = Array.isArray(items) ? items : [items];
            
            // Pour simuler les insertions, nous ajoutons simplement des ID si nécessaire
            const itemsWithIds = insertedItems.map(item => ({
              id: item.id || `mock-id-${Math.random().toString(36).substr(2, 9)}`,
              ...item,
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString(),
            }));
            
            state.data = itemsWithIds;
            return chainableObject;
          }),
          update: jest.fn((updates) => {
            // Simuler la mise à jour et retourner les éléments mis à jour
            if (Array.isArray(state.data)) {
              state.data = state.data.map(item => ({
                ...item,
                ...updates,
                updated_at: new Date().toISOString()
              }));
            } else {
              state.data = {
                ...state.data,
                ...updates,
                updated_at: new Date().toISOString()
              };
            }
            return chainableObject;
          }),
          upsert: jest.fn((items) => {
            // Simuler l'upsert (insertion ou mise à jour)
            return chainableObject.insert(items);
          }),
          delete: jest.fn(() => {
            // Simuler la suppression et retourner les éléments supprimés
            const deletedData = state.data;
            state.data = [];
            return mockReturn(deletedData);
          }),
          
          // Pour simuler des requêtes directes
          execute: jest.fn(() => mockReturn(state.data)),
          
          // Support pour les Promises (then, catch, finally)
          then: jest.fn(callback => {
            return Promise.resolve({ data: state.data, error: state.error }).then(callback);
          }),
          catch: jest.fn(callback => {
            return Promise.resolve({ data: state.data, error: state.error }).catch(callback);
          }),
          finally: jest.fn(callback => {
            return Promise.resolve({ data: state.data, error: state.error }).finally(callback);
          }),
          
          // Accès aux données internes pour le débogage
          _state: state
        };
        
        return chainableObject;
      };

      // Mock pour les requêtes de base de données
      const from = jest.fn((tableName) => {
        let mockData;
        
        // Définir des données par défaut selon la table
        if (tableName === 'users') {
          mockData = [{
            id: 'mock-id',
            email: 'user@example.com',
            full_name: 'Test User',
            organization: 'Test Org',
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }];
        } else if (tableName === 'channels') {
          mockData = [
            {
              id: 'channel-1',
              name: 'Radio Sénégal',
              type: 'radio',
              url: 'http://example.com/stream1',
              status: 'active',
              country: 'SN',
              language: 'fr',
              codec: 'mp3',
              bitrate: 128,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_checked: new Date().toISOString()
            },
            {
              id: 'channel-2',
              name: 'TV Sénégal',
              type: 'tv',
              url: 'http://example.com/stream2',
              status: 'active',
              country: 'SN',
              language: 'fr',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_checked: new Date().toISOString()
            }
          ];
        } else if (tableName === 'reports') {
          mockData = [
            {
              id: 'report-1',
              name: 'Rapport mensuel Radio Sénégal',
              type: 'monthly',
              status: 'completed',
              parameters: {
                channel_id: 'channel-1',
                start_date: '2023-01-01',
                end_date: '2023-01-31'
              },
              user_id: 'admin-user-123',
              file_url: 'http://example.com/reports/report-1.pdf',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'report-2',
              name: 'Rapport mensuel TV Sénégal',
              type: 'monthly',
              status: 'pending',
              parameters: {
                channel_id: 'channel-2',
                start_date: '2023-02-01',
                end_date: '2023-02-28'
              },
              user_id: 'user-456',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
        } else if (tableName === 'detections') {
          mockData = [
            {
              id: 'detection-1',
              channel_id: 'channel-1',
              timestamp: new Date().toISOString(),
              song_id: 'song-1',
              confidence: 0.95,
              created_at: new Date().toISOString()
            },
            {
              id: 'detection-2',
              channel_id: 'channel-2',
              timestamp: new Date(Date.now() - 86400000).toISOString(), // Hier
              song_id: 'song-2',
              confidence: 0.87,
              created_at: new Date(Date.now() - 86400000).toISOString()
            }
          ];
        } else if (tableName === 'songs') {
          mockData = [
            {
              id: 'song-1',
              title: 'Chanson Test 1',
              artist: 'Artiste Test 1',
              isrc: 'ABCDE1234567',
              created_at: new Date().toISOString()
            },
            {
              id: 'song-2',
              title: 'Chanson Test 2',
              artist: 'Artiste Test 2',
              isrc: 'FGHIJ8901234',
              created_at: new Date().toISOString()
            }
          ];
        } else {
          mockData = [{ id: `mock-${tableName}-id` }];
        }
        
        return createChainableQuery(mockData);
      });

      return {
        auth,
        from,
        storage: {
          from: jest.fn(() => ({
            upload: jest.fn(() => Promise.resolve({ data: { path: 'file.mp3' }, error: null })),
            getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/file.mp3' } }))
          }))
        },
        rpc: jest.fn(() => Promise.resolve({ data: {}, error: null }))
      };
    })
  };
});

// Mock de la configuration Supabase
jest.mock('./src/config/supabase', () => {
  const mockSupabase = require('@supabase/supabase-js').createClient();
  
  // Fonction pour exécuter les requêtes Supabase et gérer correctement les données/erreurs
  const executeSupabaseQuery = jest.fn(async (operation) => {
    try {
      const result = await operation();
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    } catch (error) {
      throw error;
    }
  });
  
  return {
    supabase: mockSupabase,
    supabaseAdmin: mockSupabase,
    executeSupabaseQuery
  };
});

// Nettoyer les mocks après chaque test
afterEach(() => {
  jest.clearAllMocks();
});

// Restaurer les mocks après tous les tests
afterAll(() => {
  jest.restoreAllMocks();
}); 