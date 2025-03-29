const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const http = require('http');

const logger = require('./utils/logger');
const { errorHandler } = require('./middlewares/errorHandler');

// Import des routes
const authRoutes = require('./routes/auth.routes');
const channelRoutes = require('./routes/channel.routes');
const detectionRoutes = require('./routes/detection.routes');
const reportRoutes = require('./routes/report.routes');
const songRoutes = require('./routes/song.routes');
const apiKeyRoutes = require('./routes/apiKey.routes');
const notificationRoutes = require('./routes/notification.routes');

// Initialiser le service d'événements (cela enregistre les gestionnaires d'événements)
require('./services/event.service');
logger.info('Service d\'événements initialisé');

// Importer automatiquement les stations radio au démarrage du serveur
const channelService = require('./services/channel.service');
(async () => {
  try {
    logger.info('Importation automatique des stations radio depuis RadioBrowser API...');
    const result = await channelService.importRadioStations(false); // false = ne pas écraser les stations existantes
    logger.info(`Import automatique de stations radio terminé: ${result.imported} stations importées, ${result.skipped} ignorées, ${result.errors} erreurs`);
  } catch (error) {
    logger.error('Erreur lors de l\'importation automatique des stations radio:', error);
  }
})();

// For debugging route loading issues
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:');
  console.error(err);
  // Don't exit the process, just log the error
});

// Configuration de l'application
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const { initSocketServer } = require('./websocket/socketServer');
initSocketServer(server);
logger.info('WebSocket server attached to HTTP server');

// For production
app.set('trust proxy', 1);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('common'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  skip: (req) => {
    // Skip rate limiting for the API docs
    return req.path.startsWith('/api-docs');
  }
});

// Apply rate limiting to all API routes
app.use('/api', limiter);

// Documentation Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SODAV Monitor API',
      version: '1.0.0',
      description: 'Documentation de l\'API SODAV Monitor',
      contact: {
        name: 'Support SODAV',
        email: 'support@sodav.sn'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'Serveur API'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'SODAV Monitor API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Export server instead of app
module.exports = server; 