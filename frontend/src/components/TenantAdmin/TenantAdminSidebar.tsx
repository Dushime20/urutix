import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaTachometerAlt, FaUsers, FaTruck, FaBox,
  FaChartLine, FaRoute, FaSignOutAlt, FaCog, FaDollarSign,
  FaBars, FaTimes, FaBuilding, FaClipboardList, FaExclamationTriangle
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminLayout } from '../../contexts/AdminLayoutContext';
import urutixLogo from '../../assets/urutix.png';
import { TranslatedText } from '../translated-text';

const TenantAdminSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useAdminLayout();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
    navigate('/auth', { replace: true });
  };

  // Tenant admin specific menu items
  const menuItems = [
    { to: '/tenant-admin', label: 'Dashboard', icon: FaTachometerAlt },
    { to: '/tenant-admin/fleet', label: 'Fleet Management', icon: FaTruck },
    { to: '/tenant-admin/cargo', label: 'Cargo Operations', icon: FaBox },
    { to: '/tenant-admin/drivers', label: 'Drivers', icon: FaUsers },
    { to: '/tenant-admin/lenders', label: 'Lenders', icon: FaDollarSign },
    { to: '/tenant-admin/routes', label: 'Routes', icon: FaRoute },
    { to: '/tenant-admin/trips', label: 'Trip Management', icon: FaClipboardList },
    { to: '/tenant-admin/financial', label: 'Financial', icon: FaDollarSign },
    { to: '/tenant-admin/analytics', label: 'Analytics', icon: FaChartLine },
    { to: '/tenant-admin/reports', label: 'Reports', icon: FaClipboardList },
    { to: '/tenant-admin/settings', label: 'Tenant Settings', icon: FaCog },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white/80 backdrop-blur border-r h-screen flex flex-col transition-all duration-300 fixed lg:sticky top-0 z-30`}>
        {/* Header with toggle */}
        <div className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-b flex items-center justify-between`}>
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-600 rounded-lg flex items-center justify-center">
                <FaBuilding className="text-white text-sm" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  <TranslatedText text="Tenant Admin" />
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {user?.tenantName && user.tenantName !== user?.tenantId ? user.tenantName : <TranslatedText text="Default Tenant" />}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarCollapsed ? <FaBars className="w-4 h-4" /> : <FaTimes className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
                end={item.to === '/tenant-admin'}
              >
                <Icon className={`${sidebarCollapsed ? 'mx-auto' : 'mr-3'} w-5 h-5 flex-shrink-0`} />
                {!sidebarCollapsed && <span><TranslatedText text={item.label} /></span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer with Logo */}
        <div className={`${sidebarCollapsed ? 'p-2' : 'p-4'} border-t flex items-center justify-center`}>
          {sidebarCollapsed ? (
            <img 
              src={urutixLogo} 
              alt="UrutiX Logo" 
              className="w-full h-auto max-h-12 object-contain"
            />
          ) : (
            <div className="w-full flex flex-col items-center gap-2">
              <img 
                src={urutixLogo} 
                alt="UrutiX Logo" 
                className="w-full h-auto max-h-32 object-contain"
              />
            </div>
          )}
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FaExclamationTriangle className="text-red-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sign Out</h3>
                <p className="text-sm text-gray-500">Are you sure you want to sign out?</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TenantAdminSidebar;
