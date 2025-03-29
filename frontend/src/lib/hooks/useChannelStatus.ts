"use client";

import { useState, useEffect } from "react";
import socketService, { ChannelStatus } from "@/lib/websocket";
import apiService from "@/services/apiService";

export function useChannelStatus() {
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Fetch initial channel statuses and set up WebSocket
  useEffect(() => {
    // Connect to WebSocket if not already
    if (!socketService.isConnected()) {
      socketService.connect();
    }
    
    // Fetch initial channel statuses
    const fetchChannels = async () => {
      try {
        setLoading(true);
        const data = await apiService.get<{ channels: ChannelStatus[] }>('/channels/statuses');
        setChannels(data.channels || []);
        setLastUpdated(new Date().toISOString());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch channel statuses'));
        console.error("Failed to fetch channel statuses:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChannels();
    
    // Subscribe to channel updates
    socketService.subscribe('channel_updates');
    
    // Set up listener for channel status updates
    const unsubscribe = socketService.on('channel_status', (channelUpdate: ChannelStatus) => {
      setChannels(prev => {
        const index = prev.findIndex(c => c.id === channelUpdate.id);
        if (index === -1) {
          // This is a new channel
          return [...prev, channelUpdate];
        } else {
          // Update existing channel
          const updated = [...prev];
          updated[index] = channelUpdate;
          return updated;
        }
      });
      
      setLastUpdated(new Date().toISOString());
    });
    
    // Cleanup
    return () => {
      unsubscribe();
      socketService.unsubscribe('channel_updates');
    };
  }, []);
  
  // Manual refresh function
  const refresh = async () => {
    try {
      setLoading(true);
      const data = await apiService.get<{ channels: ChannelStatus[] }>('/channels/statuses');
      setChannels(data.channels || []);
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch channel statuses'));
      console.error("Failed to refresh channel statuses:", err);
    } finally {
      setLoading(false);
    }
  };
  
  return {
    channels,
    loading,
    error,
    lastUpdated,
    refresh
  };
} 