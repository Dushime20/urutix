import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaUser, FaSearch, FaSignOutAlt, FaCog, FaTimes, FaCheck } from 'react-icons/fa';
import FleetOwnerSidebar from './FleetOwnerSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { notificationApi, type Notification } from '../../services/notifications/notificationApi';

const FleetOwnerLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Debug logs
  console.log('FleetOwnerLayout: user:', user, 'isLoading:', isLoading);

  // Redirect to auth if not logged in
  useEffect(() => {
    console.log('FleetOwnerLayout: useEffect triggered - isLoading:', isLoading, 'user:', user);
    if (!isLoading && !user) {
      console.log('FleetOwnerLayout: Redirecting to auth - no user found');
      navigate('/auth');
    }
  }, [isLoading, user, navigate]);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
      
      // Refresh notifications every 30 seconds
      const interval = setInterval(() => {
        loadNotifications();
        loadUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await notificationApi.getMyNotifications(20);
      setNotifications(response);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.readAt) {
      try {
        await notificationApi.markAsRead(notification.id);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      setShowNotifications(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.readAt);
      if (unreadNotifications.length > 0) {
        await notificationApi.bulkMarkAsRead(unreadNotifications.map(n => n.id));
        setNotifications(prev => 
          prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <FleetOwnerSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={toggleSidebar} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search fleet, trucks, drivers..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                />
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      loadNotifications();
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                >
                  <FaBell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <FaCheck className="w-3 h-3" />
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                      {loadingNotifications ? (
                        <div className="p-8 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Loading notifications...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <FaBell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {notifications.map((notification) => {
                            const isUnread = !notification.readAt;
                            return (
                              <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                                  isUnread ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                    isUnread ? 'bg-blue-600' : 'bg-transparent'
                                  }`}></div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className={`text-sm font-medium ${
                                        isUnread ? 'text-gray-900' : 'text-gray-700'
                                      }`}>
                                        {notification.title}
                                      </p>
                                      <span className="text-xs text-gray-400 flex-shrink-0">
                                        {notificationApi.formatTimestamp(notification.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {notification.message || notification.shortMessage}
                                    </p>
                                    {notification.priority === 'URGENT' && (
                                      <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded">
                                        Urgent
                                      </span>
                                    )}
                                    {notification.priority === 'HIGH' && (
                                      <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                                        High
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="p-4 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            navigate('/dashboard/fleet/notifications');
                          }}
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <FaUser className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </span>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/dashboard/fleet/profile');
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-50"
                    >
                      <FaUser className="w-4 h-4 text-gray-500" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/dashboard/fleet/settings');
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-50"
                    >
                      <FaCog className="w-4 h-4 text-gray-500" />
                      <span>Settings</span>
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-50 text-red-600"
                    >
                      <FaSignOutAlt className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default FleetOwnerLayout; 