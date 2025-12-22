import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaUser, FaSearch, FaSignOutAlt, FaCog } from 'react-icons/fa';
import LenderSidebar from './LenderSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSwitcher } from '@/components/language-switcher';

const LenderLayout: React.FC = () => {
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
  console.log('LenderLayout: user:', user, 'isLoading:', isLoading);

  // Redirect to auth if not logged in or not a lender
  useEffect(() => {
    console.log('LenderLayout: useEffect triggered - isLoading:', isLoading, 'user:', user);
    if (!isLoading && (!user || user.role !== 'LENDER')) {
      console.log('LenderLayout: Redirecting to auth - no lender user found');
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
    console.log('LenderLayout: Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated or not a lender
  if (!user || user.role !== 'LENDER') {
    console.log('LenderLayout: User not authenticated or not a lender');
    return null;
  }

  console.log('LenderLayout: Rendering layout for user:', user.email);

  const handleLogout = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setShowUserMenu(false);
    logout();
    // Force hard navigation to ensure logout works
    window.location.href = '/auth';
  };

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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
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
        <LenderSidebar isCollapsed={false} onToggle={toggleSidebar} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden w-full transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : ''
      }`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 relative z-10">
          <div className="flex items-center justify-between px-2 sm:px-4 lg:px-6 py-3 sm:py-4 gap-2">
            {/* Left side */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={toggleSidebar}
                className="menu-toggle-button text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 flex-shrink-0 relative z-20"
                aria-label="Toggle sidebar"
              >
                <FaBars className="w-5 h-5" />
              </button>
              
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search loans, borrowers..."
                  className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Language Switcher */}
              <LanguageSwitcher variant="default" />
              
              {/* Notifications */}
              <button className="relative text-gray-500 hover:text-gray-700 focus:outline-none">
                <FaBell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium">
                      {(user.profile?.firstName || user.profile?.lastName)
                        ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim()
                        : (user?.firstName || user?.lastName)
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : ''}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <FaUser className="w-4 h-4 text-white" />
                  </div>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user.profile?.firstName} {user.profile?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/lender/profile');
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FaUser className="inline w-4 h-4 mr-2" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/lender/settings');
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FaCog className="inline w-4 h-4 mr-2" />
                      Settings
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={(e) => handleLogout(e)}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <FaSignOutAlt className="inline w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LenderLayout;
