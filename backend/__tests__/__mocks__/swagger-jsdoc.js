/**
 * Mock du module swagger-jsdoc pour les tests
 */

// Mock simple qui retourne un objet vide
const swaggerJsDoc = jest.fn().mockReturnValue({
  openapi: '3.0.0',
  info: {
    title: 'API Mock pour tests',
    version: '1.0.0'
  },
  paths: {}
});

module.exports = swaggerJsDoc; 