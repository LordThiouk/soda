require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import des routes
const authRoutes = require('./routes/auth.routes');
const channelRoutes = require('./routes/channel.routes');
const songRoutes = require('./routes/song.routes');
const detectionRoutes = require('./routes/detection.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SODAV Monitor API',
      version: '1.0.0',
      description: 'API pour le système de surveillance des radios et TV sénégalaises',
      contact: {
        name: 'SODAV',
        url: 'https://sodav.sn',
      },
      license: {
        name: 'Propriétaire',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Serveur de développement',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Middleware
app.use(helmet()); // Sécurité
app.use(cors()); // CORS
app.use(morgan('combined')); // Logging HTTP
app.use(express.json()); // Parsing JSON
app.use(express.urlencoded({ extended: true })); // Parsing URL-encoded

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes par défaut
  max: process.env.RATE_LIMIT_MAX || 100, // 100 requêtes par fenêtre max
  standardHeaders: true,
  legacyHeaders: false,
});

// Appliquer le rate limiting à toutes les requêtes
app.use(limiter);

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/api/reports', reportRoutes);

// Route de base
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API SODAV Monitor',
    documentation: '/api-docs',
    version: '1.0.0'
  });
});

// Middleware de gestion des erreurs
app.use(errorHandler);

// Démarrage du serveur
app.listen(PORT, () => {
  logger.info(`Serveur démarré sur le port ${PORT}`);
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Documentation API disponible sur http://localhost:${PORT}/api-docs`);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error('Erreur non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesse rejetée non gérée:', reason);
});

module.exports = app; // Pour les tests 