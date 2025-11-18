import api from '../api';

export interface Notification {
  id: string;
  tenantId: string;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientDeviceTokens: string[];
  entityType?: string;
  entityId?: string;
  notificationType: string;
  category: string;
  status: string;
  priority: string;
  title: string;
  message: string;
  shortMessage?: string;
  channels: string[];
  channelData: Record<string, any>;
  tags: string[];
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  expiresAt?: string;
  requiresAction: boolean;
  actionUrl?: string;
  actionText?: string;
  actionData: Record<string, any>;
  attachments: NotificationAttachment[];
  deliveryAttempts: DeliveryAttempt[];
  userPreferences: Record<string, any>;
  analytics: Record<string, any>;
  relatedNotifications: string[];
  workflowInfo: Record<string, any>;
  escalationInfo: Record<string, any>;
  complianceInfo: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deleted_at?: string;
}

export interface NotificationAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface DeliveryAttempt {
  channel: string;
  attemptedAt: string;
  success: boolean;
  error?: string;
  responseData?: Record<string, any>;
}

export interface CreateNotificationRequest {
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientDeviceTokens?: string[];
  entityType?: string;
  entityId?: string;
  notificationType: string;
  category: string;
  title: string;
  message: string;
  shortMessage?: string;
  channels: string[];
  priority?: string;
  requiresAction?: boolean;
  actionUrl?: string;
  actionText?: string;
  actionData?: Record<string, any>;
  tags?: string[];
  scheduledAt?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationRequest {
  title?: string;
  message?: string;
  shortMessage?: string;
  channels?: string[];
  priority?: string;
  requiresAction?: boolean;
  actionUrl?: string;
  actionText?: string;
  actionData?: Record<string, any>;
  tags?: string[];
  scheduledAt?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilterRequest {
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
}

export interface NotificationSearchRequest {
  query: string;
  entityTypes?: string[];
  categories?: string[];
  limit?: number;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BulkNotificationUpdateRequest {
  notificationIds: string[];
  status: string;
  notes?: string;
}

export class NotificationApiService {
  private readonly baseUrl = '/notifications';

  // Create a new notification
  async createNotification(
    createRequest: CreateNotificationRequest
  ): Promise<Notification> {
    const response = await api.post(this.baseUrl, createRequest);
    return response.data;
  }

  // Get notifications with filtering and pagination
  async getNotifications(
    filter: NotificationFilterRequest = {}
  ): Promise<NotificationResponse> {
    const params = new URLSearchParams();
    // Append only meaningful values; skip empty strings and empty arrays
    Object.entries(filter).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.filter(v => v !== undefined && v !== null && String(v).trim() !== '')
             .forEach(v => params.append(key, String(v)));
        return;
      }
      const str = String(value);
      if (str.trim() === '') return;
      params.append(key, str);
    });
    try {
      const response = await api.get(`${this.baseUrl}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications list, falling back to /my:', error);
      // Fallback: use current user's notifications and paginate client-side
      const page = Number(filter.page || 1);
      const limit = Number(filter.limit || 20);
      const all = await this.getMyNotifications(500);
      // Apply basic client-side filtering if provided
      const filtered = all.filter((n) => {
        if (filter.category && String(filter.category).trim() && n.category !== filter.category) return false;
        if (filter.status && String(filter.status).trim() && n.status !== filter.status) return false;
        if (filter.priority && String(filter.priority).trim() && n.priority !== filter.priority) return false;
        if (filter.search && String(filter.search).trim()) {
          const q = String(filter.search).toLowerCase();
          const hay = `${n.title} ${n.message} ${n.shortMessage || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      const notifications = filtered.slice(start, start + limit);
      return { notifications, total, page, limit, totalPages };
    }
  }

  // Search notifications
  async searchNotifications(
    searchRequest: NotificationSearchRequest
  ): Promise<Notification[]> {
    const params = new URLSearchParams();
    
    Object.entries(searchRequest).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const response = await api.get(`${this.baseUrl}/search?${params.toString()}`);
    return response.data;
  }

  // Get current user notifications
  async getMyNotifications(limit: number = 50): Promise<Notification[]> {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // No token available; avoid network call
      return [];
    }
    try {
      const response = await api.get(`${this.baseUrl}/my?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.warn('Unauthorized when fetching my notifications. Returning empty list.');
        return [];
      }
      if (error?.response?.status === 500) {
        console.error('Server error when fetching notifications:', error.response?.data);
        // Return empty array instead of throwing to prevent cascading failures
        return [];
      }
      throw error;
    }
  }

  // Get unread notifications count
  async getUnreadCount(): Promise<{ count: number }> {
    try {
      // Use the dedicated backend endpoint for better performance
      const response = await api.get(`${this.baseUrl}/my/unread-count`);
      return response.data;
    } catch (error) {
      console.error('Failed to get unread count from backend, falling back to computed count:', error);
      // Fallback: compute from user notifications if backend fails
      try {
        const myNotifications = await this.getMyNotifications(50); // Reduced limit for fallback
        const count = myNotifications.filter((n) => !n.readAt && n.status !== 'READ').length;
        return { count };
      } catch (fallbackError) {
        console.error('Fallback unread count also failed:', fallbackError);
        return { count: 0 };
      }
    }
  }

  // Get notifications by entity
  async getNotificationsByEntity(
    entityType: string,
    entityId: string
  ): Promise<Notification[]> {
    const response = await api.get(
      `${this.baseUrl}/entity/${entityType}/${entityId}`
    );
    return response.data;
  }

  // Get scheduled notifications
  async getScheduledNotifications(): Promise<Notification[]> {
    const response = await api.get(`${this.baseUrl}/scheduled`);
    return response.data;
  }

  // Get expired notifications
  async getExpiredNotifications(): Promise<Notification[]> {
    const response = await api.get(`${this.baseUrl}/expired`);
    return response.data;
  }

  // Get notification by ID
  async getNotificationById(id: string): Promise<Notification> {
    const response = await api.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Update notification
  async updateNotification(
    id: string,
    updateRequest: UpdateNotificationRequest
  ): Promise<Notification> {
    const response = await api.put(`${this.baseUrl}/${id}`, updateRequest);
    return response.data;
  }

  // Mark notification as read
  async markAsRead(id: string): Promise<Notification> {
    const response = await api.post(`${this.baseUrl}/${id}/read`);
    return response.data;
  }

  // Bulk mark notifications as read
  async bulkMarkAsRead(notificationIds: string[]): Promise<Notification[]> {
    const response = await api.post(`${this.baseUrl}/bulk/read`, {
      notificationIds,
    });
    return response.data;
  }

  // Bulk update notification status
  async bulkUpdateStatus(
    bulkUpdateRequest: BulkNotificationUpdateRequest
  ): Promise<Notification[]> {
    const response = await api.post(
      `${this.baseUrl}/bulk/status`,
      bulkUpdateRequest
    );
    return response.data;
  }

  // Delete notification
  async deleteNotification(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  // Process scheduled notifications
  async processScheduledNotifications(): Promise<{ message: string }> {
    const response = await api.post(`${this.baseUrl}/process-scheduled`);
    return response.data;
  }

  // Cleanup expired notifications
  async cleanupExpiredNotifications(): Promise<{ message: string }> {
    const response = await api.post(`${this.baseUrl}/cleanup-expired`);
    return response.data;
  }

  // Test notification channel
  async testNotificationChannel(channel: string): Promise<{ message: string }> {
    const response = await api.post(`${this.baseUrl}/test/${channel}`);
    return response.data;
  }

  // Send immediate notification (helper method)
  async sendImmediateNotification(
    recipientId: string,
    title: string,
    message: string,
    options: {
      category?: string;
      priority?: string;
      channels?: string[];
      requiresAction?: boolean;
      actionUrl?: string;
      actionText?: string;
    } = {}
  ): Promise<Notification> {
    const notificationData: CreateNotificationRequest = {
      recipientId,
      title,
      message,
      notificationType: 'GENERAL',
      category: options.category || 'SYSTEM',
      channels: options.channels || ['IN_APP'],
      priority: options.priority || 'NORMAL',
      requiresAction: options.requiresAction || false,
      actionUrl: options.actionUrl,
      actionText: options.actionText,
    };

    return this.createNotification(notificationData);
  }

  // Send scheduled notification (helper method)
  async sendScheduledNotification(
    recipientId: string,
    title: string,
    message: string,
    scheduledAt: string,
    options: {
      category?: string;
      priority?: string;
      channels?: string[];
      requiresAction?: boolean;
      actionUrl?: string;
      actionText?: string;
    } = {}
  ): Promise<Notification> {
    const notificationData: CreateNotificationRequest = {
      recipientId,
      title,
      message,
      scheduledAt,
      notificationType: 'SCHEDULED',
      category: options.category || 'SYSTEM',
      channels: options.channels || ['IN_APP'],
      priority: options.priority || 'NORMAL',
      requiresAction: options.requiresAction || false,
      actionUrl: options.actionUrl,
      actionText: options.actionText,
    };

    return this.createNotification(notificationData);
  }

  // Get notification status color
  getNotificationStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      PENDING: 'text-yellow-600',
      SENT: 'text-blue-600',
      DELIVERED: 'text-green-600',
      READ: 'text-green-800',
      FAILED: 'text-red-600',
      CANCELLED: 'text-gray-500',
    };
    
    return statusColors[status] || 'text-gray-500';
  }

  // Get notification priority color
  getNotificationPriorityColor(priority: string): string {
    const priorityColors: Record<string, string> = {
      LOW: 'text-gray-500',
      NORMAL: 'text-blue-600',
      HIGH: 'text-orange-600',
      URGENT: 'text-red-600',
      CRITICAL: 'text-red-800',
    };
    
    return priorityColors[priority] || 'text-gray-500';
  }

  // Check if notification is expired
  isNotificationExpired(notification: Notification): boolean {
    if (!notification.expiresAt) return false;
    return new Date(notification.expiresAt) < new Date();
  }

  // Check if notification is scheduled
  isNotificationScheduled(notification: Notification): boolean {
    if (!notification.scheduledAt) return false;
    return new Date(notification.scheduledAt) > new Date();
  }

  // Check if notification is delivered
  isNotificationDelivered(notification: Notification): boolean {
    return notification.status === 'DELIVERED' || notification.status === 'READ';
  }

  // Check if notification is failed
  isNotificationFailed(notification: Notification): boolean {
    return notification.status === 'FAILED';
  }

  // Get notification channel icon
  getChannelIcon(channel: string): string {
    const channelIcons: Record<string, string> = {
      EMAIL: '📧',
      SMS: '📱',
      PUSH: '🔔',
      WEBHOOK: '🔗',
      IN_APP: '💬',
      SLACK: '💼',
      TEAMS: '👥',
    };
    
    return channelIcons[channel] || '📢';
  }

  // Format notification timestamp
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Get notification category icon
  getCategoryIcon(category: string): string {
    const categoryIcons: Record<string, string> = {
      SYSTEM: '⚙️',
      DRIVER: '🚗',
      VEHICLE: '🚛',
      CARGO: '📦',
      TRIP: '🗺️',
      FINANCIAL: '💰',
      COMPLIANCE: '📋',
      OTHER: '📢',
    };
    
    return categoryIcons[category] || '📢';
  }
}

export const notificationApi = new NotificationApiService();
