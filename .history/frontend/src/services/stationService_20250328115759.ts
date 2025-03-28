import apiService from './apiService';

// Types pour les stations
export interface Station {
  id: string;
  name: string;
  url: string;
  type: 'radio' | 'tv';
  country: string;
  language: string;
  bitrate?: number;
  codec?: string;
  status: 'active' | 'inactive' | 'error';
  last_checked?: string;
  created_at: string;
  updated_at: string;
}

export interface StationCreateData {
  name: string;
  url: string;
  type: 'radio' | 'tv';
  country?: string;
  language?: string;
  bitrate?: number;
  codec?: string;
}

export interface StationFilter {
  type?: 'radio' | 'tv';
  status?: 'active' | 'inactive' | 'error';
  country?: string;
  language?: string;
  search?: string;
  page?: number;
  limit?: number;
}

class StationService {
  /**
   * Récupérer la liste des stations
   * @param filters Filtres pour la recherche
   */
  async getStations(filters: StationFilter = {}): Promise<{ stations: Station[]; total: number }> {
    return await apiService.get('/channels', filters);
  }

  /**
   * Récupérer une station par son ID
   * @param id ID de la station
   */
  async getStationById(id: string): Promise<Station> {
    return await apiService.get(`/channels/${id}`);
  }

  /**
   * Créer une nouvelle station
   * @param data Données de la station
   */
  async createStation(data: StationCreateData): Promise<Station> {
    return await apiService.post('/channels', data);
  }

  /**
   * Mettre à jour une station
   * @param id ID de la station
   * @param data Données à mettre à jour
   */
  async updateStation(id: string, data: Partial<StationCreateData>): Promise<Station> {
    return await apiService.put(`/channels/${id}`, data);
  }

  /**
   * Supprimer une station
   * @param id ID de la station
   */
  async deleteStation(id: string): Promise<void> {
    return await apiService.delete(`/channels/${id}`);
  }

  /**
   * Tester la disponibilité d'une station
   * @param id ID de la station
   */
  async testStation(id: string): Promise<{ status: 'active' | 'error'; message?: string; response_time?: number }> {
    return await apiService.get(`/channels/${id}/test`);
  }

  /**
   * Importer des stations radio depuis RadioBrowser API
   * @param country Code du pays (default: 'SN' pour Sénégal)
   */
  async importRadioStations(country: string = 'SN'): Promise<{ imported: number; skipped: number; stations: Station[] }> {
    return await apiService.post('/channels/import/radio', { country });
  }

  /**
   * Récupérer les statistiques des stations
   */
  async getStationStats(): Promise<{ total: number; active: number; radio: number; tv: number }> {
    return await apiService.get('/channels/stats');
  }
}

export default new StationService(); 