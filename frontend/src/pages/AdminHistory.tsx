import React, { useState, useMemo } from 'react';
import {
  FaHistory,
  FaUser,
  FaTruck,
  FaBox,
  FaDollarSign,
  FaFileAlt,
  FaShieldAlt,
  FaCog,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaInfoCircle,
  FaUserPlus,
  FaUserMinus,
  FaEdit,
  FaTrash,
  FaKey,
  FaLock,
  FaUnlock,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';

interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  category: 'user' | 'cargo' | 'payment' | 'system' | 'security' | 'tenant' | 'document';
  description: string;
  status: 'success' | 'warning' | 'error' | 'info';
  ipAddress?: string;
  details?: any;
}

const AdminHistory: React.FC = () => {
  const [activityLogs] = useState<ActivityLog[]>([
    {
      id: 'LOG-001',
      timestamp: '2024-02-12T14:30:00',
      user: 'John Smith',
      userRole: 'Cargo Owner',
      action: 'Cargo Created',
      category: 'cargo',
      description: 'Created new cargo shipment #CRG-1234 from Nairobi to Mombasa',
      status: 'success',
      ipAddress: '192.168.1.100'
    },
    {
      id: 'LOG-002',
      timestamp: '2024-02-12T14:25:00',
      user: 'Sarah Johnson',
      userRole: 'Truck Owner',
      action: 'Bid Placed',
      category: 'cargo',
      description: 'Placed bid of $450 on cargo #CRG-1234',
      status: 'success',
      ipAddress: '192.168.1.101'
    },
    {
      id: 'LOG-003',
      timestamp: '2024-02-12T14:20:00',
      user: 'Admin User',
      userRole: 'Super Admin',
      action: 'User Suspended',
      category: 'user',
      description: 'Suspended user account: mike.wilson@example.com',
      status: 'warning',
      ipAddress: '192.168.1.1'
    },
    {
      id: 'LOG-004',
      timestamp: '2024-02-12T14:15:00',
      user: 'Michael Brown',
      userRole: 'Cargo Owner',
      action: 'Payment Completed',
      category: 'payment',
      description: 'Payment of $450 completed for cargo #CRG-1230',
      status: 'success',
      ipAddress: '192.168.1.102'
    },
    {
      id: 'LOG-005',
      timestamp: '2024-02-12T14:10:00',
      user: 'System',
      userRole: 'System',
      action: 'Backup Completed',
      category: 'system',
      description: 'Daily database backup completed successfully',
      status: 'success',
      ipAddress: 'localhost'
    },
    {
      id: 'LOG-006',
      timestamp: '2024-02-12T14:05:00',
      user: 'Unknown',
      userRole: 'Guest',
      action: 'Failed Login',
      category: 'security',
      description: 'Failed login attempt for admin@example.com',
      status: 'error',
      ipAddress: '203.0.113.45'
    },
    {
      id: 'LOG-007',
      timestamp: '2024-02-12T14:00:00',
      user: 'Admin User',
      userRole: 'Super Admin',
      action: 'Tenant Approved',
      category: 'tenant',
      description: 'Approved tenant: ABC Logistics Ltd',
      status: 'success',
      ipAddress: '192.168.1.1'
    },
    {
      id: 'LOG-008',
      timestamp: '2024-02-12T13:55:00',
      user: 'David Lee',
      userRole: 'Driver',
      action: 'Document Uploaded',
      category: 'document',
      description: 'Uploaded driving license document',
      status: 'success',
      ipAddress: '192.168.1.103'
    },
    {
      id: 'LOG-009',
      timestamp: '2024-02-12T13:50:00',
      user: 'Admin User',
      userRole: 'Super Admin',
      action: 'Permission Updated',
      category: 'security',
      description: 'Updated role permissions for Cargo Owner role',
      status: 'info',
      ipAddress: '192.168.1.1'
    },
    {
      id: 'LOG-010',
      timestamp: '2024-02-12T13:45:00',
      user: 'Emma Wilson',
      userRole: 'Cargo Owner',
      action: 'Cargo Cancelled',
      category: 'cargo',
      description: 'Cancelled cargo shipment #CRG-1229',
      status: 'warning',
      ipAddress: '192.168.1.104'
    },
    {
      id: 'LOG-011',
      timestamp: '2024-02-12T13:40:00',
      user: 'System',
      userRole: 'System',
      action: 'Email Sent',
      category: 'system',
      description: 'Sent 45 notification emails to users',
      status: 'success',
      ipAddress: 'localhost'
    },
    {
      id: 'LOG-012',
      timestamp: '2024-02-12T13:35:00',
      user: 'Admin User',
      userRole: 'Super Admin',
      action: 'User Created',
      category: 'user',
      description: 'Created new user account: jane.doe@example.com',
      status: 'success',
      ipAddress: '192.168.1.1'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      const matchesSearch =
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [activityLogs, searchTerm, categoryFilter, statusFilter]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'user': return <FaUser className="w-4 h-4" />;
      case 'cargo': return <FaBox className="w-4 h-4" />;
      case 'payment': return <FaDollarSign className="w-4 h-4" />;
      case 'system': return <FaCog className="w-4 h-4" />;
      case 'security': return <FaShieldAlt className="w-4 h-4" />;
      case 'tenant': return <FaTruck className="w-4 h-4" />;
      case 'document': return <FaFileAlt className="w-4 h-4" />;
      default: return <FaInfoCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'cargo': return 'bg-purple-100 text-purple-800';
      case 'payment': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'tenant': return 'bg-yellow-100 text-yellow-800';
      case 'document': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <FaCheckCircle className="text-green-500" />;
      case 'warning': return <FaExclamationTriangle className="text-yellow-500" />;
      case 'error': return <FaTimesCircle className="text-red-500" />;
      case 'info': return <FaInfoCircle className="text-blue-500" />;
      default: return <FaInfoCircle className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = () => {
    alert('Exporting activity logs...');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{activityLogs.length}</p>
              <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
              <FaHistory className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">User Actions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {activityLogs.filter(l => l.category === 'user').length}
              </p>
              <p className="text-xs text-green-600 mt-1">+12% from yesterday</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
              <FaUser className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Security Events</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {activityLogs.filter(l => l.category === 'security').length}
              </p>
              <p className="text-xs text-red-600 mt-1">1 failed login</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl">
              <FaShieldAlt className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Events</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {activityLogs.filter(l => l.category === 'system').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">All systems normal</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
              <FaCog className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2.5 text-sm w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="user">User Actions</option>
            <option value="cargo">Cargo Activities</option>
            <option value="payment">Payments</option>
            <option value="system">System Events</option>
            <option value="security">Security</option>
            <option value="tenant">Tenant Management</option>
            <option value="document">Documents</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="info">Info</option>
          </select>

          <button
            onClick={handleExport}
            className="px-4 py-2.5 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <FaDownload className="w-4 h-4" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-base font-bold text-gray-900">Activity Timeline</h3>
          <p className="text-sm text-gray-600 mt-1">
            Showing {filteredLogs.length} of {activityLogs.length} activities
          </p>
        </div>

        <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FaHistory className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No activities found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className={`p-2.5 rounded-lg ${getCategoryColor(log.category)}`}>
                      {getCategoryIcon(log.category)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-gray-900">{log.action}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaUser className="w-3 h-3" />
                            {log.user} ({log.userRole})
                          </span>
                          <span className="flex items-center gap-1">
                            <FaClock className="w-3 h-3" />
                            {formatDate(log.timestamp)}
                          </span>
                          {log.ipAddress && (
                            <span className="flex items-center gap-1">
                              <FaShieldAlt className="w-3 h-3" />
                              {log.ipAddress}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Activity Details</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activity ID</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusIcon(selectedLog.status)}
                    <span className="text-sm text-gray-900 capitalize">{selectedLog.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">User</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedLog.user}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Role</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedLog.userRole}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Category</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium mt-1 ${getCategoryColor(selectedLog.category)}`}>
                    {getCategoryIcon(selectedLog.category)}
                    <span className="ml-1 capitalize">{selectedLog.category}</span>
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Timestamp</p>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(selectedLog.timestamp)}</p>
                </div>
                {selectedLog.ipAddress && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-600">IP Address</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedLog.ipAddress}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Action</p>
                <p className="text-sm text-gray-900 mt-1">{selectedLog.action}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Description</p>
                <p className="text-sm text-gray-900 mt-1">{selectedLog.description}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHistory;
