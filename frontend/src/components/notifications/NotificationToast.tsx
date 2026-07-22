import React, { useEffect } from 'react';
import { X, ExternalLink, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { resolveNotificationRoute } from '../../utils/resolveNotificationRoute';

interface NotificationToastProps {
  id: string;
  type?: string;
  title: string;
  message: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  actionUrl?: string;
  actionText?: string;
  onDismiss: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
  autoHide?: boolean;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  type,
  title,
  message,
  priority = 'NORMAL',
  actionUrl,
  actionText,
  onDismiss,
  onMarkAsRead,
  autoHide = true,
  duration = 5000,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, autoHide, duration, onDismiss]);

  // Get icon based on type
  const getIcon = (): string => {
    const icons: Record<string, string> = {
      'cargo:created': '📦',
      'cargo:status:updated': '🔄',
      'cargo:delivered': '✅',
      'cargo:pickup_ready': '📍',
      'match:found': '🎯',
      'match:requested': '🤝',
      'match:accepted': '✅',
      'match:rejected': '❌',
      'bid:received': '💰',
      'bid:accepted': '🎉',
      'bid:rejected': '❌',
      'bid:expired': '⏰',
      'trip:created': '🚚',
      'trip:started': '🚀',
      'trip:completed': '🏁',
      'trip:cancelled': '🚫',
      'trip:delay': '⚠️',
      'trip:update': '📝',
      'driver:assigned': '👤',
      'driver:unassigned': '👋',
      'driver:status_changed': '🔄',
      'truck:assigned': '🚛',
      'truck:maintenance_due': '🔧',
      'truck:location_updated': '📍',
      'payment:received': '💵',
      'payment:required': '💳',
      'payment:failed': '❌',
      'document:uploaded': '📄',
      'document:verified': '✅',
      'document:rejected': '❌',
      'document:expiring': '⚠️',
      'system:maintenance': '🔧',
      'system:update': '📢',
    };
    return icons[type || ''] || '🔔';
  };

  // Get priority styles
  const getPriorityStyles = (): { bg: string; border: string; icon: string } => {
    switch (priority) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
        };
      case 'URGENT':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: 'text-orange-600',
        };
      case 'HIGH':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-gray-200',
          icon: 'text-gray-600',
        };
    }
  };

  const styles = getPriorityStyles();

  const handleAction = () => {
    const resolved = resolveNotificationRoute(actionUrl, user?.role, { notificationType: type });
    if (resolved.path) {
      if (/^https?:\/\//i.test(resolved.path)) {
        window.location.assign(resolved.path);
      } else {
        navigate(resolved.path);
      }
      if (onMarkAsRead) {
        onMarkAsRead(id);
      }
    }
    onDismiss(id);
  };

  const handleMarkAsRead = () => {
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
    onDismiss(id);
  };

  return (
    <div
      className={`max-w-sm w-full ${styles.bg} shadow-lg rounded-xl pointer-events-auto ring-1 ${styles.border} transform transition-all duration-300 ease-out animate-slide-in-right`}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className="flex-shrink-0">
            <span className="text-xl">{getIcon()}</span>
          </div>

          {/* Content */}
          <div className="ml-3 flex-1 pt-0.5">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="mt-1 text-xs text-gray-600 line-clamp-2">{message}</p>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-3">
              {actionUrl && (
                <button
                  onClick={handleAction}
                  className="flex items-center gap-1 text-xs font-medium text-[#345E85] hover:text-[#2a4d70] transition-colors"
                >
                  {actionText || 'View Details'}
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
              {onMarkAsRead && (
                <button
                  onClick={handleMarkAsRead}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Mark as read
                </button>
              )}
            </div>
          </div>

          {/* Dismiss button */}
          <div className="ml-4 flex flex-shrink-0">
            <button
              onClick={() => onDismiss(id)}
              className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#345E85] focus:ring-offset-2"
            >
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar for auto-hide */}
      {autoHide && (
        <div className="h-1 bg-gray-100 rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-[#345E85] transition-all ease-linear"
            style={{
              width: '100%',
              animation: `shrink ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
