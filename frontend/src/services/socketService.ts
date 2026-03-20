import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '../config/environment';

class SocketService {
  private socket: Socket | null = null;
  private baseURL = getApiBaseUrl().replace('/api', '');

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(`${this.baseURL}/events`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('📡 Connected to UrutiX Neural Events System');
    });

    this.socket.on('disconnect', () => {
      console.log('📡 Disconnected from UrutiX Neural Events System');
    });

    this.socket.on('error', (error) => {
      console.error('📡 Socket Error:', error);
    });
  }

  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();
