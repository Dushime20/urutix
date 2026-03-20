import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X, ExternalLink, Clock } from 'lucide-react';
import type { UrutixNotification } from '../../hooks/useNotifications';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

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
  const [selectedNotification, setSelectedNotification] = useState<UrutixNotification | null>(null);
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


  const handleNotificationClick = (n: UrutixNotification) => {
    markAsRead(n.id);
    setSelectedNotification(n);
    setIsOpen(false);
  };

  const renderNotificationModal = () => {
    return createPortal(
      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotification(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <Bell size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Notification Detail</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enlite Prime Network</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                    {selectedNotification.type?.split(':')[0] || 'System'}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <Clock size={12} />
                    {new Date(selectedNotification.timestamp).toLocaleString()}
                  </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {selectedNotification.title}
                </h2>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {selectedNotification.message}
                  </p>
                </div>

                {selectedNotification.actionUrl && (
                  <button 
                    onClick={() => {
                      const url = selectedNotification.actionUrl;
                      if (url) {
                        navigate(url);
                      }
                      setSelectedNotification(null);
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 focus:outline-none"
                  >
                    {selectedNotification.actionText || 'Proceed to Link'}
                    <ExternalLink size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  const handleViewAll = () => {
    const path = user?.role === 'CARGO_OWNER' ? '/cargo-owner/notifications' : '/dashboard/notifications';
    navigate(path);
    setIsOpen(false);
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
                                 if (notification.actionUrl) {
                                   navigate(notification.actionUrl);
                                 }
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
      {renderNotificationModal()}
    </>
  );
};

export default NotificationDropdown;
