import { Socket, io } from 'socket.io-client';

// Types
export interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  data?: any;
  created_at: string;
}

export interface AirplayLog {
  id: number;
  channel_id: number;
  song_id?: number;
  play_timestamp: string;
  end_timestamp?: string;
  duration?: number;
  detected_at: string;
}

export interface ChannelStatus {
  id: number;
  name: string;
  type: 'radio' | 'tv';
  status: 'online' | 'offline' | 'issues';
  last_detection?: string;
  logo_url?: string;
}

export interface ReportUpdate {
  id: number;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_by: string;
  created_at: string;
  updated_at: string;
}

// WebSocket Service
class WebSocketService {
  private socket: Socket | null = null;
  private isAuthenticatedFlag: boolean = false;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:5000';
  }

  // Connect to socket server
  connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(this.baseURL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity
    });

    // Set up default listeners
    this.setupListeners();

    return this.socket;
  }

  // Disconnect from socket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isAuthenticatedFlag = false;
    }
  }

  // Check if socket is connected
  isConnected(): boolean {
    return !!this.socket && this.socket.connected;
  }

  // Check if socket is authenticated
  isAuthenticated(): boolean {
    return this.isAuthenticatedFlag;
  }

  // Authenticate socket connection with JWT
  authenticate(token: string): void {
    if (!this.socket || !this.isConnected()) {
      this.connect();
    }

    this.socket?.emit('authenticate', token);
  }

  // Subscribe to a channel
  subscribe(channel: string): void {
    if (!this.socket || !this.isConnected()) {
      this.connect();
    }

    this.socket?.emit('subscribe', channel);
  }

  // Unsubscribe from a channel
  unsubscribe(channel: string): void {
    if (this.socket && this.isConnected()) {
      this.socket.emit('unsubscribe', channel);
    }
  }

  // Register an event listener
  on<T>(event: string, callback: (data: T) => void): () => void {
    if (!this.socket) {
      this.connect();
    }

    // Store callback in internal registry for management
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);

    // Register with socket.io
    this.socket?.on(event, callback);

    // Return unsubscribe function
    return () => {
      this.socket?.off(event, callback);
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  // Emit an event
  emit(event: string, data?: any): void {
    if (!this.socket || !this.isConnected()) {
      this.connect();
    }

    this.socket?.emit(event, data);
  }

  // Set up default event listeners
  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isAuthenticatedFlag = false;
    });

    this.socket.on('authenticated', () => {
      console.log('WebSocket authenticated');
      this.isAuthenticatedFlag = true;
    });

    this.socket.on('auth_error', (error) => {
      console.error('WebSocket authentication error:', error);
      this.isAuthenticatedFlag = false;
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }
}

// Create singleton instance
const socketService = new WebSocketService();

export default socketService; 