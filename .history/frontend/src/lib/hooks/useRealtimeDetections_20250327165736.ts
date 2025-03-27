"use client";

import { useState, useEffect } from "react";
import { subscribeToNewDetections, fetchRecentDetections } from "@/lib/supabase";

interface Detection {
  id: number;
  play_timestamp: string;
  end_timestamp: string | null;
  duration: number | null;
  detected_at: string;
  songs: {
    id: number;
    title: string;
    artist: string;
    album: string | null;
    isrc: string | null;
  };
  channels: {
    id: number;
    name: string;
    logo_url: string | null;
  };
}

interface UseRealtimeDetectionsProps {
  channelId?: number | null;
  limit?: number;
  refreshInterval?: number | null;
  autoSubscribe?: boolean;
}

export function useRealtimeDetections({
  channelId = null,
  limit = 10,
  refreshInterval = null,
  autoSubscribe = true
}: UseRealtimeDetectionsProps = {}) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Charger les détections
  const loadDetections = async () => {
    try {
      setLoading(true);
      const data = await fetchRecentDetections(limit);
      setDetections(data as Detection[]);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch detections'));
      console.error("Failed to fetch detections:", err);
    } finally {
      setLoading(false);
    }
  };

  // Gérer les nouvelles détections
  const handleNewDetection = async (payload: any) => {
    try {
      // Fetch the complete detection with joined data
      const data = await fetchRecentDetections(1);
      if (data && data.length > 0) {
        setDetections(prevDetections => {
          // Add to the beginning and ensure we don't exceed our limit
          const newDetections = [data[0] as Detection, ...prevDetections];
          return newDetections.slice(0, limit);
        });
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error handling new detection:", err);
    }
  };

  // S'abonner aux nouvelles détections
  useEffect(() => {
    loadDetections();

    let unsubscribe: () => void;
    
    if (autoSubscribe) {
      unsubscribe = subscribeToNewDetections(channelId, handleNewDetection);
    }

    // Configurer un intervalle de rafraîchissement si spécifié
    let intervalId: NodeJS.Timeout | undefined;
    if (refreshInterval) {
      intervalId = setInterval(() => {
        loadDetections();
      }, refreshInterval);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [channelId, limit, autoSubscribe, refreshInterval]);

  return {
    detections,
    loading,
    error,
    lastUpdated,
    refresh: loadDetections
  };
} 