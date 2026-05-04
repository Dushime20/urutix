import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FaBell, FaUser, FaSearch, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import MobileBottomNav from './MobileBottomNav';
import ModernLoader from '../common/ModernLoader';

const RoleBasedLayout: React.FC = () => {
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
    console.log('RoleBasedLayout: Showing modern loader');
    return <ModernLoader isLoading={true} text="Initializing_Session" />;
  }

  // Don't render if not authenticated
  if (!user) {
    console.log('RoleBasedLayout: No user, returning null');
    return null;
  }

  console.log('RoleBasedLayout: Rendering with user:', user);



  // Get search placeholder based on user role
  const getSearchPlaceholder = () => {
    switch (user.role) {
      case 'DRIVER':
        return 'Search trips, documents...';
      case 'CARGO_OWNER':
        return 'Search cargo, shipments...';
      case 'TRUCK_OWNER':
        return 'Search fleet, trucks, drivers...';
      case 'BROKER':
        return 'Search loads, commissions...';
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return 'Search users, tenants...';
      default:
        return 'Search...';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-2 sm:px-4 lg:px-6 py-3 sm:py-4 relative z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              
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
              {/* Notifications - Hidden on mobile as it's in the bottom nav */}
              <button className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
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
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowUserMenu(false);
                        
                        // Direct logout approach
                        try {
                          localStorage.removeItem('accessToken');
                          localStorage.removeItem('refreshToken');
                          
                          if (logout && typeof logout === 'function') {
                            logout();
                          }
                          
                          setTimeout(() => {
                            window.location.href = '/auth';
                          }, 100);
                        } catch (error) {
                          console.error('Logout error:', error);
                          window.location.href = '/auth';
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 cursor-pointer"
                      style={{ pointerEvents: 'auto' }}
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 pb-20 lg:pb-0">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default RoleBasedLayout;
