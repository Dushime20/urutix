import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaUser, FaSearch, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayoutProvider, useAdminLayout } from '../../contexts/AdminLayoutContext';
import AdminSidebar from '../AdminDashboard/Sidebar';
import Topbar from '../AdminDashboard/Topbar';
import AuthDebug from '../AuthDebug';
import { LanguageSwitcher } from '@/components/language-switcher';
import logoUrutiX from '../../assets/logo-urutix.svg';

const AdminLayoutContent: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const { sidebarCollapsed, isCompactMode, isDarkMode, toggleSidebar } = useAdminLayout();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
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

  if (!user) {
    return null;
  }

  return (
    <div className={`flex h-screen bg-gray-50 relative ${isDarkMode ? 'dark bg-gray-900' : ''}`}>
      {/* Background Logo */}
      <img
        src={logoUrutiX}
        alt="UrutiX Logo Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-5 z-0"
        style={{ objectPosition: 'center' }}
      />
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Enhanced Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaBars className="w-4 h-4 text-gray-600" />
              </button>
              
              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search users, trucks, loads..."
                  className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56"
                />
              </div>
            </div>

            {/* Right Side Header */}
            <div className="flex items-center gap-2.5">
              {/* Language Switcher */}
              <LanguageSwitcher variant="default" />
              
              {/* Notifications */}
              <button className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <FaBell className="w-4 h-4 text-gray-600" />
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-medium">
                  5
                </span>
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <div className="flex items-center gap-2">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FaUser className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/admin/profile');
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-1.5"
                    >
                      <FaUser className="w-3 h-3" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/admin/settings');
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-1.5"
                    >
                      <FaCog className="w-3 h-3" />
                      <span>Settings</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-gray-100 flex items-center gap-1.5"
                    >
                      <FaSignOutAlt className="w-3 h-3" />
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
          <div className={`${isCompactMode ? 'p-3' : 'p-6'} transition-all duration-300`}>
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      
      {/* Debug panel - only show in development and when specifically enabled */}
      {process.env.NODE_ENV === 'development' && false && <AuthDebug />}
    </div>
  );
};

const AdminLayout: React.FC = () => {
  return (
    <AdminLayoutProvider>
      <AdminLayoutContent />
    </AdminLayoutProvider>
  );
};

export default AdminLayout; 