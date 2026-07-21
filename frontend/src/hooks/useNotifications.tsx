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

    const newSocket = io(`${wsUrl}/events`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    const handleRealtimeNotification = (data: any) => {
      const notifType = ((data as any).notificationType || (data as any).type || '').toUpperCase();
      const creditBalanceRoles = ['TRUCK_OWNER', 'TENANT_ADMIN'];
      if (
        (notifType === 'LOW_BALANCE' || notifType.includes('LOW_BALANCE')) &&
        user &&
        !creditBalanceRoles.includes(user.role)
      ) {
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user.id] });

      const metadata = data?.metadata || data?.data || {};
      const isPreTripReInspection =
        metadata?.event === 'PRE_TRIP_READY_FOR_RE_INSPECTION' ||
        (notifType === 'DRIVER_ALERT' &&
          String(data?.title || '').toLowerCase().includes('re-inspection'));

      if (isPreTripReInspection) {
        queryClient.invalidateQueries({ queryKey: ['driver-pre-trip-inspections'] });
        toast.success(data.message || 'Cargo owner resolved issues. You can re-inspect now.', {
          icon: '✅',
          duration: 8000,
        });
        return;
      }

      toast(data.title || 'New notification', {
        icon: '🔔',
        duration: 5000,
      });
    };

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('notification:new', handleRealtimeNotification);
    newSocket.on('notification', handleRealtimeNotification);

    setSocket(newSocket);

    return () => {
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

  // ── Role-based notification filtering ────────────────────────────────────
  // LOW_BALANCE (TRX credit) notifications must only be visible to roles that
  // actually manage or consume TRX credits: TRUCK_OWNER and TENANT_ADMIN.
  const CREDIT_BALANCE_ROLES = ['TRUCK_OWNER', 'TENANT_ADMIN'];
  const isCreditBalanceRole = user ? CREDIT_BALANCE_ROLES.includes(user.role) : false;

  // ── Derived state ────────────────────────────────────────────────────────
  const notifications: UrutixNotification[] = (apiNotifications as any[])
    .filter((n: any) => {
      const notifType = (n.notificationType || n.type || '').toUpperCase();
      // Hide LOW_BALANCE notifications from roles that don't manage TRX credits
      if (
        (notifType === 'LOW_BALANCE' || notifType.includes('LOW_BALANCE')) &&
        !isCreditBalanceRole
      ) {
        return false;
      }
      return true;
    })
    .map((n: any) => ({
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
