import { rest } from 'msw';

// URL de l'API (définie dans jest.setup.js)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Données mockées
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Utilisateur Test',
  role: 'admin',
  created_at: '2023-01-01T00:00:00.000Z'
};

const mockStations = [
  {
    id: 'station-1',
    name: 'Radio Sénégal',
    url: 'http://example.com/stream',
    type: 'radio',
    country: 'SN',
    language: 'fr',
    bitrate: 128,
    codec: 'mp3',
    status: 'active',
    last_checked: '2023-01-01T00:00:00.000Z',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 'station-2',
    name: 'RTS 1',
    url: 'http://example.com/stream2',
    type: 'tv',
    country: 'SN',
    language: 'fr',
    status: 'active',
    last_checked: '2023-01-01T00:00:00.000Z',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  }
];

const mockDetections = [
  {
    id: 'detection-1',
    channel_id: 'station-1',
    song_id: 'song-1',
    detection_time: '2023-01-01T12:00:00.000Z',
    start_time: '2023-01-01T11:58:00.000Z',
    end_time: '2023-01-01T12:02:00.000Z',
    duration: 240,
    confidence: 0.95,
    status: 'confirmed',
    created_at: '2023-01-01T12:00:00.000Z',
    updated_at: '2023-01-01T12:00:00.000Z',
    song: {
      id: 'song-1',
      title: 'Chanson Test',
      artist: 'Artiste Test',
      album: 'Album Test',
      isrc: 'ISRC123456789',
      year: 2023
    },
    channel: {
      id: 'station-1',
      name: 'Radio Sénégal',
      type: 'radio'
    }
  }
];

const mockDashboardStats = {
  songs: {
    total: 1500,
    identified_with_isrc: 1200
  },
  channels: {
    total: 54,
    active: 48,
    radio: 42,
    tv: 12
  },
  detections: {
    total: 8500,
    today: 120,
    this_week: 840
  },
  top_channels: [
    { channel_id: 'station-1', channel_name: 'Radio Sénégal', count: 250 },
    { channel_id: 'station-2', channel_name: 'RTS 1', count: 180 }
  ],
  top_songs: [
    { song_id: 'song-1', title: 'Chanson Test', artist: 'Artiste Test', count: 15 },
    { song_id: 'song-2', title: 'Autre Chanson', artist: 'Autre Artiste', count: 10 }
  ]
};

// Gestion des erreurs
const errorHandler = (req: any, res: any, ctx: any) => {
  return res(
    ctx.status(500),
    ctx.json({
      message: 'Une erreur serveur est survenue'
    })
  );
};

// Définition des handlers
export const handlers = [
  // Auth
  rest.post(`${API_URL}/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: 'fake-jwt-token',
        user: mockUser
      })
    );
  }),

  rest.post(`${API_URL}/auth/register`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json(mockUser)
    );
  }),

  rest.post(`${API_URL}/auth/logout`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ message: 'Déconnexion réussie' })
    );
  }),

  // Stations
  rest.get(`${API_URL}/channels`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        stations: mockStations,
        total: mockStations.length
      })
    );
  }),

  rest.get(`${API_URL}/channels/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const station = mockStations.find(s => s.id === id);
    
    if (!station) {
      return res(
        ctx.status(404),
        ctx.json({ message: 'Station non trouvée' })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json(station)
    );
  }),

  // Détections
  rest.get(`${API_URL}/detection/recent`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        detections: mockDetections,
        total: mockDetections.length
      })
    );
  }),

  // Rapports et statistiques
  rest.get(`${API_URL}/reports/dashboard/stats`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockDashboardStats)
    );
  }),

  // Exemple d'erreur 401 (non autorisé)
  rest.get(`${API_URL}/secure-endpoint`, (req, res, ctx) => {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.includes('Bearer')) {
      return res(
        ctx.status(401),
        ctx.json({
          message: 'Authentification requise'
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({ message: 'Accès autorisé' })
    );
  }),
];

// Exporter des variations spécifiques pour les tests
export const failedAuthHandlers = [
  rest.post(`${API_URL}/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(401),
      ctx.json({
        message: 'Identifiants invalides'
      })
    );
  })
];

export const networkErrorHandlers = [
  rest.get(`${API_URL}/channels`, errorHandler),
  rest.get(`${API_URL}/detection/recent`, errorHandler),
  rest.get(`${API_URL}/reports/dashboard/stats`, errorHandler),
]; 