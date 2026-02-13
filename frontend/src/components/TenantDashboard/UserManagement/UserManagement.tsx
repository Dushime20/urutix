import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FaPlus, FaSearch, FaFilter, FaUserPlus, FaUsers,
  FaCheckCircle, FaTimesCircle, FaClock
} from 'react-icons/fa';
import UserList from './UserList';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import DeleteUserModal from './DeleteUserModal';
import UserDetailsDrawer from './UserDetailsDrawer';
import UserFilters from './UserFilters';
import { userApi } from '../../../services/userApi';
import { UserRole, UserStatus } from '../../../types/user.types';

interface UserManagementProps {
  tenantId: string;
  className?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  tenantId, 
  className = '' 
}) => {
  const queryClient = useQueryClient();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch users
  const { data: usersData, isLoading, error, refetch } = useQuery({
    queryKey: ['tenant-users', tenantId, selectedRole, selectedStatus, searchQuery, currentPage],
    queryFn: () => userApi.getTenantUsers(tenantId, {
      role: selectedRole !== 'ALL' ? selectedRole : undefined,
      status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      search: searchQuery || undefined,
      page: currentPage,
      limit: pageSize
    }),
    enabled: !!tenantId
  });

  // User statistics
  const userStats = React.useMemo(() => {
    if (!usersData?.data) return { total: 0, active: 0, inactive: 0, suspended: 0 };
    
    const users = usersData.data;
    return {
      total: users.length,
      active: users.filter((u: any) => u.status === 'ACTIVE').length,
      inactive: users.filter((u: any) => u.status === 'INACTIVE').length,
      suspended: users.filter((u: any) => u.status === 'SUSPENDED').length
    };
  }, [usersData]);

  // Handlers
  const handleCreateUser = () => {
    setShowCreateModal(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setShowDetailsDrawer(true);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleUserCreated = () => {
    setShowCreateModal(false);
    refetch();
  };

  const handleUserUpdated = () => {
    setShowEditModal(false);
    refetch();
  };

  const handleUserDeleted = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
    refetch();
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaUsers className="mr-3 text-blue-600" />
              User Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage users within your tenant
            </p>
          </div>
          <button
            onClick={handleCreateUser}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaUserPlus className="mr-2" />
            Create User
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">{userStats.inactive}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <FaClock className="text-gray-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Suspended</p>
                <p className="text-2xl font-bold text-red-600">{userStats.suspended}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FaTimesCircle className="text-red-600 text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FaFilter className="mr-2" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <UserFilters
            selectedRole={selectedRole}
            selectedStatus={selectedStatus}
            onRoleChange={setSelectedRole}
            onStatusChange={setSelectedStatus}
            onReset={() => {
              setSelectedRole('ALL');
              setSelectedStatus('ALL');
              setSearchQuery('');
            }}
          />
        )}
      </div>

      {/* User List */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Error loading users. Please try again.</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <UserList
            users={usersData?.data || []}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onViewDetails={handleViewDetails}
            currentPage={currentPage}
            pageSize={pageSize}
            totalUsers={usersData?.total || 0}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modals and Drawers */}
      {showCreateModal && (
        <CreateUserModal
          tenantId={tenantId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleUserCreated}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleUserUpdated}
        />
      )}

      {showDeleteModal && selectedUser && (
        <DeleteUserModal
          user={selectedUser}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleUserDeleted}
        />
      )}

      {showDetailsDrawer && selectedUser && (
        <UserDetailsDrawer
          user={selectedUser}
          onClose={() => {
            setShowDetailsDrawer(false);
            setSelectedUser(null);
          }}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
        />
      )}
    </div>
  );
};

export default UserManagement;
