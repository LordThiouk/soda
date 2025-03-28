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

// Mock pour l'API RadioBrowser
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({
    data: [
      {
        stationuuid: 'station-1',
        name: 'Radio Sénégal',
        url: 'http://example.com/stream1',
        countrycode: 'SN',
        language: 'french',
        bitrate: 128,
        codec: 'MP3',
        lastcheckok: 1
      },
      {
        stationuuid: 'station-2',
        name: 'RFM Sénégal',
        url: 'http://example.com/stream2',
        countrycode: 'SN',
        language: 'french',
        bitrate: 256,
        codec: 'AAC',
        lastcheckok: 1
      }
    ]
  })
}));

// Mock du module de validation
jest.mock('../../src/validations', () => {
  return require('../__mocks__/validation');
});

// Mock du module swagger-jsdoc
jest.mock('swagger-jsdoc', () => require('../__mocks__/swagger-jsdoc'));

describe('Channel Integration Tests', () => {
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

  const mockChannels = [
    {
      id: 'channel-1',
      name: 'Radio Sénégal',
      url: 'http://example.com/stream1',
      type: 'radio',
      country: 'SN',
      language: 'fr',
      bitrate: 128,
      codec: 'mp3',
      status: 'active',
      last_checked: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'channel-2',
      name: 'RTS 1',
      url: 'http://example.com/stream2',
      type: 'tv',
      country: 'SN',
      language: 'fr',
      status: 'active',
      last_checked: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  describe('GET /api/channels', () => {
    it('should return list of channels with pagination', async () => {
      // Configurer le mock pour la récupération des chaînes
      mockSupabaseReturn(['from', 'select', 'order', 'range'], {
        data: mockChannels,
        error: null
      });

      // Configurer le mock pour le comptage
      mockSupabaseReturn(['from', 'select', 'count'], {
        data: [{ count: 2 }],
        error: null
      });

      const response = await agent
        .get('/api/channels')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter channels by type', async () => {
      // Configurer le mock pour la récupération filtrée
      mockSupabaseReturn(['from', 'select', 'eq', 'order', 'range'], {
        data: [mockChannels[0]],  // Premier canal (radio)
        error: null
      });

      // Configurer le mock pour le comptage
      mockSupabaseReturn(['from', 'select', 'eq', 'count'], {
        data: [{ count: 1 }],
        error: null
      });

      const response = await agent
        .get('/api/channels?type=radio')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('radio');
      expect(response.body.pagination.total).toBe(1);
    });
  });

  describe('GET /api/channels/:id', () => {
    it('should return a channel by id', async () => {
      // Configurer le mock pour la récupération d'une chaîne
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: mockChannels[0],
        error: null
      });

      const response = await agent
        .get('/api/channels/channel-1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'channel-1');
      expect(response.body).toHaveProperty('name', 'Radio Sénégal');
    });

    it('should return 404 for non-existent channel', async () => {
      // Configurer le mock pour une chaîne non trouvée
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: null,
        error: null
      });

      const response = await agent
        .get('/api/channels/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/channels', () => {
    it('should create a new channel when authenticated as admin', async () => {
      // Configurer le mock pour l'insertion d'une chaîne
      mockSupabaseReturn(['from', 'insert', 'select'], {
        data: [{
          id: 'new-channel-123',
          name: 'New Radio',
          url: 'http://example.com/new-stream',
          type: 'radio',
          country: 'SN',
          language: 'fr',
          bitrate: 128,
          codec: 'mp3',
          status: 'inactive',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        error: null
      });

      const response = await agent
        .post('/api/channels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Radio',
          url: 'http://example.com/new-stream',
          type: 'radio',
          country: 'SN',
          language: 'fr'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id', 'new-channel-123');
      expect(response.body).toHaveProperty('name', 'New Radio');
      expect(response.body).toHaveProperty('status', 'inactive');
    });

    it('should return 403 when not authenticated as admin', async () => {
      const response = await agent
        .post('/api/channels')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New Radio',
          url: 'http://example.com/new-stream',
          type: 'radio',
          country: 'SN',
          language: 'fr'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid input', async () => {
      const response = await agent
        .post('/api/channels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Radio',
          // Missing required url field
          type: 'radio'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/channels/:id', () => {
    it('should update a channel when authenticated as admin', async () => {
      // Configurer le mock pour la vérification d'existence
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: mockChannels[0],
        error: null
      });

      // Configurer le mock pour la mise à jour
      mockSupabaseReturn(['from', 'update', 'eq', 'select'], {
        data: [{
          ...mockChannels[0],
          name: 'Updated Radio Name',
          updated_at: new Date().toISOString()
        }],
        error: null
      });

      const response = await agent
        .put('/api/channels/channel-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Radio Name'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Radio Name');
    });

    it('should return 404 for non-existent channel', async () => {
      // Configurer le mock pour une chaîne non trouvée
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: null,
        error: null
      });

      const response = await agent
        .put('/api/channels/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Radio Name'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/channels/:id', () => {
    it('should delete a channel when authenticated as admin', async () => {
      // Configurer le mock pour la vérification d'existence
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: mockChannels[0],
        error: null
      });

      // Configurer le mock pour la suppression
      mockSupabaseReturn(['from', 'delete', 'eq'], {
        data: {},
        error: null
      });

      const response = await agent
        .delete('/api/channels/channel-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when not authenticated as admin', async () => {
      const response = await agent
        .delete('/api/channels/channel-1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/channels/import/radio', () => {
    it('should import radio stations from RadioBrowser API', async () => {
      // Configurer le mock pour l'insertion de stations
      mockSupabaseReturn(['from', 'insert', 'select'], {
        data: [
          {
            id: 'imported-station-1',
            name: 'Radio Sénégal',
            url: 'http://example.com/stream1',
            type: 'radio',
            country: 'SN',
            language: 'fr',
            bitrate: 128,
            codec: 'mp3',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'imported-station-2',
            name: 'RFM Sénégal',
            url: 'http://example.com/stream2',
            type: 'radio',
            country: 'SN',
            language: 'fr',
            bitrate: 256,
            codec: 'aac',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        error: null
      });

      const response = await agent
        .post('/api/channels/import/radio')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          country: 'SN'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('imported');
      expect(response.body).toHaveProperty('stations');
      expect(response.body.stations).toHaveLength(2);
    });

    it('should return 403 when not authenticated as admin', async () => {
      const response = await agent
        .post('/api/channels/import/radio')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          country: 'SN'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/channels/:id/test', () => {
    it('should test channel availability', async () => {
      // Configurer le mock pour la vérification d'existence
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: mockChannels[0],
        error: null
      });

      // Configurer le mock pour l'insertion du test
      mockSupabaseReturn(['from', 'insert'], {
        data: {
          id: 'test-1',
          channel_id: 'channel-1',
          status: 'active',
          response_time: 250,
          created_at: new Date().toISOString()
        },
        error: null
      });

      // Mock pour la mise à jour du statut de la chaîne
      mockSupabaseReturn(['from', 'update', 'eq'], {
        data: null,
        error: null
      });

      const response = await agent
        .get('/api/channels/channel-1/test')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('response_time');
    });

    it('should return 404 for non-existent channel', async () => {
      // Configurer le mock pour une chaîne non trouvée
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: null,
        error: null
      });

      const response = await agent
        .get('/api/channels/non-existent-id/test')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });
  });
}); 