import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  History,
  Lock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { TranslatedText } from '../../components/translated-text';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import ModernLoader from '../../components/common/ModernLoader';

interface FeatureControl {
  id: string | null;
  permissionCode: string;
  permissionId: string | null;
  resource: string;
  action: string;
  category: string | null;
  description: string | null;
  enabled: boolean;
  isProtected: boolean;
  reason: string | null;
  updatedAt: string | null;
}

interface AuditRow {
  id: string;
  action: string;
  entity_id: string;
  user_id: string;
  changes: Record<string, unknown>;
  created_at: string;
}

const api = () => {
  const token = localStorage.getItem('accessToken');
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  return axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${token}` },
  });
};

const FeatureControls: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'controls' | 'audit'>('controls');
  const [scopeMode, setScopeMode] = useState<'PLATFORM' | 'TENANT'>('PLATFORM');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({});

  const { data: tenants = [] } = useQuery({
    queryKey: ['admin-tenants-for-features'],
    queryFn: async () => {
      const res = await api().get('/admin/tenants');
      const list = res.data?.tenants || res.data?.data?.tenants || res.data?.data || res.data || [];
      return (Array.isArray(list) ? list : []).map((t: any) => ({
        id: t.id,
        name: t.name,
        status: t.status,
      }));
    },
  });

  const { data: features = [], isLoading } = useQuery({
    queryKey: ['admin-feature-controls', scopeMode, selectedTenantId],
    queryFn: async () => {
      const params =
        scopeMode === 'TENANT' && selectedTenantId
          ? `?tenantId=${encodeURIComponent(selectedTenantId)}`
          : '';
      const res = await api().get(`/admin/feature-controls${params}`);
      return (res.data?.data || []) as FeatureControl[];
    },
    enabled: scopeMode === 'PLATFORM' || !!selectedTenantId,
  });

  const { data: audit = [], isLoading: auditLoading } = useQuery({
    queryKey: ['admin-feature-controls-audit'],
    queryFn: async () => {
      const res = await api().get('/admin/feature-controls/audit?limit=100');
      return (res.data?.data || []) as AuditRow[];
    },
    enabled: activeTab === 'audit',
  });

  const toggleMutation = useMutation({
    mutationFn: async (payload: { permissionCode: string; enabled: boolean; reason?: string }) => {
      if (scopeMode === 'TENANT' && !selectedTenantId) {
        throw new Error('Select a tenant first');
      }
      const res = await api().patch('/admin/feature-controls', {
        permissionCode: payload.permissionCode,
        enabled: payload.enabled,
        reason: payload.reason || undefined,
        scope: scopeMode,
        tenantId: scopeMode === 'TENANT' ? selectedTenantId : undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Feature control updated');
      queryClient.invalidateQueries({ queryKey: ['admin-feature-controls'] });
      queryClient.invalidateQueries({ queryKey: ['admin-feature-controls-audit'] });
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        error?.response?.data?.error ||
        'Failed to update feature control';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const groups: Record<string, FeatureControl[]> = {};
    features.forEach((f) => {
      if (
        q &&
        !f.permissionCode.toLowerCase().includes(q) &&
        !(f.description || '').toLowerCase().includes(q) &&
        !(f.category || '').toLowerCase().includes(q)
      ) {
        return;
      }
      const key = f.category || f.resource || 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    return groups;
  }, [features, search]);

  const disabledCount = features.filter((f) => !f.enabled).length;

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <AdminPageLayout
      title="Feature Controls"
      subtitle="Enable or disable platform capabilities globally or per tenant. Changes apply immediately without requiring users to log out."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('controls')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors ${
                activeTab === 'controls'
                  ? 'bg-[#2c5173] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TranslatedText text="Feature Controls" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-2 ${
                activeTab === 'audit'
                  ? 'bg-[#2c5173] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <History size={14} />
              <TranslatedText text="Permission Audit" />
            </button>
          </div>

          {activeTab === 'controls' && (
            <div className="flex items-center gap-3 text-sm text-slate-600 flex-wrap">
              <div className="flex rounded-xl overflow-hidden border border-slate-200">
                <button
                  type="button"
                  onClick={() => setScopeMode('PLATFORM')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                    scopeMode === 'PLATFORM' ? 'bg-[#2c5173] text-white' : 'bg-white text-slate-600'
                  }`}
                >
                  Platform
                </button>
                <button
                  type="button"
                  onClick={() => setScopeMode('TENANT')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
                    scopeMode === 'TENANT' ? 'bg-[#2c5173] text-white' : 'bg-white text-slate-600'
                  }`}
                >
                  Tenant
                </button>
              </div>
              {scopeMode === 'TENANT' && (
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white min-w-[200px]"
                >
                  <option value="">Select tenant…</option>
                  {tenants.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
                <ShieldAlert size={14} />
                {disabledCount} disabled
              </span>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search capabilities…"
                  className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-white min-w-[220px]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 flex gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#2c5173]" />
          <p>
            {scopeMode === 'PLATFORM' ? (
              <TranslatedText text="Global OFF blocks the capability for every role and tenant. System-critical capabilities are locked." />
            ) : (
              <TranslatedText text="Tenant OFF only affects that tenant. Tenants cannot re-enable a capability that is disabled globally." />
            )}
          </p>
        </div>

        {activeTab === 'controls' && (
          <>
            {isLoading ? (
              <ModernLoader />
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped).map(([category, items]) => {
                  const isCollapsed = collapsed.has(category);
                  return (
                    <div key={category} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleGroup(category)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/80 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                          <span className="text-sm font-black uppercase tracking-wider text-[#2c5173]">
                            {category.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-slate-400">{items.length}</span>
                        </div>
                      </button>

                      {!isCollapsed && (
                        <div className="divide-y divide-slate-100">
                          {items.map((feature) => {
                            const busy =
                              toggleMutation.isPending &&
                              toggleMutation.variables?.permissionCode === feature.permissionCode;
                            return (
                              <div
                                key={feature.permissionCode}
                                className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-3 justify-between"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-slate-800">{feature.permissionCode}</p>
                                    {feature.isProtected && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                        <Lock size={10} /> Protected
                                      </span>
                                    )}
                                    {!feature.enabled && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
                                        Globally disabled
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-500 mt-0.5">
                                    {feature.description || `${feature.resource} → ${feature.action}`}
                                  </p>
                                  {!feature.isProtected && (
                                    <input
                                      value={reasonDraft[feature.permissionCode] || ''}
                                      onChange={(e) =>
                                        setReasonDraft((prev) => ({
                                          ...prev,
                                          [feature.permissionCode]: e.target.value,
                                        }))
                                      }
                                      placeholder="Reason (optional, recorded in audit)"
                                      className="mt-2 w-full max-w-md text-xs px-3 py-2 rounded-lg border border-slate-200"
                                    />
                                  )}
                                </div>

                                <button
                                  type="button"
                                  disabled={feature.isProtected || busy}
                                  onClick={() =>
                                    toggleMutation.mutate({
                                      permissionCode: feature.permissionCode,
                                      enabled: !feature.enabled,
                                      reason: reasonDraft[feature.permissionCode],
                                    })
                                  }
                                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                    feature.enabled
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                                  }`}
                                  title={
                                    feature.isProtected
                                      ? 'System-critical — cannot be disabled'
                                      : feature.enabled
                                        ? 'Disable globally'
                                        : 'Enable globally'
                                  }
                                >
                                  {feature.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                  {feature.enabled ? 'Enabled' : 'Disabled'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {Object.keys(grouped).length === 0 && (
                  <div className="text-center py-16 text-slate-500">No capabilities match your search.</div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'audit' && (
          <>
            {auditLoading ? (
              <ModernLoader />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">When</th>
                        <th className="px-4 py-3">Action</th>
                        <th className="px-4 py-3">Permission</th>
                        <th className="px-4 py-3">Change</th>
                        <th className="px-4 py-3">Reason</th>
                        <th className="px-4 py-3">By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {audit.map((row) => {
                        const changes = row.changes || {};
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                              {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">{row.action}</td>
                            <td className="px-4 py-3 font-mono text-xs">{row.entity_id}</td>
                            <td className="px-4 py-3">
                              <span className="text-slate-500">{String(changes.oldValue || '—')}</span>
                              {' → '}
                              <span className="font-semibold">{String(changes.newValue || '—')}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{String(changes.reason || '—')}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.user_id || '—'}</td>
                          </tr>
                        );
                      })}
                      {audit.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                            No feature control changes recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminPageLayout>
  );
};

export default FeatureControls;
