const request = require('supertest');
const app = require('../../src/app');
const { supabase, mockSupabaseReturn, mockExecuteSupabaseQuery } = require('../__mocks__/supabase');
const jwt = require('jsonwebtoken');

// Mock des modules
jest.mock('../../src/config/supabase', () => {
  return {
    supabase: require('../__mocks__/supabase').supabase,
    executeSupabaseQuery: jest.fn().mockImplementation(async (query) => {
      try {
        const result = await query();
        if (result && result.data) {
          return result.data;
        }
        return result;
      } catch (error) {
        throw error;
      }
    })
  };
});

// Mock du module de validation
jest.mock('../../src/validations', () => {
  return require('../__mocks__/validation');
});

// Mock du module swagger-jsdoc
jest.mock('swagger-jsdoc', () => require('../__mocks__/swagger-jsdoc'));

describe('Report Integration Tests', () => {
  let agent;
  let adminToken;
  let userToken;

  beforeEach(() => {
    agent = request.agent(app);
    
    // Créer des tokens pour les tests
    adminToken = jwt.sign({
      id: 'admin-user-123',
      email: 'admin@example.com',
      role: 'admin'
    }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    userToken = jwt.sign({
      id: 'regular-user-123',
      email: 'user@example.com',
      role: 'user'
    }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockReports = [
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
      file_url: 'http://example.com/reports/report-1.pdf',
      user_id: 'admin-user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'report-2',
      name: 'Rapport trimestriel RTS 1',
      type: 'quarterly',
      status: 'processing',
      parameters: {
        channel_id: 'channel-2',
        start_date: '2023-01-01',
        end_date: '2023-03-31'
      },
      file_url: null,
      user_id: 'admin-user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  describe('GET /api/reports', () => {
    it('should return list of reports with pagination', async () => {
      // Configurer le mock pour la récupération des rapports
      mockSupabaseReturn(['from', 'select', 'order', 'range'], {
        data: mockReports,
        error: null
      });

      // Configurer le mock pour le comptage
      mockSupabaseReturn(['from', 'select', 'count'], {
        data: [{ count: 2 }],
        error: null
      });

      const response = await agent
        .get('/api/reports')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should handle pagination parameters', async () => {
      // Configurer le mock pour la récupération des rapports avec pagination
      mockSupabaseReturn(['from', 'select', 'order', 'range'], {
        data: [mockReports[0]],  // Juste le premier rapport
        error: null
      });

      // Configurer le mock pour le comptage
      mockSupabaseReturn(['from', 'select', 'count'], {
        data: [{ count: 2 }],
        error: null
      });

      const response = await agent
        .get('/api/reports?page=1&limit=1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 1,
        total: 2,
        pages: 2
      });
    });
  });

  describe('GET /api/reports/:id', () => {
    it('should return a report by id', async () => {
      // Configurer le mock pour la récupération d'un rapport
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: mockReports[0],
        error: null
      });

      const response = await agent
        .get('/api/reports/report-1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'report-1');
      expect(response.body).toHaveProperty('name', 'Rapport mensuel Radio Sénégal');
      expect(response.body).toHaveProperty('type', 'monthly');
      expect(response.body).toHaveProperty('status', 'completed');
    });

    it('should return 404 for non-existent report', async () => {
      // Configurer le mock pour un rapport non trouvé
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: null,
        error: null
      });

      const response = await agent
        .get('/api/reports/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/reports', () => {
    it('should generate a new report', async () => {
      // Configurer le mock pour l'insertion du rapport
      mockSupabaseReturn(['from', 'insert', 'select'], {
        data: [{
          id: 'new-report-123',
          name: 'Nouveau rapport hebdomadaire',
          type: 'weekly',
          status: 'pending',
          parameters: {
            channel_id: 'channel-1',
            start_date: '2023-04-01',
            end_date: '2023-04-07'
          },
          file_url: null,
          user_id: 'admin-user-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        error: null
      });

      const response = await agent
        .post('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Nouveau rapport hebdomadaire',
          type: 'weekly',
          parameters: {
            channel_id: 'channel-1',
            start_date: '2023-04-01',
            end_date: '2023-04-07'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'new-report-123');
      expect(response.body).toHaveProperty('name', 'Nouveau rapport hebdomadaire');
      expect(response.body).toHaveProperty('status', 'pending');
    });

    it('should return 400 for invalid input', async () => {
      const response = await agent
        .post('/api/reports')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Manque le champ "name"
          type: 'weekly',
          parameters: {
            channel_id: 'channel-1',
            start_date: '2023-04-01',
            end_date: '2023-04-07'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await agent
        .post('/api/reports')
        .send({
          name: 'Nouveau rapport hebdomadaire',
          type: 'weekly',
          parameters: {
            channel_id: 'channel-1',
            start_date: '2023-04-01',
            end_date: '2023-04-07'
          }
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/reports/:id', () => {
    it('should delete a report', async () => {
      // Configurer le mock pour la vérification d'existence
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: {
          ...mockReports[0],
          user_id: 'admin-user-123'  // S'assurer que l'utilisateur est le propriétaire
        },
        error: null
      });

      // Configurer le mock pour la suppression
      mockSupabaseReturn(['from', 'delete', 'eq'], {
        data: {},
        error: null
      });

      const response = await agent
        .delete('/api/reports/report-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('supprimé');
    });

    it('should return 404 for non-existent report', async () => {
      // Configurer le mock pour un rapport non trouvé
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: null,
        error: null
      });

      const response = await agent
        .delete('/api/reports/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when user is not the owner or admin', async () => {
      // Configurer le mock pour un rapport dont l'utilisateur n'est pas propriétaire
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: {
          ...mockReports[0],
          user_id: 'different-user-123'  // Utilisateur différent
        },
        error: null
      });

      const response = await agent
        .delete('/api/reports/report-1')
        .set('Authorization', `Bearer ${userToken}`);  // Utilisateur régulier

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/reports/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      // Configurer les mocks pour les différentes statistiques

      // Nombre total de chansons
      mockSupabaseReturn(['from', 'select', 'count'], {
        data: [{ count: 150 }],
        error: null
      });

      // Nombre de chaînes actives
      mockSupabaseReturn(['from', 'select', 'eq', 'count'], {
        data: [{ count: 10 }],
        error: null
      });

      // Nombre de détections
      mockSupabaseReturn(['from', 'select', 'count'], {
        data: [{ count: 500 }],
        error: null
      });

      // Top chaînes
      mockSupabaseReturn(['from', 'select', 'count', 'groupBy', 'order', 'limit'], {
        data: [
          { channel_id: 'channel-1', name: 'Radio Sénégal', count: 150 },
          { channel_id: 'channel-2', name: 'RTS 1', count: 100 }
        ],
        error: null
      });

      // Top chansons
      mockSupabaseReturn(['from', 'select', 'count', 'groupBy', 'order', 'limit'], {
        data: [
          { song_id: 'song-1', title: '7 Seconds', artist: 'Youssou N\'Dour', count: 30 },
          { song_id: 'song-2', title: 'Birima', artist: 'Youssou N\'Dour', count: 25 }
        ],
        error: null
      });

      const response = await agent
        .get('/api/reports/dashboard/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalSongs', 150);
      expect(response.body).toHaveProperty('activeChannels', 10);
      expect(response.body).toHaveProperty('totalDetections', 500);
      expect(response.body).toHaveProperty('topChannels');
      expect(response.body).toHaveProperty('topSongs');
      expect(response.body.topChannels).toHaveLength(2);
      expect(response.body.topSongs).toHaveLength(2);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await agent
        .get('/api/reports/dashboard/stats');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });
}); 