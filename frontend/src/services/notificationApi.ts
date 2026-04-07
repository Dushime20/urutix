import api from './api';

export interface Notification {
  id: string;
  recipientId: string;
  tenantId: string;
  entityType?: string;
  entityId?: string;
  notificationType: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  shortMessage?: string;
  channels: string[];
  isRead: boolean;
  readAt?: string;
  requiresAction?: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilters {
  recipientId?: string;
  entityType?: string;
  entityId?: string;
  notificationType?: string;
  category?: string;
  status?: string;
  priority?: string;
  isRead?: boolean;
  requiresAction?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const notificationApi = {
  // Get current user's notifications
  getMyNotifications: async (limit: number = 50): Promise<Notification[]> => {
    const response = await api.get(`/notifications/my?limit=${limit}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/notifications/my/unread-count');
    return response.data;
  },

  // Get notifications with filters
  getNotifications: async (filters: NotificationFilters): Promise<{ notifications: Notification[]; total: number }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data;
  },

  // Search notifications
  searchNotifications: async (query: string, limit: number = 20): Promise<Notification[]> => {
    const response = await api.get(`/notifications/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  // Get notification by ID
  getNotificationById: async (id: string): Promise<Notification> => {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  // Bulk mark as read
  bulkMarkAsRead: async (notificationIds: string[]): Promise<Notification[]> => {
    const response = await api.post('/notifications/bulk/read', { notificationIds });
    return response.data;
  },

  // Delete notification
  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  // Create notification (admin only)
  createNotification: async (data: Partial<Notification>): Promise<Notification> => {
    const response = await api.post('/notifications', data);
    return response.data;
  },
};

export default notificationApi;
