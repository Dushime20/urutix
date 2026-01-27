import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllUsers,
  createTenantUser,
  updateUser,
  deleteUser,
  activateUser,
  suspendUser,
  fetchTenants
} from '../services/adminApi';
import toast from 'react-hot-toast';
import {
  FaUsers, FaEdit, FaPlus, FaDownload,
  FaEye, FaCheck, FaTimes, FaBan, FaUnlock,
  FaSort, FaUser, FaBuilding, FaClock,
  FaShieldAlt, FaTrash,
  FaEnvelope,
  FaUserCheck, FaUserTimes,
  FaArrowUp, FaArrowDown, FaBell
} from 'react-icons/fa';
import {
  Users as LucideUsers
} from 'lucide-react';
import { UserPermissionEditor } from '../components/Admin/Permissions/UserPermissionEditor';
import { RolePermissionsMatrix } from '../components/Admin/Permissions/RolePermissionsMatrix';
import AdminHeader from '../components/Admin/AdminHeader';

interface User {
  id: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TENANT_ADMIN' | 'CARGO_OWNER' | 'TRUCK_OWNER' | 'DRIVER' | 'AGENT' | 'LENDER';
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
  const [role, setRole] = useState<'CARGO_OWNER' | 'TRUCK_OWNER' | 'DRIVER' | 'AGENT' | 'LENDER' | 'TENANT_ADMIN'>('CARGO_OWNER');

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
  const [permissionUser, setPermissionUser] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

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

  // Mock RBAC stat since we don't have it on User object yet without extra fetch
  // In a real scenario we'd count this from backend or extend User interface
  const usersWithOverrides = 3; // Placeholder for visually demonstrating the stat during UI dev

  const stats = [
    {
      label: 'Total Users',
      value: users.length.toString(),
      change: '+12.5%',
      changeType: 'positive',
      icon: FaUsers,
      color: 'blue',
      description: 'Active platform users'
    },
    {
      label: 'Active Users',
      value: users.filter(u => u.status === 'ACTIVE').length.toString(),
      change: '+5.2%',
      changeType: 'positive',
      icon: FaUserCheck,
      color: 'emerald',
      description: 'Currently active'
    },
    {
      label: 'Security Flagged',
      value: usersWithOverrides.toString(),
      change: '+1',
      changeType: 'neutral',
      icon: FaShieldAlt,
      color: 'violet',
      description: 'Custom permissions'
    },
    {
      label: 'Suspended',
      value: users.filter(u => u.status === 'SUSPENDED').length.toString(),
      change: '0%',
      changeType: 'neutral',
      icon: FaUserTimes,
      color: 'red',
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
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Dark Header */}
      <div className="bg-[#0f172a] text-white">
        <AdminHeader
          searchPlaceholder="Search users..."
          onSearch={(val) => {
            setSearchTerm(val);
          }}
          customRightContent={
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
              <FaBell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a]"></span>
            </button>
          }
        />

        {/* Hero Section */}
        <div className="bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
          <div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 py-8 pb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">User Management</h1>
              <p className="text-slate-400 max-w-xl">Monitor, manage, and audit user accounts, roles, and permissions across the platform.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all"
              >
                <FaPlus size={14} /> Create New User
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 -mt-8 pb-12">


        {/* Tab Switcher */}
        <div className="flex items-center gap-6 mb-6 px-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'users'
              ? 'text-indigo-600 border-indigo-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
          >
            <LucideUsers size={16} /> User Management
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`pb-2 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'roles'
              ? 'text-indigo-600 border-indigo-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
          >
            <FaShieldAlt size={16} /> Role Permissions
          </button>
        </div>

        {activeTab === 'users' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white transition-colors duration-300`}>
                        <Icon size={24} />
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.changeType === 'positive' ? 'bg-emerald-50 text-emerald-600' : stat.changeType === 'negative' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                        {stat.changeType === 'positive' && <FaArrowUp size={10} />}
                        {stat.changeType === 'negative' && <FaArrowDown size={10} />}
                        {stat.change}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-800 mb-1">{stat.value}</h3>
                      <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Users Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Filters Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                  <select
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>

                  <select
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                    <option value="AGENT">Agent</option>
                    <option value="LENDER">Lender</option>
                  </select>

                  <select
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={tenantFilter}
                    onChange={(e) => setTenantFilter(e.target.value)}
                  >
                    <option value="all">All Tenants</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 bg-white transition-colors text-gray-700 font-medium">
                    <FaDownload className="w-3 h-3" /> Export
                  </button>
                  <div className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-2 rounded-lg">
                    {total} users found
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-gray-900">
                        <button
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                          onClick={() => {
                            setSortBy('email');
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          }}
                        >
                          User Details
                          <FaSort className="w-3 h-3 text-gray-400" />
                        </button>
                      </th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Role</th>
                      <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 font-semibold text-gray-900 hidden md:table-cell">Tenant</th>
                      <th className="px-6 py-4 font-semibold text-gray-900 hidden lg:table-cell">Activity</th>
                      <th className="px-6 py-4 font-semibold text-gray-900 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoadingUsers ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            <span className="text-sm text-gray-500">Loading users...</span>
                          </div>
                        </td>
                      </tr>
                    ) : pagedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                              <FaUsers size={20} />
                            </div>
                            <span className="text-gray-900 font-medium">No users found</span>
                            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pagedUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${getRoleColor(user.role).includes('blue') ? 'from-blue-500 to-indigo-600' : 'from-slate-500 to-slate-600'}`}>
                                {user.firstName ? user.firstName[0] : user.email[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">
                                  {user.firstName && user.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user.email.split('@')[0]}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                  <FaEnvelope className="w-3 h-3" />
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleColor(user.role).replace('bg-', 'bg-').replace('text-', 'text-').replace('100', '50').replace('800', '700')} border-${getRoleColor(user.role).split('-')[1]}-200`}>
                              {formatRole(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : user.status === 'SUSPENDED' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                              <span className="text-sm font-medium text-gray-700">{formatRole(user.status)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaBuilding className="text-gray-400" />
                              <span>{user.tenantName || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell">
                            <div className="text-xs">
                              <p className="font-medium text-gray-900">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</p>
                              <p className="text-gray-500">Last login</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDetailsModal(true);
                                }}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                                title="View Details"
                              >
                                <FaEye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setPermissionUser(user)}
                                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Manage Permissions"
                              >
                                <FaShieldAlt className="w-4 h-4" />
                              </button>
                              {user.status === 'SUSPENDED' ? (
                                <button
                                  onClick={() => activateUserMutation(user.id)}
                                  className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Activate"
                                >
                                  <FaUnlock className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => suspendUserMutation({ userId: user.id })}
                                  className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Suspend"
                                >
                                  <FaBan className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagedUsers.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900">{startIdx + 1}-{Math.min(endIdx, total)}</span> of <span className="font-medium text-gray-900">{total}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      onClick={() => setPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="text-sm font-medium text-gray-700">Page {currentPage} of {totalPages}</span>
                    <button
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <RolePermissionsMatrix />
        )}
      </main>

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

      {/* Permission Editor Modal */}
      {/* Permission Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${permissionUser ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {permissionUser && (
          <UserPermissionEditor
            userId={permissionUser.id}
            userName={`${permissionUser.firstName || ''} ${permissionUser.lastName || ''}`.trim() || permissionUser.email}
            userRole={permissionUser.role}
            onClose={() => setPermissionUser(null)}
          />
        )}
      </div>

      {/* Overlay for Drawer */}
      {permissionUser && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setPermissionUser(null)}
        ></div>
      )}
    </div>
  );
};

export default AdminUsers;
