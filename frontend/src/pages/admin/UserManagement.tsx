import React, { useState, useEffect } from 'react';
import {
  FaUsers, FaEdit, FaTrash, FaPlus, FaSearch, FaDownload,
  FaEye, FaUserCheck, FaUserTimes, FaShieldAlt, FaFilter,
  FaSort, FaEllipsisV, FaCheck, FaTimes, FaBan, FaUnlock,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt
} from 'react-icons/fa';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { usePermission } from '../../contexts/PermissionContext';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  joinDate: string;
  lastLogin: string;
  avatar?: string;
  phone?: string;
  company?: string;
  location?: string;
  verificationStatus: 'verified' | 'unverified' | 'pending';
  totalShipments?: number;
  totalRevenue?: number;
}

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  
  // Permission-based access control with role fallback
  const canManageUsers = hasPermission('user:manage') || 
                         hasPermission('user:update') || 
                         user?.role === 'ADMIN' || 
                         user?.role === 'SUPER_ADMIN' ||
                         user?.role === 'TENANT_ADMIN';
  
  const canCreateUsers = hasPermission('user:create') || 
                         user?.role === 'ADMIN' || 
                         user?.role === 'SUPER_ADMIN' ||
                         user?.role === 'TENANT_ADMIN';
  
  const canDeleteUsers = hasPermission('user:delete') || 
                         user?.role === 'ADMIN' || 
                         user?.role === 'SUPER_ADMIN';
  
  const canViewUsers = hasPermission('user:view') || 
                       hasPermission('user:manage') || 
                       user?.role === 'ADMIN' || 
                       user?.role === 'SUPER_ADMIN' ||
                       user?.role === 'TENANT_ADMIN';
  
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'cargo@test.com',
      name: 'John Cargo',
      role: 'CARGO_OWNER',
      status: 'active',
      joinDate: '2024-01-15',
      lastLogin: '2024-08-09 10:30',
      phone: '+250 788 123 456',
      company: 'TransCorp Ltd',
      location: 'Kigali, Rwanda',
      verificationStatus: 'verified',
      totalShipments: 45,
      totalRevenue: 2500000
    },
    {
      id: '2',
      email: 'driver@test.com',
      name: 'Mike Driver',
      role: 'DRIVER',
      status: 'active',
      joinDate: '2024-02-20',
      lastLogin: '2024-08-09 09:15',
      phone: '+250 789 456 789',
      company: 'FastTrans Fleet',
      location: 'Nairobi, Kenya',
      verificationStatus: 'verified',
      totalShipments: 89,
      totalRevenue: 1800000
    },
    {
      id: '3',
      email: 'owner@test.com',
      name: 'Sarah Owner',
      role: 'TRUCK_OWNER',
      status: 'pending',
      joinDate: '2024-08-08',
      lastLogin: 'Never',
      phone: '+250 787 987 654',
      company: 'Green Logistics',
      location: 'Kampala, Uganda',
      verificationStatus: 'pending',
      totalShipments: 0,
      totalRevenue: 0
    },
    {
      id: '4',
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'ADMIN',
      status: 'active',
      joinDate: '2024-01-01',
      lastLogin: '2024-08-09 11:45',
      phone: '+250 786 111 222',
      company: 'UrutiX Platform',
      location: 'Kigali, Rwanda',
      verificationStatus: 'verified',
      totalShipments: 0,
      totalRevenue: 0
    },
    {
      id: '5',
      email: 'fleet@test.com',
      name: 'David Fleet',
      role: 'TRUCK_OWNER',
      status: 'suspended',
      joinDate: '2024-03-10',
      lastLogin: '2024-08-05 14:20',
      phone: '+250 785 333 444',
      company: 'Mega Transport',
      location: 'Dar es Salaam, Tanzania',
      verificationStatus: 'verified',
      totalShipments: 23,
      totalRevenue: 950000
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVerification, setFilterVerification] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    setShowBulkActions(selectedUsers.length > 0);
  }, [selectedUsers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800';
      case 'CARGO_OWNER': return 'bg-blue-100 text-blue-800';
      case 'TRUCK_OWNER': return 'bg-green-100 text-green-800';
      case 'DRIVER': return 'bg-yellow-100 text-yellow-800';
      case 'BROKER': return 'bg-orange-100 text-orange-800';
      case 'AGENT': return 'bg-cyan-100 text-cyan-800';
      case 'LENDER': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'unverified': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !filterRole || user.role === filterRole;
      const matchesStatus = !filterStatus || user.status === filterStatus;
      const matchesVerification = !filterVerification || user.verificationStatus === filterVerification;
      return matchesSearch && matchesRole && matchesStatus && matchesVerification;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof User];
      let bValue: any = b[sortBy as keyof User];

      if (sortBy === 'joinDate' || sortBy === 'lastLogin') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredAndSortedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredAndSortedUsers.map(user => user.id));
    }
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'activate':
        setUsers(prev => prev.map(user =>
          selectedUsers.includes(user.id) ? { ...user, status: 'active' as const } : user
        ));
        break;
      case 'suspend':
        setUsers(prev => prev.map(user =>
          selectedUsers.includes(user.id) ? { ...user, status: 'suspended' as const } : user
        ));
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
          setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
        }
        break;
    }
    setSelectedUsers([]);
  };

  const openUserModal = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleStatusChange = (userId: string, newStatus: User['status']) => {
    setUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, status: newStatus } : user
    ));
  };

  return (
    <AdminPageLayout
      title="User Management"
      description="Manage all platform users and their permissions"
      actions={
        <>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold shadow-lg transition-all">
            <FaDownload size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
          {canCreateUsers && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all">
              <FaPlus size={14} />
              <span className="hidden sm:inline">Add User</span>
            </button>
          )}
        </>
      }
    >
      {/* Enhanced Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative lg:col-span-2">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users, companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="CARGO_OWNER">Cargo Owner</option>
            <option value="TRUCK_OWNER">Truck Owner</option>
            <option value="DRIVER">Driver</option>
            <option value="BROKER">Broker</option>
            <option value="AGENT">Agent</option>
            <option value="LENDER">Lender</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={filterVerification}
            onChange={(e) => setFilterVerification(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && canManageUsers && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-800">
                {selectedUsers.length} user(s) selected
              </span>
              <button
                onClick={() => setSelectedUsers([])}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear selection
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
              >
                <FaCheck />
                <span>Activate</span>
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
              >
                <FaBan />
                <span>Suspend</span>
              </button>
              {canDeleteUsers && (
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                >
                  <FaTrash />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced User Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 lg:px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 lg:px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>User</span>
                    <FaSort className="text-xs" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => {
                      setSortBy('joinDate');
                      setSortOrder(sortBy === 'joinDate' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Join Date</span>
                    <FaSort className="text-xs" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserSelect(user.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.company && (
                          <div className="text-xs text-gray-400">{user.company}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVerificationColor(user.verificationStatus)}`}>
                      {user.verificationStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.joinDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {canViewUsers && (
                        <button
                          onClick={() => openUserModal(user)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                      )}
                      {canManageUsers && (
                        <button className="text-green-600 hover:text-green-900 p-1 rounded transition-colors" title="Edit">
                          <FaEdit />
                        </button>
                      )}
                      {canManageUsers && (
                        <button className="text-yellow-600 hover:text-yellow-900 p-1 rounded transition-colors" title="Permissions">
                          <FaShieldAlt />
                        </button>
                      )}
                      <div className="relative">
                        <button className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors" title="More Actions">
                          <FaEllipsisV />
                        </button>
                        {/* Dropdown menu would go here */}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{users.length}</p>
              <p className="text-gray-600">Total Users</p>
            </div>
            <FaUsers className="text-blue-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.status === 'active').length}</p>
              <p className="text-gray-600">Active Users</p>
            </div>
            <FaUserCheck className="text-green-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.status === 'pending').length}</p>
              <p className="text-gray-600">Pending Users</p>
            </div>
            <FaUserTimes className="text-yellow-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.role === 'ADMIN').length}</p>
              <p className="text-gray-600">Admins</p>
            </div>
            <FaShieldAlt className="text-purple-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.verificationStatus === 'verified').length}</p>
              <p className="text-gray-600">Verified</p>
            </div>
            <FaCheck className="text-green-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">User Details</h3>
              <button
                onClick={closeUserModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-800">{selectedUser.name}</h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <p className="text-sm text-gray-500">{selectedUser.company}</p>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <FaPhone className="text-gray-400" />
                  <span className="text-gray-700">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <span className="text-gray-700">{selectedUser.location || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCalendarAlt className="text-gray-400" />
                  <span className="text-gray-700">Joined {new Date(selectedUser.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaEnvelope className="text-gray-400" />
                  <span className="text-gray-700">Last login: {selectedUser.lastLogin}</span>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedUser.status}
                    onChange={(e) => handleStatusChange(selectedUser.id, e.target.value as User['status'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-lg ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
                  <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-lg ${getVerificationColor(selectedUser.verificationStatus)}`}>
                    {selectedUser.verificationStatus}
                  </span>
                </div>
              </div>

              {/* Stats */}
              {(selectedUser.totalShipments !== undefined || selectedUser.totalRevenue !== undefined) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedUser.totalShipments !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Total Shipments</p>
                      <p className="text-2xl font-bold text-gray-800">{selectedUser.totalShipments}</p>
                    </div>
                  )}
                  {selectedUser.totalRevenue !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-800">RWF {selectedUser.totalRevenue?.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                {canManageUsers && (
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Edit User
                  </button>
                )}
                <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                  Send Message
                </button>
                {canDeleteUsers && (
                  <button className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors">
                    Delete User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default UserManagement;
