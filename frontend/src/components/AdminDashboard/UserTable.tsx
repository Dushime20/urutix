import React, { useMemo, useState } from 'react';
import {
  FaUsers, FaEdit, FaTrash, FaPlus, FaSearch, FaDownload,
  FaEye, FaUserCheck, FaUserTimes, FaShieldAlt
} from 'react-icons/fa';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../EnliteUI/Tables';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CARGO_OWNER' | 'FLEET_OWNER' | 'DRIVER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastActive: string;
  joinedAt: string;
}

const ROLE_VARIANT: Record<User['role'], 'error' | 'primary' | 'success' | 'warning'> = {
  ADMIN: 'error',
  CARGO_OWNER: 'primary',
  FLEET_OWNER: 'success',
  DRIVER: 'warning',
};

const UserTable: React.FC = () => {
  const [users] = useState<User[]>([
    {
      id: '1',
      email: 'admin@urutix.com',
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE',
      lastActive: '2024-08-09T10:30:00Z',
      joinedAt: '2024-01-15T08:00:00Z'
    },
    {
      id: '2',
      email: 'cargo@test.com',
      name: 'John Cargo',
      role: 'CARGO_OWNER',
      status: 'ACTIVE',
      lastActive: '2024-08-09T09:15:00Z',
      joinedAt: '2024-02-20T14:30:00Z'
    },
    {
      id: '3',
      email: 'fleet@test.com',
      name: 'Jane Fleet',
      role: 'FLEET_OWNER',
      status: 'ACTIVE',
      lastActive: '2024-08-09T11:45:00Z',
      joinedAt: '2024-03-10T10:15:00Z'
    },
    {
      id: '4',
      email: 'driver@test.com',
      name: 'Mike Driver',
      role: 'DRIVER',
      status: 'INACTIVE',
      lastActive: '2024-08-07T16:20:00Z',
      joinedAt: '2024-04-05T12:00:00Z'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <FaUserCheck className="text-green-500" />;
      case 'INACTIVE': return <FaUserTimes className="text-gray-500" />;
      case 'SUSPENDED': return <FaShieldAlt className="text-red-500" />;
      default: return <FaUserTimes className="text-gray-500" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesStatus = !filterStatus || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const userColumns: Column<User>[] = useMemo(() => [
    {
      key: 'name',
      label: 'User',
      sortable: true,
      render: (_, user) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user.name.charAt(0)}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (_, user) => (
        <StatusBadge
          label={user.role.replace('_', ' ')}
          variant={ROLE_VARIANT[user.role]}
        />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_, user) => (
        <div className="flex items-center">
          {getStatusIcon(user.status)}
          <StatusBadge label={user.status} status={user.status} className="ml-2" />
        </div>
      ),
    },
    {
      key: 'lastActive',
      label: 'Last Active',
      sortable: true,
      render: (_, user) => (
        <span className="text-sm text-gray-900 dark:text-white">{new Date(user.lastActive).toLocaleDateString()}</span>
      ),
    },
    {
      key: 'joinedAt',
      label: 'Joined',
      sortable: true,
      render: (_, user) => (
        <span className="text-sm text-gray-900 dark:text-white">{new Date(user.joinedAt).toLocaleDateString()}</span>
      ),
    },
  ], []);

  const userRowActions: TableAction<User>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View',
      icon: <FaEye />,
      onClick: () => {},
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <FaEdit />,
      onClick: () => {},
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <FaTrash />,
      variant: 'danger',
      onClick: () => {},
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
          <p className="text-gray-600 dark:text-slate-300">Manage platform users and their access</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <FaPlus />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="CARGO_OWNER">Cargo Owner</option>
            <option value="FLEET_OWNER">Fleet Owner</option>
            <option value="DRIVER">Driver</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <FaDownload />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{users.length}</p>
              <p className="text-gray-600 dark:text-slate-300">Total Users</p>
            </div>
            <FaUsers className="text-purple-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.status === 'ACTIVE').length}</p>
              <p className="text-gray-600 dark:text-slate-300">Active Users</p>
            </div>
            <FaUserCheck className="text-green-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.role === 'ADMIN').length}</p>
              <p className="text-gray-600 dark:text-slate-300">Administrators</p>
            </div>
            <FaShieldAlt className="text-red-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{users.filter(u => new Date(u.lastActive) > new Date(Date.now() - 24*60*60*1000)).length}</p>
              <p className="text-gray-600 dark:text-slate-300">Active Today</p>
            </div>
            <FaUsers className="text-blue-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <StandardDataTable<User>
        embedded
        searchable={false}
        columnVisibility={false}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden px-4 py-4"
        columns={userColumns}
        data={filteredUsers}
        getRowId={(row) => row.id}
        rowActions={userRowActions}
        stickyHeader
        pagination={filteredUsers.length > 10}
        pageSize={10}
        defaultSortKey="name"
        emptyMessage="No users match your current filters"
        ariaLabel="User management"
      />
    </div>
  );
};

export default UserTable;
