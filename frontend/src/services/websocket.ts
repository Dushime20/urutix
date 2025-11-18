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
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, (update: ShipmentUpdate) => void> = new Map();
  private isConnected = false;

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected to tracking service');
          this.isConnected = true;
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
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.handleReconnection();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
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
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Create a singleton instance
export const trackingWebSocket = new TrackingWebSocket(
  import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001/tracking'
);
