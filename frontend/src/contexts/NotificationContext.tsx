import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationApi, type Notification } from '../services/notifications/notificationApi';
import toast from 'react-hot-toast';

// Notification event types for real-time updates
export type NotificationEventType = 
  // Cargo events
  | 'cargo:created'
  | 'cargo:status:updated'
  | 'cargo:delivered'
  | 'cargo:pickup_ready'
  // Match events
  | 'match:found'
  | 'match:requested'
  | 'match:accepted'
  | 'match:rejected'
  // Bid events
  | 'bid:received'
  | 'bid:accepted'
  | 'bid:rejected'
  | 'bid:expired'
  // Trip events
  | 'trip:created'
  | 'trip:started'
  | 'trip:completed'
  | 'trip:cancelled'
  | 'trip:delay'
  | 'trip:update'
  // Driver events
  | 'driver:assigned'
  | 'driver:unassigned'
  | 'driver:status_changed'
  // Truck events
  | 'truck:assigned'
  | 'truck:maintenance_due'
  | 'truck:location_updated'
  // Payment events
  | 'payment:received'
  | 'payment:required'
  | 'payment:failed'
  // Document events
  | 'document:uploaded'
  | 'document:verified'
  | 'document:rejected'
  | 'document:expiring'
  // System events
  | 'system:maintenance'
  | 'system:update'
  | 'general';

interface RealTimeNotification {
  id: string;
  type: NotificationEventType;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  isRead: boolean;
  category?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  actionUrl?: string;
  actionText?: string;
}

interface NotificationContextType {
  // State
  notifications: RealTimeNotification[];
  backendNotifications: Notification[];
  isConnected: boolean;
  isLoading: boolean;
  unreadCount: number;
  highPriorityCount: number;
  
  // Actions
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  refreshNotifications: () => Promise<void>;
  
  // Real-time
  subscribeToEvent: (event: NotificationEventType, callback: (data: any) => void) => () => void;
  
  // UI helpers
  showToast: (notification: Partial<RealTimeNotification>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Icon and color mapping for notification types
const getNotificationIcon = (type: string): string => {
  const icons: Record<string, string> = {
    // Cargo
    'cargo:created': '📦',
    'cargo:status:updated': '🔄',
    'cargo:delivered': '✅',
    'cargo:pickup_ready': '📍',
    // Match
    'match:found': '🎯',
    'match:requested': '🤝',
    'match:accepted': '✅',
    'match:rejected': '❌',
    // Bid
    'bid:received': '💰',
    'bid:accepted': '🎉',
    'bid:rejected': '❌',
    'bid:expired': '⏰',
    // Trip
    'trip:created': '🚚',
    'trip:started': '🚀',
    'trip:completed': '🏁',
    'trip:cancelled': '🚫',
    'trip:delay': '⚠️',
    'trip:update': '📝',
    // Driver
    'driver:assigned': '👤',
    'driver:unassigned': '👋',
    'driver:status_changed': '🔄',
    // Truck
    'truck:assigned': '🚛',
    'truck:maintenance_due': '🔧',
    'truck:location_updated': '📍',
    // Payment
    'payment:received': '💵',
    'payment:required': '💳',
    'payment:failed': '❌',
    // Document
    'document:uploaded': '📄',
    'document:verified': '✅',
    'document:rejected': '❌',
    'document:expiring': '⚠️',
    // System
    'system:maintenance': '🔧',
    'system:update': '📢',
    'general': '🔔',
  };
  return icons[type] || '🔔';
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [backendNotifications, setBackendNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const eventCallbacksRef = useRef<Map<NotificationEventType, Set<(data: any) => void>>>(new Map());
  const socketRef = useRef<Socket | null>(null);

  // Fetch backend notifications
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await notificationApi.getMyNotifications(50);
      setBackendNotifications(data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Clear notifications when user logs out
  useEffect(() => {
    if (!user) {
      // User logged out - clear all local notification state
      setNotifications([]);
      setBackendNotifications([]);
    }
  }, [user]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3002';
    
    const newSocket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Notifications: Connected to WebSocket');
      setIsConnected(true);
      
      // Join role-specific room
      const roomEvent = getRoomEvent(user.role);
      if (roomEvent) {
        newSocket.emit(roomEvent, { userId: user.id });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Notifications: Disconnected from WebSocket');
      setIsConnected(false);
    });

    // Listen for all notification events
    const notificationEvents: NotificationEventType[] = [
      'cargo:created', 'cargo:status:updated', 'cargo:delivered', 'cargo:pickup_ready',
      'match:found', 'match:requested', 'match:accepted', 'match:rejected',
      'bid:received', 'bid:accepted', 'bid:rejected', 'bid:expired',
      'trip:created', 'trip:started', 'trip:completed', 'trip:cancelled', 'trip:delay', 'trip:update',
      'driver:assigned', 'driver:unassigned', 'driver:status_changed',
      'truck:assigned', 'truck:maintenance_due', 'truck:location_updated',
      'payment:received', 'payment:required', 'payment:failed',
      'document:uploaded', 'document:verified', 'document:rejected', 'document:expiring',
      'system:maintenance', 'system:update', 'general'
    ];

    notificationEvents.forEach(event => {
      newSocket.on(event, (data: any) => {
        handleNotificationEvent(event, data);
      });
    });

    // Also listen for generic notification event
    newSocket.on('notification', (data: any) => {
      handleNotificationEvent(data.type || 'general', data);
    });

    socketRef.current = newSocket;

    // Fetch initial notifications
    refreshNotifications();

    return () => {
      if (newSocket) {
        const leaveEvent = getLeaveEvent(user.role);
        if (leaveEvent) {
          newSocket.emit(leaveEvent, { userId: user.id });
        }
        newSocket.close();
      }
    };
  }, [user, refreshNotifications]);

  const getRoomEvent = (role: string): string | null => {
    switch (role) {
      case 'CARGO_OWNER': return 'join:cargo-owner';
      case 'TRUCK_OWNER': return 'join:truck-owner';
      case 'DRIVER': return 'join:driver';
      case 'BROKER': return 'join:broker';
      case 'LENDER': return 'join:lender';
      case 'ADMIN':
      case 'SUPER_ADMIN': return 'join:admin';
      case 'TENANT_ADMIN': return 'join:tenant-admin';
      default: return 'join:user';
    }
  };

  const getLeaveEvent = (role: string): string | null => {
    switch (role) {
      case 'CARGO_OWNER': return 'leave:cargo-owner';
      case 'TRUCK_OWNER': return 'leave:truck-owner';
      case 'DRIVER': return 'leave:driver';
      case 'BROKER': return 'leave:broker';
      case 'LENDER': return 'leave:lender';
      case 'ADMIN':
      case 'SUPER_ADMIN': return 'leave:admin';
      case 'TENANT_ADMIN': return 'leave:tenant-admin';
      default: return 'leave:user';
    }
  };

  const handleNotificationEvent = (type: NotificationEventType, data: any) => {
    const notification: RealTimeNotification = {
      id: data.id || Date.now().toString(),
      type,
      title: data.title || formatEventTitle(type),
      message: data.message || formatEventMessage(type, data),
      data,
      timestamp: new Date().toISOString(),
      isRead: false,
      category: data.category || getCategoryFromType(type),
      priority: data.priority || getPriorityFromType(type),
      actionUrl: data.actionUrl,
      actionText: data.actionText,
    };

    setNotifications(prev => [notification, ...prev.slice(0, 99)]); // Keep max 100

    // Show toast for important notifications
    if (notification.priority === 'HIGH' || notification.priority === 'URGENT' || notification.priority === 'CRITICAL') {
      showToast(notification);
    }

    // Trigger callbacks for subscribed events
    const callbacks = eventCallbacksRef.current.get(type);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }

    // Refresh backend notifications
    refreshNotifications();
  };

  const formatEventTitle = (type: string): string => {
    const titles: Record<string, string> = {
      'cargo:created': 'New Cargo Created',
      'cargo:status:updated': 'Cargo Status Updated',
      'cargo:delivered': 'Cargo Delivered',
      'cargo:pickup_ready': 'Cargo Ready for Pickup',
      'match:found': 'New Match Found',
      'match:requested': 'Match Requested',
      'match:accepted': 'Match Accepted',
      'match:rejected': 'Match Rejected',
      'bid:received': 'New Bid Received',
      'bid:accepted': 'Bid Accepted',
      'bid:rejected': 'Bid Rejected',
      'bid:expired': 'Bid Expired',
      'trip:created': 'Trip Created',
      'trip:started': 'Trip Started',
      'trip:completed': 'Trip Completed',
      'trip:cancelled': 'Trip Cancelled',
      'trip:delay': 'Trip Delayed',
      'trip:update': 'Trip Updated',
      'driver:assigned': 'Driver Assigned',
      'driver:unassigned': 'Driver Unassigned',
      'driver:status_changed': 'Driver Status Changed',
      'truck:assigned': 'Truck Assigned',
      'truck:maintenance_due': 'Maintenance Due',
      'truck:location_updated': 'Truck Location Updated',
      'payment:received': 'Payment Received',
      'payment:required': 'Payment Required',
      'payment:failed': 'Payment Failed',
      'document:uploaded': 'Document Uploaded',
      'document:verified': 'Document Verified',
      'document:rejected': 'Document Rejected',
      'document:expiring': 'Document Expiring Soon',
      'system:maintenance': 'System Maintenance',
      'system:update': 'System Update',
    };
    return titles[type] || 'Notification';
  };

  const formatEventMessage = (type: string, data: any): string => {
    // Format message based on type and data
    switch (type) {
      case 'cargo:delivered':
        return `Cargo ${data.cargoId || ''} has been delivered successfully`;
      case 'bid:received':
        return `You received a new bid of $${data.amount || 'N/A'}`;
      case 'match:found':
        return `A transporter match has been found for your cargo`;
      case 'trip:started':
        return `Trip ${data.tripId || ''} has started`;
      case 'payment:received':
        return `Payment of $${data.amount || 'N/A'} received`;
      default:
        return data.message || 'You have a new notification';
    }
  };

  const getCategoryFromType = (type: string): string => {
    if (type.startsWith('cargo')) return 'CARGO';
    if (type.startsWith('match')) return 'CARGO';
    if (type.startsWith('bid')) return 'CARGO';
    if (type.startsWith('trip')) return 'TRIP';
    if (type.startsWith('driver')) return 'DRIVER';
    if (type.startsWith('truck')) return 'VEHICLE';
    if (type.startsWith('payment')) return 'FINANCIAL';
    if (type.startsWith('document')) return 'COMPLIANCE';
    if (type.startsWith('system')) return 'SYSTEM';
    return 'GENERAL';
  };

  const getPriorityFromType = (type: string): 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL' => {
    const highPriority = ['match:found', 'bid:received', 'cargo:delivered', 'payment:received', 'payment:required'];
    const urgentPriority = ['trip:delay', 'truck:maintenance_due', 'document:expiring', 'payment:failed'];
    const criticalPriority = ['system:maintenance'];
    
    if (criticalPriority.includes(type)) return 'CRITICAL';
    if (urgentPriority.includes(type)) return 'URGENT';
    if (highPriority.includes(type)) return 'HIGH';
    return 'NORMAL';
  };

  const showToast = useCallback((notification: Partial<RealTimeNotification>) => {
    const icon = getNotificationIcon(notification.type || 'general');
    const toastFn = notification.priority === 'URGENT' || notification.priority === 'CRITICAL' 
      ? toast.error 
      : notification.priority === 'HIGH' 
        ? toast.success 
        : toast;

    toastFn(
      (t) => (
        <div 
          className="flex items-start gap-3 cursor-pointer" 
          onClick={() => {
            toast.dismiss(t.id);
            if (notification.actionUrl) {
              window.location.href = notification.actionUrl;
            }
          }}
        >
          <span className="text-xl">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-gray-900">{notification.title}</p>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
          </div>
        </div>
      ),
      {
        duration: notification.priority === 'CRITICAL' ? 10000 : 5000,
        style: {
          maxWidth: '360px',
        },
      }
    );
  }, []);

  // Helper function to check if a string is a valid UUID
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const markAsRead = useCallback(async (id: string) => {
    console.log('[NotificationContext] markAsRead called with id:', id);
    
    // Update local real-time notifications state
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    
    // Update local backend notifications state
    setBackendNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n)
    );
    
    // Only call the API if this is a valid backend notification ID (UUID format)
    // Real-time notifications with fake IDs (timestamp-based) won't have database records
    if (!isValidUUID(id)) {
      console.log('[NotificationContext] Skipping API call - not a valid UUID:', id);
      return;
    }
    
    // Update backend and refresh to ensure consistency
    try {
      console.log('[NotificationContext] Calling API to mark as read...');
      const result = await notificationApi.markAsRead(id);
      console.log('[NotificationContext] API response:', result);
      // Refresh from backend to ensure read status is persisted
      await refreshNotifications();
      console.log('[NotificationContext] Refreshed notifications from backend');
    } catch (error: any) {
      console.error('[NotificationContext] Failed to mark notification as read:', error);
      console.error('[NotificationContext] Error details:', error.response?.data || error.message);
    }
  }, [refreshNotifications]);

  const markAllAsRead = useCallback(async () => {
    // Update local state
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setBackendNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
    
    // Update backend - only send valid UUIDs (filter out fake timestamp-based IDs)
    try {
      const unreadRealtimeIds = notifications.filter(n => !n.isRead).map(n => n.id);
      const unreadBackendIds = backendNotifications.filter(n => !n.readAt).map(n => n.id);
      
      const allUnreadIds = [...new Set([...unreadRealtimeIds, ...unreadBackendIds])];
      
      // Only include valid UUIDs for the API call
      const validUUIDs = allUnreadIds.filter(id => isValidUUID(id));
      
      console.log('[NotificationContext] markAllAsRead - Total IDs:', allUnreadIds.length, ', Valid UUIDs:', validUUIDs.length);
      
      if (validUUIDs.length > 0) {
        await notificationApi.bulkMarkAsRead(validUUIDs);
        // Refresh from backend to ensure read status is persisted
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [notifications, backendNotifications, refreshNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const subscribeToEvent = useCallback((event: NotificationEventType, callback: (data: any) => void) => {
    if (!eventCallbacksRef.current.has(event)) {
      eventCallbacksRef.current.set(event, new Set());
    }
    eventCallbacksRef.current.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      eventCallbacksRef.current.get(event)?.delete(callback);
    };
  }, []);

  // Calculate counts - prioritize backend read status
  // Create a map of backend notification read status by ID
  const backendReadStatusMap = new Map<string, boolean>();
  backendNotifications.forEach(n => {
    backendReadStatusMap.set(n.id, !!n.readAt);
  });

  const allNotifications = [...notifications, ...backendNotifications.map(n => ({
    id: n.id,
    type: (n.notificationType as NotificationEventType) || 'general',
    title: n.title,
    message: n.message,
    timestamp: n.createdAt,
    isRead: !!n.readAt,
    category: n.category,
    priority: n.priority as any,
    actionUrl: n.actionUrl,
    actionText: n.actionText,
  }))];

  // Deduplicate by id, preferring backend read status if available
  const uniqueNotifications = allNotifications.reduce((acc, curr) => {
    const existingIndex = acc.findIndex(n => n.id === curr.id);
    if (existingIndex === -1) {
      // If this notification exists in backend, use backend's read status
      if (backendReadStatusMap.has(curr.id)) {
        curr.isRead = backendReadStatusMap.get(curr.id)!;
      }
      acc.push(curr);
    } else {
      // Already exists - update with backend read status if available
      if (backendReadStatusMap.has(curr.id)) {
        acc[existingIndex].isRead = backendReadStatusMap.get(curr.id)!;
      }
    }
    return acc;
  }, [] as RealTimeNotification[]);

  const unreadCount = uniqueNotifications.filter(n => !n.isRead).length;
  const highPriorityCount = uniqueNotifications.filter(
    n => !n.isRead && (n.priority === 'HIGH' || n.priority === 'URGENT' || n.priority === 'CRITICAL')
  ).length;

  const value: NotificationContextType = {
    notifications: uniqueNotifications,
    backendNotifications,
    isConnected,
    isLoading,
    unreadCount,
    highPriorityCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    refreshNotifications,
    subscribeToEvent,
    showToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
