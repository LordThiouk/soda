import apiService from './apiService';

// Types pour les rapports
export interface Report {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  status: 'pending' | 'completed' | 'failed';
  created_by: string;
  file_url?: string;
  parameters: {
    start_date: string;
    end_date: string;
    channel_ids?: string[];
    format?: 'pdf' | 'csv' | 'excel';
    include_charts?: boolean;
  };
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ReportCreateData {
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  parameters: {
    start_date: string;
    end_date: string;
    channel_ids?: string[];
    format?: 'pdf' | 'csv' | 'excel';
    include_charts?: boolean;
  };
}

export interface ReportFilter {
  type?: 'daily' | 'weekly' | 'monthly' | 'custom';
  status?: 'pending' | 'completed' | 'failed';
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  songs: {
    total: number;
    identified_with_isrc: number;
  };
  channels: {
    total: number;
    active: number;
    radio: number;
    tv: number;
  };
  detections: {
    total: number;
    today: number;
    this_week: number;
  };
  top_channels: {
    channel_id: string;
    channel_name: string;
    count: number;
  }[];
  top_songs: {
    song_id: string;
    title: string;
    artist: string;
    count: number;
  }[];
}

class ReportService {
  /**
   * Récupérer la liste des rapports
   * @param filters Filtres pour la recherche
   */
  async getReports(filters: ReportFilter = {}): Promise<{ reports: Report[]; total: number }> {
    return await apiService.get('/reports', filters);
  }

  /**
   * Récupérer un rapport par son ID
   * @param id ID du rapport
   */
  async getReportById(id: string): Promise<Report> {
    return await apiService.get(`/reports/${id}`);
  }

  /**
   * Générer un nouveau rapport
   * @param data Données du rapport
   */
  async generateReport(data: ReportCreateData): Promise<Report> {
    return await apiService.post('/reports', data);
  }

  /**
   * Supprimer un rapport
   * @param id ID du rapport
   */
  async deleteReport(id: string): Promise<void> {
    return await apiService.delete(`/reports/${id}`);
  }

  /**
   * Télécharger un rapport
   * @param id ID du rapport
   */
  downloadReport(id: string): void {
    const url = apiService.constructor.getFullUrl(`/reports/${id}/download`);
    window.open(url, '_blank');
  }

  /**
   * Récupérer les statistiques pour le tableau de bord
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return await apiService.get('/reports/dashboard/stats');
  }

  /**
   * Obtenir des statistiques par période
   * @param period Période ('day', 'week', 'month', 'year')
   * @param start_date Date de début
   * @param end_date Date de fin
   */
  async getStatsByPeriod(period: 'day' | 'week' | 'month' | 'year', start_date: string, end_date: string): Promise<{
    period: string;
    count: number;
  }[]> {
    return await apiService.get('/reports/stats/by-period', { period, start_date, end_date });
  }
}

export default new ReportService(); 