import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Configuration de base pour Axios
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const TIMEOUT = 30000; // 30 secondes

// Création d'une instance axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour les requêtes
api.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis le localStorage (ou autre storage)
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    // Si un token existe, l'ajouter aux headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Gestion des erreurs spécifiques
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'erreur
      const status = error.response.status;
      
      if (status === 401) {
        // Non autorisé - déconnecter l'utilisateur
        if (typeof window !== 'undefined') {
          // Déconnecter l'utilisateur
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          // Rediriger vers la page de connexion
          window.location.href = '/login';
        }
      }
      
      // Enrichir l'erreur avec des informations supplémentaires
      error.statusCode = status;
      error.message = error.response.data.message || 'Une erreur est survenue';
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      error.statusCode = 0;
      error.message = 'Aucune réponse du serveur, veuillez vérifier votre connexion';
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      error.statusCode = 0;
      error.message = 'Erreur de configuration de la requête';
    }
    
    return Promise.reject(error);
  }
);

// Types pour les paramètres et options
interface RequestOptions extends AxiosRequestConfig {
  secure?: boolean;
}

// Classe de service API
class ApiService {
  /**
   * Effectuer une requête GET
   * @param url URL de l'endpoint
   * @param params Paramètres de requête (optionnels)
   * @param options Options de configuration (optionnelles)
   */
  async get<T>(url: string, params?: any, options?: RequestOptions): Promise<T> {
    const response: AxiosResponse<T> = await api.get(url, { ...options, params });
    return response.data;
  }

  /**
   * Effectuer une requête POST
   * @param url URL de l'endpoint
   * @param data Données à envoyer
   * @param options Options de configuration (optionnelles)
   */
  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    const response: AxiosResponse<T> = await api.post(url, data, options);
    return response.data;
  }

  /**
   * Effectuer une requête PUT
   * @param url URL de l'endpoint
   * @param data Données à envoyer
   * @param options Options de configuration (optionnelles)
   */
  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    const response: AxiosResponse<T> = await api.put(url, data, options);
    return response.data;
  }

  /**
   * Effectuer une requête DELETE
   * @param url URL de l'endpoint
   * @param options Options de configuration (optionnelles)
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    const response: AxiosResponse<T> = await api.delete(url, options);
    return response.data;
  }

  /**
   * Effectuer une requête avec upload de fichier
   * @param url URL de l'endpoint
   * @param formData FormData contenant les fichiers et données
   * @param options Options de configuration (optionnelles)
   */
  async upload<T>(url: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const uploadOptions = {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'multipart/form-data',
      },
    };
    
    const response: AxiosResponse<T> = await api.post(url, formData, uploadOptions);
    return response.data;
  }

  // Méthode statique pour obtenir l'URL complète
  static getFullUrl(path: string): string {
    return `${API_URL}${path}`;
  }
}

// Exporter une instance unique
export default new ApiService(); 