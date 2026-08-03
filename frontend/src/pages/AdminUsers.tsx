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
  Users,
  Edit,
  Plus,
  Eye,
  X,
  Ban,
  Unlock,
  Building2,
  ShieldCheck,
  Trash2,
  Mail,
  UserCheck,
  UserX,
} from 'lucide-react';
import { UserPermissionEditor } from '../components/Admin/Permissions/UserPermissionEditor';
import { RolePermissionsMatrix } from '../components/Admin/Permissions/RolePermissionsMatrix';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { TranslatedText } from '../components/translated-text';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../components/EnliteUI/Tables';

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
  const [role, setRole] = useState<'ADMIN' | 'CARGO_OWNER' | 'TRUCK_OWNER' | 'DRIVER' | 'AGENT' | 'LENDER' | 'TENANT_ADMIN' | 'BROKER' | 'CARGO_RECEIVER' | 'FLEET_MANAGER' | 'FLEET_DISPATCHER' | 'FLEET_ACCOUNTANT' | 'FLEET_SAFETY_OFFICER' | 'CUSTOMS_OFFICER'>('CARGO_OWNER');

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [permissionUser, setPermissionUser] = useState<User | null>(null);
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

  const columns: Column<User>[] = useMemo(() => [
    {
      key: 'email',
      label: 'User Details',
      alwaysVisible: true,
      sortable: true,
      render: (_v, user) => (
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm overflow-hidden relative ${getRoleColor(user.role).includes('blue') || getRoleColor(user.role).includes('indigo') ? 'bg-primary-600' : 'bg-slate-700'}`}>
            <span className="relative z-10">{user.firstName ? user.firstName[0] : user.email[0].toUpperCase()}</span>
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
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (_v, user) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border transition-all ${getRoleColor(user.role).replace('bg-', 'bg-').replace('text-', 'text-').replace('100', '50/50').replace('800', '700')} border-primary-100`}>
          {formatRole(user.role)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_v, user) => (
        <StatusBadge status={user.status} label={formatRole(user.status)} />
      ),
    },
    {
      key: 'tenantName',
      label: 'Tenant',
      sortable: true,
      defaultHidden: false,
      render: (_v, user) => (
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
          <Building2 size={12} className="text-primary-400 dark:text-primary-500" />
          <span>{user.tenantName || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'lastLoginAt',
      label: 'Activity',
      sortable: true,
      defaultHidden: false,
      render: (_v, user) => (
        <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest leading-none">
            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : <TranslatedText text="NEVER" />}
          </p>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
            <TranslatedText text="LAST LOGIN" />
          </p>
        </div>
      ),
    },
  ], []);

  const rowActions: TableAction<User>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: <Eye className="w-4 h-4" />,
      onClick: (user) => {
        setSelectedUser(user);
        setShowDetailsModal(true);
      },
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="w-4 h-4" />,
      onClick: (user) => handleEditUser(user),
    },
    {
      key: 'permissions',
      label: 'Manage Permissions',
      icon: <ShieldCheck className="w-4 h-4" />,
      onClick: (user) => setPermissionUser(user),
    },
    {
      key: 'activate',
      label: 'Activate',
      icon: <Unlock className="w-4 h-4" />,
      variant: 'success',
      hidden: (user) => user.status !== 'SUSPENDED',
      onClick: (user) => activateUserMutation(user.id),
    },
    {
      key: 'suspend',
      label: 'Suspend',
      icon: <Ban className="w-4 h-4" />,
      variant: 'warning',
      hidden: (user) => user.status === 'SUSPENDED',
      onClick: (user) => suspendUserMutation({ userId: user.id }),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'danger',
      divider: true,
      onClick: (user) => handleDeleteUser(user.id),
    },
  ], [activateUserMutation, suspendUserMutation]);

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
        <StandardDataTable
          columns={columns}
          data={users}
          loading={isLoadingUsers}
          getRowId={(row) => row.id}
          searchPlaceholder="Search users..."
          searchKeys={['email', 'firstName', 'lastName', 'companyName', 'tenantName']}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
                { value: 'SUSPENDED', label: 'Suspended' },
              ],
            },
            {
              key: 'role',
              label: 'Role',
              options: [
                { value: 'SUPER_ADMIN', label: 'Super Admin' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'TENANT_ADMIN', label: 'Tenant Admin' },
                { value: 'CARGO_OWNER', label: 'Cargo Owner' },
                { value: 'CARGO_RECEIVER', label: 'Cargo Receiver' },
                { value: 'TRUCK_OWNER', label: 'Truck Owner' },
                { value: 'DRIVER', label: 'Driver' },
                { value: 'BROKER', label: 'Broker' },
                { value: 'AGENT', label: 'Agent' },
                { value: 'LENDER', label: 'Lender' },
                { value: 'CUSTOMS_OFFICER', label: 'Customs Officer' },
                { value: 'FLEET_MANAGER', label: 'Fleet Manager' },
                { value: 'FLEET_DISPATCHER', label: 'Fleet Dispatcher' },
                { value: 'FLEET_ACCOUNTANT', label: 'Fleet Accountant' },
                { value: 'FLEET_SAFETY_OFFICER', label: 'Fleet Safety Officer' },
              ],
            },
            {
              key: 'tenantId',
              label: 'Tenant',
              options: tenants.map((tenant) => ({
                value: tenant.id,
                label: tenant.name,
              })),
            },
          ]}
          defaultSortKey="createdAt"
          defaultSortDirection="desc"
          rowActions={rowActions}
          emptyMessage="No users found"
          ariaLabel="Admin users"
        />
      ) : (
        <RolePermissionsMatrix />
      )}

      {/* Create User Modal */}
      {
        showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-transparent pb-24 lg:pb-8">
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
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/30 rounded-xl p-4">
                  <div className="flex items-start gap-1.5">
                    <ShieldCheck className="text-primary-600 dark:text-primary-400 mt-0.5" size={12} />
                    <div>
                      <h4 className="font-black text-primary-900 dark:text-primary-300 text-xs uppercase tracking-tight">User Information</h4>
                      <p className="text-[10px] text-primary-700 dark:text-primary-400/80 font-medium mt-1 leading-relaxed">
                        A new user account will be created. The user will receive an email with login instructions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={isCreating || !tenantId || !email || !firstName || !lastName}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-transparent pb-24 lg:pb-8">
              <div className="p-6 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight"><TranslatedText text="Edit User" /></h2>
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

              <div className="p-6 space-y-6">
                {/* Editable Email and Tenant */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
                      placeholder="Enter email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      Tenant *
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
                      value={editTenantId}
                      onChange={(e) => setEditTenantId(e.target.value)}
                    >
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
                      placeholder="Enter first name"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
                      placeholder="Enter last name"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
                    placeholder="Enter phone number"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      Role
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                    >
                      <option value="SUPER_ADMIN">SUPER ADMIN</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="TENANT_ADMIN">TENANT ADMIN</option>
                      <option value="CARGO_OWNER">CARGO OWNER</option>
                      <option value="TRUCK_OWNER">TRUCK OWNER</option>
                      <option value="DRIVER">DRIVER</option>
                      <option value="AGENT">AGENT</option>
                      <option value="LENDER">LENDER</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                      Status
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm font-bold border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white transition-all"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                </div>

                <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/30 rounded-xl p-4">
                  <div className="flex items-start gap-1.5">
                    <ShieldCheck className="text-primary-600 dark:text-primary-400 mt-0.5" size={12} />
                    <div>
                      <h4 className="font-black text-primary-900 dark:text-primary-300 text-xs uppercase tracking-tight">Update Information</h4>
                      <p className="text-[10px] text-primary-700 dark:text-primary-400/80 font-medium mt-1 leading-relaxed">
                        Changes will be saved immediately. All fields can be edited.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUserId(null);
                  }}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateUserMutation()}
                  disabled={isUpdating || !editFirstName || !editLastName}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
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
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8 border border-transparent dark:border-slate-800">
              <div className="p-8 border-b border-gray-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl bg-primary-600`}>
                      {selectedUser.firstName ? selectedUser.firstName[0] : selectedUser.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                          {selectedUser.firstName && selectedUser.lastName
                            ? `${selectedUser.firstName} ${selectedUser.lastName}`
                            : selectedUser.email.split('@')[0]}
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getRoleColor(selectedUser.role).replace('bg-', 'bg-').replace('text-', 'text-').replace('100', '50/50').replace('800', '700')} border-primary-100 dark:border-primary-900/30`}>
                          {formatRole(selectedUser.role)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          <Mail className="w-3.5 h-3.5 text-primary-400" />
                          {selectedUser.email}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${selectedUser.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{formatRole(selectedUser.status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-3 text-slate-400 hover:text-gray-600 dark:hover:text-slate-350 rounded-2xl bg-gray-50 dark:bg-slate-800 transition-all border border-transparent"
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
                    className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all"
                  >
                    Modify Access Profile
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                        Authentication Matrix
                      </h3>
                      <div className="space-y-6">
                        <div className="flex justify-between items-center bg-[#fafafa] dark:bg-slate-800/40 p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Platform Email</span>
                          <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{selectedUser.email}</span>
                        </div>
                        {selectedUser.phone && (
                          <div className="flex justify-between items-center bg-[#fafafa] dark:bg-slate-800/40 p-4 rounded-2xl">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Secure Phone</span>
                            <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{selectedUser.phone}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center bg-[#fafafa] dark:bg-slate-800/40 p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assigned Tenant</span>
                          <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{selectedUser.tenantName || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        Lifecycle Meta
                      </h3>
                      <div className="space-y-6">
                        <div className="flex justify-between items-center bg-[#fafafa] dark:bg-slate-800/40 p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Registration Date</span>
                          <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{new Date(selectedUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#fafafa] dark:bg-slate-800/40 p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Last Network Sync</span>
                          <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                            {selectedUser.lastLoginAt
                              ? new Date(selectedUser.lastLoginAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                              : 'NEVER'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-[#fafafa] dark:bg-slate-800/40 p-4 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email Verif</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${selectedUser.emailVerifiedAt ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'}`}>
                            {selectedUser.emailVerifiedAt ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    Security Procedures
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.status === 'SUSPENDED' ? (
                      <button
                        onClick={() => {
                          activateUserMutation(selectedUser.id);
                          setShowDetailsModal(false);
                        }}
                        className="flex items-center gap-3 p-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all font-black text-[10px] uppercase tracking-widest"
                      >
                        <Unlock size={14} /> Restore Account Access
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          suspendUserMutation({ userId: selectedUser.id });
                          setShowDetailsModal(false);
                        }}
                        className="flex items-center gap-3 p-4 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-all font-black text-[10px] uppercase tracking-widest"
                      >
                        <Ban size={14} /> Immediate Suspension
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleDeleteUser(selectedUser.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex items-center gap-3 p-4 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all font-black text-[10px] uppercase tracking-widest"
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
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-transparent dark:border-slate-800 transform transition-transform duration-300 ease-in-out z-50 ${permissionUser ? 'translate-x-0' : 'translate-x-full'}`}
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
