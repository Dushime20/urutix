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

  // Generate deterministic thread ID from two user IDs
  private generateThreadId(userId1: string, userId2: string): string {
    // Sort to ensure consistent thread ID regardless of order
    const sorted = [userId1, userId2].sort();
    return `thread-${sorted[0]}-${sorted[1]}`;
  }

  async getThreads(): Promise<ChatThread[]> {
    try {
      const response = await api.get(`${this.baseUrl}/threads`);
      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        // Return empty array if endpoint not available or error
        console.warn('Messenger API not available, returning empty threads');
        return [];
      }
      throw error;
    }
  }

  async getMessages(threadId: string): Promise<ChatMessage[]> {
    try {
      const response = await api.get(`${this.baseUrl}/threads/${threadId}/messages`);
      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        // Return empty array if no messages or error
        console.warn('No messages found for thread:', threadId);
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
