import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { server, mockServer } from '../mocks/server';

// Wrapper pour fournir le contexte aux hooks testés
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

// Configuration des tests d'intégration pour le contexte
describe('App Context Integration Tests', () => {
  // Démarrer le serveur MSW avant tous les tests
  beforeAll(() => server.listen());
  
  // Réinitialiser les handlers après chaque test
  afterEach(() => {
    mockServer.resetHandlers();
    window.localStorage.clear();
  });
  
  // Fermer le serveur après tous les tests
  afterAll(() => server.close());
  
  test('should provide initial context values', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });
    
    // Vérifier les valeurs initiales du contexte
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.dashboardStats).toBeNull();
    expect(result.current.sidebarOpen).toBeDefined();
    expect(typeof result.current.toggleSidebar).toBe('function');
    expect(typeof result.current.refreshDashboardStats).toBe('function');
  });
  
  test('should toggle sidebar', () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });
    
    // Récupérer l'état initial
    const initialSidebarState = result.current.sidebarOpen;
    
    // Basculer l'état de la sidebar
    act(() => {
      result.current.toggleSidebar();
    });
    
    // Vérifier que l'état a changé
    expect(result.current.sidebarOpen).toBe(!initialSidebarState);
    
    // Basculer à nouveau
    act(() => {
      result.current.toggleSidebar();
    });
    
    // Vérifier que l'état est revenu à l'état initial
    expect(result.current.sidebarOpen).toBe(initialSidebarState);
  });
  
  test('should update context after login/logout', async () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });
    
    // Vérifier l'état initial
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    
    // Simuler une connexion
    await act(async () => {
      // On utilise directement le hook useAuth injecté dans le contexte
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
    
    // Simuler une déconnexion
    await act(async () => {
      await result.current.logout();
    });
    
    // Vérifier l'état après déconnexion
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
  
  test('should load dashboard stats after authentication', async () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });
    
    // Se connecter pour charger les statistiques
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    // Les statistiques devraient être chargées automatiquement après connexion
    // Mais pour s'assurer, appelons manuellement refreshDashboardStats
    await act(async () => {
      await result.current.refreshDashboardStats();
    });
    
    // Vérifier que les statistiques ont été chargées
    expect(result.current.dashboardStats).toEqual(expect.objectContaining({
      songs: expect.objectContaining({
        total: 1500
      }),
      channels: expect.objectContaining({
        total: 54
      })
    }));
  });
  
  test('should handle API errors during dashboard stats loading', async () => {
    const { result } = renderHook(() => useAppContext(), { wrapper });
    
    // Se connecter d'abord
    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123'
      });
    });
    
    // Configurer le serveur pour retourner des erreurs
    mockServer.useNetworkErrorHandlers();
    
    // Essayer de charger les statistiques (devrait échouer)
    await act(async () => {
      await result.current.refreshDashboardStats();
    });
    
    // Les statistiques devraient rester null après une erreur
    expect(result.current.dashboardStats).toBeNull();
  });
}); 