const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const logger = require('./utils/logger');
const { errorHandler } = require('./middlewares/errorHandler');

// Import des routes
const authRoutes = require('./routes/auth.routes');
const channelRoutes = require('./routes/channel.routes');
const detectionRoutes = require('./routes/detection.routes');
const reportRoutes = require('./routes/report.routes');
const songRoutes = require('./routes/song.routes');
const apiKeyRoutes = require('./routes/apiKey.routes');

// Configuration de l'application
const app = express();

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Logging des requêtes HTTP
app.use(morgan('dev', {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));

// Protection contre les attaques par force brute
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  }
});

// Appliquer le rate limiting aux routes d'authentification et d'API
app.use('/api/auth', apiLimiter);
app.use('/api/detection', apiLimiter);

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SODAV Monitoring API',
      version: '1.0.0',
      description: 'API pour le système de monitoring des diffusions de la SODAV',
      contact: {
        name: 'SODAV',
        url: 'https://www.sodav.sn',
        email: 'contact@sodav.sn'
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
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      }
    }
  },
  apis: ['./src/routes/*.js'] // Chemin vers les fichiers routes avec les annotations Swagger
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API opérationnelle',
    timestamp: new Date().toISOString()
  });
});

// Enregistrement des routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/api-keys', apiKeyRoutes);

// Dossier statique pour les téléchargements
app.use('/downloads', express.static(path.join(__dirname, '../downloads')));

// Middleware de gestion des erreurs
app.use(errorHandler);

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Impossible de trouver ${req.originalUrl} sur ce serveur`
  });
});

module.exports = app; 