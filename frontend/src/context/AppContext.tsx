'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import authService, { User } from '@/services/authService';
import reportService, { DashboardStats } from '@/services/reportService';
import { useWebSocket } from '@/lib/hooks/useWebSocket';

interface AppContextType {
  user: User | null;
  isLoading: boolean;
  dashboardStats: DashboardStats | null;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  refreshDashboardStats: () => Promise<void>;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
  wsConnected: boolean;
  wsAuthenticated: boolean;
}

// Valeurs par défaut pour le contexte
const defaultDashboardStats: DashboardStats = {
  songs: { total: 0, identified_with_isrc: 0 },
  channels: { total: 0, active: 0, radio: 0, tv: 0 },
  detections: { total: 0, today: 0, this_week: 0 },
  top_channels: [],
  top_songs: []
};

// Création du contexte
const AppContext = createContext<AppContextType | undefined>(undefined);

// Fournisseur du contexte
export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { user, isLoading: authLoading, isAuthenticated, logout, hasRole } = auth;
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Initialize WebSocket
  const { connected: wsConnected, authenticated: wsAuthenticated } = useWebSocket();

  // Fermer la sidebar sur mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Vérifier au chargement
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fermer la sidebar lors du changement de page sur mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Auto-fetch dashboard stats when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshDashboardStats();
    }
  }, [isAuthenticated, user]);

  // Refresh dashboard stats
  const refreshDashboardStats = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoadingStats(true);
      const stats = await reportService.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fonction pour basculer l'état de la sidebar
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Combined loading state
  const isLoading = authLoading || isLoadingStats;

  // Valeur du contexte
  const contextValue: AppContextType = {
    user,
    isLoading,
    dashboardStats,
    sidebarOpen,
    toggleSidebar,
    refreshDashboardStats,
    isAuthenticated,
    logout,
    hasRole,
    wsConnected,
    wsAuthenticated
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// Hook pour utiliser le contexte
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 