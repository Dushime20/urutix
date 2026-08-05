import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, Search, X } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import ModernLoader from '../components/common/ModernLoader';
import { navigateFromNotification } from '../utils/notificationNavigation';

const NotificationCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status
    if (filter === 'unread' && notification.isRead) return false;
    if (filter === 'read' && !notification.isRead) return false;

    // Filter by category
    if (categoryFilter !== 'all' && notification.category !== categoryFilter) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const categories = Array.from(new Set(notifications.map(n => n.category)));

  const handleNotificationClick = async (notification: any) => {
    await navigateFromNotification({
      notification,
      role: user?.role,
      navigate,
      markAsRead,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
      case 'URGENT':
        return 'border-l-red-500 bg-red-50/30';
      case 'HIGH':
        return 'border-l-orange-500 bg-orange-50/30';
      case 'NORMAL':
        return 'border-l-blue-500 bg-blue-50/30';
      case 'LOW':
        return 'border-l-gray-500 bg-gray-50/30';
      default:
        return 'border-l-gray-500 bg-gray-50/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CARGO':
        return '📦';
      case 'TRIP':
        return '🚚';
      case 'DRIVER':
        return '👤';
      case 'BUSINESS':
        return '💼';
      case 'SYSTEM':
        return '⚙️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell size={32} className="text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Center</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CheckCheck size={18} />
                Mark all as read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <div className="flex gap-2">
                {['all', 'unread', 'read'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 dark:text-slate-300 hover:bg-gray-200'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <ModernLoader isLoading={true} type="list" items={10} />
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
              <Bell size={64} className="text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500 dark:text-slate-400">No notifications found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchQuery ? 'Try adjusting your search or filters' : 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white dark:bg-slate-900 rounded-lg shadow-sm border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.isRead ? 'border-r-4 border-r-blue-500' : 'border border-gray-200 dark:border-slate-700'
                } p-6 hover:shadow-md transition-all cursor-pointer`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 text-3xl">
                    {getCategoryIcon(notification.category)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-lg font-semibold ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400">
                          <span className={`px-2 py-1 rounded-full font-medium ${
                            notification.priority === 'CRITICAL' || notification.priority === 'URGENT'
                              ? 'bg-red-100 text-red-700'
                              : notification.priority === 'HIGH'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700 dark:text-slate-300'
                          }`}>
                            {notification.priority}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:text-slate-300 rounded-full">
                            {notification.category}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check size={20} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>

                    {notification.requiresAction && notification.actionText && (
                      <button className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                        {notification.actionText} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenterPage;
