/**
 * API Marketplace & Webhook Management — TENANT_ADMIN role
 * Route: /tenant-admin/integrations
 * Layout: DashboardLayout (TenantAdminLayout)
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Key, Webhook, Plus, Trash2, Copy, CheckCircle, Play, Eye, EyeOff, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiMarketplaceApi } from '../../services/featuresApi';
import { TranslatedText } from '../../components/translated-text';
import ModernLoader from '../../components/common/ModernLoader';
import { StandardDataTable, type Column, type TableAction } from '../../components/EnliteUI/Tables';

type Tab = 'api-keys' | 'webhooks';

const IntegrationsPage: React.FC = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('api-keys');
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [whName, setWhName] = useState('');
  const [whUrl, setWhUrl] = useState('');
  const [whEvents, setWhEvents] = useState<string[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);

  const { data: keys = [], isLoading: keysLoading } = useQuery({ queryKey: ['api-keys'], queryFn: apiMarketplaceApi.listKeys });
  const { data: webhooks = [], isLoading: whLoading } = useQuery({ queryKey: ['webhooks'], queryFn: apiMarketplaceApi.listWebhooks });
  const { data: events = [] } = useQuery({ queryKey: ['webhook-events'], queryFn: apiMarketplaceApi.getEvents });

  const genKeyMutation = useMutation({
    mutationFn: () => apiMarketplaceApi.generateKey({ name: newKeyName }),
    onSuccess: (data: any) => { setGeneratedKey(data.key); setNewKeyName(''); qc.invalidateQueries({ queryKey: ['api-keys'] }); },
    onError: () => toast.error('Failed to generate key'),
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => apiMarketplaceApi.revokeKey(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); toast.success('Key revoked'); },
  });

  const createWhMutation = useMutation({
    mutationFn: () => apiMarketplaceApi.createWebhook({ name: whName, url: whUrl, events: whEvents }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); setShowWebhookForm(false); setWhName(''); setWhUrl(''); setWhEvents([]); toast.success('Webhook created'); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to create webhook'),
  });

  const deleteWhMutation = useMutation({
    mutationFn: (id: string) => apiMarketplaceApi.deleteWebhook(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); toast.success('Webhook deleted'); },
  });

  const testWhMutation = useMutation({
    mutationFn: (id: string) => apiMarketplaceApi.testWebhook(id),
    onSuccess: (data: any) => toast[data.success ? 'success' : 'error'](data.success ? `Test delivered (${data.statusCode})` : `Test failed: ${data.error}`),
  });

  const toggleWhMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => apiMarketplaceApi.updateWebhook(id, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const copyKey = (key: string) => { navigator.clipboard.writeText(key); setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); toast.success('Key copied to clipboard'); };

  const toggleEvent = (event: string) => setWhEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);

  const apiKeyColumns = useMemo<Column<any>[]>(() => [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (v) => <span className="font-black text-slate-900 dark:text-white text-xs">{String(v)}</span>,
    },
    {
      key: 'keyPrefix',
      label: 'Key Prefix',
      render: (v) => (
        <code className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
          {String(v)}...
        </code>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (_v, row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400">{row.permissions?.join(', ') || 'read'}</span>
      ),
    },
    {
      key: 'lastUsedAt',
      label: 'Last Used',
      sortable: true,
      render: (v) => (
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {v ? new Date(String(v)).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
  ], []);

  const apiKeyActions = useMemo<TableAction<any>[]>(() => [
    {
      key: 'revoke',
      label: 'Revoke',
      icon: <Trash2 size={13} />,
      variant: 'danger',
      onClick: (row) => revokeKeyMutation.mutate(row.id),
    },
  ], [revokeKeyMutation]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          <TranslatedText text="Integrations" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          <TranslatedText text="Manage API keys and webhook endpoints to integrate Urutix with your systems." />
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {(['api-keys', 'webhooks'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            {t === 'api-keys' ? <Key size={13} /> : <Webhook size={13} />}
            {t === 'api-keys' ? 'API Keys' : 'Webhooks'}
          </button>
        ))}
      </div>

      {/* API KEYS TAB */}
      {tab === 'api-keys' && (
        <div className="space-y-4">
          {/* Generate new key */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
            <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4">
              <TranslatedText text="Generate New API Key" />
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g. ERP Integration)"
                className="flex-1 px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => genKeyMutation.mutate()}
                disabled={!newKeyName || genKeyMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-black transition-all disabled:opacity-50"
              >
                <Plus size={14} /> <TranslatedText text="Generate" />
              </button>
            </div>

            {/* Show generated key once */}
            {generatedKey && (
              <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-xs font-black text-amber-700 dark:text-amber-300 mb-2">
                  ⚠️ <TranslatedText text="Copy this key now — it will never be shown again!" />
                </p>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 border border-amber-200 dark:border-amber-700">
                  <code className="flex-1 text-xs font-mono text-slate-700 dark:text-slate-300 break-all">{generatedKey}</code>
                  <button onClick={() => copyKey(generatedKey)} className="text-primary-600 dark:text-primary-400 flex-shrink-0">
                    {copiedKey ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <button onClick={() => setGeneratedKey(null)} className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline">
                  <TranslatedText text="I've saved my key — dismiss" />
                </button>
              </div>
            )}
          </div>

          {/* Key List */}
          {keysLoading ? <ModernLoader isLoading type="table" rows={3} columns={3} /> : (
            <StandardDataTable<any>
              embedded
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-2"
              columns={apiKeyColumns}
              data={keys as any[]}
              getRowId={(row) => row.id}
              searchPlaceholder="Search API keys…"
              searchKeys={['name', 'keyPrefix']}
              rowActions={apiKeyActions}
              emptyMessage="No API keys yet."
              stickyHeader
              columnVisibility
              pagination
              ariaLabel="API keys"
            />
          )}
        </div>
      )}

      {/* WEBHOOKS TAB */}
      {tab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowWebhookForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black transition-all"
            >
              <Plus size={14} /> <TranslatedText text="Add Webhook" />
            </button>
          </div>

          {whLoading ? <ModernLoader isLoading type="table" rows={3} columns={3} /> : (
            <div className="space-y-3">
              {(webhooks as any[]).length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Webhook size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                    <TranslatedText text="No webhooks configured yet." />
                  </p>
                </div>
              ) : (
                (webhooks as any[]).map((wh: any) => (
                  <div key={wh.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black text-slate-900 dark:text-white text-sm">{wh.name}</h3>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${wh.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {wh.isActive ? 'ACTIVE' : 'PAUSED'}
                          </span>
                          {wh.failureCount > 0 && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {wh.failureCount} failures
                            </span>
                          )}
                        </div>
                        <code className="text-xs text-slate-500 dark:text-slate-400 truncate block">{wh.url}</code>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => testWhMutation.mutate(wh.id)} disabled={testWhMutation.isPending} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all" title="Send test">
                          <Play size={13} />
                        </button>
                        <button onClick={() => toggleWhMutation.mutate({ id: wh.id, isActive: !wh.isActive })} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all">
                          {wh.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                        </button>
                        <button onClick={() => deleteWhMutation.mutate(wh.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {wh.events?.map((e: string) => (
                        <span key={e} className="text-[10px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">{e}</span>
                      ))}
                    </div>
                    {wh.deliveryLogs?.length > 0 && (
                      <button
                        onClick={() => setExpandedLogs(expandedLogs === wh.id ? null : wh.id)}
                        className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {expandedLogs === wh.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        <TranslatedText text="Delivery Logs" /> ({wh.deliveryLogs.length})
                      </button>
                    )}
                    {expandedLogs === wh.id && (
                      <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto">
                        {wh.deliveryLogs.slice(-10).reverse().map((log: any, i: number) => (
                          <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-bold ${log.success ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400'}`}>
                            <span>{log.success ? '✓' : '✗'}</span>
                            <span>{log.event}</span>
                            <span className="ml-auto">{log.statusCode} · {log.responseMs}ms</span>
                            <span className="text-slate-400">{new Date(log.deliveredAt).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Create Webhook Modal */}
          {showWebhookForm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-5 uppercase tracking-tight">
                  <TranslatedText text="Add Webhook" />
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Name *</label>
                    <input type="text" value={whName} onChange={e => setWhName(e.target.value)} placeholder="e.g. ERP Sync" className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Endpoint URL *</label>
                    <input type="url" value={whUrl} onChange={e => setWhUrl(e.target.value)} placeholder="https://your-server.com/webhook" className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Events * (select at least one)</label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                      {(events as string[]).map((e: string) => (
                        <label key={e} className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-xs font-bold transition-all ${whEvents.includes(e) ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}>
                          <input type="checkbox" checked={whEvents.includes(e)} onChange={() => toggleEvent(e)} className="hidden" />
                          <span className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${whEvents.includes(e) ? 'bg-primary-600 border-primary-600' : 'border-slate-300 dark:border-slate-600'}`}>
                            {whEvents.includes(e) && <CheckCircle size={10} className="text-white" />}
                          </span>
                          {e}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowWebhookForm(false)} className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    <TranslatedText text="Cancel" />
                  </button>
                  <button
                    onClick={() => createWhMutation.mutate()}
                    disabled={!whName || !whUrl || whEvents.length === 0 || createWhMutation.isPending}
                    className="flex-1 px-4 py-2.5 text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all disabled:opacity-50"
                  >
                    {createWhMutation.isPending ? '...' : <TranslatedText text="Create Webhook" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IntegrationsPage;
