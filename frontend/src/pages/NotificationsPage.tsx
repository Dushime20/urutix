import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Bell, Trash2, CheckCircle, Box, Truck, CreditCard, Settings } from 'lucide-react';
import { notificationApi } from '../services/notifications/notificationApi';
import type { CreateNotificationRequest, Notification } from '../services/notifications/notificationApi';
import { TranslatedText } from '../components/translated-text';

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
      <div className="p-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-800">
            <TranslatedText text="Error loading notifications" />: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 px-4 py-3 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 ${categoryInfo.color.includes('blue') ? '' : 'from-gray-500 to-gray-600'}`}>
              <CategoryIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {filters.category ? (
                  <TranslatedText text={`${categoryInfo.name} Notifications`} />
                ) : (
                  <TranslatedText text="Notification Center" />
                )}
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">
                {filters.category ? (
                  <TranslatedText text={`Manage all ${categoryInfo.name.toLowerCase()} notifications and alerts`} />
                ) : (
                  <TranslatedText text="Manage all notifications across the platform" />
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount && (
              <div className="bg-red-100 text-red-800 px-2.5 py-1 rounded-lg text-xs font-medium border border-red-200">
                {unreadCount.count} <TranslatedText text="unread" />
              </div>
            )}
            {!unreadCount && (
              <div className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200">
                0 <TranslatedText text="unread" />
              </div>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <TranslatedText text="Create" /> {filters.category ? categoryInfo.name : ''} <TranslatedText text="Notification" />
            </button>
          </div>
        </div>
        {filters.category && (
          <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-blue-200">
            <TranslatedText text="Category" />: <span className="font-medium text-gray-700">{filters.category}</span>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search notifications..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value=""><TranslatedText text="All Categories" /></option>
              <option value="SYSTEM"><TranslatedText text="System" /></option>
              <option value="DRIVER"><TranslatedText text="Driver" /></option>
              <option value="VEHICLE"><TranslatedText text="Vehicle" /></option>
              <option value="CARGO"><TranslatedText text="Cargo" /></option>
              <option value="TRIP"><TranslatedText text="Trip" /></option>
              <option value="FINANCIAL"><TranslatedText text="Financial" /></option>
              <option value="COMPLIANCE"><TranslatedText text="Compliance" /></option>
            </select>
            <select
              className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value=""><TranslatedText text="All Statuses" /></option>
              <option value="PENDING"><TranslatedText text="Pending" /></option>
              <option value="SENT"><TranslatedText text="Sent" /></option>
              <option value="DELIVERED"><TranslatedText text="Delivered" /></option>
              <option value="READ"><TranslatedText text="Read" /></option>
              <option value="FAILED"><TranslatedText text="Failed" /></option>
            </select>
            <select
              className="px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value=""><TranslatedText text="All Priorities" /></option>
              <option value="LOW"><TranslatedText text="Low" /></option>
              <option value="NORMAL"><TranslatedText text="Normal" /></option>
              <option value="HIGH"><TranslatedText text="High" /></option>
              <option value="URGENT"><TranslatedText text="Urgent" /></option>
              <option value="CRITICAL"><TranslatedText text="Critical" /></option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-800 font-medium">
              {selectedNotifications.length} <TranslatedText text="notification(s) selected" />
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkMarkAsRead}
                className="bg-green-600 text-white px-2.5 py-1 text-xs rounded-lg hover:bg-green-700 flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <TranslatedText text="Mark as Read" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
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
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <TranslatedText text="Notification" />
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <TranslatedText text="Category" />
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <TranslatedText text="Status" />
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <TranslatedText text="Priority" />
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <TranslatedText text="Channels" />
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <TranslatedText text="Actions" />
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-xs text-gray-500">
                    <TranslatedText text="Loading notifications..." />
                  </td>
                </tr>
              ) : notificationsData?.notifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-xs text-gray-500">
                    <TranslatedText text="No notifications found" />
                  </td>
                </tr>
              ) : (
                notificationsData?.notifications.map((notification: Notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={(e) => handleNotificationSelect(notification.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-xs font-medium text-gray-900">
                            {notification.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {notification.shortMessage || notification.message.substring(0, 50)}...
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {notificationApi.formatTimestamp(notification.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm mr-1.5">
                          {notificationApi.getCategoryIcon(notification.category)}
                        </span>
                        <span className="text-xs text-gray-900">{notification.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${notificationApi.getNotificationStatusColor(notification.status)}`}>
                        {notification.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${notificationApi.getNotificationPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        {notification.channels.map((channel: string) => (
                          <span key={channel} className="text-sm" title={channel}>
                            {notificationApi.getChannelIcon(channel)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                      <div className="flex gap-1.5 items-center">
                        {notification.requiresAction && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <TranslatedText text="Action Required" />
                          </span>
                        )}
                        {!notification.readAt && (
                          <button
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Mark as Read"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(notification.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
          <nav className="flex space-x-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <TranslatedText text="Previous" />
            </button>
            {Array.from({ length: notificationsData.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-2.5 py-1.5 text-xs border rounded-lg transition-colors ${
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
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <TranslatedText text="Next" />
            </button>
          </nav>
        </div>
      )}

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md shadow-xl">
            <h2 className="text-sm font-semibold mb-3">
              <TranslatedText text="Create Notification" />
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Title" /> *
                </label>
                <input
                  type="text"
                  value={createForm.title || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                  placeholder="Notification title"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Message" /> *
                </label>
                <textarea
                  value={createForm.message || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                  rows={3}
                  placeholder="Notification message"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Recipient ID" /> *
                </label>
                <input
                  type="text"
                  value={createForm.recipientId || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, recipientId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                  placeholder="UUID of the recipient"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Category" />
                </label>
                <select
                  value={createForm.category || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                >
                  <option value="SYSTEM"><TranslatedText text="System" /></option>
                  <option value="DRIVER"><TranslatedText text="Driver" /></option>
                  <option value="VEHICLE"><TranslatedText text="Vehicle" /></option>
                  <option value="CARGO"><TranslatedText text="Cargo" /></option>
                  <option value="TRIP"><TranslatedText text="Trip" /></option>
                  <option value="FINANCIAL"><TranslatedText text="Financial" /></option>
                  <option value="COMPLIANCE"><TranslatedText text="Compliance" /></option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Priority" />
                </label>
                <select
                  value={createForm.priority || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                >
                  <option value="LOW"><TranslatedText text="Low" /></option>
                  <option value="NORMAL"><TranslatedText text="Normal" /></option>
                  <option value="HIGH"><TranslatedText text="High" /></option>
                  <option value="URGENT"><TranslatedText text="Urgent" /></option>
                  <option value="CRITICAL"><TranslatedText text="Critical" /></option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Channels" />
                </label>
                <div className="space-y-1.5">
                  {['IN_APP', 'EMAIL', 'SMS', 'PUSH'].map((channel) => (
                    <label key={channel} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={createForm.channels?.includes(channel) || false}
                        onChange={() => handleChannelToggle(channel)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="ml-2 text-xs text-gray-700">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <TranslatedText text="Requires Action" />
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createForm.requiresAction || false}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, requiresAction: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="ml-2 text-xs text-gray-700">
                    <TranslatedText text="User must take action" />
                  </span>
                </label>
              </div>

              {createForm.requiresAction && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <TranslatedText text="Action URL" />
                    </label>
                    <input
                      type="text"
                      value={createForm.actionUrl || ''}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, actionUrl: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                      placeholder="URL for the action"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <TranslatedText text="Action Text" />
                    </label>
                    <input
                      type="text"
                      value={createForm.actionText || ''}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, actionText: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                      placeholder="Text for the action button"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TranslatedText text="Cancel" />
              </button>
              <button
                onClick={handleCreateNotification}
                disabled={!createForm.title || !createForm.message || !createForm.recipientId || createMutation.isPending}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createMutation.isPending ? <TranslatedText text="Creating..." /> : <TranslatedText text="Create" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
