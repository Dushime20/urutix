import React from 'react';
import { 
  FaSync, FaCog, FaBell, FaUser, 
  FaCheckCircle, FaExclamationTriangle, FaClock 
} from 'react-icons/fa';

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
}

const TenantHeader: React.FC<TenantHeaderProps> = ({ 
  tenant, 
  onRefresh, 
  lastUpdated 
}) => {
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

  return (
    <div className="bg-white border-b border-gray-200">
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
                  ID: {tenant?.id || 'N/A'}
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
              <button
                onClick={onRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <FaSync className="w-4 h-4" />
              </button>

              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
                <FaBell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <FaCog className="w-4 h-4" />
              </button>

              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <FaUser className="w-4 h-4" />
              </button>
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
