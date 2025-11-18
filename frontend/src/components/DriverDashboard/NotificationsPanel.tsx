import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Clock, 
  X,
  Settings,
  Filter,
  Check,
  Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'URGENT';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'TRIP' | 'SAFETY' | 'PAYMENT' | 'SYSTEM' | 'MAINTENANCE';
  actionRequired?: boolean;
  actionUrl?: string;
}

interface NotificationsPanelProps {
  notifications?: Notification[];
  loading?: boolean;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ notifications, loading }) => {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'TRIP' | 'SAFETY' | 'PAYMENT' | 'SYSTEM' | 'MAINTENANCE'>('ALL');
  const [showSettings, setShowSettings] = useState(false);

  // Mock data for demonstration
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'URGENT',
      title: 'Trip Assignment',
      message: 'New urgent trip assigned: Chicago to Detroit. Departure in 2 hours.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      read: false,
      priority: 'CRITICAL',
      category: 'TRIP',
      actionRequired: true,
      actionUrl: '/trips/123'
    },
    {
      id: '2',
      type: 'WARNING',
      title: 'Safety Alert',
      message: 'Your safety score has dropped to 85. Review recent driving behavior.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      read: false,
      priority: 'HIGH',
      category: 'SAFETY',
      actionRequired: true
    },
    {
      id: '3',
      type: 'SUCCESS',
      title: 'Payment Received',
      message: 'Payment of $850 for trip TRIP-2024-001 has been processed.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      read: true,
      priority: 'MEDIUM',
      category: 'PAYMENT'
    },
    {
      id: '4',
      type: 'INFO',
      title: 'Maintenance Reminder',
      message: 'Vehicle inspection due in 3 days. Schedule appointment.',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      read: true,
      priority: 'MEDIUM',
      category: 'MAINTENANCE',
      actionRequired: true
    },
    {
      id: '5',
      type: 'ERROR',
      title: 'System Update',
      message: 'App will be updated tonight at 2 AM. Expect 15 minutes downtime.',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      read: true,
      priority: 'LOW',
      category: 'SYSTEM'
    },
    {
      id: '6',
      type: 'WARNING',
      title: 'Hours Limit',
      message: 'You are approaching your weekly driving hours limit (38/40 hours).',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      read: false,
      priority: 'HIGH',
      category: 'SAFETY'
    }
  ];

  const currentNotifications = notifications || mockNotifications;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INFO':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'ERROR':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'URGENT':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INFO':
        return 'border-l-blue-500 bg-blue-50';
      case 'WARNING':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'ERROR':
        return 'border-l-red-500 bg-red-50';
      case 'SUCCESS':
        return 'border-l-green-500 bg-green-50';
      case 'URGENT':
        return 'border-l-red-600 bg-red-100';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'TRIP':
        return 'bg-blue-100 text-blue-800';
      case 'SAFETY':
        return 'bg-green-100 text-green-800';
      case 'PAYMENT':
        return 'bg-purple-100 text-purple-800';
      case 'SYSTEM':
        return 'bg-gray-100 text-gray-800';
      case 'MAINTENANCE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now.getTime() - notificationTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return notificationTime.toLocaleDateString();
  };

  const filteredNotifications = currentNotifications.filter(notification => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !notification.read;
    return notification.category === filter;
  });

  const unreadCount = currentNotifications.filter(n => !n.read).length;
  const displayedNotifications = showAll ? filteredNotifications : filteredNotifications.slice(0, 3);

  const markAsRead = (id: string) => {
    // API call to mark notification as read
    console.log('Marking notification as read:', id);
  };

  const deleteNotification = (id: string) => {
    // API call to delete notification
    console.log('Deleting notification:', id);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="w-6 h-6 text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showAll ? 'Show Less' : `Show All (${filteredNotifications.length})`}
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 mt-4">
          {(['ALL', 'UNREAD', 'TRIP', 'SAFETY', 'PAYMENT', 'SYSTEM', 'MAINTENANCE'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === filterOption
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filterOption === 'ALL' ? 'All' : 
               filterOption === 'UNREAD' ? `Unread (${unreadCount})` :
               filterOption}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {displayedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getTypeColor(notification.type)} ${
              !notification.read ? 'bg-white' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getTypeIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                      {notification.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(notification.category)}`}>
                      {notification.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimestamp(notification.timestamp)}
                    </span>
                    
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 text-gray-400 hover:text-green-600 rounded hover:bg-green-50"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                
                {notification.actionRequired && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-orange-600 font-medium">Action Required</span>
                    {notification.actionUrl && (
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        View Details →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <div className="p-6 text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No notifications found</p>
          <p className="text-sm text-gray-400">
            {filter === 'UNREAD' ? 'All notifications have been read' : 'You\'re all caught up!'}
          </p>
        </div>
      )}

      {/* Show More Button */}
      {!showAll && filteredNotifications.length > 3 && (
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Show {filteredNotifications.length - 3} more notifications
          </button>
        </div>
      )}
    </div>
  );
};
