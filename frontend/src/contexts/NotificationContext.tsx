import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 4000,
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Use react-hot-toast for visual notifications
    const toastMessage = notification.title 
      ? `${notification.title}: ${notification.message}`
      : notification.message;

    switch (notification.type) {
      case 'success':
        toast.success(toastMessage, { duration: newNotification.duration });
        break;
      case 'error':
        toast.error(toastMessage, { duration: newNotification.duration });
        break;
      case 'warning':
        toast(toastMessage, { 
          icon: '⚠️',
          duration: newNotification.duration 
        });
        break;
      case 'info':
      default:
        toast(toastMessage, { 
          icon: 'ℹ️',
          duration: newNotification.duration 
        });
        break;
    }

    // Auto-remove notification after duration
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, newNotification.duration);

    return id;
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showNotification({ type: 'success', message, title });
  }, [showNotification]);

  const showError = useCallback((message: string, title?: string) => {
    showNotification({ type: 'error', message, title });
  }, [showNotification]);

  const showInfo = useCallback((message: string, title?: string) => {
    showNotification({ type: 'info', message, title });
  }, [showNotification]);

  const showWarning = useCallback((message: string, title?: string) => {
    showNotification({ type: 'warning', message, title });
  }, [showNotification]);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextType = {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
