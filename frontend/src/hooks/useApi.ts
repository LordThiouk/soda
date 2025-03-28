import { useState, useCallback } from 'react';

interface UseApiReturn<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export default function useApi<T>(apiFunc: (...args: any[]) => Promise<T>): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      try {
        setIsLoading(true);
        setError(null);
        
        const result = await apiFunc(...args);
        setData(result);
        return result;
      } catch (err: any) {
        const errorObj = err instanceof Error ? err : new Error(err?.message || 'Une erreur est survenue');
        setError(errorObj);
        throw errorObj;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunc]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, error, isLoading, execute, reset };
}

/**
 * Example d'utilisation:
 * 
 * ```tsx
 * import useApi from '@/hooks/useApi';
 * import stationService from '@/services/stationService';
 * 
 * function StationList() {
 *   const { data, error, isLoading, execute } = useApi(stationService.getStations);
 * 
 *   useEffect(() => {
 *     execute();
 *   }, [execute]);
 * 
 *   if (isLoading) return <div>Chargement...</div>;
 *   if (error) return <div>Erreur: {error.message}</div>;
 *   if (!data) return <div>Aucune donnée</div>;
 * 
 *   return (
 *     <div>
 *       {data.stations.map(station => (
 *         <div key={station.id}>{station.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */ 