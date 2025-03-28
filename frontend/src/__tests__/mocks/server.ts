import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Configurer le serveur de mock
export const server = setupServer(...handlers);

// Exposer des méthodes pour réinitialiser ou modifier les handlers
export const mockServer = {
  // Réinitialiser les handlers aux valeurs par défaut
  resetHandlers: () => {
    server.resetHandlers();
    server.use(...handlers);
  },
  
  // Utiliser des handlers personnalisés pour un test spécifique
  use: (...customHandlers: any[]) => {
    server.use(...customHandlers);
  },
  
  // Méthode de raccourci pour utiliser les handlers d'erreur de connexion
  useNetworkErrorHandlers: () => {
    const { networkErrorHandlers } = require('./handlers');
    server.use(...networkErrorHandlers);
  },
  
  // Méthode de raccourci pour utiliser les handlers d'authentification échouée
  useFailedAuthHandlers: () => {
    const { failedAuthHandlers } = require('./handlers');
    server.use(...failedAuthHandlers);
  }
}; 