import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  isRead: boolean;
  category?: string;
  priority?: string;
  createdAt?: string;
}

export const useNotifications = () => {
  console.log('🔔 [HOOK] useNotifications hook called');
  const { user } = useAuth();
  console.log('🔔 [HOOK] Current user:', user);
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch existing notifications from API
  const { data: apiNotifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      console.log('🔔 [NOTIFICATIONS] Fetching notifications for user:', {
        userId: user?.id,
        userRole: user?.role,
        userName: user?.name,
        tenantId: user?.tenantId,
      });
      const response = await notificationsAPI.getAll({ limit: 50 });
      console.log('🔔 [NOTIFICATIONS] API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
      console.log('🔔 [NOTIFICATIONS] Response data:', response.data);
      
      // Backend returns array directly, not wrapped in { notifications: [] }
      const notifications = Array.isArray(response.data) ? response.data : [];
      console.log('🔔 [NOTIFICATIONS] Notifications array:', notifications);
      console.log('🔔 [NOTIFICATIONS] Notifications count:', notifications.length);
      
      // Log each notification
      if (notifications.length > 0) {
        notifications.forEach((notif: any, index: number) => {
          console.log(`🔔 [NOTIFICATIONS] Notification ${index + 1}:`, {
            id: notif.id,
            type: notif.type || notif.notificationType,
            title: notif.title,
            message: notif.message,
            status: notif.status,
            category: notif.category,
            priority: notif.priority,
            createdAt: notif.createdAt,
            recipientId: notif.recipientId,
          });
        });
      } else {
        console.log('🔔 [NOTIFICATIONS] No notifications found');
      }
      
      return notifications;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  });

  // Fetch unread count
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      console.log('🔔 [UNREAD COUNT] Fetching unread count for user:', {
        userId: user?.id,
        userRole: user?.role,
        userName: user?.name,
      });
      const response = await notificationsAPI.getUnreadCount();
      console.log('🔔 [UNREAD COUNT] API response:', {
        status: response.status,
        data: response.data,
        count: response.data?.count,
      });
      return response.data;
    },
    enabled: !!user,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001';
    
    const newSocket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Notifications: Connected to WebSocket');
      setIsConnected(true);
      
      // Join user-specific room
      newSocket.emit('join:user', { userId: user.id });
    });

    newSocket.on('disconnect', () => {
      console.log('Notifications: Disconnected from WebSocket');
      setIsConnected(false);
    });

    // Listen for new notifications
    newSocket.on('notification:new', (data: any) => {
      console.log('🔔 [WEBSOCKET] New notification received:', {
        data,
        currentUser: user?.id,
        currentRole: user?.role,
      });
      
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user.id] });
      
      // Show toast
      toast.success(data.title || 'New notification', {
        duration: 5000,
      });
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave:user', { userId: user.id });
        newSocket.close();
      }
    };
  }, [user, queryClient]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user?.id, queryClient]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.id, queryClient]);

  const unreadCount = unreadCountData?.count || 0;
  const notifications = apiNotifications.map((n: any) => ({
    id: n.id,
    type: n.notificationType || n.type || 'general',
    title: n.title,
    message: n.message,
    data: n.metadata || n.data,
    timestamp: n.createdAt || n.timestamp,
    isRead: n.status === 'READ',
    category: n.category,
    priority: n.priority,
  }));

  console.log('🔔 [FINAL STATE] Notifications state:', {
    apiNotificationsCount: apiNotifications.length,
    notificationsCount: notifications.length,
    unreadCount,
    unreadCountData,
    isLoading,
    userRole: user?.role,
    userId: user?.id,
  });
  
  // Log first 3 notifications for debugging
  if (notifications.length > 0) {
    console.log('🔔 [FINAL STATE] First 3 notifications:', notifications.slice(0, 3));
  }

  return {
    notifications,
    isConnected,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  };
};
