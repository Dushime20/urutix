import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaUser, FaSearch, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayoutProvider, useAdminLayout } from '../../contexts/AdminLayoutContext';
import { TenantAdminSidebar, TenantAdminTopbar } from '../TenantAdmin';
import logoUrutix from '../../assets/logo-urutix.svg';
import { LanguageSwitcher } from '@/components/language-switcher';

const TenantAdminLayoutContent: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const { sidebarCollapsed, isCompactMode, isDarkMode, toggleSidebar } = useAdminLayout();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
      return;
    }

    // Ensure only tenant admins can access this layout
    if (!isLoading && user && user.role !== 'TENANT_ADMIN') {
      // Redirect non-tenant-admins to appropriate dashboard
      switch (user.role) {
        case 'ADMIN':
        case 'SUPER_ADMIN':
          navigate('/admin', { replace: true });
          break;
        case 'CARGO_OWNER':
          navigate('/dashboard/cargos', { replace: true });
          break;
        case 'TRUCK_OWNER':
          navigate('/dashboard/fleet', { replace: true });
          break;
        default:
          navigate('/dashboard', { replace: true });
          break;
      }
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

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/auth', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'TENANT_ADMIN') {
    return null;
  }

  return (
    <div className={`flex h-screen bg-gray-50 ${isDarkMode ? 'dark bg-gray-900' : ''}`}>
      <TenantAdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaBars className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search operations, drivers, vehicles..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
                />
              </div>
            </div>

            {/* Right Side Header */}
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <LanguageSwitcher variant="default" />
              
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <FaBell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {(user?.firstName || user?.lastName) 
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : ''}
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FaUser className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/tenant-admin/profile');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FaUser className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/tenant-admin/settings');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FaCog className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2"
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
        <main className="flex-1 overflow-auto relative">
          {/* Background Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ opacity: 0.05 }}>
            <img 
              src={logoUrutix} 
              alt="UrutiX Logo Background" 
              className="w-full h-full object-contain max-w-5xl max-h-5xl"
            />
          </div>
          
          <div className={`${isCompactMode ? 'p-3' : 'p-6'} transition-all duration-300 relative z-10`}>
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const TenantAdminLayout: React.FC = () => {
  return (
    <AdminLayoutProvider>
      <TenantAdminLayoutContent />
    </AdminLayoutProvider>
  );
};

export default TenantAdminLayout;
