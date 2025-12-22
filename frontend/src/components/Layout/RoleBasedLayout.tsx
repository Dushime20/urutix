import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaUser, FaSearch, FaSignOutAlt, FaCog } from 'react-icons/fa';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const RoleBasedLayout: React.FC = () => {
  // Sidebar open by default on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      // Desktop: show sidebar by default, Mobile: hide sidebar by default
      return window.innerWidth >= 1024; // lg breakpoint (1024px)
    }
    // SSR fallback: hide by default
    return false;
  });
  
  // Ensure sidebar is hidden on mobile on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Debug logs
  console.log('RoleBasedLayout: user:', user, 'isLoading:', isLoading);

  // Redirect to auth if not logged in
  useEffect(() => {
    console.log('RoleBasedLayout: useEffect triggered - isLoading:', isLoading, 'user:', user);
    if (!isLoading && !user) {
      console.log('RoleBasedLayout: Redirecting to auth - no user found');
      navigate('/auth');
    }
  }, [isLoading, user, navigate]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show loading while checking authentication
  if (isLoading) {
    console.log('RoleBasedLayout: Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    console.log('RoleBasedLayout: No user, returning null');
    return null;
  }

  console.log('RoleBasedLayout: Rendering with user:', user);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth < 1024 && sidebarOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.sidebar-container') && !target.closest('.menu-toggle-button')) {
          setSidebarOpen(false);
        }
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [sidebarOpen]);

  // Handle window resize to maintain correct sidebar state
  useEffect(() => {
    let previousWidth = window.innerWidth;
    
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const wasDesktop = previousWidth >= 1024;
      const isDesktop = currentWidth >= 1024;
      
      // Only adjust on actual breakpoint changes
      if (!wasDesktop && isDesktop && !sidebarOpen) {
        // Switched from mobile to desktop - show sidebar
        setSidebarOpen(true);
      } else if (wasDesktop && !isDesktop && sidebarOpen) {
        // Switched from desktop to mobile - hide sidebar
        setSidebarOpen(false);
      }
      
      previousWidth = currentWidth;
    };

    // Throttle resize events
    let timeoutId: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', throttledResize);
    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(timeoutId);
    };
  }, [sidebarOpen]);

  const handleLogout = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowUserMenu(false);
    logout();
    // Force hard navigation to ensure logout works
    window.location.href = '/auth';
  };

  // Get search placeholder based on user role
  const getSearchPlaceholder = () => {
    switch (user.role) {
      case 'DRIVER':
        return 'Search trips, documents...';
      case 'CARGO_OWNER':
        return 'Search cargo, shipments...';
      case 'TRUCK_OWNER':
        return 'Search fleet, trucks, drivers...';
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return 'Search users, tenants...';
      default:
        return 'Search...';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
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
          sidebarOpen 
            ? 'translate-x-0' 
            : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden w-full transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : ''
      }`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-2 sm:px-4 lg:px-6 py-3 sm:py-4 relative z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={toggleSidebar}
                className="menu-toggle-button p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 relative z-20"
                aria-label="Toggle sidebar"
              >
                <FaBars className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={getSearchPlaceholder()}
                  className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Side Header */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <FaBell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1 sm:space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaUser className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {(user.firstName || user.lastName) 
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : ''}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => navigate('/dashboard/profile')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FaUser className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => navigate('/dashboard/settings')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FaCog className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={(e) => handleLogout(e)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default RoleBasedLayout;
