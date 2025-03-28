import { renderHook, act } from '@testing-library/react';
import useApi from '@/hooks/useApi';
import stationService from '@/services/stationService';
import detectionService from '@/services/detectionService';
import reportService from '@/services/reportService';
import { server, mockServer } from '../mocks/server';

// Configuration des tests d'intégration pour les services API
describe('API Integration Tests', () => {
  // Démarrer le serveur MSW avant tous les tests
  beforeAll(() => server.listen());
  
  // Réinitialiser les handlers après chaque test
  afterEach(() => {
    mockServer.resetHandlers();
    localStorage.clear();
  });
  
  // Fermer le serveur après tous les tests
  afterAll(() => server.close());
  
  // Tester le hook useApi
  describe('useApi Hook', () => {
    test('should handle successful API call', async () => {
      // Créer un hook useApi avec getStations
      const { result } = renderHook(() => useApi(stationService.getStations));
      
      // Exécuter l'appel API
      await act(async () => {
        await result.current.execute();
      });
      
      // Vérifier les résultats
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual({
        stations: expect.arrayContaining([
          expect.objectContaining({
            id: 'station-1',
            name: 'Radio Sénégal'
          }),
          expect.objectContaining({
            id: 'station-2',
            name: 'RTS 1'
          })
        ]),
        total: 2
      });
    });
    
    test('should handle API error', async () => {
      // Configurer le serveur pour retourner des erreurs
      mockServer.useNetworkErrorHandlers();
      
      // Créer un hook useApi avec getStations
      const { result } = renderHook(() => useApi(stationService.getStations));
      
      // Exécuter l'appel API (qui devrait échouer)
      let errorThrown = false;
      
      await act(async () => {
        try {
          await result.current.execute();
        } catch (error) {
          errorThrown = true;
        }
      });
      
      // Vérifier que l'erreur a été capturée
      expect(errorThrown).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeNull();
    });
    
    test('should reset state when calling reset()', async () => {
      // Créer un hook useApi
      const { result } = renderHook(() => useApi(stationService.getStations));
      
      // Exécuter l'appel API
      await act(async () => {
        await result.current.execute();
      });
      
      // Vérifier que les données sont présentes
      expect(result.current.data).not.toBeNull();
      
      // Réinitialiser l'état
      act(() => {
        result.current.reset();
      });
      
      // Vérifier que l'état a été réinitialisé
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });
  });
  
  // Tester les services API
  describe('API Services', () => {
    // Tests pour stationService
    describe('stationService', () => {
      test('should fetch stations list', async () => {
        const response = await stationService.getStations();
        
        expect(response).toEqual({
          stations: expect.arrayContaining([
            expect.objectContaining({
              id: 'station-1',
              name: 'Radio Sénégal',
              type: 'radio'
            }),
            expect.objectContaining({
              id: 'station-2',
              name: 'RTS 1',
              type: 'tv'
            })
          ]),
          total: 2
        });
      });
      
      test('should fetch a station by ID', async () => {
        const station = await stationService.getStationById('station-1');
        
        expect(station).toEqual(
          expect.objectContaining({
            id: 'station-1',
            name: 'Radio Sénégal',
            type: 'radio'
          })
        );
      });
    });
    
    // Tests pour detectionService
    describe('detectionService', () => {
      test('should fetch recent detections', async () => {
        const response = await detectionService.getRecentDetections();
        
        expect(response).toEqual({
          detections: expect.arrayContaining([
            expect.objectContaining({
              id: 'detection-1',
              channel_id: 'station-1',
              song: expect.objectContaining({
                title: 'Chanson Test'
              })
            })
          ]),
          total: 1
        });
      });
    });
    
    // Tests pour reportService
    describe('reportService', () => {
      test('should fetch dashboard statistics', async () => {
        const stats = await reportService.getDashboardStats();
        
        expect(stats).toEqual(
          expect.objectContaining({
            songs: expect.objectContaining({
              total: 1500,
              identified_with_isrc: 1200
            }),
            channels: expect.objectContaining({
              total: 54,
              active: 48
            }),
            detections: expect.objectContaining({
              total: 8500
            }),
            top_channels: expect.arrayContaining([
              expect.objectContaining({
                channel_id: 'station-1',
                channel_name: 'Radio Sénégal'
              })
            ]),
            top_songs: expect.arrayContaining([
              expect.objectContaining({
                song_id: 'song-1',
                title: 'Chanson Test'
              })
            ])
          })
        );
      });
    });
  });
}); 