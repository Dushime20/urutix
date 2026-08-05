import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { permissionApi, type PermissionItem, type UserPermissionDetail } from '../../services/permissionApi';
import { TranslatedText } from '../../components/translated-text';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import ModernLoader from '../../components/common/ModernLoader';
import {
  Search, User, Mail, Shield, AlertCircle, CheckCircle,
  Lock, ChevronLeft, ChevronDown, ChevronRight,
  Check, X, RefreshCw, Save, History, Filter,
  ShieldCheck, ShieldAlert, Eye, EyeOff,   Clock,
} from 'lucide-react';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';

// ── Module display config ────────────────────────────────────────────────────
const MODULE_META: Record<string, { label: string; icon: string; color: string }> = {
  user_management:   { label: 'User Management',      icon: '👤', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  cargo_management:  { label: 'Cargo Management',     icon: '📦', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  fleet_management:  { label: 'Fleet Management',     icon: '🚛', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  driver_management: { label: 'Driver Management',    icon: '🧑‍✈️', color: 'bg-teal-50 border-teal-200 text-teal-700' },
  broker_management: { label: 'Broker Management',    icon: '🤝', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  bidding:           { label: 'Auctions & Bidding',   icon: '🔨', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  orders_deliveries: { label: 'Orders & Deliveries',  icon: '📋', color: 'bg-green-50 border-green-200 text-green-700' },
  financial:         { label: 'Financial Management', icon: '💰', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  analytics:         { label: 'Analytics & Reports',  icon: '📊', color: 'bg-sky-50 border-sky-200 text-sky-700' },
  system_admin:      { label: 'System Administration',icon: '⚙️', color: 'bg-slate-50 border-slate-200 text-slate-700' },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function roleBadgeColor(role: string) {
  const map: Record<string, string> = {
    SUPER_ADMIN:   'bg-red-50 text-red-700 border-red-200',
    ADMIN:         'bg-purple-50 text-purple-700 border-purple-200',
    TENANT_ADMIN:  'bg-violet-50 text-violet-700 border-violet-200',
    CARGO_OWNER:   'bg-blue-50 text-blue-700 border-blue-200',
    TRUCK_OWNER:   'bg-orange-50 text-orange-700 border-orange-200',
    DRIVER:        'bg-teal-50 text-teal-700 border-teal-200',
    BROKER:        'bg-indigo-50 text-indigo-700 border-indigo-200',
    LENDER:        'bg-emerald-50 text-emerald-700 border-emerald-200',
    CUSTOMS_OFFICER: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return map[role] || 'bg-gray-50 text-gray-700 border-gray-200';
}

function statusBadgeColor(status: string) {
  return status === 'ACTIVE'
    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
    : 'bg-gray-50 text-gray-600 border-gray-200';
}

// ── UserPermissionEditor ────────────────────────────────────────────────────
interface EditorProps {
  user: any;
  onClose: () => void;
  onSaved: () => void;
}

const UserPermissionEditor: React.FC<EditorProps> = ({ user, onClose, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<UserPermissionDetail | null>(null);
  const [pendingGrants, setPendingGrants] = useState<Set<string>>(new Set());
  const [pendingRevokes, setPendingRevokes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'permissions' | 'audit'>('permissions');
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(Object.keys(MODULE_META)));
  const [filterMode, setFilterMode] = useState<'all' | 'granted' | 'denied'>('all');
  const [reason, setReason] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [detailData, auditData] = await Promise.all([
        permissionApi.getUserPermissionDetail(user.id),
        permissionApi.getAuditLog(user.id, 30).catch(() => []),
      ]);
      setDetail(detailData);
      setAuditLog(Array.isArray(auditData) ? auditData : []);
      // Reset pending changes
      setPendingGrants(new Set());
      setPendingRevokes(new Set());
    } catch (err) {
      toast.error('Failed to load permission details');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const togglePermission = (perm: PermissionItem) => {
    const code = perm.code;
    const isCurrentlyEffective = isEffective(perm);

    if (isCurrentlyEffective) {
      // Will revoke: add to revokes, remove from grants
      setPendingRevokes(prev => { const n = new Set(prev); n.add(code); return n; });
      setPendingGrants(prev => { const n = new Set(prev); n.delete(code); return n; });
    } else {
      // Will grant: add to grants, remove from revokes
      setPendingGrants(prev => { const n = new Set(prev); n.add(code); return n; });
      setPendingRevokes(prev => { const n = new Set(prev); n.delete(code); return n; });
    }
  };

  const isEffective = (perm: PermissionItem): boolean => {
    const code = perm.code;
    if (pendingGrants.has(code)) return true;
    if (pendingRevokes.has(code)) return false;
    return perm.effective;
  };

  const isPending = (code: string) => pendingGrants.has(code) || pendingRevokes.has(code);

  const toggleModule = (cat: string) => {
    setExpandedModules(prev => {
      const n = new Set(prev);
      if (n.has(cat)) n.delete(cat); else n.add(cat);
      return n;
    });
  };

  const selectAllInModule = (perms: PermissionItem[], grant: boolean) => {
    if (grant) {
      setPendingGrants(prev => { const n = new Set(prev); perms.forEach(p => { n.add(p.code); }); return n; });
      setPendingRevokes(prev => { const n = new Set(prev); perms.forEach(p => { n.delete(p.code); }); return n; });
    } else {
      setPendingRevokes(prev => { const n = new Set(prev); perms.forEach(p => { n.add(p.code); }); return n; });
      setPendingGrants(prev => { const n = new Set(prev); perms.forEach(p => { n.delete(p.code); }); return n; });
    }
  };

  const handleSave = async () => {
    if (pendingGrants.size === 0 && pendingRevokes.size === 0) {
      toast('No changes to save');
      return;
    }
    setSaving(true);
    try {
      await permissionApi.updateUserPermissions(
        user.id,
        Array.from(pendingGrants),
        Array.from(pendingRevokes),
        reason || 'Updated by admin',
      );
      toast.success(`Permissions saved: +${pendingGrants.size} granted, -${pendingRevokes.size} revoked`);
      onSaved();
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setPendingGrants(new Set());
    setPendingRevokes(new Set());
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 p-8">
        <ModernLoader isLoading type="page" showStats={false} />
      </div>
    );
  }

  if (!detail) return null;

  // Group permissions by category
  const byCategory = detail.permissions.reduce<Record<string, PermissionItem[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const totalChanges = pendingGrants.size + pendingRevokes.size;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="w-12 h-12 bg-[#2c5173]/10 rounded-2xl flex items-center justify-center text-[#2c5173] font-black text-lg">
              {(user.firstName || user.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${roleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
                <span className="text-xs text-gray-500 font-medium">{user.email}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalChanges > 0 && (
              <>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                  {totalChanges} unsaved change{totalChanges !== 1 ? 's' : ''}
                </span>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reason</label>
                  <input
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Reason for change..."
                    className="w-64 px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:border-[#2c5173]"
                  />
                </div>
                <button
                  onClick={resetChanges}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  <X size={14} /> Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#2c5173] hover:bg-[#1e3850] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 bg-gray-50 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
          {(['permissions', 'audit'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${
                activeTab === tab ? 'bg-white dark:bg-slate-900 text-[#2c5173] shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:text-slate-300'
              }`}
            >
              {tab === 'permissions' ? 'Permissions' : 'Audit Log'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'permissions' ? (
        <>
          {/* Filter bar */}
          <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 p-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-[#2c5173]"
              />
            </div>
            <div className="flex gap-1 bg-gray-50 dark:bg-slate-800/50 p-1 rounded-xl">
              {(['all', 'granted', 'denied'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                    filterMode === mode ? 'bg-white dark:bg-slate-900 text-[#2c5173] shadow-sm' : 'text-gray-400'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400 font-medium">
              {detail.permissions.filter(p => p.effective).length} / {detail.permissions.length} granted
            </div>
          </div>

          {/* Permission modules */}
          <div className="space-y-4">
            {Object.entries(byCategory).map(([category, perms]) => {
              const meta = MODULE_META[category] || { label: category, icon: '🔧', color: 'bg-gray-50 border-gray-200 text-gray-700' };
              const search = searchTerm.toLowerCase();
              const filtered = perms.filter(p => {
                const matchesSearch = !search || p.code.includes(search) || p.description?.toLowerCase().includes(search);
                const matchesFilter =
                  filterMode === 'all' ? true :
                  filterMode === 'granted' ? isEffective(p) :
                  !isEffective(p);
                return matchesSearch && matchesFilter;
              });
              if (!filtered.length) return null;

              const allGranted = filtered.every(p => isEffective(p));
              const anyGranted = filtered.some(p => isEffective(p));
              const isExpanded = expandedModules.has(category);
              const pendingCount = filtered.filter(p => isPending(p.code)).length;

              return (
                <div key={category} className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 overflow-hidden">
                  {/* Module header */}
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => toggleModule(category)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border ${meta.color}`}>
                        <span>{meta.icon}</span> {meta.label}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">{filtered.length} permissions</span>
                      {pendingCount > 0 && (
                        <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                          {pendingCount} pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); selectAllInModule(filtered, !allGranted); }}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-lg border transition-colors ${
                          allGranted
                            ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {allGranted ? 'Revoke All' : anyGranted ? 'Grant All' : 'Grant All'}
                      </button>
                      {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Permission rows */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 divide-y divide-gray-50">
                      {filtered.map(perm => {
                        const effective = isEffective(perm);
                        const pending = isPending(perm.code);
                        return (
                          <div
                            key={perm.id}
                            className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                              effective ? 'bg-emerald-50/30' : 'bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800'
                            } ${pending ? 'ring-1 ring-inset ring-amber-200' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${effective ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-gray-800 font-mono">{perm.code}</span>
                                  {pending && (
                                    <span className="text-[9px] bg-amber-100 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded font-bold uppercase">
                                      {pendingGrants.has(perm.code) ? '+ pending grant' : '- pending revoke'}
                                    </span>
                                  )}
                                  {!pending && perm.source === 'user_granted' && (
                                    <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-bold">override: granted</span>
                                  )}
                                  {!pending && perm.source === 'user_denied' && (
                                    <span className="text-[9px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded font-bold">override: denied</span>
                                  )}
                                  {!pending && perm.source === 'role' && (
                                    <span className="text-[9px] bg-gray-100 text-gray-500 border border-gray-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-bold">from role</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5">{perm.description}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => togglePermission(perm)}
                              className={`w-10 h-6 rounded-full transition-all flex-shrink-0 flex items-center px-0.5 ${
                                effective ? 'bg-emerald-500 justify-end' : 'bg-gray-200 justify-start'
                              }`}
                            >
                              <span className="w-5 h-5 bg-white dark:bg-slate-900 rounded-full shadow-sm" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save button at bottom if changes pending */}
          {totalChanges > 0 && (
            <div className="sticky bottom-4 flex justify-end">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl p-4 flex items-center gap-4">
                <span className="text-sm font-bold text-gray-700 dark:text-slate-300">
                  {pendingGrants.size > 0 && <span className="text-emerald-600">+{pendingGrants.size} grant{pendingGrants.size !== 1 ? 's' : ''} </span>}
                  {pendingRevokes.size > 0 && <span className="text-rose-600">-{pendingRevokes.size} revoke{pendingRevokes.size !== 1 ? 's' : ''}</span>}
                </span>
                <button
                  onClick={resetChanges}
                  className="px-4 py-2 bg-gray-100 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors hover:bg-gray-200"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-[#2c5173] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Audit Log Tab */
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 p-6">
          <h3 className="text-sm font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
            <History size={16} /> Permission Audit Trail
          </h3>
          {auditLog.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <History size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No audit history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLog.map((log: any, i: number) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    log.action?.includes('grant') ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-gray-800">{log.action?.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                    {log.changes && (
                      <div className="mt-1 text-[11px] text-gray-500 font-mono">
                        {log.changes.permission && <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">{log.changes.permission}</span>}
                        {log.changes.reason && <span className="ml-2">— {log.changes.reason}</span>}
                      </div>
                    )}
                    {log.performed_by && (
                      <div className="text-[10px] text-gray-400 mt-1">By: {log.performed_by}</div>
                    )}
                    {log.ip_address && (
                      <div className="text-[10px] text-gray-400">IP: {log.ip_address}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
const PermissionManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = useCallback(async (searchTerm = '', role = '') => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users', {
        params: { search: searchTerm, role: role || undefined, limit: 50 },
      });
      const data = response.data;
      setUsers(Array.isArray(data) ? data : data?.users || data?.items || data?.data || []);
    } catch {
      // Fallback: try operational endpoint
      try {
        const res = await api.get('/admin/operational/users', {
          params: { search: searchTerm, limit: 50 },
        });
        const d = res.data?.data || res.data || [];
        setUsers(Array.isArray(d) ? d : []);
      } catch {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search, roleFilter);
  };

  const roles = ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'CARGO_OWNER', 'TRUCK_OWNER', 'DRIVER', 'BROKER', 'LENDER', 'CUSTOMS_OFFICER'];

  const userColumns: Column<any>[] = useMemo(() => [
    {
      key: 'email',
      label: 'User',
      sortable: true,
      render: (_: unknown, u: any) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#2c5173]/10 rounded-xl flex items-center justify-center text-[#2c5173] font-black text-sm">
            {(u.firstName || u.profile?.firstName || u.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {u.firstName || u.profile?.firstName || ''} {u.lastName || u.profile?.lastName || ''}
              {!u.firstName && !u.profile?.firstName && <span className="text-gray-400">—</span>}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1 font-medium">
              <Mail className="w-3 h-3 text-gray-400" /> {u.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (_: unknown, u: any) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${roleBadgeColor(u.role)}`}>
          <Shield className="w-3 h-3" /> {u.role?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: unknown, u: any) => (
        <StatusBadge
          label={u.status}
          status={u.status}
          icon={u.status === 'ACTIVE' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
        />
      ),
    },
  ], []);

  const userRowActions: TableAction<any>[] = useMemo(() => [
    {
      key: 'manage',
      label: 'Manage Permissions',
      icon: <Lock className="w-3 h-3" />,
      onClick: (u) => setSelectedUser(u),
    },
  ], []);

  if (selectedUser) {
    return (
      <AdminPageLayout
        title={<TranslatedText text="Permission Management" />}
        description={<TranslatedText text="Manage user-specific permissions and access control" />}
      >
        <UserPermissionEditor
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSaved={() => {}}
        />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={<TranslatedText text="Permission Management" />}
      description={<TranslatedText text="Manage user-specific permissions and access control" />}
    >
      <div className="safe-bottom">
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-gray-100 dark:border-slate-800 p-6">
        {/* Search & filter */}
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#2c5173]/20 focus:border-[#2c5173] transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); fetchUsers(search, e.target.value); }}
            className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#2c5173]/20"
          >
            <option value="">All Roles</option>
            {roles.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
          </select>
          <button
            type="submit"
            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#2c5173] transition-colors"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </form>

        {/* Users table */}
        <StandardDataTable
          embedded
          columns={userColumns}
          data={users}
          getRowId={(row) => row.id}
          loading={loading}
          searchable={false}
          columnVisibility
          stickyHeader
          defaultSortKey="email"
          rowActions={userRowActions}
          onRefresh={() => fetchUsers(search, roleFilter)}
          emptyMessage="No users found"
          ariaLabel="Permission management users"
        />
      </div>
      </div>
    </AdminPageLayout>
  );
};

export default PermissionManagement;
