import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

export interface UrutixNotification {
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
  actionUrl?: string;
  actionText?: string;
}

/** Returns true when a raw API notification object should be considered "read" */
function isNotificationRead(n: any): boolean {
  return (
    n.isRead === true ||
    n.status === 'READ' ||
    (typeof n.readAt === 'string' && n.readAt.length > 0)
  );
}

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // ── Fetch notifications ──────────────────────────────────────────────────
  const { data: apiNotifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const response = await notificationsAPI.getAll({ limit: 50 });
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 0,
  });

  // ── Fetch unread count ───────────────────────────────────────────────────
  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      const response = await notificationsAPI.getUnreadCount();
      return response.data;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  // ── WebSocket for real-time updates ─────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001';

    const newSocket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join:user', { userId: user.id });
    });

    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('notification:new', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user.id] });
      toast(data.title || 'New notification', {
        icon: '🔔',
        duration: 5000,
      });
    });

    // Also listen on the events namespace event name used by NotificationContext
    newSocket.on('notification', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user.id] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave:user', { userId: user.id });
      newSocket.close();
    };
  }, [user, queryClient]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      // Optimistic update
      queryClient.setQueryData(['notifications', user?.id], (old: any[]) =>
        (old || []).map((n: any) =>
          n.id === notificationId
            ? { ...n, isRead: true, status: 'READ', readAt: new Date().toISOString() }
            : n
        )
      );
      queryClient.setQueryData(['notifications-unread-count', user?.id], (old: any) => ({
        count: Math.max(0, (old?.count ?? 1) - 1),
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user?.id, queryClient]);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = (apiNotifications as any[])
        .filter((n: any) => !isNotificationRead(n))
        .map((n: any) => n.id);
      if (unreadIds.length === 0) return;
      await notificationsAPI.bulkMarkAsRead(unreadIds);
      // Optimistic update
      queryClient.setQueryData(['notifications', user?.id], (old: any[]) =>
        (old || []).map((n: any) => ({
          ...n,
          isRead: true,
          status: 'READ',
          readAt: new Date().toISOString(),
        }))
      );
      queryClient.setQueryData(['notifications-unread-count', user?.id], { count: 0 });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?.id, queryClient, apiNotifications]);

  const removeNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationsAPI.delete(notificationId);
      queryClient.setQueryData(['notifications', user?.id], (old: any[]) =>
        (old || []).filter((n: any) => n.id !== notificationId)
      );
      queryClient.setQueryData(['notifications-unread-count', user?.id], (old: any) => {
        const wasUnread = (apiNotifications as any[]).find(
          (n: any) => n.id === notificationId && !isNotificationRead(n)
        );
        return { count: Math.max(0, (old?.count ?? 0) - (wasUnread ? 1 : 0)) };
      });
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  }, [user?.id, queryClient, apiNotifications]);

  // ── Derived state ────────────────────────────────────────────────────────
  const notifications: UrutixNotification[] = (apiNotifications as any[]).map((n: any) => ({
    id: n.id,
    type: n.notificationType || n.type || 'GENERAL',
    title: n.title,
    message: n.message,
    data: n.metadata || n.data,
    timestamp: n.createdAt || n.timestamp || new Date().toISOString(),
    isRead: isNotificationRead(n),
    category: n.category,
    priority: n.priority,
    createdAt: n.createdAt,
    actionUrl: n.actionUrl,
    actionText: n.actionText,
  }));

  // Unread count: prefer server value, fall back to client-side count
  const serverUnreadCount = unreadCountData?.count ?? null;
  const clientUnreadCount = notifications.filter(n => !n.isRead).length;
  const unreadCount = serverUnreadCount !== null ? serverUnreadCount : clientUnreadCount;

  const highPriorityCount = notifications.filter(
    n => !n.isRead && (n.priority === 'HIGH' || n.priority === 'URGENT' || n.priority === 'CRITICAL')
  ).length;

  return {
    notifications,
    isConnected,
    unreadCount,
    highPriorityCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
};
