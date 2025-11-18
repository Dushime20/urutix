import React from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaClock } from 'react-icons/fa';

interface Activity {
  id: number;
  type: string;
  action: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

interface RecentActivityProps {
  activities: Activity[];
  maxItems?: number;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ 
  activities, 
  maxItems = 10 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'error':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'info':
        return <FaInfoCircle className="text-blue-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shipment':
        return '📦';
      case 'maintenance':
        return '🔧';
      case 'payment':
        return '💰';
      case 'dispute':
        return '⚠️';
      case 'driver':
        return '👤';
      case 'fleet':
        return '🚛';
      default:
        return '📋';
    }
  };

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <span className="text-sm text-gray-500">
            Last {displayedActivities.length} activities
          </span>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {displayedActivities.length > 0 ? (
          displayedActivities.map((activity) => (
            <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-lg">{getTypeIcon(activity.type)}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} - {activity.type}
                    </p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(activity.status)}
                      <span className="text-xs text-gray-500">{activity.timestamp}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                  
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-400 mb-2">
              <FaClock className="mx-auto h-12 w-12" />
            </div>
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400">Activities will appear here as they happen</p>
          </div>
        )}
      </div>
      
      {activities.length > maxItems && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all activities ({activities.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
