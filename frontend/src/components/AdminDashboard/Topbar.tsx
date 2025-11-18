import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSignOutAlt, FaUserCircle, FaSync, FaExpand, FaCompress,
  FaMoon, FaSun, FaLayerGroup, FaTh, FaList, FaBars, FaCog
} from 'react-icons/fa';
import { FiGrid, FiList } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminLayout } from '../../contexts/AdminLayoutContext';
import TenantSwitcher from './TenantSwitcher';

const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    viewMode, setViewMode, 
    isDarkMode, toggleTheme,
    isCompactMode, toggleCompactMode,
    isFullScreen, toggleFullScreen,
    isRefreshing, setIsRefreshing,
    toggleSidebar
  } = useAdminLayout();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
    navigate('/auth', { replace: true });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000);
    window.location.reload();
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Toggle sidebar"
            >
              <FaBars />
            </button>
            <div className="hidden sm:block text-sm text-gray-600">Scope</div>
            <TenantSwitcher />
          </div>
          
          {/* Toggle Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle - Hidden on mobile */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'} transition-colors`}
                title="List view"
              >
                <FiList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'} transition-colors`}
                title="Grid view"
              >
                <FiGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded ${viewMode === 'card' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'} transition-colors`}
                title="Card view"
              >
                <FaTh className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
              title="Refresh"
              disabled={isRefreshing}
            >
              <FaSync className="w-4 h-4" />
            </button>

            <button
              onClick={toggleCompactMode}
              className={`hidden sm:flex p-2 rounded-lg transition-colors ${isCompactMode ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
              title={isCompactMode ? 'Normal spacing' : 'Compact spacing'}
            >
              <FaLayerGroup className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className={`hidden sm:flex p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'hover:bg-gray-100'}`}
              title={isDarkMode ? 'Light mode' : 'Dark mode'}
            >
              {isDarkMode ? <FaSun className="w-4 h-4" /> : <FaMoon className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleFullScreen}
              className="hidden sm:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullScreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
            </button>

            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>

            <span className="hidden md:block text-sm text-gray-600">Admin Panel</span>
            
            {/* Admin User Info */}
            <div className="flex items-center space-x-3 bg-gray-100 rounded-lg px-3 py-2">
              <FaUserCircle className="text-gray-600" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">
                  {user?.firstName || user?.lastName 
                    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() 
                    : user?.email || 'Admin User'}
                </div>
                <div className="text-gray-500 text-xs">{user?.role || 'Administrator'}</div>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutDialog(true)}
              className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-all duration-200 border border-red-200"
              title="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <FaSignOutAlt className="mx-auto text-4xl text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to logout from the admin panel?</p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLogoutDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
