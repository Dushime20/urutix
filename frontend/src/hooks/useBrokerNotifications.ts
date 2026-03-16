import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  isRead: boolean;
}

export const useBrokerNotifications = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'BROKER') return;

    // Connect to WebSocket server
    const token = localStorage.getItem('token');
    const newSocket = io(import.meta.env.VITE_WS_URL || 'ws://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Broker notifications: Connected to WebSocket');
      setIsConnected(true);
      
      // Join broker-specific room
      newSocket.emit('join:broker', { brokerId: user.id });
    });

    newSocket.on('disconnect', () => {
      console.log('Broker notifications: Disconnected from WebSocket');
      setIsConnected(false);
    });

    // Listen for match proposal notifications
    newSocket.on('match:proposal:created', (data: any) => {
      setNotifications((prev) => [
        {
          id: data.id || Date.now().toString(),
          type: 'match_proposal',
          title: 'New Match Proposal',
          message: `A new match proposal has been created for load ${data.loadId}`,
          data,
          timestamp: new Date().toISOString(),
          isRead: false,
        },
        ...prev,
      ]);
    });

    newSocket.on('match:proposal:approved', (data: any) => {
      setNotifications((prev) => [
        {
          id: data.id || Date.now().toString(),
          type: 'match_approved',
          title: 'Match Proposal Approved',
          message: `Your match proposal has been approved`,
          data,
          timestamp: new Date().toISOString(),
          isRead: false,
        },
        ...prev,
      ]);
    });

    newSocket.on('match:proposal:rejected', (data: any) => {
      setNotifications((prev) => [
        {
          id: data.id || Date.now().toString(),
          type: 'match_rejected',
          title: 'Match Proposal Rejected',
          message: `Your match proposal has been rejected`,
          data,
          timestamp: new Date().toISOString(),
          isRead: false,
        },
        ...prev,
      ]);
    });

    newSocket.on('commission:status:updated', (data: any) => {
      setNotifications((prev) => [
        {
          id: data.id || Date.now().toString(),
          type: 'commission_updated',
          title: 'Commission Status Updated',
          message: `Commission status changed to ${data.status}`,
          data,
          timestamp: new Date().toISOString(),
          isRead: false,
        },
        ...prev,
      ]);
    });

    newSocket.on('commission:paid', (data: any) => {
      setNotifications((prev) => [
        {
          id: data.id || Date.now().toString(),
          type: 'commission_paid',
          title: 'Commission Paid',
          message: `You have received a payment of $${data.amount}`,
          data,
          timestamp: new Date().toISOString(),
          isRead: false,
        },
        ...prev,
      ]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave:broker', { brokerId: user.id });
      newSocket.close();
    };
  }, [user]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};

