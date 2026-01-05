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
  category?: string;
  priority?: string;
}

export const useCargoOwnerNotifications = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only connect if user is a cargo owner
    if (!user || user.role !== 'CARGO_OWNER') {
      return;
    }

    // Connect to WebSocket server
    const token = localStorage.getItem('accessToken');
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';
    const newSocket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Cargo owner notifications: Connected to WebSocket');
      setIsConnected(true);
      
      // Join cargo owner-specific room
      newSocket.emit('join:cargo-owner', { userId: user.id });
    });

    newSocket.on('disconnect', () => {
      console.log('Cargo owner notifications: Disconnected from WebSocket');
      setIsConnected(false);
    });

    // Listen for match notifications
    newSocket.on('match:found', (data: any) => {
      const notification: Notification = {
        id: data.id || Date.now().toString(),
        type: 'match_found',
        title: 'New Match Found',
        message: `A transporter match has been found for your cargo ${data.cargoId || ''}`,
        data,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'CARGO',
        priority: 'HIGH',
      };
      
      setNotifications((prev) => [notification, ...prev]);
      toast.success('New match found!', {
        icon: '🎯',
        duration: 5000,
      });
    });

    // Listen for bid notifications
    newSocket.on('bid:received', (data: any) => {
      const notification: Notification = {
        id: data.id || Date.now().toString(),
        type: 'bid_received',
        title: 'New Bid Received',
        message: `You received a bid of $${data.amount || 'N/A'} for cargo ${data.cargoId || ''}`,
        data,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'CARGO',
        priority: 'HIGH',
      };
      
      setNotifications((prev) => [notification, ...prev]);
      toast.success('New bid received!', {
        icon: '💰',
        duration: 5000,
      });
    });

    // Listen for bid accepted notifications
    newSocket.on('bid:accepted', (data: any) => {
      const notification: Notification = {
        id: data.id || Date.now().toString(),
        type: 'bid_accepted',
        title: 'Bid Accepted',
        message: `Your bid has been accepted for cargo ${data.cargoId || ''}`,
        data,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'CARGO',
        priority: 'MEDIUM',
      };
      
      setNotifications((prev) => [notification, ...prev]);
    });

    // Listen for cargo status updates
    newSocket.on('cargo:status:updated', (data: any) => {
      const notification: Notification = {
        id: data.id || Date.now().toString(),
        type: 'cargo_status_updated',
        title: 'Cargo Status Updated',
        message: `Your cargo ${data.cargoId || ''} status changed to ${data.status || ''}`,
        data,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'CARGO',
        priority: 'NORMAL',
      };
      
      setNotifications((prev) => [notification, ...prev]);
    });

    // Listen for payment notifications
    newSocket.on('payment:required', (data: any) => {
      const notification: Notification = {
        id: data.id || Date.now().toString(),
        type: 'payment_required',
        title: 'Payment Required',
        message: `Payment of $${data.amount || 'N/A'} is required for cargo ${data.cargoId || ''}`,
        data,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'FINANCIAL',
        priority: 'HIGH',
      };
      
      setNotifications((prev) => [notification, ...prev]);
      toast.error('Payment required!', {
        icon: '💳',
        duration: 5000,
      });
    });

    // Listen for delivery notifications
    newSocket.on('cargo:delivered', (data: any) => {
      const notification: Notification = {
        id: data.id || Date.now().toString(),
        type: 'cargo_delivered',
        title: 'Cargo Delivered',
        message: `Your cargo ${data.cargoId || ''} has been delivered successfully`,
        data,
        timestamp: new Date().toISOString(),
        isRead: false,
        category: 'CARGO',
        priority: 'HIGH',
      };
      
      setNotifications((prev) => [notification, ...prev]);
      toast.success('Cargo delivered!', {
        icon: '✅',
        duration: 5000,
      });
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leave:cargo-owner', { userId: user.id });
        newSocket.close();
      }
    };
  }, [user]);

  // Return default values if not a cargo owner
  if (!user || user.role !== 'CARGO_OWNER') {
    return {
      notifications: [],
      isConnected: false,
      unreadCount: 0,
      highPriorityUnread: 0,
      markAsRead: () => {},
      markAllAsRead: () => {},
      removeNotification: () => {},
    };
  }

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const highPriorityUnread = notifications.filter((n) => !n.isRead && n.priority === 'HIGH').length;

  return {
    notifications,
    isConnected,
    unreadCount,
    highPriorityUnread,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
};

