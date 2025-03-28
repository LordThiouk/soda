import { renderHook, act } from '@testing-library/react';
import useAuth from '@/hooks/useAuth';
import { server, mockServer } from '../mocks/server';

// Configuration des tests d'intégration pour l'authentification
describe('Authentication Integration Tests', () => {
  // Démarrer le serveur MSW avant tous les tests
  beforeAll(() => server.listen());
  
  // Réinitialiser les handlers après chaque test
  afterEach(() => {
    mockServer.resetHandlers();
    window.localStorage.clear();
  });
  
  // Fermer le serveur après tous les tests
  afterAll(() => server.close());
  
  // Tests pour le hook useAuth
  describe('useAuth Hook', () => {
    test('should initialize with unauthenticated state', () => {
      const { result } = renderHook(() => useAuth());
      
      // Vérifier l'état initial
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false); // Car checkAuth est synchrone
    });
    
    test('should login successfully', async () => {
      const { result } = renderHook(() => useAuth());
      
      // Simuler le processus de connexion
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123'
        });
      });
      
      // Vérifier l'état après connexion
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Utilisateur Test',
        role: 'admin'
      }));
      
      // Vérifier que le token a été stocké dans localStorage
      expect(window.localStorage.getItem('authToken')).toBe('fake-jwt-token');
    });
    
    test('should handle login failure', async () => {
      // Utiliser les handlers d'échec d'authentification
      mockServer.useFailedAuthHandlers();
      
      const { result } = renderHook(() => useAuth());
      
      // Tenter de se connecter (devrait échouer)
      let error;
      
      await act(async () => {
        try {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong_password'
          });
        } catch (e) {
          error = e;
        }
      });
      
      // Vérifier que la connexion a échoué
      expect(error).toBeDefined();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
    
    test('should logout successfully', async () => {
      const { result } = renderHook(() => useAuth());
      
      // Se connecter d'abord
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123'
        });
      });
      
      // Vérifier que l'utilisateur est connecté
      expect(result.current.isAuthenticated).toBe(true);
      
      // Se déconnecter
      await act(async () => {
        await result.current.logout();
      });
      
      // Vérifier que l'utilisateur est déconnecté
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(window.localStorage.getItem('authToken')).toBeNull();
    });
    
    test('should correctly check user role', async () => {
      const { result } = renderHook(() => useAuth());
      
      // Se connecter d'abord
      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123'
        });
      });
      
      // Vérifier les rôles
      expect(result.current.hasRole('admin')).toBe(true);
      expect(result.current.hasRole('user')).toBe(false);
      expect(result.current.hasRole(['admin', 'manager'])).toBe(true);
      expect(result.current.hasRole(['user', 'guest'])).toBe(false);
    });
  });
}); 