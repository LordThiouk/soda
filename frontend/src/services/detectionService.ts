import apiService from './apiService';

// Types pour les détections
export interface Detection {
  id: string;
  channel_id: string;
  song_id: string;
  detection_time: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  confidence: number;
  status: 'pending' | 'confirmed' | 'corrected' | 'rejected';
  created_at: string;
  updated_at: string;
  song?: {
    id: string;
    title: string;
    artist: string;
    album?: string;
    isrc?: string;
    year?: number;
  };
  channel?: {
    id: string;
    name: string;
    type: 'radio' | 'tv';
  };
}

export interface DetectionFilter {
  channel_id?: string;
  song_id?: string;
  start_date?: string;
  end_date?: string;
  status?: 'pending' | 'confirmed' | 'corrected' | 'rejected';
  page?: number;
  limit?: number;
}

// Types pour les sessions de surveillance
export interface MonitoringSession {
  id: string;
  channel_id: string;
  interval_seconds: number;
  callback_url?: string;
  status: 'active' | 'stopped' | 'failed';
  status_reason?: string;
  started_at: string;
  ended_at?: string;
  last_detection_at?: string;
  detection_count: number;
  created_at: string;
  channel?: {
    id: string;
    name: string;
    type: 'radio' | 'tv';
    url: string;
    logo_url?: string;
  };
}

export interface MonitoringSessionDetection {
  id: string;
  detection_id: string;
  detected_at: string;
  song?: {
    title: string;
    artist: string;
    album?: string;
    isrc?: string;
  };
}

export interface MonitoringError {
  id: string;
  error_message: string;
  occurred_at: string;
}

export interface MonitoringSessionDetails {
  session: MonitoringSession;
  detections: MonitoringSessionDetection[];
  errors: MonitoringError[];
}

class DetectionService {
  /**
   * Récupérer la liste des détections récentes
   * @param filters Filtres pour la recherche
   */
  async getRecentDetections(filters: DetectionFilter = {}): Promise<{ detections: Detection[]; total: number }> {
    return await apiService.get('/detection/recent', filters);
  }

  /**
   * Identifier une chanson à partir d'un échantillon audio en base64
   * @param data Données de l'échantillon audio
   */
  async identifyAudio(data: { channel_id: string; audio_sample: string }): Promise<Detection> {
    return await apiService.post('/detection/identify', data);
  }

  /**
   * Identifier une chanson à partir d'un fichier audio
   * @param channel_id ID de la chaîne
   * @param audioFile Fichier audio
   */
  async identifyAudioFile(channel_id: string, audioFile: File): Promise<Detection> {
    const formData = new FormData();
    formData.append('channel_id', channel_id);
    formData.append('audio_sample', audioFile);
    
    return await apiService.upload('/detection/identify-file', formData);
  }

  /**
   * Corriger une détection existante
   * @param detection_id ID de la détection
   * @param song_id ID de la chanson correcte
   */
  async correctDetection(detection_id: string, song_id: string): Promise<Detection> {
    return await apiService.post(`/detection/${detection_id}/correction`, { song_id });
  }

  /**
   * Récupérer des statistiques de détection pour une période
   * @param start_date Date de début
   * @param end_date Date de fin
   */
  async getDetectionStats(start_date: string, end_date: string): Promise<{ 
    total: number; 
    by_channel: { channel_id: string; channel_name: string; count: number }[];
    by_hour: { hour: number; count: number }[];
  }> {
    return await apiService.get('/detection/stats', { start_date, end_date });
  }

  /**
   * S'abonner aux détections en temps réel (via Supabase)
   * @param callback Fonction de callback à appeler lorsqu'une nouvelle détection arrive
   */
  subscribeToRealTimeDetections(callback: (detection: Detection) => void) {
    // Cette fonction devrait être implémentée avec Supabase Client
    // Elle pourrait ressembler à ceci:
    /*
    const supabase = createClient(...);
    return supabase
      .channel('detection-updates')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'detections' }, 
        (payload) => callback(payload.new as Detection)
      )
      .subscribe();
    */
    // Pour l'instant, retournons une fonction de nettoyage vide
    return () => {};
  }

  /**
   * Démarrer une session de surveillance en temps réel
   * @param channel_id ID de la chaîne à surveiller
   * @param options Options de la session (intervalle, URL de callback)
   */
  async startMonitoringSession(
    channel_id: string, 
    options: { interval_seconds?: number; callback_url?: string } = {}
  ): Promise<MonitoringSession> {
    return await apiService.post(`/detection/realtime/${channel_id}/start`, options);
  }

  /**
   * Arrêter une session de surveillance en temps réel
   * @param channel_id ID de la chaîne à arrêter
   * @param reason Raison de l'arrêt (optionnel)
   */
  async stopMonitoringSession(channel_id: string, reason?: string): Promise<MonitoringSession> {
    return await apiService.post(`/detection/realtime/${channel_id}/stop`, { reason });
  }

  /**
   * Récupérer toutes les sessions de surveillance actives
   */
  async getActiveMonitoringSessions(): Promise<MonitoringSession[]> {
    return await apiService.get('/detection/realtime/sessions');
  }

  /**
   * Récupérer les détails d'une session de surveillance
   * @param session_id ID de la session
   */
  async getMonitoringSessionDetails(session_id: string): Promise<MonitoringSessionDetails> {
    return await apiService.get(`/detection/realtime/sessions/${session_id}`);
  }

  /**
   * S'abonner aux mises à jour des sessions de surveillance (via Supabase)
   * @param callback Fonction de callback à appeler lorsqu'une session est mise à jour
   */
  subscribeToMonitoringSessions(callback: (session: MonitoringSession) => void) {
    // Implémentation similaire à subscribeToRealTimeDetections
    return () => {};
  }
}

export default new DetectionService(); 