import { io, Socket } from 'socket.io-client';
import { config } from '../config/environment';

export interface LoadStatusUpdate {
  loadId: string;
  status: string;
  timestamp: string;
  updatedBy?: string;
}

class LoadStatusWebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private listeners: Map<string, (update: LoadStatusUpdate) => void> = new Map();
  private subscribedLoads: Set<string> = new Set();

  constructor() {
    // Only initialize if WebSocket is enabled
    if (!config.features.websocket) {
      console.log('WebSocket disabled in config');
      return;
    }
  }

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (!config.features.websocket) {
        console.log('WebSocket disabled, skipping connection');
        resolve();
        return;
      }

      try {
        const wsUrl = config.websocket.url.replace('ws://', 'http://').replace('wss://', 'https://');
        const namespace = '/tracking'; // Using existing tracking namespace
        
        this.socket = io(`${wsUrl}${namespace}`, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.socket.on('connect', () => {
          console.log('✅ Load Status WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Re-subscribe to all previously subscribed loads
          this.subscribedLoads.forEach(loadId => {
            this.subscribeToLoad(loadId);
          });
          
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('❌ Load Status WebSocket disconnected');
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('Load Status WebSocket connection error:', error);
          this.isConnected = false;
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(error);
          }
        });

        // Listen for load status updates
        this.socket.on('load:status:updated', (data: LoadStatusUpdate) => {
          console.log('📦 Load status update received:', data);
          this.notifyListeners(data);
        });

        // Listen for any load updates (broader event)
        this.socket.on('load:updated', (data: any) => {
          if (data.status && data.id) {
            const update: LoadStatusUpdate = {
              loadId: data.id,
              status: data.status,
              timestamp: data.updatedAt || new Date().toISOString(),
              updatedBy: data.updatedBy,
            };
            this.notifyListeners(update);
          }
        });

        // Set connection timeout
        setTimeout(() => {
          if (!this.isConnected) {
            console.warn('Load Status WebSocket connection timeout');
            // Don't reject, just log - connection might still succeed
          }
        }, 10000);
      } catch (error) {
        console.error('Failed to initialize Load Status WebSocket:', error);
        reject(error);
      }
    });
  }

  subscribeToLoad(loadId: string): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot subscribe to load: WebSocket not connected');
      return;
    }

    if (this.subscribedLoads.has(loadId)) {
      return; // Already subscribed
    }

    this.subscribedLoads.add(loadId);
    
    // Join a room for this load (using existing trip room pattern)
    // The backend should handle load status updates similarly to trip status updates
    this.socket.emit('join:load', { loadId });
    console.log(`📦 Subscribed to load status updates: ${loadId}`);
  }

  unsubscribeFromLoad(loadId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    if (!this.subscribedLoads.has(loadId)) {
      return;
    }

    this.subscribedLoads.delete(loadId);
    this.socket.emit('leave:load', { loadId });
    console.log(`📦 Unsubscribed from load status updates: ${loadId}`);
  }

  onStatusUpdate(loadId: string, callback: (update: LoadStatusUpdate) => void): () => void {
    const listenerId = `${loadId}-${Date.now()}`;
    this.listeners.set(listenerId, (update: LoadStatusUpdate) => {
      if (update.loadId === loadId) {
        callback(update);
      }
    });

    // Subscribe to this load if not already subscribed
    this.subscribeToLoad(loadId);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listenerId);
    };
  }

  private notifyListeners(update: LoadStatusUpdate): void {
    this.listeners.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in load status update listener:', error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      // Unsubscribe from all loads
      this.subscribedLoads.forEach(loadId => {
        this.unsubscribeFromLoad(loadId);
      });
      
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      this.subscribedLoads.clear();
      console.log('📦 Load Status WebSocket disconnected');
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const loadStatusWebSocket = new LoadStatusWebSocketService();

