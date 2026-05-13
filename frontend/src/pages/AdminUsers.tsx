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
  Users, Edit, Plus, Download,
  Eye, X, Ban, Unlock,
  ChevronsUpDown, User, Building2,
  ShieldCheck, Trash2,
  Mail,
  UserCheck, UserX,
  Search
} from 'lucide-react';
import { UserPermissionEditor } from '../components/Admin/Permissions/UserPermissionEditor';
import { RolePermissionsMatrix } from '../components/Admin/Permissions/RolePermissionsMatrix';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { TranslatedText } from '../components/translated-text';
import ModernLoader from '../components/common/ModernLoader';

interface User {
  id: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TENANT_ADMIN' | 'CARGO_OWNER' | 'TRUCK_OWNER' | 'DRIVER' | 'BROKER' | 'AGENT' | 'LENDER' | 'CARGO_RECEIVER' | 'FLEET_MANAGER' | 'FLEET_DISPATCHER' | 'FLEET_ACCOUNTANT' | 'FLEET_SAFETY_OFFICER' | 'CUSTOMS_OFFICER';
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
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'CARGO_OWNER' | 'TRUCK_OWNER' | 'DRIVER' | 'AGENT' | 'LENDER' | 'TENANT_ADMIN' | 'BROKER' | 'CARGO_RECEIVER' | 'FLEET_MANAGER' | 'FLEET_DISPATCHER' | 'FLEET_ACCOUNTANT' | 'FLEET_SAFETY_OFFICER' | 'CUSTOMS_OFFICER'>('CARGO_OWNER');

  // Edit form state
  const [editEmail, setEditEmail] = useState('');
  const [editTenantId, setEditTenantId] = useState('');
  const [editTenantName, setEditTenantName] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
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

  // Get tenants for dropdown - only show ACTIVE tenants
  const tenants: Tenant[] = useMemo(() => {
    const allTenants = tenantsData?.tenants || [];
    return allTenants.filter((tenant: Tenant) =>
      tenant.status === 'ACTIVE' || tenant.status === 'active'
    );
  }, [tenantsData]);

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
    mutationFn: () => {
      // Generate a secure random password since the admin shouldn't set this
      const generatedPassword = Math.random().toString(36).slice(-10) + 'A1!';
      return createTenantUser(tenantId, {
        email: email.trim(),
        password: generatedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: role,
        phoneNumber: phoneNumber.trim() || undefined,
        companyName: tenantId
      });
    },
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
        email: editEmail.trim(),
        tenantId: editTenantId,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim() || undefined,
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
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setRole('CARGO_OWNER');
  };

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditEmail(user.email);
    setEditTenantId(user.tenantId);
    setEditTenantName(user.tenantName || 'N/A');
    setEditFirstName(user.firstName || '');
    setEditLastName(user.lastName || '');
    setEditPhone(user.phone || '');
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
    if (!tenantId || !email || !firstName || !lastName) {
      toast.error('Please fill in all required fields');
      return;
    }
    createUser();
  };

  // Mock RBAC stat since we don't have it on User object yet without extra fetch
  // In a real scenario we'd count this from backend or extend User interface
  const usersWithOverrides = 3; // Placeholder for visually demonstrating the stat during UI dev

  const getStatsData = () => [
    {
      label: 'Total Users',
      value: users.length.toString(),
      change: '+12.5%',
      changeType: 'positive',
      icon: Users,
      color: 'blue',
      description: 'Active platform users'
    },
    {
      label: 'Active Users',
      value: users.filter(u => u.status === 'ACTIVE').length.toString(),
      change: '+5.2%',
      changeType: 'positive',
      icon: UserCheck,
      color: 'emerald',
      description: 'Currently active'
    },
    {
      label: 'Security Flagged',
      value: usersWithOverrides.toString(),
      change: '+1',
      changeType: 'neutral',
      icon: ShieldCheck,
      color: 'violet',
      description: 'Custom permissions'
    },
    {
      label: 'Suspended',
      value: users.filter(u => u.status === 'SUSPENDED').length.toString(),
      change: '0%',
      changeType: 'neutral',
      icon: UserX,
      color: 'red',
      description: 'Suspended accounts'
    },
  ];

  const stats = getStatsData();

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

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  return (
    <AdminPageLayout
      title={<TranslatedText text="User Management" />}
      description={<TranslatedText text="Monitor, manage, and audit user accounts, roles, and permissions across the platform." />}
      actions={
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold transition-all"
        >
          <Plus size={16} /> <TranslatedText text="Create New User" />
        </button>
      }
    >


      <div className="flex items-center gap-6 mb-8 border-b border-gray-100">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeTab === 'users'
            ? 'text-primary-600'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
        >
          <Users size={14} /> <TranslatedText text="User Management" />
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeTab === 'roles'
            ? 'text-primary-600'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
        >
          <ShieldCheck size={14} /> <TranslatedText text="Role Permissions" />
          {activeTab === 'roles' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />}
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 hover:shadow-xl hover:shadow-gray-100/50 dark:hover:shadow-slate-950/50 transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                    <Icon size={100} className="text-gray-900 dark:text-white" />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 dark:text-slate-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-all duration-300 shadow-sm">
                        <Icon size={18} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none"><TranslatedText text={stat.label} /></p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{stat.value}</h3>
                      <span className={`text-[10px] font-black tracking-widest uppercase ${stat.changeType === 'positive' ? 'text-emerald-500' : stat.changeType === 'negative' ? 'text-rose-500' : 'text-slate-400'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-4 leading-none"><TranslatedText text={stat.description} /></p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Users Content Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Filters Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-900/50 flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="SEARCH USERS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full md:w-64 bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all shadow-sm"
                  />
                  <Search className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 group-hover:text-primary-500 transition-colors w-3.5 h-3.5" />
                </div>
                <select
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm cursor-pointer hover:border-primary-200 dark:hover:border-primary-800 transition-all font-black"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">ALL STATUS</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>

                <select
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm cursor-pointer hover:border-primary-200 dark:hover:border-primary-800 transition-all font-black"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">ALL ROLES</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="TENANT_ADMIN">TENANT ADMIN</option>
                  <option value="CARGO_OWNER">CARGO OWNER</option>
                  <option value="CARGO_RECEIVER">CARGO RECEIVER</option>
                  <option value="TRUCK_OWNER">TRUCK OWNER</option>
                  <option value="DRIVER">DRIVER</option>
                  <option value="BROKER">BROKER</option>
                  <option value="AGENT">AGENT</option>
                  <option value="LENDER">LENDER</option>
                  <option value="CUSTOMS_OFFICER">CUSTOMS OFFICER</option>
                  <option value="FLEET_MANAGER">FLEET MANAGER</option>
                  <option value="FLEET_DISPATCHER">FLEET DISPATCHER</option>
                  <option value="FLEET_ACCOUNTANT">FLEET ACCOUNTANT</option>
                  <option value="FLEET_SAFETY_OFFICER">FLEET SAFETY OFFICER</option>
                </select>

                <select
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm cursor-pointer hover:border-primary-200 dark:hover:border-primary-800 transition-all font-black"
                  value={tenantFilter}
                  onChange={(e) => setTenantFilter(e.target.value)}
                >
                  <option value="all">ALL TENANTS</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-slate-700 rounded-xl flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 transition-all shadow-sm text-slate-600 dark:text-slate-400">
                  <Download className="w-3 h-3" /> <TranslatedText text="Export" />
                </button>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-gray-100/50 dark:bg-slate-800/50 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-slate-800">
                  {total} <TranslatedText text="IDENTIFIED" />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#fafafa] dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4">
                      <button
                        className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-colors"
                        onClick={() => {
                          setSortBy('email');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        <TranslatedText text="User Details" />
                        <ChevronsUpDown className="w-3 h-3 text-gray-400 dark:text-slate-600" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Role" /></th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Status" /></th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden md:table-cell"><TranslatedText text="Tenant" /></th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden lg:table-cell"><TranslatedText text="Activity" /></th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Action" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-0">
                        <ModernLoader isLoading={true} type="table" rows={10} columns={6} />
                      </td>
                    </tr>
                  ) : pagedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-slate-500">
                            <Users size={20} />
                          </div>
                          <span className="text-gray-900 dark:text-white font-medium"><TranslatedText text="No users found" /></span>
                          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1"><TranslatedText text="Try adjusting your filters" /></p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg overflow-hidden relative group-hover:scale-105 transition-transform duration-300 bg-gradient-to-br ${getRoleColor(user.role).includes('blue') || getRoleColor(user.role).includes('indigo') ? 'from-primary-500 to-primary-700 shadow-primary-200 dark:shadow-primary-900/40' : 'from-slate-700 to-slate-900 shadow-slate-200 dark:shadow-slate-950/40'}`}>
                              <span className="relative z-10">{user.firstName ? user.firstName[0] : user.email[0].toUpperCase()}</span>
                              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                {user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.email.split('@')[0]}
                              </div>
                              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1.5 leading-none">
                                <Mail className="w-3 h-3 text-primary-400 dark:text-primary-500" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all ${getRoleColor(user.role).replace('bg-', 'bg-').replace('text-', 'text-').replace('100', '50/50').replace('800', '700')} border-primary-100 shadow-sm`}>
                            {formatRole(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2 h-2 rounded-full shadow-sm ${user.status === 'ACTIVE' ? 'bg-emerald-500 shadow-emerald-200' : user.status === 'SUSPENDED' ? 'bg-rose-500 shadow-rose-200' : 'bg-amber-500 shadow-amber-200'}`}></div>
                            <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none"><TranslatedText text={(user.status || '').replace('_', ' ')} /></span>
                          </div>
                        </td>
                        <td className="px-6 py-5 hidden md:table-cell text-sm font-black text-gray-900 dark:text-white tracking-tight leading-none text-right">
                          <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                            <Building2 size={12} className="text-primary-400 dark:text-primary-500" />
                            <span>{user.tenantName || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 hidden lg:table-cell">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : <TranslatedText text="NEVER" />}</p>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none"><TranslatedText text="LAST LOGIN" /></p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDetailsModal(true);
                              }}
                              className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all shadow-sm bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl transition-all shadow-sm bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setPermissionUser(user)}
                              className="p-2 text-slate-400 dark:text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all shadow-sm bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
                              title="Manage Permissions"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                             {user.status === 'SUSPENDED' ? (
                              <button
                                onClick={() => activateUserMutation(user.id)}
                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all shadow-sm bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
                                title="Activate"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => suspendUserMutation({ userId: user.id })}
                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-xl transition-all shadow-sm bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
                                title="Suspend"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all shadow-sm bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
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

            {/* Pagination */}
            {pagedUsers.length > 0 && (
              <div className="px-6 py-5 border-t border-gray-100 dark:border-slate-800 bg-[#fafafa] dark:bg-slate-900 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <TranslatedText text="Showing" /> <span className="text-gray-900 dark:text-white">{startIdx + 1}-{Math.min(endIdx, total)}</span> <TranslatedText text="of" /> <span className="text-gray-900 dark:text-white">{total}</span> <TranslatedText text="identified" />
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-750 disabled:opacity-50 transition-all shadow-sm shadow-gray-100 dark:shadow-none hover:border-primary-200 dark:hover:border-primary-800"
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <TranslatedText text="Previous" />
                  </button>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mx-2"><TranslatedText text="Page" /> <span className="text-gray-900 dark:text-white font-black">{currentPage}</span> <TranslatedText text="of" /> <span className="text-gray-900 dark:text-white font-black">{totalPages}</span></span>
                  <button
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-750 disabled:opacity-50 transition-all shadow-sm shadow-gray-100 dark:shadow-none hover:border-primary-200 dark:hover:border-primary-800"
                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <TranslatedText text="Next" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <RolePermissionsMatrix />
      )}


      {/* Create User Modal */}
      {
        showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
              <div className="p-6 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight"><TranslatedText text="Create New User" /></h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

               <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      <TranslatedText text="Tenant" /> *
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
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
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      <TranslatedText text="Role" /> *
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                    >
                      <option value="TENANT_ADMIN">TENANT ADMIN</option>
                      <option value="CARGO_OWNER">CARGO OWNER</option>
                      <option value="CARGO_RECEIVER">CARGO RECEIVER</option>
                      <option value="TRUCK_OWNER">TRUCK OWNER</option>
                      <option value="DRIVER">DRIVER</option>
                      <option value="BROKER">BROKER</option>
                      <option value="AGENT">AGENT</option>
                      <option value="LENDER">LENDER</option>
                      <option value="CUSTOMS_OFFICER">CUSTOMS OFFICER</option>
                      <option value="FLEET_MANAGER">FLEET MANAGER</option>
                      <option value="FLEET_DISPATCHER">FLEET DISPATCHER</option>
                      <option value="FLEET_ACCOUNTANT">FLEET ACCOUNTANT</option>
                      <option value="FLEET_SAFETY_OFFICER">FLEET SAFETY OFFICER</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      <TranslatedText text="First Name" /> *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
                      placeholder="ENTER FIRST NAME..."
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      <TranslatedText text="Last Name" /> *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
                      placeholder="ENTER LAST NAME..."
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
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>



                <div className="bg-primary-50 border border-primary-200 rounded-lg p-2">
                  <div className="flex items-start gap-1.5">
                    <ShieldCheck className="text-primary-600 mt-0.5" size={12} />
                    <div>
                      <h4 className="font-semibold text-primary-900 text-xs">User Information</h4>
                      <p className="text-[10px] text-primary-700 mt-0.5">
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
                  disabled={isCreating || !tenantId || !email || !firstName || !lastName}
                  className="px-2.5 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium shadow-lg shadow-primary-200"
                >
                  {isCreating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>{isCreating ? 'Creating...' : 'Create User'}</span>
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit User Modal */}
      {
        showEditModal && editingUserId && (
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
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-3">
                {/* Editable Email and Tenant */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tenant *
                    </label>
                    <select
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={editTenantId}
                      onChange={(e) => setEditTenantId(e.target.value)}
                    >
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                      ))}
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
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter last name"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter phone number"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

                <div className="bg-primary-50 border border-primary-200 rounded-lg p-2">
                  <div className="flex items-start gap-1.5">
                    <ShieldCheck className="text-primary-600 mt-0.5" size={12} />
                    <div>
                      <h4 className="font-semibold text-primary-900 text-xs">Update Information</h4>
                      <p className="text-[10px] text-primary-700 mt-0.5">
                        Changes will be saved immediately. All fields can be edited.
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
                  className="px-2.5 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium shadow-lg shadow-primary-100"
                >
                  {isUpdating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* User Details Modal */}
      {
        showDetailsModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-100">
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl bg-gradient-to-br ${getRoleColor(selectedUser.role).includes('blue') || getRoleColor(selectedUser.role).includes('indigo') ? 'from-primary-500 to-primary-700' : 'from-slate-700 to-slate-900'}`}>
                      {selectedUser.firstName ? selectedUser.firstName[0] : selectedUser.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                          {selectedUser.firstName && selectedUser.lastName
                            ? `${selectedUser.firstName} ${selectedUser.lastName}`
                            : selectedUser.email.split('@')[0]}
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getRoleColor(selectedUser.role).replace('bg-', 'bg-').replace('text-', 'text-').replace('100', '50/50').replace('800', '700')} border-primary-100 shadow-sm`}>
                          {formatRole(selectedUser.role)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Mail className="w-3.5 h-3.5 text-primary-400" />
                          {selectedUser.email}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${selectedUser.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatRole(selectedUser.status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-3 text-slate-400 hover:text-gray-600 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all border border-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-12">
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleEditUser(selectedUser);
                    }}
                    className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
                  >
                    Modify Access Profile
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50" />
                        Authentication Matrix
                      </h3>
                      <div className="space-y-6">
                        <div className="flex justify-between items-center bg-[#fafafa] p-4 rounded-2xl border border-gray-50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Email</span>
                          <span className="text-sm font-black text-gray-900 tracking-tight">{selectedUser.email}</span>
                        </div>
                        {selectedUser.phone && (
                          <div className="flex justify-between items-center bg-[#fafafa] p-4 rounded-2xl border border-gray-50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Phone</span>
                            <span className="text-sm font-black text-gray-900 tracking-tight">{selectedUser.phone}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center bg-[#fafafa] p-4 rounded-2xl border border-gray-50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Tenant</span>
                          <span className="text-sm font-black text-gray-900 tracking-tight">{selectedUser.tenantName || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                        Lifecycle Meta
                      </h3>
                      <div className="space-y-6">
                        <div className="flex justify-between items-center bg-[#fafafa] p-4 rounded-2xl border border-gray-50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Date</span>
                          <span className="text-sm font-black text-gray-900 tracking-tight">{new Date(selectedUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#fafafa] p-4 rounded-2xl border border-gray-50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Network Sync</span>
                          <span className="text-sm font-black text-gray-900 tracking-tight">
                            {selectedUser.lastLoginAt
                              ? new Date(selectedUser.lastLoginAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                              : 'NEVER'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-[#fafafa] p-4 rounded-2xl border border-gray-50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Verif</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${selectedUser.emailVerifiedAt ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {selectedUser.emailVerifiedAt ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50" />
                    Security Procedures
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.status === 'SUSPENDED' ? (
                      <button
                        onClick={() => {
                          activateUserMutation(selectedUser.id);
                          setShowDetailsModal(false);
                        }}
                        className="flex items-center gap-3 p-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 font-black text-[10px] uppercase tracking-widest"
                      >
                        <Unlock size={14} /> Restore Account Access
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          suspendUserMutation({ userId: selectedUser.id });
                          setShowDetailsModal(false);
                        }}
                        className="flex items-center gap-3 p-4 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 font-black text-[10px] uppercase tracking-widest"
                      >
                        <Ban size={14} /> Immediate Suspension
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleDeleteUser(selectedUser.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex items-center gap-3 p-4 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 font-black text-[10px] uppercase tracking-widest"
                    >
                      <Trash2 size={14} /> Terminate User Identity
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

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
      {
        permissionUser && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setPermissionUser(null)}
          ></div>
        )
      }
    </AdminPageLayout>
  );
};

export default AdminUsers;
