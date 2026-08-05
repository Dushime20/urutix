import React, { useState, useEffect, useMemo } from 'react';
import {
  FaUsers, FaEdit, FaTrash, FaPlus, FaSearch, FaDownload,
  FaEye, FaShieldAlt, FaCheck, FaTimes, FaBan,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaKey,
} from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { usePermission } from '../../contexts/PermissionContext';
import { useAuth } from '../../contexts/AuthContext';
import { TranslatedText } from '../../components/translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import ModernLoader from '../../components/common/ModernLoader';
import { RolePermissionsMatrix } from '../../components/Admin/Permissions/RolePermissionsMatrix';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';
import { permissionApi } from '../../services/permissionApi';
import api from '../../services/api';
import toast from 'react-hot-toast';

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

// ── Per-User Permissions Modal ─────────────────────────────────────────────
const UserPermissionsModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const { data: detail, isLoading } = useQuery({
    queryKey: ['user-perm-detail', user.id],
    queryFn: () => permissionApi.getUserPermissionDetail(user.id),
  });

  const { mutate: grantPerm, isPending: granting } = useMutation({
    mutationFn: ({ permission }: { permission: string }) =>
      permissionApi.grantPermission(user.id, permission, reason || undefined, expiresAt ? new Date(expiresAt) : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-perm-detail', user.id] });
      toast.success('Permission granted');
    },
    onError: () => toast.error('Failed to grant permission'),
  });

  const { mutate: revokePerm, isPending: revoking } = useMutation({
    mutationFn: ({ permission }: { permission: string }) =>
      permissionApi.revokePermission(user.id, permission),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-perm-detail', user.id] });
      toast.success('Permission revoked');
    },
    onError: () => toast.error('Failed to revoke permission'),
  });

  const { mutate: denyPerm, isPending: denying } = useMutation({
    mutationFn: ({ permission }: { permission: string }) =>
      permissionApi.denyPermission(user.id, permission, reason || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-perm-detail', user.id] });
      toast.success('Permission denied');
    },
    onError: () => toast.error('Failed to deny permission'),
  });

  // Group permissions by resource
  const grouped: Record<string, typeof detail.permissions> = {};
  (detail?.permissions || []).forEach((p: any) => {
    const resource = p.resource || p.code?.split('.')[0] || 'other';
    if (!grouped[resource]) grouped[resource] = [];
    grouped[resource].push(p);
  });

  const sourceLabel = (source: string) => {
    const map: Record<string, string> = {
      role: 'Role default',
      user_granted: 'Manually granted',
      user_denied: 'Manually denied',
      none: 'Not assigned',
    };
    return map[source] || source;
  };

  const sourceColor = (source: string) => {
    const map: Record<string, string> = {
      role: 'text-blue-600 bg-blue-50',
      user_granted: 'text-emerald-700 bg-emerald-50',
      user_denied: 'text-red-700 bg-red-50',
      none: 'text-slate-500 bg-slate-50',
    };
    return map[source] || 'text-slate-500 bg-slate-50';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2c5173] flex items-center justify-center text-white font-black text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-slate-100">{user.name}</h2>
              <p className="text-xs text-slate-400 font-semibold">{user.email} · <span className="text-[#2c5173]">{user.role}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition-all">
            <FaTimes />
          </button>
        </div>

        {/* Optional reason + expiry fields */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Reason (optional)</label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Temporary access for audit"
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#2c5173] outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Expires (optional)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#2c5173] outline-none"
            />
          </div>
          <p className="text-[10px] text-slate-400 self-center">
            <FaKey className="inline mr-1" />
            Click <span className="font-black text-emerald-600">Grant</span>, <span className="font-black text-red-600">Deny</span>, or <span className="font-black text-slate-600 dark:text-slate-300">Reset</span> to manage overrides.
          </p>
        </div>

        {/* Permissions list */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5173]" />
            </div>
          ) : !detail?.permissions?.length ? (
            <div className="text-center py-12 text-slate-400 text-sm">No permissions defined for this role yet.</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([resource, perms]) => (
                <div key={resource}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="w-1 h-3 bg-[#2c5173] rounded-full inline-block" />
                    {resource}
                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px]">{(perms as any[]).length}</span>
                  </p>
                  <div className="space-y-1.5">
                    {(perms as any[]).map((p: any) => (
                      <div key={p.id || p.code} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 rounded-xl transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.effective ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{p.action || p.code}</p>
                            {p.description && <p className="text-[10px] text-slate-400">{p.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${sourceColor(p.source)}`}>
                            {sourceLabel(p.source)}
                          </span>
                          {/* Grant */}
                          <button
                            onClick={() => grantPerm({ permission: p.name || p.code })}
                            disabled={granting}
                            title="Grant override"
                            className="px-2.5 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50"
                          >
                            Grant
                          </button>
                          {/* Deny */}
                          <button
                            onClick={() => denyPerm({ permission: p.name || p.code })}
                            disabled={denying}
                            title="Deny override"
                            className="px-2.5 py-1.5 bg-red-100 text-red-700 text-[10px] font-black rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                          >
                            Deny
                          </button>
                          {/* Reset — only shown when there's a manual override */}
                          {(p.source === 'user_granted' || p.source === 'user_denied') && (
                            <button
                              onClick={() => revokePerm({ permission: p.name || p.code })}
                              disabled={revoking}
                              title="Reset to role default"
                              className="px-2.5 py-1.5 bg-slate-200 text-slate-600 dark:text-slate-300 text-[10px] font-black rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-100 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Add New Permission Panel (superadmin only) ─────────────────────────────
const CATEGORIES = [
  'user_management', 'cargo_management', 'fleet_management', 'driver_management',
  'trip_management', 'bidding', 'matching', 'broker_management', 'receiver_management',
  'financial', 'credits', 'lending', 'analytics', 'tracking', 'documents', 'customs',
  'safety', 'maintenance', 'insurance', 'fuel', 'notifications', 'ratings', 'rewards',
  'marketplace', 'communication', 'system_admin', 'admin', 'tenant', 'security',
];

const AddPermissionPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const { mutate: createPerm, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/permissions/create', {
        resource: resource.trim().toLowerCase().replace(/\s+/g, '_'),
        action: action.trim().toLowerCase().replace(/\s+/g, '_'),
        description: description.trim() || undefined,
        category: (customCategory.trim() || category || 'other').toLowerCase().replace(/\s+/g, '_'),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-role-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['modal-all-permissions'] });
      toast.success(`Permission "${resource}.${action}" created`);
      setResource(''); setAction(''); setDescription(''); setCategory(''); setCustomCategory('');
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create permission'),
  });

  return (
    <div className="mb-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2c5173] hover:bg-[#1e3850] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
        >
          <FaPlus size={11} /> Add New Permission
        </button>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-[#2c5173]/20 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FaShieldAlt className="text-[#2c5173]" size={14} />
              Add New Permission
            </h3>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 dark:text-slate-300">
              <FaTimes size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resource *</label>
              <input
                value={resource}
                onChange={e => setResource(e.target.value)}
                placeholder="e.g. cargo, fleet, users"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Action *</label>
              <input
                value={action}
                onChange={e => setAction(e.target.value)}
                placeholder="e.g. view, create, edit"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</label>
              <select
                value={category}
                onChange={e => { setCategory(e.target.value); setCustomCategory(''); }}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#2c5173] outline-none"
              >
                <option value="">Select category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__custom__">Custom…</option>
              </select>
              {category === '__custom__' && (
                <input
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="custom_category"
                  className="mt-1 w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#2c5173] outline-none"
                />
              )}
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What this permission allows"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#2c5173] focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-[10px] text-slate-400">
              Permission will be created as <code className="font-mono text-[#2c5173]">{resource || 'resource'}.{action || 'action'}</code>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-black hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => createPerm()}
                disabled={isPending || !resource.trim() || !action.trim()}
                className="px-4 py-2 bg-[#2c5173] text-white rounded-lg text-xs font-black hover:bg-[#1e3850] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isPending ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</> : <><FaCheck size={10} /> Create Permission</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

type ActiveTab = 'users' | 'role-permissions';

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');

  const { user: authUser } = useAuth();
  const { hasPermission } = usePermission();
  const { tSync } = useTranslation();
  const queryClient = useQueryClient();

  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';

  // Permission-based access control with role fallback
  const canManageUsers = hasPermission('user:manage') ||
    hasPermission('user:update') ||
    authUser?.role === 'ADMIN' ||
    authUser?.role === 'SUPER_ADMIN' ||
    authUser?.role === 'TENANT_ADMIN';

  const canCreateUsers = hasPermission('user:create') ||
    authUser?.role === 'ADMIN' ||
    authUser?.role === 'SUPER_ADMIN' ||
    authUser?.role === 'TENANT_ADMIN';

  const canDeleteUsers = hasPermission('user:delete') ||
    authUser?.role === 'ADMIN' ||
    authUser?.role === 'SUPER_ADMIN';

  const canViewUsers = hasPermission('user:view') ||
    hasPermission('user:manage') ||
    authUser?.role === 'ADMIN' ||
    authUser?.role === 'SUPER_ADMIN' ||
    authUser?.role === 'TENANT_ADMIN';

  // ── Real user data from backend ────────────────────────────────────────────
  const { data: usersData, isLoading: usersLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data as any[];
    },
    retry: 1,
  });

  // Normalize backend data to local User shape
  const users: User[] = (usersData || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.profile
      ? `${u.profile.firstName || ''} ${u.profile.lastName || ''}`.trim() || u.email
      : u.email,
    role: u.role || 'UNKNOWN',
    status: (u.status || 'active').toLowerCase() as User['status'],
    joinDate: u.createdAt || new Date().toISOString(),
    lastLogin: u.lastLoginAt || 'Never',
    phone: u.phone || u.profile?.phone,
    company: u.profile?.companyName,
    location: u.profile?.location,
    verificationStatus: u.emailVerifiedAt ? 'verified' : 'pending',
    totalShipments: u.totalShipments,
    totalRevenue: u.totalRevenue,
  }));

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVerification, setFilterVerification] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Per-user permissions modal
  const [showPermModal, setShowPermModal] = useState(false);
  const [permUser, setPermUser] = useState<User | null>(null);

  useEffect(() => {
    setShowBulkActions(selectedUsers.length > 0);
  }, [selectedUsers]);

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

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesStatus = !filterStatus || user.status === filterStatus;
    const matchesVerification = !filterVerification || user.verificationStatus === filterVerification;
    return matchesSearch && matchesRole && matchesStatus && matchesVerification;
  }), [users, searchTerm, filterRole, filterStatus, filterVerification]);

  const openUserModal = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const openPermModal = (user: User) => {
    setPermUser(user);
    setShowPermModal(true);
  };

  const userColumns: Column<User>[] = useMemo(() => [
    {
      key: 'name',
      label: tSync('User'),
      alwaysVisible: true,
      render: (_v, user) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
            {user.name.charAt(0)}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            {user.company && (
              <div className="text-xs text-gray-400">{user.company}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: tSync('Role'),
      render: (_v, user) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
          {user.role.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      label: tSync('Status'),
      render: (_v, user) => (
        <StatusBadge status={user.status} label={user.status} />
      ),
    },
    {
      key: 'verificationStatus',
      label: tSync('Verification'),
      render: (_v, user) => (
        <StatusBadge status={user.verificationStatus} label={user.verificationStatus} />
      ),
    },
    {
      key: 'joinDate',
      label: tSync('Join Date'),
      render: (_v, user) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {new Date(user.joinDate).toLocaleDateString()}
        </span>
      ),
    },
  ], [tSync]);

  const userRowActions: TableAction<User>[] = useMemo(() => [
    {
      key: 'view',
      label: tSync('View Details'),
      icon: <FaEye className="w-3.5 h-3.5" />,
      hidden: () => !canViewUsers,
      onClick: (user) => openUserModal(user),
    },
    {
      key: 'edit',
      label: tSync('Edit'),
      icon: <FaEdit className="w-3.5 h-3.5" />,
      hidden: () => !canManageUsers,
      onClick: () => {},
    },
    {
      key: 'permissions',
      label: tSync('Manage Permissions'),
      icon: <FaShieldAlt className="w-3.5 h-3.5" />,
      hidden: () => !isSuperAdmin,
      onClick: (user) => openPermModal(user),
    },
  ], [tSync, canViewUsers, canManageUsers, isSuperAdmin]);

  const handleBulkAction = async (action: string) => {
    if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;
    }
    // Optimistic local update — refresh after
    try {
      await Promise.all(selectedUsers.map(id => {
        if (action === 'activate') return api.put(`/users/${id}`, { status: 'ACTIVE' });
        if (action === 'suspend')  return api.put(`/users/${id}`, { status: 'SUSPENDED' });
        if (action === 'delete')   return api.delete(`/users/${id}`);
        return Promise.resolve();
      }));
      toast.success(`Bulk ${action} applied to ${selectedUsers.length} user(s)`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch {
      toast.error(`Bulk ${action} partially failed — please refresh`);
    }
    setSelectedUsers([]);
  };

  const handleStatusChange = async (userId: string, newStatus: User['status']) => {
    try {
      await api.put(`/users/${userId}`, { status: newStatus.toUpperCase() });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  if (usersLoading && !usersData) {
    return (
      <AdminPageLayout
        title={<TranslatedText text="User Management" />}
        description={<TranslatedText text="Manage all platform users and their permissions" />}
      >
        <ModernLoader isLoading={true} type="page" showStats={true} />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={<TranslatedText text="User Management" />}
      description={<TranslatedText text="Manage all platform users and their permissions" />}
      actions={
        <>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-all">
            <FaDownload size={14} />
            <span className="hidden sm:inline"><TranslatedText text="Export" /></span>
          </button>
          {canCreateUsers && (
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-bold transition-all">
              <FaPlus size={14} />
              <span className="hidden sm:inline"><TranslatedText text="Add User" /></span>
            </button>
          )}
        </>
      }
    >
      <div className="safe-bottom">
      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6 overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
          <nav className="flex gap-1 px-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-4 border-b-2 font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'users' ? 'border-[#2c5173] text-[#2c5173]' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <FaUsers size={12} />
              <TranslatedText text="Users" />
              <span className="ml-1 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-black">{users.length}</span>
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('role-permissions')}
                className={`py-4 px-4 border-b-2 font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'role-permissions' ? 'border-[#2c5173] text-[#2c5173]' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
              >
                <FaShieldAlt size={12} />
                <TranslatedText text="Role Permissions" />
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* ── Role Permissions Tab ─────────────────────────────────────────── */}
      {activeTab === 'role-permissions' && (
        <>
          {/* Add New Permission Panel */}
          <AddPermissionPanel />
          <RolePermissionsMatrix />
        </>
      )}

      {/* ── Users Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'users' && (<>
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 lg:p-6 border border-transparent">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative lg:col-span-2">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={tSync("Search users, companies...")}
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
            <option value=""><TranslatedText text="All Roles" /></option>
            <option value="ADMIN"><TranslatedText text="Admin" /></option>
            <option value="CARGO_OWNER"><TranslatedText text="Cargo Owner" /></option>
            <option value="TRUCK_OWNER"><TranslatedText text="Truck Owner" /></option>
            <option value="DRIVER"><TranslatedText text="Driver" /></option>
            <option value="BROKER"><TranslatedText text="Broker" /></option>
            <option value="AGENT"><TranslatedText text="Agent" /></option>
            <option value="LENDER"><TranslatedText text="Lender" /></option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value=""><TranslatedText text="All Status" /></option>
            <option value="active"><TranslatedText text="Active" /></option>
            <option value="inactive"><TranslatedText text="Inactive" /></option>
            <option value="pending"><TranslatedText text="Pending" /></option>
            <option value="suspended"><TranslatedText text="Suspended" /></option>
          </select>
          <select
            value={filterVerification}
            onChange={(e) => setFilterVerification(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value=""><TranslatedText text="All Verification" /></option>
            <option value="verified"><TranslatedText text="Verified" /></option>
            <option value="unverified"><TranslatedText text="Unverified" /></option>
            <option value="pending"><TranslatedText text="Pending" /></option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && canManageUsers && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-800">
                {selectedUsers.length} <TranslatedText text="user(s) selected" />
              </span>
              <button
                onClick={() => setSelectedUsers([])}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                <TranslatedText text="Clear selection" />
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
              >
                <FaCheck />
                <span><TranslatedText text="Activate" /></span>
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
              >
                <FaBan />
                <span><TranslatedText text="Suspend" /></span>
              </button>
              {canDeleteUsers && (
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                >
                  <FaTrash />
                  <span><TranslatedText text="Delete" /></span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced User Table */}
      <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-transparent p-4 lg:p-6">
        <StandardDataTable
          embedded
          columns={userColumns}
          data={filteredUsers}
          getRowId={(row) => row.id}
          searchable={false}
          selectable
          selectedIds={selectedUsers}
          onSelectionChange={setSelectedUsers}
          rowActions={userRowActions}
          defaultSortKey="name"
          defaultSortDirection="asc"
          emptyMessage={tSync('No users match your current filters')}
          onRefresh={() => refetch()}
          ariaLabel={tSync('User list')}
        />
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800"><TranslatedText text="User Details" /></h3>
              <button
                onClick={closeUserModal}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-300"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-800">{selectedUser.name}</h4>
                  <p className="text-gray-600 dark:text-slate-300">{selectedUser.email}</p>
                  <p className="text-sm text-gray-500">{selectedUser.company}</p>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <FaPhone className="text-gray-400" />
                  <span className="text-gray-700 dark:text-slate-300">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <span className="text-gray-700 dark:text-slate-300">{selectedUser.location || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaCalendarAlt className="text-gray-400" />
                  <span className="text-gray-700 dark:text-slate-300"><TranslatedText text="Joined" /> {new Date(selectedUser.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <FaEnvelope className="text-gray-400" />
                  <span className="text-gray-700 dark:text-slate-300"><TranslatedText text="Last login" />: {selectedUser.lastLogin}</span>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"><TranslatedText text="Status" /></label>
                  <select
                    value={selectedUser.status}
                    onChange={(e) => handleStatusChange(selectedUser.id, e.target.value as User['status'])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active"><TranslatedText text="Active" /></option>
                    <option value="inactive"><TranslatedText text="Inactive" /></option>
                    <option value="pending"><TranslatedText text="Pending" /></option>
                    <option value="suspended"><TranslatedText text="Suspended" /></option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"><TranslatedText text="Role" /></label>
                  <span className={`inline-flex px-3 py-2 text-sm font-semibold rounded-lg ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"><TranslatedText text="Verification" /></label>
                  <StatusBadge status={selectedUser.verificationStatus} label={selectedUser.verificationStatus} />
                </div>
              </div>

              {/* Stats */}
              {(selectedUser.totalShipments !== undefined || selectedUser.totalRevenue !== undefined) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedUser.totalShipments !== undefined && (
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-slate-300"><TranslatedText text="Total Shipments" /></p>
                      <p className="text-2xl font-bold text-gray-800">{selectedUser.totalShipments}</p>
                    </div>
                  )}
                  {selectedUser.totalRevenue !== undefined && (
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-slate-300"><TranslatedText text="Total Revenue" /></p>
                      <p className="text-2xl font-bold text-gray-800">RWF {selectedUser.totalRevenue?.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                {canManageUsers && (
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                    <TranslatedText text="Edit User" />
                  </button>
                )}
                <button
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-slate-300 px-4 py-2 rounded-lg transition-colors"
                  onClick={() => {
                    closeUserModal();
                    if (isSuperAdmin && selectedUser) openPermModal(selectedUser);
                  }}
                >
                  {isSuperAdmin ? <TranslatedText text="Manage Permissions" /> : <TranslatedText text="Send Message" />}
                </button>
                {canDeleteUsers && (
                  <button className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg transition-colors">
                    <TranslatedText text="Delete User" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Per-User Permissions Modal ───────────────────────────────────── */}
      {showPermModal && permUser && (
        <UserPermissionsModal user={permUser} onClose={() => { setShowPermModal(false); setPermUser(null); }} />
      )}
      </>)}
      </div>
    </AdminPageLayout>
  );
};

export default UserManagement;
