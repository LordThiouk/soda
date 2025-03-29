"use client";

import { useState, useEffect } from "react";
import socketService, { AirplayLog } from "@/lib/websocket";
import apiService from "@/services/apiService";

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

interface UseRealtimeDetectionsOptions {
  channelId?: number | null;
  limit?: number;
  refreshInterval?: number | null;
}

export function useRealtimeDetections(options: UseRealtimeDetectionsOptions = {}) {
  const { channelId = null, limit = 10, refreshInterval = null } = options;
  
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Fetch initial detections and set up WebSocket
  useEffect(() => {
    // Connect to WebSocket if not already
    if (!socketService.isConnected()) {
      socketService.connect();
    }
    
    // Fetch initial detections
    const fetchDetections = async () => {
      try {
        setLoading(true);
        
        let url = `/detection/recent?limit=${limit}`;
        if (channelId) {
          url += `&channelId=${channelId}`;
        }
        
        const data = await apiService.get<{ detections: Detection[] }>(url);
        setDetections(data.detections || []);
        setLastUpdated(new Date().toISOString());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch detections'));
        console.error("Failed to fetch detections:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetections();
    
    // Subscribe to appropriate channel
    if (channelId) {
      socketService.subscribe(`channel:${channelId}`);
    } else {
      socketService.subscribe('airplay_updates');
    }
    
    // Set up listener for new airplay logs
    const unsubscribe = socketService.on('new_airplay', (airplayLog: AirplayLog) => {
      // Filter by channel if needed
      if (channelId && airplayLog.channel_id !== channelId) {
        return;
      }
      
      // Transform to Detection format and add to list
      // This is a simplified example - the actual data format may vary
      const newDetection: Detection = {
        id: airplayLog.id,
        play_timestamp: airplayLog.play_timestamp,
        end_timestamp: airplayLog.end_timestamp || null,
        duration: airplayLog.duration || null,
        detected_at: airplayLog.detected_at,
        songs: {
          id: 0, // These would need to be fetched or provided by the server
          title: "Loading...", 
          artist: "Loading...",
          album: null,
          isrc: null
        },
        channels: {
          id: airplayLog.channel_id,
          name: "Loading...", // This would need to be fetched or provided
          logo_url: null
        }
      };
      
      setDetections(prev => {
        const updated = [newDetection, ...prev];
        return updated.slice(0, limit);
      });
      
      setLastUpdated(new Date().toISOString());
    });
    
    // Set up periodic refresh if requested
    let interval: NodeJS.Timeout | null = null;
    if (refreshInterval) {
      interval = setInterval(fetchDetections, refreshInterval);
    }
    
    // Cleanup
    return () => {
      unsubscribe();
      if (channelId) {
        socketService.unsubscribe(`channel:${channelId}`);
      } else {
        socketService.unsubscribe('airplay_updates');
      }
      
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [channelId, limit, refreshInterval]);
  
  // Manual refresh function
  const refresh = async () => {
    try {
      setLoading(true);
      
      let url = `/detection/recent?limit=${limit}`;
      if (channelId) {
        url += `&channelId=${channelId}`;
      }
      
      const data = await apiService.get<{ detections: Detection[] }>(url);
      setDetections(data.detections || []);
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch detections'));
      console.error("Failed to refresh detections:", err);
    } finally {
      setLoading(false);
    }
  };
  
  return {
    detections,
    loading,
    error,
    lastUpdated,
    refresh
  };
} 