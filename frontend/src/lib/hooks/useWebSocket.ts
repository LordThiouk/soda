"use client";

import { useEffect, useState } from "react";
import socketService from "@/lib/websocket";
import useAuth from "@/hooks/useAuth";

export interface WebSocketState {
  connected: boolean;
  authenticated: boolean;
}

export const useWebSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  
  useEffect(() => {
    // Connect to WebSocket on mount and track status
    socketService.connect();
    
    // Check initial connection state
    setConnected(socketService.isConnected());
    setAuthenticated(socketService.isAuthenticated());
    
    // Set up event listeners
    const unsubscribeConnect = socketService.on<void>('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });
    
    const unsubscribeDisconnect = socketService.on<void>('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      setAuthenticated(false);
    });
    
    const unsubscribeAuthenticated = socketService.on<void>('authenticated', () => {
      console.log('WebSocket authenticated');
      setAuthenticated(true);
    });
    
    const unsubscribeAuthError = socketService.on<{message: string}>('auth_error', (error) => {
      console.error('WebSocket authentication error:', error);
      setAuthenticated(false);
    });
    
    return () => {
      // Clean up on unmount
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeAuthenticated();
      unsubscribeAuthError();
      
      // Don't disconnect on cleanup as other components might be using the connection
      // socketService.disconnect();
    };
  }, []);
  
  // Authenticate when user changes
  useEffect(() => {
    // If we have a user and authentication token, authenticate the WebSocket
    if (isAuthenticated && user) {
      const token = localStorage.getItem('authToken');
      if (token) {
        socketService.authenticate(token);
      }
    } else {
      setAuthenticated(false);
    }
  }, [isAuthenticated, user]);
  
  // In development mode, simulate an authenticated state
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !authenticated) {
      console.warn("WebSocket: Using development mode, simulating authenticated state");
      setAuthenticated(true);
    }
  }, [authenticated]);
  
  return {
    connected,
    authenticated,
    subscribe: socketService.subscribe.bind(socketService),
    unsubscribe: socketService.unsubscribe.bind(socketService),
    on: socketService.on.bind(socketService),
    emit: socketService.emit.bind(socketService),
    authenticate: socketService.authenticate.bind(socketService),
  };
}; 