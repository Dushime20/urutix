import React, { useState } from 'react';
import { 
  FaBell,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaMoneyBillWave,
  FaFileAlt,
  FaUserCheck,
  FaClock,
  FaTrash,
  FaEye,
  FaFilter,
  FaSearch,
  FaBullhorn,
  FaShieldAlt,
  FaGavel,
  FaCalendarAlt,
  FaCheck,
  FaEllipsisV
} from 'react-icons/fa';

interface Notification {
  id: string;
  type: 'payment' | 'application' | 'alert' | 'system' | 'compliance' | 'marketing' | 'legal';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionRequired: boolean;
  relatedId?: string;
  relatedType?: 'loan' | 'borrower' | 'transaction' | 'policy';
  metadata?: {
    amount?: number;
    currency?: string;
    borrowerName?: string;
    loanId?: string;
    dueDate?: Date;
  };
}

const LenderNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'payment',
      priority: 'urgent',
      title: 'Payment Overdue',
      message: 'Payment of $25,000 from Global Shipping Co. is 5 days overdue for Loan #LS-2024-0156',
      timestamp: new Date(2025, 7, 10, 14, 30),
      isRead: false,
      actionRequired: true,
      relatedId: 'LS-2024-0156',
      relatedType: 'loan',
      metadata: {
        amount: 25000,
        currency: 'USD',
        borrowerName: 'Global Shipping Co.',
        loanId: 'LS-2024-0156',
        dueDate: new Date(2025, 7, 5)
      }
    },
    {
      id: '2',
      type: 'application',
      priority: 'high',
      title: 'New Loan Application',
      message: 'Pacific Freight LLC has submitted a new loan application for $150,000',
      timestamp: new Date(2025, 7, 12, 9, 15),
      isRead: false,
      actionRequired: true,
      relatedId: 'LA-2024-0203',
      relatedType: 'loan',
      metadata: {
        amount: 150000,
        currency: 'USD',
        borrowerName: 'Pacific Freight LLC'
      }
    },
    {
      id: '3',
      type: 'alert',
      priority: 'high',
      title: 'Credit Score Alert',
      message: 'Credit score for Maritime Solutions Inc. has dropped below your minimum threshold (650)',
      timestamp: new Date(2025, 7, 11, 16, 45),
      isRead: false,
      actionRequired: true,
      relatedId: 'BR-2024-0089',
      relatedType: 'borrower',
      metadata: {
        borrowerName: 'Maritime Solutions Inc.'
      }
    },
    {
      id: '4',
      type: 'payment',
      priority: 'medium',
      title: 'Payment Received',
      message: 'Received payment of $50,000 from Trans-Ocean Logistics for Loan #LS-2024-0134',
      timestamp: new Date(2025, 7, 12, 11, 20),
      isRead: true,
      actionRequired: false,
      relatedId: 'LS-2024-0134',
      relatedType: 'transaction',
      metadata: {
        amount: 50000,
        currency: 'USD',
        borrowerName: 'Trans-Ocean Logistics',
        loanId: 'LS-2024-0134'
      }
    },
    {
      id: '5',
      type: 'compliance',
      priority: 'high',
      title: 'Compliance Document Required',
      message: 'Annual compliance report for AML regulations is due in 3 days',
      timestamp: new Date(2025, 7, 11, 8, 0),
      isRead: false,
      actionRequired: true,
      metadata: {
        dueDate: new Date(2025, 7, 15)
      }
    },
    {
      id: '6',
      type: 'system',
      priority: 'medium',
      title: 'System Maintenance',
      message: 'Scheduled system maintenance on August 15th from 2:00 AM to 4:00 AM EST',
      timestamp: new Date(2025, 7, 10, 10, 0),
      isRead: true,
      actionRequired: false
    },
    {
      id: '7',
      type: 'marketing',
      priority: 'low',
      title: 'New Feature Available',
      message: 'Automated risk assessment tools are now available in your dashboard',
      timestamp: new Date(2025, 7, 9, 15, 30),
      isRead: true,
      actionRequired: false
    },
    {
      id: '8',
      type: 'legal',
      priority: 'high',
      title: 'Contract Amendment Required',
      message: 'Legal review required for updated lending terms with Coastal Shipping Corp.',
      timestamp: new Date(2025, 7, 8, 13, 45),
      isRead: false,
      actionRequired: true,
      relatedId: 'BR-2024-0067',
      relatedType: 'borrower',
      metadata: {
        borrowerName: 'Coastal Shipping Corp.'
      }
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'unread' | 'action-required'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.isRead) ||
                         (filter === 'action-required' && notification.actionRequired);
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    const matchesSearch = searchTerm === '' || 
                         notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesType && matchesPriority && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.isRead).length;

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = `h-5 w-5 ${priority === 'urgent' ? 'text-red-600' : 
                                 priority === 'high' ? 'text-orange-600' : 
                                 priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'}`;
    
    switch (type) {
      case 'payment':
        return <FaMoneyBillWave className={iconClass} />;
      case 'application':
        return <FaFileAlt className={iconClass} />;
      case 'alert':
        return <FaExclamationTriangle className={iconClass} />;
      case 'compliance':
        return <FaShieldAlt className={iconClass} />;
      case 'system':
        return <FaInfoCircle className={iconClass} />;
      case 'marketing':
        return <FaBullhorn className={iconClass} />;
      case 'legal':
        return <FaGavel className={iconClass} />;
      default:
        return <FaBell className={iconClass} />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${badges[priority as keyof typeof badges]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleBulkAction = (action: 'read' | 'delete') => {
    if (action === 'read') {
      setNotifications(prev => 
        prev.map(notification => 
          selectedNotifications.includes(notification.id)
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } else if (action === 'delete') {
      setNotifications(prev => 
        prev.filter(n => !selectedNotifications.includes(n.id))
      );
    }
    setSelectedNotifications([]);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const notificationTypes = [
    { value: 'all', label: 'All Types', count: notifications.length },
    { value: 'payment', label: 'Payments', count: notifications.filter(n => n.type === 'payment').length },
    { value: 'application', label: 'Applications', count: notifications.filter(n => n.type === 'application').length },
    { value: 'alert', label: 'Alerts', count: notifications.filter(n => n.type === 'alert').length },
    { value: 'compliance', label: 'Compliance', count: notifications.filter(n => n.type === 'compliance').length },
    { value: 'system', label: 'System', count: notifications.filter(n => n.type === 'system').length },
    { value: 'marketing', label: 'Marketing', count: notifications.filter(n => n.type === 'marketing').length },
    { value: 'legal', label: 'Legal', count: notifications.filter(n => n.type === 'legal').length }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaBell className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-1">
                  Stay updated with your lending activities and important alerts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Unread:</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  {unreadCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Action Required:</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  {actionRequiredCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'unread' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('action-required')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'action-required' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Action Required ({actionRequiredCount})
              </button>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FaFilter className="h-4 w-4" />
              Filters
            </button>

            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('read')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <FaCheck className="h-4 w-4" />
                  Mark Read
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <FaTrash className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}

            {/* Mark All as Read */}
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FaCheckCircle className="h-4 w-4" />
              Mark All Read
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {notificationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} ({type.count})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <FaBell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms or filters.' : 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                  !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNotifications(prev => [...prev, notification.id]);
                      } else {
                        setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                      }
                    }}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />

                  {/* Notification Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          {getPriorityBadge(notification.priority)}
                          {notification.actionRequired && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                              ACTION REQUIRED
                            </span>
                          )}
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        
                        <p className={`text-sm mb-3 ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>

                        {/* Metadata */}
                        {notification.metadata && (
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            {notification.metadata.borrowerName && (
                              <span className="flex items-center gap-1">
                                <FaUserCheck className="h-3 w-3" />
                                {notification.metadata.borrowerName}
                              </span>
                            )}
                            {notification.metadata.amount && (
                              <span className="flex items-center gap-1">
                                <FaMoneyBillWave className="h-3 w-3" />
                                {notification.metadata.currency} {notification.metadata.amount.toLocaleString()}
                              </span>
                            )}
                            {notification.metadata.loanId && (
                              <span className="flex items-center gap-1">
                                <FaFileAlt className="h-3 w-3" />
                                {notification.metadata.loanId}
                              </span>
                            )}
                            {notification.metadata.dueDate && (
                              <span className="flex items-center gap-1">
                                <FaCalendarAlt className="h-3 w-3" />
                                Due: {notification.metadata.dueDate.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <FaClock className="h-3 w-3" />
                            {formatTimeAgo(notification.timestamp)}
                          </span>

                          {notification.actionRequired && (
                            <div className="flex gap-2">
                              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                                Take Action
                              </button>
                              <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50">
                                View Details
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Menu */}
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Mark as read"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete notification"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded">
                          <FaEllipsisV className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredNotifications.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Load More Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LenderNotificationsPage;
