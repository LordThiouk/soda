// Charger les variables d'environnement
require('dotenv').config();

const server = require('./app');
const logger = require('./utils/logger');

// Vérification des variables d'environnement essentielles
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'JWT_SECRET',
  'NODE_ENV'
];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
  logger.error(
    `Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`
  );
  process.exit(1);
}

// Port configuration
const PORT = process.env.PORT || 5000;

// Gestion des erreurs non captées
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Arrêt du serveur...');
  logger.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Start the server
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`Documentation API disponible sur http://localhost:${PORT}/api-docs`);
});

// Gestion des rejets de promesses non gérées
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Arrêt du serveur...');
  logger.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Gestion de l'arrêt propre du serveur
process.on('SIGTERM', () => {
  logger.info('Signal SIGTERM reçu. Arrêt gracieux du serveur...');
  server.close(() => {
    logger.info('Serveur arrêté.');
    process.exit(0);
  });
});

module.exports = server; 