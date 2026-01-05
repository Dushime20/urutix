import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaUser, FaSignOutAlt, FaCog, FaTimes, FaCheck, FaQuestionCircle, FaSearch } from 'react-icons/fa';
import FleetOwnerSidebar from './FleetOwnerSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { notificationApi, type Notification } from '../../services/notifications/notificationApi';
import { HelpCenter } from '../FleetDashboard/HelpCenter';
import FleetOwnerOnboarding from '../FleetDashboard/FleetOwnerOnboarding';
import { FloatingHelpButton } from '../FleetDashboard/FloatingHelpButton';
import logoUrutiX from '../../assets/logo-urutix.svg';
import { LanguageSwitcher } from '@/components/language-switcher';

const FleetOwnerLayout: React.FC = () => {
  // Sidebar open by default on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // lg breakpoint
    }
    return false;
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
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

  // Check if user needs onboarding
  useEffect(() => {
    if (user) {
      const hasSeenOnboarding = localStorage.getItem('fleetOwnerOnboardingCompleted');
      if (!hasSeenOnboarding) {
        // Show onboarding after a short delay
        setTimeout(() => {
          setShowOnboarding(true);
        }, 1000);
      }
    }
  }, [user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Press ? to open help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowHelpCenter(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

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

  // Handle window resize to maintain correct sidebar state
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop && !sidebarOpen) {
        setSidebarOpen(true);
      } else if (!isDesktop && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    const throttledResize = () => {
      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(handleResize, 150);
      };
    };
    
    window.addEventListener('resize', throttledResize());
    return () => window.removeEventListener('resize', throttledResize());
  }, [sidebarOpen]);

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

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowUserMenu(false);
    logout();
    // Force hard navigation to ensure logout works
    window.location.href = '/auth';
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('fleetOwnerOnboardingCompleted', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('fleetOwnerOnboardingCompleted', 'true');
    setShowOnboarding(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Background Logo */}
      <img 
        src={logoUrutiX} 
        alt="UrutiX Logo Background" 
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0" 
        style={{objectPosition: 'center'}} 
      />
      
      {/* Overlay - only on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`sidebar-container fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <FleetOwnerSidebar 
          isCollapsed={false} 
          onToggle={toggleSidebar}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden relative z-10 w-full transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : ''
      }`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2.5 relative z-50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              {/* Menu Toggle Button */}
              <button
                onClick={toggleSidebar}
                className="menu-toggle-button p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 relative z-20"
                aria-label="Toggle sidebar"
              >
                <FaBars className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search trucks, trips..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
              {/* Right Side Header */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                {/* Language Switcher */}
                <LanguageSwitcher variant="default" />
                
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) {
                        loadNotifications();
                      }
                    }}
                    className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FaBell className="w-4 h-4 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-[100] max-h-[600px] flex flex-col">
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

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-medium text-gray-900">
                        {(() => {
                          const firstName = user?.firstName || '';
                          const lastName = user?.lastName || '';
                          const fullName = `${firstName} ${lastName}`.trim();
                          if (fullName) {
                            return fullName;
                          }
                          // Fallback to email username if names not available
                          return user?.email ? user.email.split('@')[0] : 'User';
                        })()}
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="User menu"
                    >
                      <FaUser className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-[100]">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/dashboard/fleet/profile');
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FaUser className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/dashboard/fleet/settings');
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FaCog className="w-3.5 h-3.5" />
                        <span>Settings</span>
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={(e) => handleLogout(e)}
                        className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <FaSignOutAlt className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-4">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Help Center Modal */}
      {showHelpCenter && (
        <HelpCenter
          onClose={() => setShowHelpCenter(false)}
          onRestartTour={() => {
            setShowOnboarding(true);
          }}
        />
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <FleetOwnerOnboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Floating Help Button */}
      <FloatingHelpButton />
    </div>
  );
};

export default FleetOwnerLayout; 