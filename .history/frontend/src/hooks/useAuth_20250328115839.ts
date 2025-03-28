import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import authService, { User, LoginCredentials, RegisterData } from '@/services/authService';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
}

export default function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fonction de connexion
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const loggedUser = await authService.login(credentials);
      setUser(loggedUser);
      router.push('/dashboard');
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fonction d'inscription
  const register = useCallback(async (data: RegisterData) => {
    try {
      setIsLoading(true);
      await authService.register(data);
      // Après l'inscription, rediriger vers la page de connexion
      router.push('/login');
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Fonction de déconnexion
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = useCallback((role: string | string[]) => {
    return authService.hasRole(role);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    hasRole,
  };
} 