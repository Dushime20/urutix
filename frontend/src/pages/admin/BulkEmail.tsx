import React, { useState, useEffect } from 'react';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import AIEmailAssistant from '../../components/Admin/AIEmailAssistant';
import { TranslatedText } from '../../components/translated-text';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Send, Plus, Edit2, Trash2, Eye, FileText,
  CheckCircle, XCircle, Filter, RefreshCw,
  Mail, MessageSquare, Smartphone, Bell, ChevronDown, ChevronUp,
  Zap, BarChart2, Clock, Megaphone, Settings, Search, X, Building2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  description: string;
  category: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
}

interface CampaignLog {
  id: string;
  subject: string;
  recipientsCount: number;
  sentCount: number;
  failedCount: number;
  status: string;
  createdAt: string;
  metadata?: any;
}

interface Tenant {
  id: string;
  name: string;
  status: string;
  subdomain?: string;
  contactEmail?: string;
}

type Channel = 'email' | 'sms' | 'whatsapp' | 'in_app';
type TabId = 'compose' | 'templates' | 'logs';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNELS: { id: Channel; label: string; icon: React.ElementType; color: string; bg: string; border: string; desc: string }[] = [
  { id: 'email',    label: 'Email',    icon: Mail,          color: '#6366f1', bg: 'bg-indigo-50',  border: 'border-indigo-200', desc: 'Rich HTML campaigns' },
  { id: 'sms',      label: 'SMS',      icon: Smartphone,    color: '#0ea5e9', bg: 'bg-sky-50',     border: 'border-sky-200',    desc: 'Text to all active phones' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: '#22c55e', bg: 'bg-green-50',   border: 'border-green-200',  desc: 'WhatsApp Business API' },
  { id: 'in_app',   label: 'In-App',   icon: Bell,          color: '#f59e0b', bg: 'bg-amber-50',   border: 'border-amber-200',  desc: 'Notification bell & centre' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE',              label: 'Active' },
  { value: 'SUSPENDED',           label: 'Suspended' },
  { value: 'PENDING_ACTIVATION',  label: 'Pending Activation' },
  { value: 'DEACTIVATED',         label: 'Deactivated' },
];

const CATEGORY_OPTIONS = [
  { value: 'general',       label: 'General' },
  { value: 'announcement',  label: 'Announcement' },
  { value: 'update',        label: 'Update' },
  { value: 'marketing',     label: 'Marketing' },
  { value: 'notification',  label: 'Notification' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChannelPill: React.FC<{ ch: Channel }> = ({ ch }) => {
  const c = CHANNELS.find(x => x.id === ch)!;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.border} border`} style={{ color: c.color }}>
      <Icon size={10} />
      {c.label}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BulkEmail: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('compose');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<CampaignLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  // Compose
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>(['email']);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [showHtml, setShowHtml] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Tenant picker
  const [allTenants, setAllTenants] = useState<Tenant[]>([]);
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantPickerOpen, setTenantPickerOpen] = useState(false);

  // Template CRUD modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', subject: '', htmlBody: '', textBody: '', description: '', category: 'general', isActive: true });

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: '', html: '' });

  useEffect(() => { fetchTemplates(); fetchLogs(); fetchTenants(); }, []);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/admin/bulk-email/tenants');
      if (res.data.success) {
        setAllTenants(res.data.data || []);
      } else {
        console.warn('[BulkEmail] tenant picker error:', res.data.message);
        toast.error(`Could not load tenants: ${res.data.message}`);
      }
    } catch (err: any) {
      console.error('[BulkEmail] fetchTenants failed:', err);
      toast.error('Could not load tenant list');
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/admin/bulk-email/templates');
      if (res.data.success) setTemplates(res.data.data);
    } catch { /* silent */ }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get('/admin/bulk-email/logs');
      if (res.data.success) setLogs(res.data.data);
    } catch { /* silent */ } finally { setLogsLoading(false); }
  };

  const toggleChannel = (ch: Channel) => {
    setSelectedChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const needsHtml    = selectedChannels.includes('email');
  const needsMessage = selectedChannels.some(c => ['sms', 'whatsapp', 'in_app'].includes(c));

  const getEffectiveContent = () => {
    if (useTemplate && selectedTemplate) {
      const t = templates.find(t => t.id === selectedTemplate);
      return t ? { subject: t.subject, htmlBody: t.htmlBody, message: t.textBody || t.subject } : null;
    }
    return { subject, htmlBody: htmlBody || `<p>${message}</p>`, message };
  };

  const canSend = (() => {
    if (!selectedChannels.length) return false;
    if (useTemplate) return !!selectedTemplate;
    if (!subject) return false;
    if (needsHtml && !htmlBody && !message) return false;
    if (needsMessage && !message) return false;
    return true;
  })();

  const handleSend = async () => {
    const content = getEffectiveContent();
    if (!content) { toast.error('Select a template or fill in the message'); return; }

    setLoading(true);
    try {
      const filters: any = {};
      if (filterStatus.length) filters.status = filterStatus;
      if (selectedTenantIds.length) filters.tenantIds = selectedTenantIds;

      const res = await api.post('/admin/bulk-email/send', {
        channels: selectedChannels,
        subject: content.subject,
        message: content.message,
        htmlBody: content.htmlBody,
        filters: Object.keys(filters).length ? filters : undefined,
      });

      if (res.data.success) {
        const results = res.data.results || {};
        const lines: string[] = [];
        selectedChannels.forEach(ch => {
          const r = results[ch];
          if (r?.success) lines.push(`${ch.toUpperCase()}: ${r.sent ?? r.recipientsCount ?? '?'} sent`);
          else if (r) lines.push(`${ch.toUpperCase()}: failed`);
        });
        toast.success(lines.join(' · ') || 'Campaign sent!');

        setSubject(''); setMessage(''); setHtmlBody('');
        setSelectedTemplate(''); setFilterStatus([]); setSelectedTenantIds([]);
        setActiveTab('logs');
        fetchLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    const content = getEffectiveContent();
    if (!content) return;
    setPreviewContent({ subject: content.subject, html: content.htmlBody });
    setPreviewOpen(true);
  };

  const handleSaveTemplate = async () => {
    setLoading(true);
    try {
      const res = editingTemplate
        ? await api.put(`/admin/bulk-email/templates/${editingTemplate.id}`, templateForm)
        : await api.post('/admin/bulk-email/templates', templateForm);

      if (res.data.success) {
        toast.success(editingTemplate ? 'Template updated!' : 'Template created!');
        setIsTemplateModalOpen(false);
        setEditingTemplate(null);
        setTemplateForm({ name: '', subject: '', htmlBody: '', textBody: '', description: '', category: 'general', isActive: true });
        fetchTemplates();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save template');
    } finally { setLoading(false); }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(`/admin/bulk-email/templates/${id}`);
      toast.success('Template deleted!');
      fetchTemplates();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleAISuggestion = (sub: string, body: string) => {
    setSubject(sub);
    setHtmlBody(body);
    setUseTemplate(false);
    toast.success('AI suggestion applied!');
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'compose',   label: 'Compose',   icon: Zap },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'logs',      label: 'History',   icon: BarChart2 },
  ];

  return (
    <AdminPageLayout
      title={<TranslatedText text="Communications Hub" />}
      description={<TranslatedText text="Send campaigns to all tenants via Email, SMS, WhatsApp & In-App" />}
    >
      <div className="space-y-6">

        {/* ── Hero strip ── */}
        <div className="rounded-3xl p-6 flex items-center justify-between overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
          <div className="absolute right-0 top-0 w-48 h-48 rounded-full opacity-10 bg-white translate-x-1/3 -translate-y-1/3" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="p-2 bg-white/20 rounded-xl"><Megaphone className="w-5 h-5 text-white" /></div>
              <span className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]"><TranslatedText text="Super Admin · Broadcast" /></span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight"><TranslatedText text="Multi-Channel Outreach" /></h2>
            <p className="text-white/50 text-xs mt-1 font-medium"><TranslatedText text="Reach all Tenant Admins across every channel simultaneously" /></p>
          </div>
          <div className="relative z-10 flex gap-2">
            {CHANNELS.map(ch => {
              const Icon = ch.icon;
              return (
                <div key={ch.id} className="flex flex-col items-center gap-1 px-3 py-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                  <Icon className="w-4 h-4 text-white" />
                  <span className="text-[9px] font-black text-white/70 uppercase tracking-wider">{ch.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 inline-flex gap-1.5">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                style={active
                  ? { background: '#1e293b', color: '#fff', boxShadow: '0 4px 14px rgba(30,41,59,0.3)' }
                  : { color: '#64748b' }}>
                <Icon size={14} strokeWidth={active ? 2.5 : 2} />
                <TranslatedText text={label} />
              </button>
            );
          })}
        </div>

        {/* ════════════════════ COMPOSE ════════════════════ */}
        {activeTab === 'compose' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Left panel */}
            <div className="space-y-4">

              {/* Channel picker */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4"><TranslatedText text="1. Channels" /></p>
                <div className="space-y-2">
                  {CHANNELS.map(ch => {
                    const Icon = ch.icon;
                    const active = selectedChannels.includes(ch.id);
                    return (
                      <button key={ch.id} onClick={() => toggleChannel(ch.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left"
                        style={{ borderColor: active ? ch.color : '#e2e8f0', background: active ? `${ch.color}0d` : '#fff' }}>
                        <div className="p-2 rounded-xl" style={{ background: active ? `${ch.color}20` : '#f1f5f9', color: active ? ch.color : '#94a3b8' }}>
                          <Icon size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{ch.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium truncate">{ch.desc}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ borderColor: active ? ch.color : '#cbd5e1', background: active ? ch.color : 'transparent' }}>
                          {active && <CheckCircle size={11} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedChannels.length === 0 && (
                  <p className="text-xs text-red-400 font-medium text-center mt-3"><TranslatedText text="Select at least one channel" /></p>
                )}
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button className="w-full flex items-center justify-between px-5 py-4" onClick={() => setShowFilters(v => !v)}>
                  <div className="flex items-center gap-2">
                    <Filter size={13} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="2. Recipient Filters" /></span>
                    {(filterStatus.length + selectedTenantIds.length) > 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white bg-slate-800">
                        {filterStatus.length + selectedTenantIds.length}
                      </span>
                    )}
                  </div>
                  {showFilters ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                </button>

                {showFilters && (
                  <div className="px-5 pb-5 space-y-5 border-t border-slate-100">

                    {/* Status checkboxes */}
                    <div className="pt-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><TranslatedText text="Tenant Status" /></p>
                      <div className="space-y-1.5">
                        {STATUS_OPTIONS.map(opt => (
                          <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded accent-slate-800"
                              checked={filterStatus.includes(opt.value)}
                              onChange={e => {
                                if (e.target.checked) setFilterStatus([...filterStatus, opt.value]);
                                else setFilterStatus(filterStatus.filter(s => s !== opt.value));
                              }} />
                            <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* ── Multi-Select Tenant Picker ── */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Specific Tenants" /></p>
                        <div className="flex items-center gap-2">
                          {selectedTenantIds.length > 0 && (
                            <button onClick={() => setSelectedTenantIds([])}
                              className="text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest">
                              <TranslatedText text="Clear" /> ({selectedTenantIds.length})
                            </button>
                          )}
                          {allTenants.length > 0 && selectedTenantIds.length < allTenants.length && (
                            <button onClick={() => setSelectedTenantIds(allTenants.map(t => t.id))}
                              className="text-[9px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest">
                              <TranslatedText text="All" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Selected chips */}
                      {selectedTenantIds.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {selectedTenantIds.map(id => {
                            const t = allTenants.find(x => x.id === id);
                            return (
                              <span key={id}
                                className="inline-flex items-center gap-1 pl-2 pr-1 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold">
                                <Building2 size={9} className="opacity-70" />
                                <span className="max-w-[90px] truncate">{t?.name || id.slice(0, 8)}</span>
                                <button onClick={() => setSelectedTenantIds(selectedTenantIds.filter(i => i !== id))}
                                  className="ml-0.5 p-0.5 hover:bg-white/20 rounded">
                                  <X size={9} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Dropdown trigger */}
                      <button
                        onClick={() => setTenantPickerOpen(v => !v)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all">
                        <span className="flex items-center gap-2">
                          <Building2 size={13} className="text-slate-400" />
                          {selectedTenantIds.length === 0
                            ? <TranslatedText text="Select tenants…" />
                            : `${selectedTenantIds.length} of ${allTenants.length} selected`}
                        </span>
                        {tenantPickerOpen ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                      </button>

                      {/* Searchable dropdown list */}
                      {tenantPickerOpen && (
                        <div className="mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                          {/* Search input */}
                          <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                            <Search size={13} className="text-slate-400 flex-shrink-0" />
                            <input
                              autoFocus
                              type="text"
                              value={tenantSearch}
                              onChange={e => setTenantSearch(e.target.value)}
                              placeholder="Search tenants…"
                              className="flex-1 text-xs font-medium text-slate-700 outline-none bg-transparent placeholder-slate-400"
                            />
                            {tenantSearch && (
                              <button onClick={() => setTenantSearch('')} className="text-slate-400 hover:text-slate-600">
                                <X size={12} />
                              </button>
                            )}
                          </div>

                          {/* Tenant rows */}
                          <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
                            {allTenants
                              .filter(t => {
                                const q = tenantSearch.toLowerCase();
                                return !q || t.name?.toLowerCase().includes(q) || t.subdomain?.toLowerCase().includes(q) || t.contactEmail?.toLowerCase().includes(q);
                              })
                              .map(t => {
                                const selected = selectedTenantIds.includes(t.id);
                                const statusColor = t.status === 'ACTIVE'
                                  ? { bg: 'bg-emerald-50', text: 'text-emerald-700' }
                                  : t.status === 'SUSPENDED'
                                  ? { bg: 'bg-red-50',     text: 'text-red-700' }
                                  : { bg: 'bg-slate-100',  text: 'text-slate-600' };
                                return (
                                  <button key={t.id}
                                    onClick={() => {
                                      if (selected) setSelectedTenantIds(selectedTenantIds.filter(i => i !== t.id));
                                      else setSelectedTenantIds([...selectedTenantIds, t.id]);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
                                    {/* Checkbox */}
                                    <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                                      style={{ borderColor: selected ? '#1e293b' : '#cbd5e1', background: selected ? '#1e293b' : 'transparent' }}>
                                      {selected && <CheckCircle size={10} className="text-white" />}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-slate-800 truncate">{t.name}</p>
                                      {t.subdomain && <p className="text-[10px] text-slate-400 truncate">{t.subdomain}</p>}
                                    </div>
                                    {/* Status badge */}
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor.bg} ${statusColor.text}`}>
                                      {t.status?.replace('_', ' ')}
                                    </span>
                                  </button>
                                );
                              })
                            }
                            {allTenants.filter(t => {
                              const q = tenantSearch.toLowerCase();
                              return !q || t.name?.toLowerCase().includes(q);
                            }).length === 0 && (
                              <p className="text-center text-xs text-slate-400 py-6 font-medium"><TranslatedText text="No tenants found" /></p>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <p className="text-[10px] text-slate-400 font-medium">
                              {selectedTenantIds.length} <TranslatedText text="selected" /> · {allTenants.length} <TranslatedText text="total" />
                            </p>
                            <button onClick={() => setTenantPickerOpen(false)}
                              className="text-[10px] font-black text-slate-800 uppercase tracking-widest hover:underline">
                              <TranslatedText text="Done" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {(filterStatus.length > 0 || selectedTenantIds.length > 0) && (
                      <button onClick={() => { setFilterStatus([]); setSelectedTenantIds([]); }}
                        className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest">
                        <TranslatedText text="Clear All Filters" />
                      </button>
                    )}
                    {filterStatus.length === 0 && selectedTenantIds.length === 0 && (
                      <p className="text-[10px] text-slate-400 font-medium"><TranslatedText text="No filter → all Tenant Admins" /></p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Composer */}
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5"><TranslatedText text="3. Compose Message" /></p>

                {/* Template vs Custom toggle */}
                <div className="flex gap-3 mb-5">
                  {[
                    { use: false, icon: Edit2,    label: 'Custom' },
                    { use: true,  icon: FileText,  label: 'Template' },
                  ].map(({ use, icon: Icon, label }) => {
                    const active = useTemplate === use;
                    return (
                      <button key={String(use)} onClick={() => setUseTemplate(use)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all"
                        style={active ? { borderColor: '#1e293b', background: '#f8fafc', color: '#1e293b' } : { borderColor: '#e2e8f0', color: '#64748b' }}>
                        <Icon size={13} />
                        <TranslatedText text={label} />
                      </button>
                    );
                  })}
                </div>

                {useTemplate ? (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><TranslatedText text="Select Template" /></label>
                    <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-300">
                      <option value=""><TranslatedText text="Choose a template…" /></option>
                      {templates.filter(t => t.isActive).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Subject */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><TranslatedText text="Subject / Title" /></label>
                      <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                        placeholder="E.g. Platform Maintenance — Friday 22:00 UTC"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" />
                    </div>

                    {/* Plain message (SMS / WhatsApp / In-App) */}
                    {needsMessage && (
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                          <TranslatedText text="Message" />
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 normal-case text-[9px] font-bold">SMS · WhatsApp · In-App</span>
                        </label>
                        <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)}
                          placeholder="Keep under 160 characters for SMS. Plain text — no HTML."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none resize-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" />
                        <div className="flex justify-between mt-1">
                          <p className="text-[10px] text-slate-400 font-medium"><TranslatedText text="Recommended: ≤ 160 chars for SMS" /></p>
                          <p className={`text-[10px] font-bold tabular-nums ${message.length > 160 ? 'text-amber-500' : 'text-slate-400'}`}>{message.length} chars</p>
                        </div>
                      </div>
                    )}

                    {/* HTML Body (email) */}
                    {needsHtml && (
                      <div>
                        <button onClick={() => setShowHtml(v => !v)}
                          className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 hover:text-slate-700 transition-colors">
                          <Mail size={11} />
                          <TranslatedText text="Email HTML Body (optional — uses message text if blank)" />
                          {showHtml ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                        {showHtml && (
                          <>
                            <div className="flex items-center justify-between mb-1.5">
                              <span />
                              <AIEmailAssistant
                                onApplySuggestion={handleAISuggestion}
                                currentSubject={subject}
                                currentBody={htmlBody}
                              />
                            </div>
                            <textarea rows={9} value={htmlBody} onChange={e => setHtmlBody(e.target.value)}
                              placeholder="<p>Dear Tenant Admin,</p><p>Write your rich HTML message here…</p>"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-700 outline-none resize-y focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" />
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                              Variables: <code className="bg-slate-200 px-1 rounded text-slate-600">{'{{tenantName}}'}</code> <code className="bg-slate-200 px-1 rounded text-slate-600">{'{{email}}'}</code>
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Send bar */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2"><TranslatedText text="Sending via" /></p>
                  <div className="flex flex-wrap gap-2">
                    {selectedChannels.length === 0
                      ? <span className="text-xs text-red-400 font-medium"><TranslatedText text="No channels selected" /></span>
                      : selectedChannels.map(ch => <ChannelPill key={ch} ch={ch} />)
                    }
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {needsHtml && !useTemplate && (
                    <button onClick={handlePreview} disabled={!canSend}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      <Eye size={14} /> <TranslatedText text="Preview" />
                    </button>
                  )}
                  <button onClick={handleSend} disabled={loading || !canSend}
                    className="flex items-center gap-2 px-7 py-2.5 text-white rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
                    style={{ background: '#1e293b', boxShadow: '0 6px 20px rgba(30,41,59,0.35)' }}>
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    <TranslatedText text={loading ? 'Sending…' : 'Launch Campaign'} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ TEMPLATES ════════════════════ */}
        {activeTab === 'templates' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-800"><TranslatedText text="Email Templates" /></h3>
                <p className="text-xs text-slate-400 mt-0.5"><TranslatedText text="Reusable HTML templates for email campaigns" /></p>
              </div>
              <button
                onClick={() => { setEditingTemplate(null); setTemplateForm({ name: '', subject: '', htmlBody: '', textBody: '', description: '', category: 'general', isActive: true }); setIsTemplateModalOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all hover:-translate-y-0.5"
                style={{ background: '#1e293b' }}>
                <Plus size={15} /> <TranslatedText text="New Template" />
              </button>
            </div>

            {templates.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-slate-300" size={32} />
                </div>
                <p className="font-bold text-slate-500"><TranslatedText text="No templates yet" /></p>
                <p className="text-xs text-slate-400 mt-1"><TranslatedText text="Create your first email template to reuse in campaigns." /></p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Name" /></th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Subject" /></th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Category" /></th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Status" /></th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Actions" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {templates.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700 text-sm">{t.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">{t.description}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm max-w-xs truncate">{t.subject}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide">{t.category}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${t.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            <TranslatedText text={t.isActive ? 'Active' : 'Inactive'} />
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingTemplate(t); setTemplateForm({ name: t.name, subject: t.subject, htmlBody: t.htmlBody, textBody: t.textBody || '', description: t.description, category: t.category, isActive: t.isActive }); setIsTemplateModalOpen(true); }}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                              <Settings size={15} />
                            </button>
                            <button onClick={() => handleDeleteTemplate(t.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ HISTORY ════════════════════ */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-800"><TranslatedText text="Campaign History" /></h3>
                <p className="text-xs text-slate-400 mt-0.5">{logs.length} <TranslatedText text={logs.length !== 1 ? 'campaigns' : 'campaign'} /></p>
              </div>
              <button onClick={fetchLogs} disabled={logsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-all">
                <RefreshCw size={13} className={logsLoading ? 'animate-spin' : ''} />
                <TranslatedText text="Refresh" />
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-slate-300" size={32} />
                </div>
                <p className="font-bold text-slate-500"><TranslatedText text="No campaigns yet" /></p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Subject" /></th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Recipients" /></th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Sent" /></th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Failed" /></th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Status" /></th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Date" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-700 text-sm max-w-xs truncate">{log.subject}</td>
                        <td className="px-6 py-4 text-center font-mono text-xs font-bold text-slate-600">{log.recipientsCount}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{log.sentCount}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{log.failedCount}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            log.status === 'sent' || log.status === 'sending' ? 'bg-emerald-50 text-emerald-600'
                            : log.status === 'failed' ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                          }`}>{log.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-slate-400 font-medium tabular-nums">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Template Modal ── */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md px-8 py-5 border-b border-slate-100 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-black text-slate-800"><TranslatedText text={editingTemplate ? 'Edit Template' : 'New Template'} /></h2>
                <p className="text-xs text-slate-400 mt-0.5"><TranslatedText text="Configure email template" /></p>
              </div>
              <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <XCircle size={22} />
              </button>
            </div>

            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><TranslatedText text="Template Name" /></label>
                  <input type="text" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="e.g. Welcome Email"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-300" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><TranslatedText text="Category" /></label>
                  <select value={templateForm.category} onChange={e => setTemplateForm({ ...templateForm, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-300">
                    {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><TranslatedText text="Subject Line" /></label>
                <input type="text" value={templateForm.subject} onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><TranslatedText text="Description" /></label>
                <input type="text" value={templateForm.description} onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><TranslatedText text="HTML Content" /></label>
                <textarea rows={7} value={templateForm.htmlBody} onChange={e => setTemplateForm({ ...templateForm, htmlBody: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer">
                <input type="checkbox" checked={templateForm.isActive} onChange={e => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                  className="w-4 h-4 accent-slate-800 rounded" />
                <span className="text-sm font-bold text-slate-700"><TranslatedText text="Set as Active Template" /></span>
              </label>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-8 py-5 flex items-center justify-end gap-3 z-10">
              <button onClick={() => setIsTemplateModalOpen(false)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50">
                <TranslatedText text="Cancel" />
              </button>
              <button onClick={handleSaveTemplate} disabled={loading}
                className="px-5 py-2.5 text-white rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                style={{ background: '#1e293b' }}>
                <TranslatedText text={loading ? 'Saving…' : 'Save Template'} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-black text-slate-800"><TranslatedText text="Email Preview" /></h2>
                <p className="text-[10px] text-slate-400 mt-0.5">{previewContent.subject}</p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
                <XCircle size={22} />
              </button>
            </div>
            <div className="h-[500px]">
              <iframe srcDoc={previewContent.html} className="w-full h-full border-0 block" title="Email Preview" />
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default BulkEmail;
