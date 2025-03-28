const request = require('supertest');
const app = require('../../src/app');
const { supabase, mockSupabaseReturn, mockExecuteSupabaseQuery } = require('../__mocks__/supabase');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// API key pour les tests
const TEST_API_KEY = 'test-api-key-123456';

// Mock des modules
jest.mock('../../src/services/detection.service', () => {
  return {
    identifySong: jest.fn().mockResolvedValue({
      success: true,
      confidence: 0.92,
      artist: 'Youssou N\'Dour',
      title: '7 Seconds',
      album: 'The Guide',
      release_year: 1994,
      isrc: 'FRGFV9400246',
      detected_at: new Date().toISOString(),
      service: 'audd'
    }),
    identifyWithAcoustid: jest.fn().mockResolvedValue({
      success: true,
      confidence: 0.89,
      artist: 'Youssou N\'Dour',
      title: '7 Seconds',
      album: 'The Guide',
      release_year: 1994,
      isrc: 'FRGFV9400246',
      detected_at: new Date().toISOString(),
      service: 'acoustid'
    }),
    identifyWithAudd: jest.fn().mockResolvedValue({
      success: true,
      confidence: 0.92,
      artist: 'Youssou N\'Dour',
      title: '7 Seconds',
      album: 'The Guide',
      release_year: 1994,
      isrc: 'FRGFV9400246',
      detected_at: new Date().toISOString(),
      service: 'audd'
    })
  };
});

jest.mock('../../src/services/apiKey.service', () => {
  return {
    verifyApiKey: jest.fn().mockResolvedValue({
      valid: true,
      key: {
        id: 'api-key-123',
        key: TEST_API_KEY,
        name: 'Test API Key',
        permissions: ['detection.identify'],
        user_id: 'user-123',
        created_at: new Date().toISOString()
      },
      user: {
        id: 'user-123',
        email: 'apiuser@example.com',
        role: 'user'
      }
    })
  };
});

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

// Mock du module swagger-jsdoc
jest.mock('swagger-jsdoc', () => require('../__mocks__/swagger-jsdoc'));

describe('Detection Integration Tests', () => {
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
    }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    
    userToken = jwt.sign({
      id: 'regular-user-123',
      email: 'user@example.com',
      role: 'user'
    }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockDetections = [
    {
      id: 'detection-1',
      channel_id: 'channel-1',
      song_id: 'song-1',
      confidence: 0.92,
      detected_at: new Date().toISOString(),
      service: 'audd',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      channel: {
        id: 'channel-1',
        name: 'Radio Sénégal',
        type: 'radio'
      },
      song: {
        id: 'song-1',
        title: '7 Seconds',
        artist: 'Youssou N\'Dour',
        isrc: 'FRGFV9400246'
      }
    },
    {
      id: 'detection-2',
      channel_id: 'channel-2',
      song_id: 'song-2',
      confidence: 0.87,
      detected_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      service: 'acoustid',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      channel: {
        id: 'channel-2',
        name: 'RFM Sénégal',
        type: 'radio'
      },
      song: {
        id: 'song-2',
        title: 'Set',
        artist: 'Youssou N\'Dour',
        isrc: 'FRGFV9500123'
      }
    }
  ];

  describe('POST /api/detection/identify', () => {
    it('should identify a song with valid API key', async () => {
      // Mock pour la recherche de la chaîne
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: {
          id: 'channel-1',
          name: 'Radio Sénégal',
          type: 'radio',
          status: 'active'
        },
        error: null
      });

      // Mock pour vérifier si la chanson existe déjà
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: null,
        error: null
      });

      // Mock pour l'insertion de la chanson
      mockSupabaseReturn(['from', 'insert', 'select'], {
        data: [{
          id: 'song-1',
          title: '7 Seconds',
          artist: 'Youssou N\'Dour',
          album: 'The Guide',
          release_year: 1994,
          isrc: 'FRGFV9400246',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        error: null
      });

      // Mock pour l'insertion de la détection
      mockSupabaseReturn(['from', 'insert', 'select'], {
        data: [{
          id: 'detection-1',
          channel_id: 'channel-1',
          song_id: 'song-1',
          confidence: 0.92,
          detected_at: new Date().toISOString(),
          service: 'audd',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        error: null
      });

      const response = await agent
        .post('/api/detection/identify')
        .set('X-API-KEY', TEST_API_KEY)
        .send({
          channel_id: 'channel-1',
          audio_sample: 'base64_encoded_audio_sample'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('artist', 'Youssou N\'Dour');
      expect(response.body).toHaveProperty('title', '7 Seconds');
      expect(response.body).toHaveProperty('isrc', 'FRGFV9400246');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await agent
        .post('/api/detection/identify')
        .set('X-API-KEY', TEST_API_KEY)
        .send({
          // channel_id is missing
          audio_sample: 'base64_encoded_audio_sample'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for invalid API key', async () => {
      // Override API key verification
      require('../../src/services/apiKey.service').verifyApiKey.mockResolvedValueOnce({
        valid: false
      });

      const response = await agent
        .post('/api/detection/identify')
        .set('X-API-KEY', 'invalid-api-key')
        .send({
          channel_id: 'channel-1',
          audio_sample: 'base64_encoded_audio_sample'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/detection/identify-file', () => {
    it('should identify a song from uploaded file', async () => {
      // Mock pour la recherche de la chaîne
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: {
          id: 'channel-1',
          name: 'Radio Sénégal',
          type: 'radio',
          status: 'active'
        },
        error: null
      });

      // Mock pour vérifier si la chanson existe déjà
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: null,
        error: null
      });

      // Mock pour l'insertion de la chanson
      mockSupabaseReturn(['from', 'insert', 'select'], {
        data: [{
          id: 'song-1',
          title: '7 Seconds',
          artist: 'Youssou N\'Dour',
          album: 'The Guide',
          release_year: 1994,
          isrc: 'FRGFV9400246',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        error: null
      });

      // Mock pour l'insertion de la détection
      mockSupabaseReturn(['from', 'insert', 'select'], {
        data: [{
          id: 'detection-1',
          channel_id: 'channel-1',
          song_id: 'song-1',
          confidence: 0.89,
          detected_at: new Date().toISOString(),
          service: 'acoustid',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        error: null
      });

      // Créer un chemin pour le mock du fichier
      const testFilePath = path.join(__dirname, 'test-audio-file.mp3');
      
      // Écrire un fichier temporaire pour le test
      if (!fs.existsSync(testFilePath)) {
        fs.writeFileSync(testFilePath, 'mock audio data');
      }

      const response = await agent
        .post('/api/detection/identify-file')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('channel_id', 'channel-1')
        .attach('audio_sample', testFilePath);

      // Nettoyage du fichier test
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('artist', 'Youssou N\'Dour');
      expect(response.body).toHaveProperty('title', '7 Seconds');
    });

    it('should return 400 for missing file or channel_id', async () => {
      const response = await agent
        .post('/api/detection/identify-file')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('channel_id', 'channel-1');
        // No file attached

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/detection/recent', () => {
    it('should return recent detections with pagination', async () => {
      // Mock pour la récupération des détections
      mockSupabaseReturn(['from', 'select', 'order', 'range'], {
        data: mockDetections,
        error: null
      });

      // Mock pour le comptage
      mockSupabaseReturn(['from', 'select', 'count'], {
        data: [{ count: 2 }],
        error: null
      });

      const response = await agent
        .get('/api/detection/recent')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter detections by channel_id', async () => {
      // Mock pour la récupération filtrée
      mockSupabaseReturn(['from', 'select', 'eq', 'order', 'range'], {
        data: [mockDetections[0]],
        error: null
      });

      // Mock pour le comptage
      mockSupabaseReturn(['from', 'select', 'eq', 'count'], {
        data: [{ count: 1 }],
        error: null
      });

      const response = await agent
        .get('/api/detection/recent?channel_id=channel-1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].channel_id).toBe('channel-1');
      expect(response.body.pagination.total).toBe(1);
    });

    it('should filter detections by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Format the dates
      const startDate = yesterday.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      // Mock pour la récupération par date
      mockSupabaseReturn(['from', 'select', 'gte', 'lte', 'order', 'range'], {
        data: mockDetections,
        error: null
      });

      // Mock pour le comptage
      mockSupabaseReturn(['from', 'select', 'gte', 'lte', 'count'], {
        data: [{ count: 2 }],
        error: null
      });

      const response = await agent
        .get(`/api/detection/recent?start_date=${startDate}&end_date=${endDate}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });
  });

  describe('POST /api/detection/:detection_id/correction', () => {
    it('should apply a correction to a detection', async () => {
      // Mock pour la récupération de la détection
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: mockDetections[0],
        error: null
      });

      // Mock pour la récupération de la chanson
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: {
          id: 'song-3',
          title: 'Birima',
          artist: 'Youssou N\'Dour',
          album: 'Joko',
          release_year: 2000,
          isrc: 'FRGFV0000123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        error: null
      });

      // Mock pour la mise à jour de la détection
      mockSupabaseReturn(['from', 'update', 'eq', 'select'], {
        data: [{
          ...mockDetections[0],
          song_id: 'song-3',
          manual_correction: true,
          updated_at: new Date().toISOString()
        }],
        error: null
      });

      const response = await agent
        .post('/api/detection/detection-1/correction')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          song_id: 'song-3'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'detection-1');
      expect(response.body).toHaveProperty('song_id', 'song-3');
      expect(response.body).toHaveProperty('manual_correction', true);
    });

    it('should return 404 for non-existent detection', async () => {
      // Mock pour une détection non trouvée
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: null,
        error: null
      });

      const response = await agent
        .post('/api/detection/non-existent-id/correction')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          song_id: 'song-3'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent song', async () => {
      // Mock pour la récupération de la détection
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: mockDetections[0],
        error: null
      });

      // Mock pour une chanson non trouvée
      mockSupabaseReturn(['from', 'select', 'eq', 'single'], {
        data: null,
        error: null
      });

      const response = await agent
        .post('/api/detection/detection-1/correction')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          song_id: 'non-existent-song'
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 403 when not authenticated as admin or manager', async () => {
      const response = await agent
        .post('/api/detection/detection-1/correction')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          song_id: 'song-3'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message');
    });
  });
}); 