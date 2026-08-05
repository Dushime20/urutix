import React from 'react';
import { FaBell, FaSearch, FaUser, FaBuilding, FaChevronDown } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminLayout } from '../../contexts/AdminLayoutContext';

const TenantAdminTopbar: React.FC = () => {
  const { user } = useAuth();
  const { toggleSidebar } = useAdminLayout();

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 overflow-x-hidden">
      <div className="flex items-center justify-between min-w-0 gap-2">
        {/* Left side - Breadcrumb */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-2 min-w-0">
            <FaBuilding className="text-blue-600 flex-shrink-0" />
            <h1 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white truncate">Tenant Administration</h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search operations, drivers, vehicles..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Right side - User info and notifications */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* Tenant Context Indicator */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-primary-50 rounded-lg">
            <FaBuilding className="text-primary-600 text-sm flex-shrink-0" />
            <div className="text-sm min-w-0">
              <p className="text-gray-600 dark:text-slate-300 text-xs">Managing</p>
              <p className="font-medium text-primary-900 truncate max-w-32 text-xs">
                {user?.tenantName && user.tenantName !== user?.tenantId ? user.tenantName : 'Default Tenant'}
              </p>
            </div>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 rounded-lg transition-colors">
            <FaBell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3 pl-3 border-l border-gray-200 dark:border-slate-700">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <FaUser className="text-white text-sm" />
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500">Tenant Administrator</p>
            </div>
            <FaChevronDown className="text-gray-400 text-sm flex-shrink-0" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TenantAdminTopbar;
