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
      // Ensure each detection has the proper structure before adding it to state
      const formattedData = data.map((det: any) => {
        return {
          id: det.id,
          play_timestamp: det.play_timestamp,
          end_timestamp: det.end_timestamp,
          duration: det.duration,
          detected_at: det.detected_at,
          songs: Array.isArray(det.songs) && det.songs.length > 0 ? det.songs[0] : det.songs,
          channels: Array.isArray(det.channels) && det.channels.length > 0 ? det.channels[0] : det.channels
        } as Detection;
      });
      setDetections(formattedData);
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
        // Format the detection data
        const formattedDetection = {
          id: data[0].id,
          play_timestamp: data[0].play_timestamp,
          end_timestamp: data[0].end_timestamp,
          duration: data[0].duration,
          detected_at: data[0].detected_at,
          songs: Array.isArray(data[0].songs) && data[0].songs.length > 0 ? data[0].songs[0] : data[0].songs,
          channels: Array.isArray(data[0].channels) && data[0].channels.length > 0 ? data[0].channels[0] : data[0].channels
        } as Detection;
        
        setDetections(prevDetections => {
          // Add to the beginning and ensure we don't exceed our limit
          const newDetections = [formattedDetection, ...prevDetections];
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