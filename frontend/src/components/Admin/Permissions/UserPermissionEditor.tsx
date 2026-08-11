import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  X,
  Search,
  Shield,
  ShieldOff,
  RotateCcw,
  History,
  Lock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { permissionApi, type PermissionItem } from '../../../services/permissionApi';

interface UserPermissionEditorProps {
  userId: string;
  userName: string;
  userRole: string;
  onClose: () => void;
  readOnly?: boolean;
}

type DraftAction = 'grant' | 'deny' | 'revoke' | null;

const sourceLabel = (item: PermissionItem & { globallyDisabled?: boolean }) => {
  if (item.globallyDisabled) return 'Blocked globally';
  switch (item.source) {
    case 'role':
      return 'Inherited from role';
    case 'user_granted':
      return 'User override: granted';
    case 'user_denied':
      return 'User override: denied';
    default:
      return 'Not granted';
  }
};

export const UserPermissionEditor: React.FC<UserPermissionEditorProps> = ({
  userId,
  userName,
  userRole,
  onClose,
  readOnly = false,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'permissions' | 'audit'>('permissions');
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, DraftAction>>({});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-user-permissions', userId],
    queryFn: () => permissionApi.getUserPermissionDetail(userId),
  });

  const { data: auditRaw, isLoading: auditLoading } = useQuery({
    queryKey: ['admin-user-permission-audit', userId],
    queryFn: () => permissionApi.getAuditLog(userId, 50, 0),
    enabled: activeTab === 'audit',
  });

  const auditLog = useMemo(() => {
    if (Array.isArray(auditRaw)) return auditRaw;
    if (Array.isArray((auditRaw as any)?.data)) return (auditRaw as any).data;
    return [];
  }, [auditRaw]);

  const permissions = data?.permissions || [];
  const summary = (data as any)?.summary || {
    total: permissions.length,
    effective: permissions.filter((p) => p.effective).length,
    userGranted: permissions.filter((p) => p.source === 'user_granted').length,
    userDenied: permissions.filter((p) => p.source === 'user_denied').length,
    globallyDisabled: permissions.filter((p: any) => p.globallyDisabled).length,
  };

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const groups: Record<string, Array<PermissionItem & { globallyDisabled?: boolean; codeColon?: string }>> = {};
    permissions.forEach((p: any) => {
      if (
        q &&
        !String(p.code || '').toLowerCase().includes(q) &&
        !String(p.codeColon || '').toLowerCase().includes(q) &&
        !String(p.description || '').toLowerCase().includes(q) &&
        !String(p.category || '').toLowerCase().includes(q) &&
        !String(p.resource || '').toLowerCase().includes(q)
      ) {
        return;
      }
      const key = p.category || p.resource || 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [permissions, search]);

  const dirtyCount = Object.values(drafts).filter(Boolean).length;

  const setDraft = (code: string, action: DraftAction) => {
    setDrafts((prev) => {
      const next = { ...prev };
      if (!action) delete next[code];
      else next[code] = action;
      return next;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const grants: string[] = [];
      const denies: string[] = [];
      const revokes: string[] = [];
      Object.entries(drafts).forEach(([code, action]) => {
        if (action === 'grant') grants.push(code);
        if (action === 'deny') denies.push(code);
        if (action === 'revoke') revokes.push(code);
      });
      return permissionApi.updateUserPermissions(userId, grants, revokes, reason || undefined, denies);
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'User permissions updated');
      setDrafts({});
      setReason('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-user-permission-audit', userId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update permissions');
    },
  });

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-3 bg-slate-50 dark:bg-slate-900/80">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{userName}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
              {userRole}
            </span>
            <span className="text-xs text-slate-500">
              {summary.effective}/{summary.total} effective
            </span>
            {summary.userGranted > 0 && (
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                +{summary.userGranted} grants
              </span>
            )}
            {summary.userDenied > 0 && (
              <span className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-md font-semibold">
                {summary.userDenied} denies
              </span>
            )}
            {summary.globallyDisabled > 0 && (
              <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1">
                <Lock size={10} /> {summary.globallyDisabled} globally off
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 px-6">
        <button
          type="button"
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'permissions'
              ? 'border-b-2 border-[#2c5173] text-[#2c5173]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('permissions')}
        >
          Permissions
        </button>
        <button
          type="button"
          className={`px-4 py-3 text-sm font-medium inline-flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-b-2 border-[#2c5173] text-[#2c5173]'
              : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('audit')}
        >
          <History size={14} /> Audit
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {activeTab === 'permissions' ? (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 flex gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#2c5173]" />
              <p>
                Grant adds a user override. Deny blocks even if the role normally allows it.
                Restore clears the override and returns to role defaults. Globally disabled
                features stay blocked for everyone until re-enabled in Feature Controls.
              </p>
            </div>

            {!readOnly && (
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Change reason</label>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Optional — recorded in audit log"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={!dirtyCount || saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  className="px-5 py-2.5 rounded-xl bg-[#2c5173] text-white text-xs font-black uppercase tracking-wider disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving…' : `Save ${dirtyCount || ''} change${dirtyCount === 1 ? '' : 's'}`}
                </button>
              </div>
            )}

            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search capabilities…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            {isLoading ? (
              <div className="py-16 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5173]" />
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(grouped).map(([category, items]) => {
                  const isCollapsed = collapsed.has(category);
                  return (
                    <div key={category} className="rounded-2xl border border-slate-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleGroup(category)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                          <span className="text-xs font-black uppercase tracking-wider text-[#2c5173]">
                            {category.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-slate-400">{items.length}</span>
                        </div>
                      </button>

                      {!isCollapsed && (
                        <div className="divide-y divide-slate-100">
                          {items.map((item) => {
                            const code = item.codeColon || item.code.replace('.', ':');
                            const draft = drafts[code] || drafts[item.code] || null;
                            const previewEffective = item.globallyDisabled
                              ? false
                              : draft === 'grant'
                                ? true
                                : draft === 'deny'
                                  ? false
                                  : draft === 'revoke'
                                    ? !!(item as any).fromRole
                                    : item.effective;

                            return (
                              <div key={item.id} className="px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        item.globallyDisabled
                                          ? 'bg-amber-500'
                                          : previewEffective
                                            ? 'bg-emerald-500'
                                            : 'bg-slate-300'
                                      }`}
                                    />
                                    <p className="font-semibold text-slate-800 text-sm">{code}</p>
                                    {item.globallyDisabled && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                        <Lock size={10} /> Global OFF
                                      </span>
                                    )}
                                    {draft && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                        Pending {draft}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5 ml-4">
                                    {item.description || `${item.resource} → ${item.action}`}
                                  </p>
                                  <p className="text-[11px] text-slate-400 mt-1 ml-4">{sourceLabel(item)}</p>
                                </div>

                                {!readOnly && (
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      title="Grant for this user"
                                      disabled={!!item.globallyDisabled}
                                      onClick={() => setDraft(code, draft === 'grant' ? null : 'grant')}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border disabled:opacity-40 ${
                                        draft === 'grant'
                                          ? 'bg-emerald-600 text-white border-emerald-600'
                                          : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                      }`}
                                    >
                                      <Shield size={12} /> Grant
                                    </button>
                                    <button
                                      type="button"
                                      title="Deny for this user"
                                      onClick={() => setDraft(code, draft === 'deny' ? null : 'deny')}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                        draft === 'deny'
                                          ? 'bg-red-600 text-white border-red-600'
                                          : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                                      }`}
                                    >
                                      <ShieldOff size={12} /> Deny
                                    </button>
                                    {(item.source === 'user_granted' ||
                                      item.source === 'user_denied' ||
                                      draft === 'grant' ||
                                      draft === 'deny' ||
                                      draft === 'revoke') && (
                                      <button
                                        type="button"
                                        title="Restore role default"
                                        onClick={() => setDraft(code, draft === 'revoke' ? null : 'revoke')}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                          draft === 'revoke'
                                            ? 'bg-slate-700 text-white border-slate-700'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                      >
                                        <RotateCcw size={12} /> Restore
                                      </button>
                                    )}
                                    {item.effective && !item.globallyDisabled && !draft && (
                                      <span className="text-emerald-600" title="Currently effective">
                                        <Check size={14} />
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {Object.keys(grouped).length === 0 && (
                  <div className="text-center py-12 text-slate-500">No permissions match your search.</div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {auditLoading ? (
              <div className="py-16 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5173]" />
              </div>
            ) : (
              <div className="space-y-4">
                {auditLog.map((log: any, idx: number) => (
                  <div key={log.id || idx} className="rounded-xl border border-slate-200 p-4 bg-white">
                    <div className="flex justify-between gap-3 items-start">
                      <p className="font-semibold text-slate-800 text-sm">{log.action}</p>
                      <p className="text-xs text-slate-400 whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                      </p>
                    </div>
                    <pre className="mt-2 text-xs bg-slate-50 rounded-lg p-3 overflow-x-auto text-slate-600">
                      {JSON.stringify(log.changes || {}, null, 2)}
                    </pre>
                    <p className="mt-2 text-xs text-slate-400">
                      By: {log.performed_by || log.user_id || 'System'}
                    </p>
                  </div>
                ))}
                {auditLog.length === 0 && (
                  <div className="text-center py-12 text-slate-500">No permission changes recorded for this user.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
