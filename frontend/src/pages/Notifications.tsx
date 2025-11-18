import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Filter, Search, Eye, Trash2, Check } from 'lucide-react';
import { notificationsAPI } from '../services/api';

const Notifications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', searchTerm, statusFilter],
    queryFn: () => notificationsAPI.getAll({ search: searchTerm, isRead: statusFilter !== 'all' ? statusFilter === 'read' : undefined }),
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trip_update':
        return '🚛';
      case 'payment_received':
        return '💰';
      case 'load_assigned':
        return '📦';
      case 'system_alert':
        return '⚠️';
      default:
        return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error-100 text-error-800';
      case 'medium':
        return 'bg-warning-100 text-warning-800';
      case 'low':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">Stay updated with your latest notifications</p>
        </div>
        <button className="btn btn-outline">
          <Check className="w-4 h-4 mr-2" />
          Mark All as Read
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
            <button className="btn btn-outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Notifications</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {notifications?.data?.notifications?.map((notification: any) => (
            <div key={notification.id} className={`p-6 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''}`}>
              <div className="flex items-start space-x-4">
                <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {notification.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                      {notification.priority}
                    </span>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                    <span>{new Date(notification.createdAt).toLocaleString()}</span>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {notifications?.data?.notifications?.length === 0 && (
        <div className="text-center py-12">
          <Bell className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            You're all caught up! No new notifications.
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications; 