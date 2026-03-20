import api from './api';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'DRIVER' | 'SHIPPER' | 'DISPATCH' | 'SYSTEM';
  recipientId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  tripId?: string;
  loadId?: string;
}

export interface ChatThread {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  tripId?: string;
  loadId?: string;
}

class MessengerApiService {
  private readonly baseUrl = '/messenger';

  async getThreads(): Promise<ChatThread[]> {
    try {
      const response = await api.get(`${this.baseUrl}/threads`);
      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Fallback for demo
        return [
          {
            id: 'thread-1',
            participantId: 'shipper-123',
            participantName: 'Global Logistics Solutions',
            participantRole: 'SHIPPER',
            unreadCount: 2,
            tripId: 'TRP- Ugandan-001',
            lastMessage: {
              id: 'msg-1',
              senderId: 'shipper-123',
              senderName: 'Global Logistics Solutions',
              senderRole: 'SHIPPER',
              recipientId: 'current-driver',
              content: 'Please confirm when you reach the Malaba border.',
              timestamp: new Date().toISOString(),
              isRead: false
            }
          },
          {
            id: 'thread-2',
            participantId: 'dispatch-456',
            participantName: 'Main Dispatch Hub',
            participantRole: 'DISPATCH',
            unreadCount: 0,
            lastMessage: {
              id: 'msg-2',
              senderId: 'current-driver',
              senderName: 'You',
              senderRole: 'DRIVER',
              recipientId: 'dispatch-456',
              content: 'Fuel levels are optimal. Proceeding to destination.',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              isRead: true
            }
          }
        ];
      }
      throw error;
    }
  }

  async getMessages(threadId: string): Promise<ChatMessage[]> {
    try {
      const response = await api.get(`${this.baseUrl}/threads/${threadId}/messages`);
      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Fallback for demo
        if (threadId === 'thread-1') {
          return [
            {
              id: 'msg-01',
              senderId: 'current-driver',
              senderName: 'You',
              senderRole: 'DRIVER',
              recipientId: 'shipper-123',
              content: 'I have departed from Kampala. ETA to border is 4 hours.',
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              isRead: true
            },
            {
              id: 'msg-1',
              senderId: 'shipper-123',
              senderName: 'Global Logistics Solutions',
              senderRole: 'SHIPPER',
              recipientId: 'current-driver',
              content: 'Please confirm when you reach the Malaba border.',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              isRead: false
            }
          ];
        }
        return [];
      }
      throw error;
    }
  }

  async sendMessage(recipientId: string, content: string, options: { tripId?: string; loadId?: string } = {}): Promise<ChatMessage> {
    const response = await api.post(`${this.baseUrl}/send`, {
      recipientId,
      content,
      ...options
    });
    return response.data;
  }

  async markAsRead(threadId: string): Promise<void> {
    await api.post(`${this.baseUrl}/threads/${threadId}/read`);
  }
}

export const messengerApi = new MessengerApiService();
export default messengerApi;
