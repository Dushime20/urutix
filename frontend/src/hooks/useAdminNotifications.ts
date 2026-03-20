import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  isRead: boolean;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
}

export const useAdminNotifications = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'system:success',
      title: 'Platform Calibration Complete',
      message: 'All regional nodes successfully synchronized with the central hive.',
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'NORMAL'
    },
    {
      id: '2',
      type: 'security:warning',
      title: 'Failed Migration Attempt',
      message: 'Suspicious credential manifestation detected from IP 192.168.1.1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
      priority: 'HIGH'
    }
  ]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001';
    
    // Connect to 'events' namespace for administrative alerts
    const newSocket = io(`${wsUrl}/events`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Admin notifications: Connected to WebSocket');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('new_activity', (data: any) => {
      const notification: Notification = {
        id: data.id || Date.now().toString(),
        type: 'activity',
        title: 'New Platform Activity',
        message: data.description || 'System activity detected',
        data,
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'NORMAL'
      };
      setNotifications(prev => [notification, ...prev]);
    });

    newSocket.on('suspicious_activity', (data: any) => {
      const notification: Notification = {
        id: data.id || Date.now().toString(),
        type: 'security',
        title: 'SECURITY ALERT',
        message: data.reason || 'Suspicious behavior detected',
        data,
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'HIGH'
      };
      setNotifications(prev => [notification, ...prev]);
      toast.error('Security Alert Detected', { icon: '🛡️' });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    notifications,
    isConnected,
    unreadCount: notifications.filter(n => !n.isRead).length,
    highPriorityCount: notifications.filter(n => !n.isRead && (n.priority === 'HIGH' || n.priority === 'URGENT' || n.priority === 'CRITICAL')).length,
    markAsRead,
    markAllAsRead,
    removeNotification
  };
};
