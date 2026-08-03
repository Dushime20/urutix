import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { StandardDataTable, StatusBadge, type Column } from '../../components/EnliteUI/Tables';
import {
  Send, Edit2, Eye, FileText,
  CheckCircle, XCircle, Filter, RefreshCw, Megaphone,
  Mail, MessageSquare, Smartphone, Bell, ChevronDown, ChevronUp,
  Zap, BarChart2, Clock,
} from 'lucide-react';
import { TranslatedText } from '../../components/translated-text';
import { useTranslation } from '../../hooks/useTranslation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  isActive: boolean;
}

interface CampaignLog {
  id: string;
  subject: string;
  recipientsCount: number;
  sentCount: number;
  failedCount: number;
  status: string;
  createdAt: string;
  metadata?: { filters?: any; partnerBulkEmail?: boolean };
}

type Channel = 'email' | 'sms' | 'whatsapp' | 'in_app';
type TabId = 'compose' | 'templates' | 'history';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = '#345E85';

const CHANNELS: { id: Channel; label: string; icon: React.ElementType; color: string; bg: string; desc: string }[] = [
  { id: 'email',    label: 'Email',    icon: Mail,           color: '#6366f1', bg: 'bg-indigo-50',  desc: 'Rich HTML emails' },
  { id: 'sms',      label: 'SMS',      icon: Smartphone,     color: '#0ea5e9', bg: 'bg-sky-50',     desc: 'Short text message' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare,  color: '#22c55e', bg: 'bg-green-50',   desc: 'WhatsApp Business' },
  { id: 'in_app',   label: 'In-App',   icon: Bell,           color: '#f59e0b', bg: 'bg-amber-50',   desc: 'Notification centre' },
];

const ROLE_OPTIONS = [
  { value: 'TRUCK_OWNER',     label: 'Truck Owners' },
  { value: 'DRIVER',          label: 'Drivers' },
  { value: 'CARGO_OWNER',     label: 'Cargo Owners' },
  { value: 'CARGO_RECEIVER',  label: 'Cargo Receivers' },
  { value: 'AGENT',           label: 'Agents' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE',                label: 'Active' },
  { value: 'PENDING_VERIFICATION',  label: 'Pending Verification' },
  { value: 'SUSPENDED',             label: 'Suspended' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChannelBadge: React.FC<{ ch: Channel }> = ({ ch }) => {
  const { tSync } = useTranslation();
  const cfg = CHANNELS.find(c => c.id === ch);
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} dark:bg-slate-800`}
      style={{ color: cfg.color }}
    >
      <Icon size={10} />
      {tSync(cfg.label)}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TenantBulkEmail: React.FC = () => {
  const { tSync } = useTranslation();
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
  const [filterRoles, setFilterRoles] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: '', html: '' });

  useEffect(() => { fetchTemplates(); fetchLogs(); }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/tenant-dashboard/communicate/templates');
      setTemplates(res.data?.data || []);
    } catch { /* optional */ }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get('/tenant-dashboard/communicate/logs');
      setLogs(res.data?.data || []);
    } catch { /* silent */ } finally {
      setLogsLoading(false);
    }
  };

  const toggleChannel = (ch: Channel) => {
    setSelectedChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch],
    );
  };

  const needsHtml = selectedChannels.includes('email');
  const needsMessage = selectedChannels.some(c => ['sms', 'whatsapp', 'in_app'].includes(c));

  const getEffectiveContent = () => {
    if (useTemplate && selectedTemplate) {
      const t = templates.find(t => t.id === selectedTemplate);
      return t ? { subject: t.subject, htmlBody: t.htmlBody, message: t.subject } : null;
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
      if (filterRoles.length) filters.roles = filterRoles;
      if (filterStatus.length) filters.status = filterStatus;

      const res = await api.post('/tenant-dashboard/communicate/send', {
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
          if (r?.success) {
            const cnt = r.sent ?? r.recipientsCount ?? '?';
            lines.push(`${ch.toUpperCase()}: ${cnt} sent`);
          } else if (r) {
            lines.push(`${ch.toUpperCase()}: failed`);
          }
        });
        toast.success(lines.join(' · ') || 'Campaign sent!');

        // Reset
        setSubject(''); setMessage(''); setHtmlBody('');
        setSelectedTemplate(''); setFilterRoles([]); setFilterStatus([]);
        setActiveTab('history');
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

  // ── TABS ──────────────────────────────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'compose',   label: 'Compose',   icon: Zap },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'history',   label: 'History',   icon: BarChart2 },
  ];

  const templateColumns: Column<EmailTemplate>[] = useMemo(() => [
    {
      key: 'name',
      label: tSync('Internal Template Name'),
      sortable: true,
      render: (_: unknown, t: EmailTemplate) => (
        <span className="font-black text-slate-700 dark:text-slate-200 text-sm">{t.name}</span>
      ),
    },
    {
      key: 'subject',
      label: tSync('Broadcast Subject'),
      sortable: true,
      render: (_: unknown, t: EmailTemplate) => (
        <span className="text-slate-500 dark:text-slate-400 text-sm max-w-sm truncate italic block">{t.subject}</span>
      ),
    },
    {
      key: 'isActive',
      label: tSync('Operational Status'),
      align: 'center',
      sortable: true,
      render: (_: unknown, t: EmailTemplate) => (
        <StatusBadge label={t.isActive ? tSync('Active') : tSync('Inactive')} status={t.isActive ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'actions',
      label: tSync('Action'),
      align: 'right',
      hideable: false,
      alwaysVisible: true,
      render: (_: unknown, t: EmailTemplate) => (
        <button
          disabled={!t.isActive}
          onClick={() => { setSelectedTemplate(t.id); setUseTemplate(true); setActiveTab('compose'); }}
          className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest hover:bg-primary-600 dark:hover:bg-primary-500 shadow-lg disabled:opacity-30 transition-all active:scale-95"
        >
          <TranslatedText text="Utilize" />
        </button>
      ),
    },
  ], [tSync]);

  const logColumns: Column<CampaignLog>[] = useMemo(() => [
    {
      key: 'subject',
      label: tSync('Subject Matter'),
      sortable: true,
      render: (_: unknown, log: CampaignLog) => (
        <p className="font-black text-slate-700 dark:text-slate-200 text-sm max-w-xs truncate">{log.subject}</p>
      ),
    },
    {
      key: 'recipientsCount',
      label: tSync('Targets'),
      align: 'center',
      sortable: true,
      render: (_: unknown, log: CampaignLog) => (
        <span className="font-black text-xs text-slate-500 dark:text-slate-400 tabular-nums">{log.recipientsCount}</span>
      ),
    },
    {
      key: 'sentCount',
      label: tSync('Success'),
      align: 'center',
      sortable: true,
      render: (_: unknown, log: CampaignLog) => (
        <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800/50 tabular-nums">{log.sentCount}</span>
      ),
    },
    {
      key: 'failedCount',
      label: tSync('Failures'),
      align: 'center',
      sortable: true,
      render: (_: unknown, log: CampaignLog) => (
        <span className="font-black text-xs text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-lg border border-rose-100 dark:border-rose-800/50 tabular-nums">{log.failedCount}</span>
      ),
    },
    {
      key: 'status',
      label: tSync('Execution Status'),
      align: 'center',
      sortable: true,
      render: (_: unknown, log: CampaignLog) => (
        <StatusBadge label={tSync(log.status)} status={log.status} />
      ),
    },
    {
      key: 'createdAt',
      label: tSync('Timestamp'),
      align: 'right',
      sortable: true,
      render: (_: unknown, log: CampaignLog) => (
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black tracking-tighter tabular-nums">
          {new Date(log.createdAt).toLocaleString()}
        </span>
      ),
    },
  ], [tSync]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div
        className="rounded-[40px] p-10 flex flex-col md:flex-row md:items-center justify-between overflow-hidden relative border border-white/5 shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #0f172a 100%)` }}
      >
        {/* decorative circles */}
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full opacity-10 bg-primary-400 blur-3xl translate-x-1/4 -translate-y-1/4" />
        <div className="absolute left-0 bottom-0 w-64 h-64 rounded-full opacity-5 bg-emerald-400 blur-3xl -translate-x-1/4 translate-y-1/4" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
              <Megaphone className="w-6 h-6 text-primary-400" />
            </div>
            <span className="text-primary-300 text-[10px] font-black uppercase tracking-[0.2em]"><TranslatedText text="Communications Hub" /></span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight"><TranslatedText text="Partner Outreach" /></h1>
          <p className="text-slate-400 font-medium mt-3 max-w-lg">
            <TranslatedText text="Strategic communication across multiple channels: Email, SMS, WhatsApp, and In-App messaging." />
          </p>
        </div>

        <div className="relative z-10 flex gap-3 flex-wrap mt-8 md:mt-0">
          {CHANNELS.map(ch => {
            const Icon = ch.icon;
            return (
              <div key={ch.id} className="flex flex-col items-center gap-2 px-6 py-4 bg-white/5 backdrop-blur-md rounded-[24px] border border-white/5 hover:bg-white/10 transition-all group">
                <Icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{tSync(ch.label)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-2 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-3 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden group"
              style={active ? { background: PRIMARY, color: '#fff', boxShadow: `0 8px 20px ${PRIMARY}40` } : {}}
            >
              <Icon size={16} strokeWidth={active ? 3 : 2} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500'} />
              <span className={active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}><TranslatedText text={label} /></span>
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════ COMPOSE TAB ══════════════════════════ */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Channel selector + filters */}
          <div className="space-y-4">
            {/* Channel Picker Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
                1. <TranslatedText text="Choose Channels" />
              </p>
              <div className="space-y-3">
                {CHANNELS.map(ch => {
                  const Icon = ch.icon;
                  const active = selectedChannels.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => toggleChannel(ch.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group"
                      style={{
                        borderColor: active ? ch.color : 'transparent',
                        background: active ? `${ch.color}0d` : '',
                      }}
                    >
                      <div
                        className="p-3 rounded-xl transition-transform group-hover:scale-110"
                        style={{ background: active ? `${ch.color}20` : '', color: active ? ch.color : '#94a3b8' }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">{tSync(ch.label)}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{tSync(ch.desc)}</p>
                      </div>
                      <div
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all shadow-sm"
                        style={{ borderColor: active ? ch.color : '#cbd5e1', background: active ? ch.color : 'transparent' }}
                      >
                        {active && <CheckCircle size={14} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedChannels.length === 0 && (
                <p className="text-xs text-red-400 font-bold text-center mt-4">
                  <TranslatedText text="Select at least one channel" />
                </p>
              )}
            </div>

            {/* Recipient Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
              <button
                className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => setShowFilters(v => !v)}
              >
                <div className="flex items-center gap-3">
                  <Filter size={16} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    2. <TranslatedText text="Recipients" />
                  </span>
                  {(filterRoles.length + filterStatus.length) > 0 && (
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-lg shadow-primary-500/20"
                      style={{ background: PRIMARY }}
                    >
                      {filterRoles.length + filterStatus.length}
                    </span>
                  )}
                </div>
                {showFilters ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </button>

              {showFilters && (
                <div className="px-6 pb-6 space-y-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="pt-5">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 italic">
                      <TranslatedText text="Filter By Role" />
                    </p>
                    <div className="space-y-2">
                      {ROLE_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 checked:bg-primary-600 transition-all"
                            style={{ accentColor: PRIMARY }}
                            checked={filterRoles.includes(opt.value)}
                            onChange={e => {
                              if (e.target.checked) setFilterRoles([...filterRoles, opt.value]);
                              else setFilterRoles(filterRoles.filter(r => r !== opt.value));
                            }}
                          />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                             {tSync(opt.label)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 italic">
                      <TranslatedText text="Filter By Status" />
                    </p>
                    <div className="space-y-2">
                      {STATUS_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 checked:bg-primary-600 transition-all"
                            style={{ accentColor: PRIMARY }}
                            checked={filterStatus.includes(opt.value)}
                            onChange={e => {
                              if (e.target.checked) setFilterStatus([...filterStatus, opt.value]);
                              else setFilterStatus(filterStatus.filter(s => s !== opt.value));
                            }}
                          />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {tSync(opt.label)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {(filterRoles.length + filterStatus.length) > 0 && (
                    <button
                      onClick={() => { setFilterRoles([]); setFilterStatus([]); }}
                      className="text-[10px] font-black text-rose-500 dark:text-rose-400 hover:text-rose-700 uppercase tracking-widest flex items-center gap-2 transition-colors"
                    >
                      <RefreshCw size={10} />
                      <TranslatedText text="Clear Filter Selection" />
                    </button>
                  )}
                  {filterRoles.length === 0 && filterStatus.length === 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                       <CheckCircle size={10} className="text-emerald-500" />
                       <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                         <TranslatedText text="Global Broadcast · All Partners" />
                       </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Composer */}
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-8">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
                3. <TranslatedText text="Compose Message" />
              </p>

              {/* Source toggle (template vs custom) */}
              <div className="flex gap-3 mb-6">
                {[
                  { use: false, icon: Edit2, label: 'Custom' },
                  { use: true,  icon: FileText, label: 'Template' },
                ].map(({ use, icon: Icon, label }) => {
                  const active = useTemplate === use;
                  return (
                    <button
                      key={String(use)}
                      onClick={() => setUseTemplate(use)}
                      className="flex items-center gap-2.5 px-5 py-3 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                      style={active ? { borderColor: PRIMARY, background: `${PRIMARY}10`, color: PRIMARY } : { borderColor: 'transparent', color: '#64748b' }}
                    >
                      <Icon size={14} />
                      <TranslatedText text={label} />
                    </button>
                  );
                })}
              </div>

              {useTemplate ? (
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                    <TranslatedText text="Select Communication Template" />
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={e => setSelectedTemplate(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
                  >
                    <option value="">{tSync('Choose a template…')}</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {templates.length === 0 && (
                    <p className="text-xs text-slate-400 font-medium italic">
                       <TranslatedText text="No templates yet. Ask a Super Admin to create some." />
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Subject — always shown */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                       <TranslatedText text="Subject / Title" />
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder={tSync("E.g. Important update for all truck owners")}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
                    />
                  </div>

                  {/* Plain-text message — for SMS / WhatsApp / In-App */}
                  {needsMessage && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                        <TranslatedText text="Message Content" />
                        <span className="ml-3 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 normal-case text-[9px] font-black border border-slate-200 dark:border-slate-700">
                          SMS · WhatsApp · In-App
                        </span>
                      </label>
                      <textarea
                        rows={5}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder={tSync("Write a concise message (SMS max 160 chars recommended)")}
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none resize-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
                      />
                      <div className="flex justify-between mt-2 px-1">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                           <TranslatedText text="Tip: Keep under 160 chars for SMS compatibility" />
                        </p>
                        <p className={`text-[10px] font-black tabular-nums tracking-widest ${message.length > 160 ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                          {message.length} <TranslatedText text="CHARS" />
                        </p>
                      </div>
                    </div>
                  )}

                  {/* HTML Body — email specific */}
                  {needsHtml && (
                    <div>
                      <button
                        onClick={() => setShowHtml(v => !v)}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 hover:text-primary-600 transition-colors group"
                      >
                        <Mail size={12} className="group-hover:scale-110 transition-transform" />
                        <TranslatedText text="Email HTML Body (uses plain message if blank)" />
                        {showHtml ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      {showHtml && (
                        <textarea
                          rows={10}
                          value={htmlBody}
                          onChange={e => setHtmlBody(e.target.value)}
                          placeholder={tSync("<p>Dear Partner,</p><p>Write your rich HTML email here…</p>")}
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-sm text-slate-700 dark:text-slate-200 outline-none resize-y focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Channel summary + actions */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between border-b-4" style={{ borderColor: PRIMARY }}>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 italic">
                   <TranslatedText text="Distribution Channels" />
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedChannels.length === 0
                    ? <span className="text-xs text-rose-500 font-black uppercase tracking-widest italic animate-pulse">
                        <TranslatedText text="No channels selected" />
                      </span>
                    : selectedChannels.map(ch => <ChannelBadge key={ch} ch={ch} />)
                  }
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto">
                {needsHtml && !useTemplate && (
                  <button
                    onClick={handlePreview}
                    disabled={!canSend}
                    className="flex items-center justify-center gap-3 px-6 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-[20px] font-black text-[10px] uppercase tracking-[0.15em] hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                  >
                    <Eye size={16} /> <TranslatedText text="Preview" />
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={loading || !canSend}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-10 py-3.5 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-1 transition-all active:scale-95 relative overflow-hidden group"
                  style={{ background: PRIMARY, boxShadow: `0 12px 24px ${PRIMARY}50` }}
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative z-10 flex items-center gap-3">
                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    {loading ? tSync('Sending…') : tSync('Launch Campaign')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════ TEMPLATES TAB ══════════════════════════ */}
      {activeTab === 'templates' && (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 mt-6 transition-all">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight"><TranslatedText text="Communication Templates" /></h3>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                <TranslatedText text="Centrally managed by administrators" /> · <TranslatedText text="Rich HTML format" />
              </p>
            </div>
          </div>

          {templates.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-6">
                <FileText className="text-slate-300 dark:text-slate-600" size={36} />
              </div>
              <h4 className="text-lg font-black text-slate-800 dark:text-white"><TranslatedText text="No Templates Available" /></h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-sm mx-auto font-medium italic">
                 <TranslatedText text="Collaborate with your organization's Super Admin to establish standardized communication templates." />
              </p>
            </div>
          ) : (
            <StandardDataTable
              embedded
              searchable={false}
              columnVisibility={false}
              pagination={false}
              columns={templateColumns}
              data={templates}
              getRowId={(row) => row.id}
              defaultSortKey="name"
              stickyHeader
              className="overflow-hidden rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all shadow-slate-100 dark:shadow-none"
              emptyMessage={tSync('No Templates Available')}
              ariaLabel="Communication templates"
            />
          )}
        </div>
      )}

      {/* ══════════════════════════ HISTORY TAB ══════════════════════════ */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 mt-6 transition-all">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight"><TranslatedText text="Campaign Transmission Audit" /></h3>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                {logs.length} <TranslatedText text="Historical Campaigns Identified" />
              </p>
            </div>
            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:bg-white dark:hover:bg-slate-700 hover:border-primary-500 transition-all shadow-sm active:scale-95 group"
            >
              <RefreshCw size={14} className={`${logsLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
              <TranslatedText text="Refresh Audit Log" />
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-6">
                <Clock className="text-slate-300 dark:text-slate-600" size={36} />
              </div>
              <h4 className="text-lg font-black text-slate-800 dark:text-white"><TranslatedText text="No Historical Data" /></h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 max-w-sm mx-auto font-medium italic">
                <TranslatedText text="Strategic outreach initiatives launched from this portal will be logged for administrative review." />
              </p>
            </div>
          ) : (
            <StandardDataTable
              embedded
              searchable={false}
              columnVisibility={false}
              pagination={false}
              loading={logsLoading}
              columns={logColumns}
              data={logs}
              getRowId={(row) => row.id}
              defaultSortKey="createdAt"
              defaultSortDirection="desc"
              stickyHeader
              className="overflow-hidden rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all shadow-slate-100 dark:shadow-none"
              emptyMessage={tSync('No Historical Data')}
              ariaLabel="Campaign transmission audit"
            />
          )}
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-4xl overflow-hidden shadow-2xl border border-white/5">
            <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight"><TranslatedText text="Campaign Visual Preview" /></h2>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">{previewContent.subject}</p>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all text-slate-400 active:scale-90"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="h-[600px] bg-slate-50 dark:bg-slate-950 p-8">
              <div className="w-full h-full bg-white dark:bg-white rounded-2xl shadow-inner overflow-hidden border border-slate-200 dark:border-slate-800">
                <iframe srcDoc={previewContent.html} className="w-full h-full border-0" title="Campaign Preview" />
              </div>
            </div>
            <div className="px-10 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
               <button
                 onClick={() => setPreviewOpen(false)}
                 className="px-8 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-600 transition-all active:scale-95 shadow-lg"
               >
                 <TranslatedText text="Close Preview" />
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantBulkEmail;
