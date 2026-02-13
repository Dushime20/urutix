import React, { useState } from 'react';
import { 
  FaSync, FaCog, FaBell, FaUser, 
  FaCheckCircle, FaExclamationTriangle, FaClock,
  FaSignOutAlt, FaUserCircle, FaChartBar
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Tenant {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'suspended';
  type: string;
}

interface TenantHeaderProps {
  tenant: Tenant;
  onRefresh: () => void;
  lastUpdated: Date;
  onViewChange?: (view: string) => void;
}

const TenantHeader: React.FC<TenantHeaderProps> = ({ 
  tenant, 
  onRefresh, 
  lastUpdated,
  onViewChange
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSettings = () => {
    setShowUserMenu(false);
    onViewChange?.('settings');
  };

  const handleProfile = () => {
    setShowUserMenu(false);
    onViewChange?.('profile');
  };

  const handleDashboard = () => {
    setShowUserMenu(false);
    onViewChange?.('overview');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaCheckCircle className="w-4 h-4" />;
      case 'inactive': return <FaClock className="w-4 h-4" />;
      case 'suspended': return <FaExclamationTriangle className="w-4 h-4" />;
      default: return <FaClock className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fleet-operator': return 'Fleet Operator';
      case 'cargo-owner': return 'Cargo Owner';
      case 'broker': return 'Freight Broker';
      case 'logistics': return 'Logistics Provider';
      default: return type;
    }
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  };

  // Mock notifications - in real app, fetch from API
  const notifications = [
    { id: 1, title: 'New user registered', message: 'John Doe joined as truck owner', time: '5 min ago', unread: true },
    { id: 2, title: 'Load completed', message: 'Load #L-2024-001 delivered successfully', time: '1 hour ago', unread: true },
    { id: 3, title: 'Payment received', message: 'Payment of RF 250,000 received', time: '2 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          {/* Left side - Tenant Info */}
          <div className="flex items-center space-x-4">
            {/* Tenant Avatar/Logo */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {tenant?.name?.charAt(0)?.toUpperCase() || 'T'}
              </span>
            </div>

            {/* Tenant Details */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tenant?.name || 'Unknown Tenant'}</h1>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tenant?.status || 'inactive')}`}>
                  {getStatusIcon(tenant?.status || 'inactive')}
                  <span className="ml-1.5 capitalize">{tenant?.status || 'inactive'}</span>
                </span>
                <span className="text-sm text-gray-500">
                  {getTypeLabel(tenant?.type || 'unknown')}
                </span>
                <span className="text-sm text-gray-400">
                  ID: {tenant?.id?.substring(0, 8) || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-4">
            {/* Last Updated */}
            <div className="text-sm text-gray-500">
              <span className="hidden sm:inline">Last updated: </span>
              {formatLastUpdated(lastUpdated)}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                title="Refresh data"
              >
                <FaSync className="w-4 h-4" />
              </button>

              {/* Notifications Button */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
                  title="Notifications"
                >
                  <FaBell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowNotifications(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${notification.unread ? 'bg-blue-50' : ''}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                              </div>
                              {notification.unread && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full mt-1"></span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 border-t border-gray-200 text-center">
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                          View all notifications
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Settings Button */}
              <button 
                onClick={handleSettings}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <FaCog className="w-4 h-4" />
              </button>

              {/* User Menu Button */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="User menu"
                >
                  <FaUser className="w-4 h-4" />
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                      <div className="p-4 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{user?.email || 'User'}</p>
                        <p className="text-xs text-gray-500 mt-1">Tenant Admin</p>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={handleProfile}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <FaUserCircle className="w-4 h-4 mr-3 text-gray-400" />
                          My Profile
                        </button>
                        <button
                          onClick={handleDashboard}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <FaChartBar className="w-4 h-4 mr-3 text-gray-400" />
                          Dashboard
                        </button>
                        <button
                          onClick={handleSettings}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                          <FaCog className="w-4 h-4 mr-3 text-gray-400" />
                          Settings
                        </button>
                      </div>
                      <div className="border-t border-gray-200 py-2">
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <FaSignOutAlt className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="py-4 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">23</div>
              <div className="text-xs text-gray-500">Active Trucks</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">47</div>
              <div className="text-xs text-gray-500">Active Loads</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">94.2%</div>
              <div className="text-xs text-gray-500">On-Time Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">4.6/5</div>
              <div className="text-xs text-gray-500">Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantHeader;
