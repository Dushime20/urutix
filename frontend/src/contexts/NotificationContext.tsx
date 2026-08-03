import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { notificationApi } from '../services/notifications/notificationApi';
import type { Notification } from '../services/notifications/notificationApi';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { shouldSuppressRealtimeToast } from '../utils/actionToast';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const data = await notificationApi.getMyNotifications(50);
      // Normalise isRead so both readAt and status='READ' are treated as read
      const normalised = data.map((n: any) => ({
        ...n,
        isRead: !!(n.isRead || n.status === 'READ' || (typeof n.readAt === 'string' && n.readAt.length > 0)),
      }));
      // Role-based filter: LOW_BALANCE is only for TRUCK_OWNER and TENANT_ADMIN
      const creditBalanceRoles = ['TRUCK_OWNER', 'TENANT_ADMIN'];
      const filtered = normalised.filter((n: any) => {
        const notifType = (n.notificationType || n.type || '').toUpperCase();
        if (
          (notifType === 'LOW_BALANCE' || notifType.includes('LOW_BALANCE')) &&
          !creditBalanceRoles.includes(user.role)
        ) {
          return false;
        }
        return true;
      });
      setNotifications(filtered);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const data = await notificationApi.getUnreadCount();
      setUnreadCount(data.count);
    } catch (err: any) {
      console.error('Error fetching unread count:', err);
      // Fall back to client-side count
      setUnreadCount(prev => prev);
    }
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString(), status: 'READ', isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead && !n.readAt).map(n => n.id);
      if (unreadIds.length === 0) return;
      await notificationApi.bulkMarkAsRead(unreadIds);
      setNotifications(prev =>
        prev.map(n => ({ ...n, readAt: new Date().toISOString(), status: 'READ', isRead: true }))
      );
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all as read:', err);
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.readAt) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  const refreshNotifications = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  // WebSocket real-time connection
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    const wsUrl = (import.meta as any).env?.VITE_WEBSOCKET_URL || (import.meta as any).env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

    const socket = io(`${wsUrl}/events`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Real-time notification push from backend (single event — backend also emits
    // `notification:new` with the same payload; listening to both would double toasts).
    socket.on('notification', (newNotif: Notification) => {
      // Role-based filter: LOW_BALANCE is only for TRUCK_OWNER and TENANT_ADMIN
      const notifType = ((newNotif as any).notificationType || (newNotif as any).type || '').toUpperCase();
      const creditBalanceRoles = ['TRUCK_OWNER', 'TENANT_ADMIN'];
      if (
        (notifType === 'LOW_BALANCE' || notifType.includes('LOW_BALANCE')) &&
        user &&
        !creditBalanceRoles.includes(user.role)
      ) {
        return; // Suppress for roles that don't manage TRX credits
      }

      setNotifications(prev => {
        // Avoid duplicates
        if (prev.some(n => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
      });
      if (!newNotif.readAt) {
        setUnreadCount(prev => prev + 1);
      }

      // One toast per notification id; skip when the user just got an action toast
      if (shouldSuppressRealtimeToast(notifType, newNotif.title)) {
        return;
      }

      const priority = newNotif.priority;
      const isPreTrip =
        notifType === 'PRE_TRIP_APPROVED' ||
        notifType === 'PRE_TRIP_READY_FOR_RE_INSPECTION' ||
        (notifType === 'DRIVER_ALERT' &&
          String(newNotif.title || '').toLowerCase().includes('re-inspection'));

      if (
        priority === 'HIGH' ||
        priority === 'URGENT' ||
        priority === 'CRITICAL' ||
        isPreTrip
      ) {
        const toastId = newNotif.id ? `notif-${newNotif.id}` : `notif-${notifType}-${newNotif.title}`;
        toast(newNotif.title || 'New notification', {
          id: toastId,
          icon: isPreTrip ? '🟢' : getCategoryEmoji(newNotif.category),
          duration: isPreTrip ? 8000 : 5000,
        });
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      refreshNotifications();
    }
  }, [user, refreshNotifications]);

  // After notifications load, sync unread count from local state if server count is 0
  useEffect(() => {
    if (notifications.length > 0 && unreadCount === 0) {
      const localUnread = notifications.filter(n => !n.isRead).length;
      if (localUnread > 0) setUnreadCount(localUnread);
    }
  }, [notifications]);

  // Poll unread count every 30s as fallback
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        isConnected,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    LOAN: '💰',
    FINANCIAL: '💵',
    TRIP: '🚚',
    CARGO: '📦',
    DRIVER: '👤',
    AUCTION: '🔨',
    SYSTEM: '⚙️',
    EMERGENCY: '🚨',
  };
  return map[category] || '🔔';
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
