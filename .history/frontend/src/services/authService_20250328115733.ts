import apiService from './apiService';
import { createClient } from '@supabase/supabase-js';

// Types pour l'authentification
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

// Initialisation du client Supabase si les variables d'environnement sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

class AuthService {
  /**
   * Connecter un utilisateur
   * @param credentials Informations de connexion
   */
  async login(credentials: LoginCredentials) {
    // Si Supabase est configuré, utiliser l'authentification Supabase
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      // Stocker le token et les informations utilisateur
      if (data?.session) {
        localStorage.setItem('authToken', data.session.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      }
    } else {
      // Sinon, utiliser l'API REST
      const response = await apiService.post<{ token: string; user: User }>('/auth/login', credentials);
      
      // Stocker le token et les informations utilisateur
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return response.user;
    }
  }

  /**
   * Inscrire un nouvel utilisateur
   * @param userData Données d'inscription
   */
  async register(userData: RegisterData) {
    // Si Supabase est configuré, utiliser l'authentification Supabase
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role || 'user',
          }
        }
      });

      if (error) throw error;
      return data.user;
    } else {
      // Sinon, utiliser l'API REST
      return await apiService.post<User>('/auth/register', userData);
    }
  }

  /**
   * Déconnecter l'utilisateur
   */
  async logout() {
    // Si Supabase est configuré, utiliser l'authentification Supabase
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      // Sinon, utiliser l'API REST
      await apiService.post('/auth/logout');
    }
    
    // Supprimer les données de session
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  /**
   * Récupérer l'utilisateur actuel depuis le localStorage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   * @param role Rôle à vérifier
   */
  hasRole(role: string | string[]): boolean {
    const user = this.getCurrentUser();
    
    if (!user) return false;
    
    // Si rôle est un tableau, vérifier si l'utilisateur a au moins un des rôles
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    // Sinon, vérifier si l'utilisateur a le rôle spécifié
    return user.role === role;
  }

  /**
   * Rafraîchir le token d'authentification
   */
  async refreshToken() {
    // Si Supabase est configuré, utiliser l'authentification Supabase
    if (supabase) {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (data?.session) {
        localStorage.setItem('authToken', data.session.access_token);
        return data.session.access_token;
      }
    } else {
      // Sinon, utiliser l'API REST
      const response = await apiService.post<{ token: string }>('/auth/refresh-token');
      localStorage.setItem('authToken', response.token);
      return response.token;
    }
  }
}

export default new AuthService(); 