const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Créer le répertoire des logs s'il n'existe pas
const logDir = process.env.LOG_FILE ? path.dirname(process.env.LOG_FILE) : 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Définir le niveau de log par défaut
const level = process.env.LOG_LEVEL || 'info';

// Format personnalisé
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Création du logger
const logger = winston.createLogger({
  level,
  format: customFormat,
  defaultMeta: { service: 'sodav-monitor-api' },
  transports: [
    // Écrire tous les logs dans le fichier
    new winston.transports.File({
      filename: process.env.LOG_FILE || path.join(logDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: process.env.LOG_FILE || path.join(logDir, 'combined.log'),
    }),
  ],
});

// Si nous ne sommes pas en production, logger également dans la console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Fonctions pour faciliter l'utilisation
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger; 