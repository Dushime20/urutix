import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchAllUsers, 
  createTenantUser, 
  updateUser, 
  deleteUser, 
  activateUser, 
  suspendUser, 
  getUserById,
  fetchTenants
} from '../services/adminApi';
import toast from 'react-hot-toast';
import { 
  FaUsers, FaEdit, FaPlus, FaSearch, FaDownload,
  FaEye, FaCheck, FaTimes, FaBan, FaUnlock,
  FaSort, FaEllipsisV, FaClock, FaUser, FaBuilding,
  FaCog, FaShieldAlt, FaExclamationTriangle, FaTrash,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt,
  FaUserCheck, FaUserTimes, FaUserClock
} from 'react-icons/fa';

interface User {
  id: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TENANT_ADMIN' | 'CARGO_OWNER' | 'TRUCK_OWNER' | 'DRIVER' | 'BROKER' | 'AGENT' | 'LENDER';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
  tenantId: string;
  tenantName?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  emailVerifiedAt?: string;
  phoneVerifiedAt?: string;
  profile?: {
    firstName: string;
    lastName: string;
    companyName?: string;
    address?: string;
    cityId?: number;
    postalCode?: string;
    countryCode?: string;
    avatarUrl?: string;
    rating?: number;
    totalTrips?: number;
  };
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
}

const AdminUsers: React.FC = () => {
  const qc = useQueryClient();
  
  // Fetch data
  const { data: usersData, isLoading: isLoadingUsers, error: usersError } = useQuery({ 
    queryKey: ['admin-all-users'], 
    queryFn: () => fetchAllUsers() 
  });
  
  const { data: tenantsData } = useQuery({ 
    queryKey: ['admin-tenants'], 
    queryFn: fetchTenants 
  });
  
  // Form state
  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'CARGO_OWNER' | 'TRUCK_OWNER' | 'DRIVER' | 'AGENT' | 'LENDER' | 'TENANT_ADMIN' | 'BROKER'>('CARGO_OWNER');
  
  // Edit form state
  const [editEmail, setEditEmail] = useState('');
  const [editTenantName, setEditTenantName] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editRole, setEditRole] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('');
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get tenants for dropdown
  const tenants: Tenant[] = tenantsData?.tenants || [];

  // Create a tenant lookup map
  const tenantMap = useMemo(() => {
    const map = new Map<string, string>();
    tenants.forEach(tenant => {
      map.set(tenant.id, tenant.name);
    });
    return map;
  }, [tenants]);

  // Use real data from API
  const users: User[] = useMemo(() => {
    if (!usersData || !Array.isArray(usersData)) return [];
    return usersData.map((user: any) => ({
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      tenantId: user.tenantId,
      tenantName: tenantMap.get(user.tenantId) || user.tenant?.name || 'N/A',
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      companyName: user.profile?.companyName || '',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneVerifiedAt: user.phoneVerifiedAt,
      profile: user.profile
    }));
  }, [usersData, tenantMap]);

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return users
      .filter((user: User) => {
        const matchesSearch = 
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.tenantName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesTenant = tenantFilter === 'all' || user.tenantId === tenantFilter;
        return matchesSearch && matchesStatus && matchesRole && matchesTenant;
      })
      .sort((a: User, b: User) => {
        const aValue = a[sortBy as keyof User] || '';
        const bValue = b[sortBy as keyof User] || '';
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
      });
  }, [users, searchTerm, statusFilter, roleFilter, tenantFilter, sortBy, sortOrder]);

  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedUsers = filteredUsers.slice(startIdx, endIdx);

  // Mutations
  const { mutate: createUser, isPending: isCreating } = useMutation({
    mutationFn: () => createTenantUser(tenantId, {
      email: email.trim(),
      password: password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: role,
      phoneNumber: phoneNumber.trim() || undefined,
      companyName: companyName.trim() || undefined
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-users'] });
      resetForm();
      setShowCreateModal(false);
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create user');
    }
  });

  const { mutate: updateUserMutation, isPending: isUpdating } = useMutation({
    mutationFn: () => {
      if (!editingUserId) throw new Error('No user to update');
      return updateUser(editingUserId, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim() || undefined,
        companyName: editCompanyName.trim() || undefined,
        role: editRole,
        status: editStatus
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-users'] });
      setShowEditModal(false);
      setEditingUserId(null);
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update user');
    }
  });

  const { mutate: deleteUserMutation } = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete user');
    }
  });

  const { mutate: activateUserMutation } = useMutation({
    mutationFn: (userId: string) => activateUser(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-users'] });
      toast.success('User activated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to activate user');
    }
  });

  const { mutate: suspendUserMutation } = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) => suspendUser(userId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-users'] });
      toast.success('User suspended successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to suspend user');
    }
  });

  const resetForm = () => {
    setTenantId('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setCompanyName('');
    setRole('CARGO_OWNER');
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditEmail(user.email);
    setEditTenantName(user.tenantName || 'N/A');
    setEditFirstName(user.firstName || '');
    setEditLastName(user.lastName || '');
    setEditPhone(user.phone || '');
    setEditCompanyName(user.companyName || '');
    setEditRole(user.role);
    setEditStatus(user.status);
    setShowEditModal(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation(userId);
    }
  };

  const handleCreateUser = () => {
    if (!tenantId || !email || !password || !firstName || !lastName) {
      toast.error('Please fill in all required fields');
      return;
    }
    createUser();
  };

  const stats = [
    { 
      label: 'Total Users', 
      value: users.length, 
      icon: FaUsers, 
      color: 'from-blue-500 to-blue-600',
      description: 'All registered users'
    },
    { 
      label: 'Active Users', 
      value: users.filter(u => u.status === 'ACTIVE').length, 
      icon: FaUserCheck, 
      color: 'from-green-500 to-green-600',
      description: 'Currently active'
    },
    { 
      label: 'Pending Verification', 
      value: users.filter(u => u.status === 'PENDING_VERIFICATION').length, 
      icon: FaUserClock, 
      color: 'from-yellow-500 to-yellow-600',
      description: 'Awaiting verification'
    },
    { 
      label: 'Suspended Users', 
      value: users.filter(u => u.status === 'SUSPENDED').length, 
      icon: FaUserTimes, 
      color: 'from-red-500 to-red-600',
      description: 'Suspended accounts'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'PENDING_VERIFICATION': return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800';
      case 'ADMIN': return 'bg-blue-100 text-blue-800';
      case 'TENANT_ADMIN': return 'bg-indigo-100 text-indigo-800';
      case 'CARGO_OWNER': return 'bg-green-100 text-green-800';
      case 'TRUCK_OWNER': return 'bg-orange-100 text-orange-800';
      case 'DRIVER': return 'bg-yellow-100 text-yellow-800';
      case 'BROKER': return 'bg-teal-100 text-teal-800';
      case 'AGENT': return 'bg-pink-100 text-pink-800';
      case 'LENDER': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <FaCheck className="text-green-500" />;
      case 'INACTIVE': return <FaTimes className="text-gray-500" />;
      case 'PENDING_VERIFICATION': return <FaClock className="text-yellow-500" />;
      case 'SUSPENDED': return <FaBan className="text-red-500" />;
      default: return <FaTimes className="text-gray-500" />;
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">User Management</h1>
          <p className="text-xs text-gray-600 mt-0.5">Manage platform users and their permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm text-xs font-medium"
        >
          <FaPlus className="w-3 h-3" />
          <span>Add User</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity" style={{
                background: stat.color === 'from-blue-500 to-blue-600' ? 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), transparent)' :
                           stat.color === 'from-green-500 to-green-600' ? 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.05), transparent)' :
                           stat.color === 'from-yellow-500 to-yellow-600' ? 'linear-gradient(to bottom right, rgba(245, 158, 11, 0.05), transparent)' :
                           'linear-gradient(to bottom right, rgba(239, 68, 68, 0.05), transparent)'
              }}></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-0.5">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900 mb-0.5">{stat.value}</p>
                    <p className="text-[10px] text-gray-500">{stat.description}</p>
                  </div>
                  <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white text-sm" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-2.5 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="relative">
            <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING_VERIFICATION">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          <select
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="TENANT_ADMIN">Tenant Admin</option>
            <option value="CARGO_OWNER">Cargo Owner</option>
            <option value="TRUCK_OWNER">Truck Owner</option>
            <option value="DRIVER">Driver</option>
            <option value="BROKER">Broker</option>
            <option value="AGENT">Agent</option>
            <option value="LENDER">Lender</option>
          </select>

          <select
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
          >
            <option value="all">All Tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>

          <button className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
            <FaDownload className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>

        {/* Pagination controls */}
        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {total} users
          </div>
          <div className="flex items-center gap-1.5">
            <select
              className="px-1.5 py-0.5 text-xs border border-gray-200 rounded"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        {isLoadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-xs text-gray-600">Loading users...</span>
          </div>
        ) : usersError ? (
          <div className="p-3 text-center">
            <div className="text-red-600 mb-1.5">
              <FaExclamationTriangle className="text-lg mx-auto mb-1.5" />
              <p className="text-xs">Failed to load users. Please try again.</p>
            </div>
          </div>
        ) : pagedUsers.length === 0 ? (
          <div className="p-3 text-center">
            <FaUsers className="text-xl text-gray-400 mx-auto mb-1.5" />
            <p className="text-xs text-gray-600">No users found</p>
            {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || tenantFilter !== 'all' ? (
              <p className="text-[10px] text-gray-500 mt-1">Try adjusting your filters</p>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">
                    <button 
                      className="flex items-center gap-1"
                      onClick={() => {
                        setSortBy('email');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <span>User</span>
                      <FaSort className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Role</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Status</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Tenant</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Last Login</th>
                  <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <FaUser className="text-white text-xs" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-xs">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.email.split('@')[0]}
                          </div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <FaEnvelope className="w-2.5 h-2.5" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="text-[10px] text-gray-400 flex items-center gap-0.5">
                              <FaPhone className="w-2.5 h-2.5" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getRoleColor(user.role)}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px]">{getStatusIcon(user.status)}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(user.status)}`}>
                          {formatRole(user.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-0.5">
                        <FaBuilding className="text-gray-400 text-xs" />
                        <span className="text-xs text-gray-900">{user.tenantName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="text-xs text-gray-900">
                        {user.lastLoginAt 
                          ? new Date(user.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailsModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <FaEye className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                          title="Edit"
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                        {user.status === 'SUSPENDED' ? (
                          <button 
                            onClick={() => activateUserMutation(user.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Activate"
                          >
                            <FaUnlock className="w-3 h-3" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => suspendUserMutation({ userId: user.id })}
                            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                            title="Suspend"
                          >
                            <FaBan className="w-3 h-3" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {pagedUsers.length > 0 && (
          <div className="flex items-center justify-between p-2 border-t border-gray-200 bg-gray-50">
            <div className="text-[10px] text-gray-600">
              Showing {Math.min(endIdx, total)} of {total}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                className="px-1.5 py-0.5 text-xs border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="text-[10px] text-gray-700">Page {currentPage} / {totalPages}</span>
              <button
                className="px-1.5 py-0.5 text-xs border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Create New User</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tenant *
                  </label>
                  <select
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                  >
                    <option value="">Select tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                  >
                    <option value="CARGO_OWNER">Cargo Owner</option>
                    <option value="TRUCK_OWNER">Truck Owner</option>
                    <option value="DRIVER">Driver</option>
                    <option value="BROKER">Broker</option>
                    <option value="AGENT">Agent</option>
                    <option value="LENDER">Lender</option>
                    <option value="TENANT_ADMIN">Tenant Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter company name (optional)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <div className="flex items-start gap-1.5">
                  <FaShieldAlt className="text-blue-600 mt-0.5 text-xs" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-xs">User Information</h4>
                    <p className="text-[10px] text-blue-700 mt-0.5">
                      A new user account will be created. The user will receive an email with login instructions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={isCreating || !tenantId || !email || !password || !firstName || !lastName}
                className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
              >
                {isCreating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isCreating ? 'Creating...' : 'Create User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">Edit User</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUserId(null);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-3 space-y-3">
              {/* Read-only user info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium text-gray-900">{editEmail}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tenant:</span>
                    <span className="ml-2 font-medium text-gray-900">{editTenantName}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter first name"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter last name"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter company name"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="TENANT_ADMIN">Tenant Admin</option>
                    <option value="CARGO_OWNER">Cargo Owner</option>
                    <option value="TRUCK_OWNER">Truck Owner</option>
                    <option value="DRIVER">Driver</option>
                    <option value="BROKER">Broker</option>
                    <option value="AGENT">Agent</option>
                    <option value="LENDER">Lender</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <div className="flex items-start gap-1.5">
                  <FaShieldAlt className="text-blue-600 mt-0.5 text-xs" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-xs">Update Information</h4>
                    <p className="text-[10px] text-blue-700 mt-0.5">
                      Changes will be saved immediately. Email and tenant cannot be changed from this form.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUserId(null);
                }}
                className="px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateUserMutation()}
                disabled={isUpdating || !editFirstName || !editLastName}
                className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
              >
                {isUpdating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <FaUser className="text-white text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {selectedUser.firstName && selectedUser.lastName 
                        ? `${selectedUser.firstName} ${selectedUser.lastName}`
                        : selectedUser.email.split('@')[0]}
                    </h2>
                    <p className="text-xs text-gray-600">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-3 space-y-3">
              {/* Status and Role */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px]">{getStatusIcon(selectedUser.status)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                      {formatRole(selectedUser.status)}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                    {formatRole(selectedUser.role)}
                  </span>
                </div>
                <div className="flex space-x-1.5">
                  <button 
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleEditUser(selectedUser);
                    }}
                    className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit User
                  </button>
                </div>
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">User Information</h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedUser.email}</span>
                    </div>
                    {selectedUser.phone && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedUser.phone}</span>
                      </div>
                    )}
                    {selectedUser.companyName && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Company:</span>
                        <span className="font-medium">{selectedUser.companyName}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Tenant:</span>
                      <span className="font-medium">{selectedUser.tenantName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Last Login:</span>
                      <span className="font-medium">
                        {selectedUser.lastLoginAt 
                          ? new Date(selectedUser.lastLoginAt).toLocaleString()
                          : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Verification Status</h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Email Verified:</span>
                      <span className={`font-medium ${selectedUser.emailVerifiedAt ? 'text-green-600' : 'text-gray-400'}`}>
                        {selectedUser.emailVerifiedAt ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {selectedUser.emailVerifiedAt && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Verified At:</span>
                        <span className="font-medium">{new Date(selectedUser.emailVerifiedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Phone Verified:</span>
                      <span className={`font-medium ${selectedUser.phoneVerifiedAt ? 'text-green-600' : 'text-gray-400'}`}>
                        {selectedUser.phoneVerifiedAt ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {selectedUser.profile?.rating && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Rating:</span>
                        <span className="font-medium">{selectedUser.profile.rating.toFixed(1)} / 5.0</span>
                      </div>
                    )}
                    {selectedUser.profile?.totalTrips !== undefined && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Total Trips:</span>
                        <span className="font-medium">{selectedUser.profile.totalTrips}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedUser.status === 'SUSPENDED' ? (
                    <button 
                      onClick={() => {
                        activateUserMutation(selectedUser.id);
                        setShowDetailsModal(false);
                      }}
                      className="w-full flex items-center space-x-2 p-2 text-left border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-green-600 text-xs"
                    >
                      <FaUnlock className="text-green-400 text-xs" />
                      <span>Activate User</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        suspendUserMutation({ userId: selectedUser.id });
                        setShowDetailsModal(false);
                      }}
                      className="w-full flex items-center space-x-2 p-2 text-left border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors text-yellow-600 text-xs"
                    >
                      <FaBan className="text-yellow-400 text-xs" />
                      <span>Suspend User</span>
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      handleDeleteUser(selectedUser.id);
                      setShowDetailsModal(false);
                    }}
                    className="w-full flex items-center space-x-2 p-2 text-left border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600 text-xs"
                  >
                    <FaTrash className="text-red-400 text-xs" />
                    <span>Delete User</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
