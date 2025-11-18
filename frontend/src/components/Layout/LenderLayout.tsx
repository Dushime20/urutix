import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaUser, FaSearch, FaSignOutAlt, FaCog } from 'react-icons/fa';
import LenderSidebar from './LenderSidebar';
import { useAuth } from '../../contexts/AuthContext';

const LenderLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/auth');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`transition-all duration-300 flex-shrink-0 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <LenderSidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
              >
                <FaBars className="w-5 h-5" />
              </button>
              
              {/* Search Bar */}
              <div className="hidden md:block">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search loans, borrowers..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-80"
                  />
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
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
                      {user.profile?.firstName} {user.profile?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
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
                      onClick={handleLogout}
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
