import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllUsers } from '../services/adminApi';
import toast from 'react-hot-toast';
import {
  FaTimes, FaUsers, FaSearch, FaFilter, FaUserPlus,
  FaEdit, FaBan, FaCheckCircle, FaTimesCircle, FaEye,
  FaEnvelope, FaPhone, FaBuilding, FaUserShield
} from 'react-icons/fa';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from './EnliteUI/Tables';

interface User {
  id: string;
  email: string;
  role: string;
  status?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    companyName?: string;
  };
  createdAt?: string;
  lastLoginAt?: string;
}

interface ManageUsersModalProps {
  tenantId: string;
  tenantName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ManageUsersModal: React.FC<ManageUsersModalProps> = ({
  tenantId,
  tenantName,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch users for this tenant
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['tenant-users', tenantId],
    queryFn: async () => {
      const result = await fetchAllUsers(tenantId);
      return result || [];
    },
    enabled: isOpen && !!tenantId,
  });

  const users: User[] = usersData || [];

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.profile?.firstName} ${user.profile?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    const roleMap: Record<string, string> = {
      'TENANT_ADMIN': 'bg-purple-100 text-purple-800',
      'CARGO_OWNER': 'bg-blue-100 text-blue-800',
      'TRUCK_OWNER': 'bg-green-100 text-green-800',
      'DRIVER': 'bg-yellow-100 text-yellow-800',
      'ADMIN': 'bg-red-100 text-red-800',
      'SUPER_ADMIN': 'bg-gray-100 text-gray-800',
    };
    return roleMap[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role: string) => {
    if (role === 'TENANT_ADMIN' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return <FaUserShield className="w-4 h-4" />;
    }
    return <FaUsers className="w-4 h-4" />;
  };

  if (!isOpen) return null;

  const uniqueRoles = Array.from(new Set(users.map((u) => u.role)));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-6xl p-0 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <FaUsers className="w-6 h-6 text-blue-600" />
                <span>Manage Users</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">{tenantName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Filters and Search */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                {uniqueRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.replace('_', ' ')}
                  </option>
                ))}
              </select>

              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredUsers.length}</span> of{' '}
                <span className="font-semibold">{users.length}</span> users
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <FaUserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <StandardDataTable
              embedded
              columns={[
                {
                  key: 'email',
                  label: 'User',
                  sortable: true,
                  render: (_: string, user: User) => (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {user.profile?.firstName && user.profile?.lastName
                            ? `${user.profile.firstName} ${user.profile.lastName}`
                            : 'No Name'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-1">
                          <FaEnvelope className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'role',
                  label: 'Role',
                  sortable: true,
                  render: (role: string) => (
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}>
                      {getRoleIcon(role)}
                      <span>{role.replace('_', ' ')}</span>
                    </span>
                  ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  sortable: true,
                  render: (status?: string) => (
                    <StatusBadge label={status || 'ACTIVE'} status={(status || 'ACTIVE').toLowerCase()} />
                  ),
                },
                {
                  key: 'profile',
                  label: 'Contact',
                  render: (_: any, user: User) => (
                    <div className="text-sm text-gray-900 dark:text-slate-200">
                      {user.profile?.phone ? (
                        <div className="flex items-center space-x-1">
                          <FaPhone className="w-3 h-3 text-gray-400" />
                          <span>{user.profile.phone}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">No phone</span>
                      )}
                      {user.profile?.companyName && (
                        <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
                          <FaBuilding className="w-3 h-3" />
                          <span>{user.profile.companyName}</span>
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'lastLoginAt',
                  label: 'Last Login',
                  sortable: true,
                  render: (lastLoginAt: string | undefined, user: User) => (
                    <div>
                      <div className="text-sm text-gray-900 dark:text-slate-200">
                        {lastLoginAt ? new Date(lastLoginAt).toLocaleDateString() : 'Never'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.createdAt ? `Joined ${new Date(user.createdAt).toLocaleDateString()}` : ''}
                      </div>
                    </div>
                  ),
                },
              ] as Column<User>[]}
              data={filteredUsers}
              loading={isLoading}
              error={error ? 'Failed to load users. Please try again.' : null}
              onRetry={() => refetch()}
              getRowId={(row) => row.id}
              searchable={false}
              pagination
              pageSize={10}
              columnVisibility
              stickyHeader
              striped
              hoverable
              dense
              emptyMessage={
                searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'No users match your current filters'
                  : 'No users found'
              }
              rowActions={[
                { key: 'view', label: 'View Details', icon: <FaEye />, onClick: () => undefined },
                { key: 'edit', label: 'Edit User', icon: <FaEdit />, onClick: () => undefined },
                {
                  key: 'toggle',
                  label: 'Toggle Status',
                  icon: <FaBan />,
                  variant: 'danger',
                  onClick: () => undefined,
                },
              ] as TableAction<User>[]}
              ariaLabel="Tenant users"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Total users: <span className="font-semibold">{users.length}</span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUsersModal;

