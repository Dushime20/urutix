import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Bell, Trash2, CheckCircle, Box, Truck, CreditCard, Settings } from 'lucide-react';
import { notificationApi } from '../services/notifications/notificationApi';
import type { CreateNotificationRequest, Notification } from '../services/notifications/notificationApi';

const NotificationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    priority: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [createForm, setCreateForm] = useState<Partial<CreateNotificationRequest>>({
    category: 'SYSTEM',
    priority: 'NORMAL',
    channels: ['IN_APP'],
  });

  const queryClient = useQueryClient();

  // Get category from URL params and set initial filter
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setFilters(prev => ({ ...prev, category }));
      setCreateForm(prev => ({ ...prev, category }));
    }
  }, [searchParams]);

  // Get category display info
  const getCategoryInfo = (category: string) => {
    const categoryInfo = {
      SYSTEM: { name: 'System', icon: Settings, color: 'text-gray-600' },
      CARGO: { name: 'Cargo', icon: Box, color: 'text-blue-600' },
      TRIP: { name: 'Trip', icon: Truck, color: 'text-green-600' },
      FINANCIAL: { name: 'Financial', icon: CreditCard, color: 'text-purple-600' },
      DRIVER: { name: 'Driver', icon: Truck, color: 'text-orange-600' },
      VEHICLE: { name: 'Vehicle', icon: Truck, color: 'text-red-600' },
      COMPLIANCE: { name: 'Compliance', icon: CheckCircle, color: 'text-yellow-600' },
    };
    return categoryInfo[category as keyof typeof categoryInfo] || { name: 'All', icon: Bell, color: 'text-gray-600' };
  };

  const categoryInfo = getCategoryInfo(filters.category);
  const CategoryIcon = categoryInfo.icon;

  // Fetch notifications
  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications', filters, currentPage],
    queryFn: () => notificationApi.getNotifications({
      ...filters,
      page: currentPage,
      limit: 20,
    }),
  });

  // Fetch unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => notificationApi.getUnreadCount(),
    retry: 1, // Only retry once to avoid overwhelming the server
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.warn('Failed to fetch unread count, will show 0:', error);
    }
  });

  // Create notification mutation
  const createMutation = useMutation({
    mutationFn: (request: CreateNotificationRequest) =>
      notificationApi.createNotification(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowCreateModal(false);
      setCreateForm({
        category: 'SYSTEM',
        priority: 'NORMAL',
        channels: ['IN_APP'],
      });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Bulk mark as read mutation
  const bulkMarkAsReadMutation = useMutation({
    mutationFn: (ids: string[]) => notificationApi.bulkMarkAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      setSelectedNotifications([]);
    },
  });

  // Handle notification selection
  const handleNotificationSelect = useCallback((notificationId: string, checked: boolean) => {
    if (checked) {
      setSelectedNotifications(prev => [...prev, notificationId]);
    } else {
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
    }
  }, []);

  // Handle bulk mark as read
  const handleBulkMarkAsRead = useCallback(() => {
    if (selectedNotifications.length > 0) {
      bulkMarkAsReadMutation.mutate(selectedNotifications);
    }
  }, [selectedNotifications, bulkMarkAsReadMutation]);

  // Handle filter change
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  // Handle search
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  }, []);

  // Handle create notification
  const handleCreateNotification = useCallback(() => {
    if (createForm.title && createForm.message && createForm.recipientId) {
      createMutation.mutate(createForm as CreateNotificationRequest);
    }
  }, [createForm, createMutation]);

  // Handle channel selection
  const handleChannelToggle = useCallback((channel: string) => {
    setCreateForm(prev => {
      const currentChannels = prev.channels || [];
      if (currentChannels.includes(channel)) {
        return { ...prev, channels: currentChannels.filter(c => c !== channel) };
      } else {
        return { ...prev, channels: [...currentChannels, channel] };
      }
    });
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading notifications: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg bg-gray-100 ${categoryInfo.color}`}>
              <CategoryIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {filters.category ? `${categoryInfo.name} Notifications` : 'Notification Center'}
              </h1>
              <p className="text-gray-600">
                {filters.category 
                  ? `Manage all ${categoryInfo.name.toLowerCase()} notifications and alerts`
                  : 'Manage all notifications across the platform'
                }
              </p>
            </div>
          </div>
          {filters.category && (
            <div className="text-sm text-gray-500">
              Category: <span className="font-medium text-gray-700">{filters.category}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {unreadCount && (
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              {unreadCount.count} unread
            </div>
          )}
          {!unreadCount && (
            <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
              0 unread
            </div>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create {filters.category ? categoryInfo.name : ''} Notification
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="SYSTEM">System</option>
              <option value="DRIVER">Driver</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="CARGO">Cargo</option>
              <option value="TRIP">Trip</option>
              <option value="FINANCIAL">Financial</option>
              <option value="COMPLIANCE">Compliance</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="READ">Read</option>
              <option value="FAILED">Failed</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-800">
              {selectedNotifications.length} notification(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkMarkAsRead}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Read
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNotifications(
                          notificationsData?.notifications.map((n: Notification) => n.id) || [],
                        );
                      } else {
                        setSelectedNotifications([]);
                      }
                    }}
                    checked={selectedNotifications.length === (notificationsData?.notifications.length || 0)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading notifications...
                  </td>
                </tr>
              ) : notificationsData?.notifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No notifications found
                  </td>
                </tr>
              ) : (
                notificationsData?.notifications.map((notification: Notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={(e) => handleNotificationSelect(notification.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {notification.shortMessage || notification.message.substring(0, 50)}...
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {notificationApi.formatTimestamp(notification.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">
                          {notificationApi.getCategoryIcon(notification.category)}
                        </span>
                        <span className="text-sm text-gray-900">{notification.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${notificationApi.getNotificationStatusColor(notification.status)}`}>
                        {notification.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${notificationApi.getNotificationPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {notification.channels.map((channel: string) => (
                          <span key={channel} className="text-lg" title={channel}>
                            {notificationApi.getChannelIcon(channel)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {notification.requiresAction && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Action Required
                          </span>
                        )}
                        {!notification.readAt && (
                          <button
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Read"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(notification.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {notificationsData && notificationsData.totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: notificationsData.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 border rounded-lg ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(notificationsData.totalPages, prev + 1))}
              disabled={currentPage === notificationsData.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Create Notification</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={createForm.title || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="Notification title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  value={createForm.message || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  rows={3}
                  placeholder="Notification message"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient ID *
                </label>
                <input
                  type="text"
                  value={createForm.recipientId || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, recipientId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="UUID of the recipient"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={createForm.category || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="SYSTEM">System</option>
                  <option value="DRIVER">Driver</option>
                  <option value="VEHICLE">Vehicle</option>
                  <option value="CARGO">Cargo</option>
                  <option value="TRIP">Trip</option>
                  <option value="FINANCIAL">Financial</option>
                  <option value="COMPLIANCE">Compliance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={createForm.priority || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channels
                </label>
                <div className="space-y-2">
                  {['IN_APP', 'EMAIL', 'SMS', 'PUSH'].map((channel) => (
                    <label key={channel} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={createForm.channels?.includes(channel) || false}
                        onChange={() => handleChannelToggle(channel)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requires Action
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createForm.requiresAction || false}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, requiresAction: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">User must take action</span>
                </label>
              </div>

              {createForm.requiresAction && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action URL
                    </label>
                    <input
                      type="text"
                      value={createForm.actionUrl || ''}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, actionUrl: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2"
                      placeholder="URL for the action"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action Text
                    </label>
                    <input
                      type="text"
                      value={createForm.actionText || ''}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, actionText: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2"
                      placeholder="Text for the action button"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNotification}
                disabled={!createForm.title || !createForm.message || !createForm.recipientId || createMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
