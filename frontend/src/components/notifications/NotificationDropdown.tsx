import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink, Clock, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    highPriorityCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Track previous open state to detect closing
  const prevIsOpen = useRef(isOpen);

  // Mark all as read when closing the dropdown
  useEffect(() => {
    if (prevIsOpen.current && !isOpen && unreadCount > 0) {
      markAllAsRead();
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, unreadCount, markAllAsRead]);

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    return true;
  }).slice(0, 10); // Show max 10 notifications

  // Get notification icon
  const getNotificationIcon = (type: string): string => {
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
    return icons[type] || '🔔';
  };

  // Get priority badge color
  const getPriorityColor = (priority?: string): string => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'URGENT': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'HIGH': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'CRITICAL': return <AlertCircle className="w-3 h-3" />;
      case 'URGENT': return <AlertTriangle className="w-3 h-3" />;
      case 'HIGH': return <Info className="w-3 h-3" />;
      default: return null;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    // We rely on the close-effect to mark as read, or specific button?
    // User probably expects clicking item to "read" it immediately or navigate?
    // Current logic marks read + navigates + closes.
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    // Don't close immediately if just expanding? 
    // Assuming navigation implies closing.
    setIsOpen(false);
  };

  const handleViewAll = () => {
    const path = user?.role === 'CARGO_OWNER' ? '/cargo-owner/notifications' : '/dashboard/notifications';
    navigate(path);
    setIsOpen(false);
  };

  const getCategoryColor = (type: string) => {
    // Map categories/types to pill styles
    return 'bg-white border border-gray-200 text-gray-700'; 
  };

  const getCardStyle = (priority: string) => {
     // Light styling for cards
     return 'bg-blue-50/50';
  };

  return (
    <>
      {/* Bell Button */}
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors relative touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-gray-600"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          
          {/* Connection indicator */}
          {isConnected && (
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
          )}
          
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}

          {/* High priority pulse */}
          {highPriorityCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75"></span>
          )}
        </button>
      </div>

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] isolate">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar Drawer */}
          <div 
            className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
              isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-3 px-6 py-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-[#4F46E5] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'unread'
                    ? 'bg-[#4F46E5] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className={`text-xs ml-0.5 px-1.5 py-0.5 rounded-full ${
                    activeTab === 'unread' ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
              
              <div className="ml-auto">
                 {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-[#4F46E5] font-medium hover:text-[#4338ca] flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                 )}
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto h-[calc(100%-140px)] px-4 pb-6 space-y-4 bg-gray-50/30">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-[200px]">
                    {activeTab === 'unread' 
                      ? "You've read all your notifications." 
                      : "You're all caught up! Check back later for updates."}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`group relative bg-white p-4 rounded-xl border transition-all hover:shadow-md ${
                      !notification.isRead 
                        ? 'border-blue-100 shadow-sm bg-blue-50/10' 
                        : 'border-gray-100'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Close/Remove Button Absolute */}
                    <button
                      onClick={(e) => {
                         e.stopPropagation();
                         removeNotification(notification.id);
                      }}
                      className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex gap-4">
                      {/* Icon Column */}
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                           !notification.isRead ? 'bg-blue-100 text-[#4F46E5]' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        {/* Header Row: Tag + Dot */}
                        <div className="flex items-center gap-2 mb-1.5">
                           <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                              {notification.type.split(':')[0].replace('_', ' ')}
                           </span>
                           {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                           )}
                        </div>

                        <h4 className={`text-sm font-semibold mb-1 ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                          {notification.message}
                        </p>

                        {/* Footer Row: Time + Action */}
                        <div className="flex items-center justify-between mt-2 border-t border-gray-50 pt-3">
                          <span className="text-xs text-gray-400">
                            {new Date(notification.timestamp).toLocaleString(undefined, {
                               month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>

                          {notification.actionUrl && (
                            <button 
                               className="text-xs font-medium text-[#4F46E5] hover:text-[#4338ca] flex items-center gap-1"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 navigate(notification.actionUrl!);
                                 setIsOpen(false);
                               }}
                            >
                               {notification.actionText || 'View Details'} <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default NotificationDropdown;
