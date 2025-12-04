export interface ShipmentUpdate {
  shipmentId: string;
  type: 'LOCATION_UPDATE' | 'STATUS_UPDATE' | 'PROGRESS_UPDATE' | 'DELIVERY_UPDATE';
  data: {
    currentLocation?: {
      latitude: number;
      longitude: number;
      timestamp: string;
    };
    status?: string;
    progress?: number;
    actualDelivery?: string;
    actualPickup?: string;
  };
}

export class TrackingWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // Reduced attempts
  private reconnectDelay = 2000; // Increased delay
  private listeners: Map<string, (update: ShipmentUpdate) => void> = new Map();
  private isConnected = false;
  private isConnecting = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private enabled: boolean;

  constructor(private url: string, enabled: boolean = true) {
    this.enabled = enabled;
  }

  connect(): Promise<void> {
    // If WebSocket is disabled, return early without attempting connection
    if (!this.enabled) {
      return Promise.resolve();
    }

    // If already connecting, return early
    if (this.isConnecting) {
      return Promise.resolve();
    }

    // If already connected, resolve immediately
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        
        // Set connection timeout (5 seconds)
        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            this.ws.close();
            this.isConnecting = false;
            // Silently fail - don't reject, just resolve without connection
            console.warn('WebSocket connection timeout - continuing without real-time updates');
            resolve();
          }
        }, 5000);

        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          console.log('✅ WebSocket connected to tracking service');
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const update: ShipmentUpdate = JSON.parse(event.data);
            this.notifyListeners(update);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.isConnected = false;
          this.isConnecting = false;
          
          // Only attempt reconnection if it was previously connected and enabled
          if (this.enabled && (this.reconnectAttempts === 0 || this.reconnectAttempts < this.maxReconnectAttempts)) {
            this.handleReconnection();
          }
        };

        this.ws.onerror = (error) => {
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          this.isConnecting = false;
          
          // Silently fail - don't log errors to avoid console spam
          // WebSocket server might not be available, which is okay
          resolve(); // Resolve instead of reject to not break the app
        };
      } catch (error) {
        this.isConnecting = false;
        // Silently fail - resolve instead of reject
        resolve();
      }
    });
  }

  private handleReconnection(): void {
    // Don't reconnect if disabled
    if (!this.enabled) {
      return;
    }

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      // Don't log reconnection attempts to reduce console noise
      this.reconnectTimeout = setTimeout(() => {
        if (this.enabled) {
          this.connect().catch(() => {
            // Silently handle reconnection failures
          });
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
    // Silently stop reconnecting after max attempts (no console log)
  }

  subscribe(shipmentId: string, callback: (update: ShipmentUpdate) => void): () => void {
    this.listeners.set(shipmentId, callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(shipmentId);
    };
  }

  private notifyListeners(update: ShipmentUpdate): void {
    const listener = this.listeners.get(update.shipmentId);
    if (listener) {
      listener(update);
    }
  }

  sendMessage(message: any): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }

  disconnect(): void {
    // Clear timeouts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    // Safely close WebSocket if it exists
    if (this.ws) {
      // Only close if not already closed or closing
      if (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.close();
        } catch (error) {
          // Ignore errors when closing
        }
      }
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Enable or disable WebSocket (useful for testing or when server is unavailable)
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.isConnected) {
      this.disconnect();
    }
  }
}

// Import config for WebSocket settings
import { config } from '../config/environment';

// Get WebSocket URL from config
const getWebSocketUrl = (): string => {
  return config.websocket.url;
};

// Create a singleton instance
// WebSocket is optional - app will work without it
export const trackingWebSocket = new TrackingWebSocket(
  getWebSocketUrl(),
  config.websocket.enabled
);
