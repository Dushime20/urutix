import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Send, History, Edit2, Eye, FileText, Users,
  CheckCircle, XCircle, Filter, RefreshCw, Megaphone,
  Mail, MessageSquare, Smartphone, Bell, ChevronDown, ChevronUp,
  Zap, BarChart2, Clock,
} from 'lucide-react';

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
  const cfg = CHANNELS.find(c => c.id === ch);
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg}`}
      style={{ color: cfg.color }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TenantBulkEmail: React.FC = () => {
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

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div
        className="rounded-3xl p-8 flex items-center justify-between overflow-hidden relative"
        style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, #1a3a5c 100%)` }}
      >
        {/* decorative circles */}
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-10 bg-white translate-x-1/4 -translate-y-1/4" />
        <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full opacity-5 bg-white translate-y-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/20 rounded-2xl">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Communications Hub</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Partner Outreach</h1>
          <p className="text-white/60 text-sm mt-1 font-medium">Reach your partners via Email, SMS, WhatsApp & In-App</p>
        </div>

        <div className="relative z-10 flex gap-2 flex-wrap">
          {CHANNELS.map(ch => {
            const Icon = ch.icon;
            return (
              <div key={ch.id} className="flex flex-col items-center gap-1 px-4 py-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Icon className="w-5 h-5 text-white" />
                <span className="text-[9px] font-black text-white/80 uppercase tracking-wider">{ch.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              style={active ? { background: PRIMARY, color: '#fff', boxShadow: `0 4px 14px ${PRIMARY}40` } : { color: '#64748b' }}
            >
              <Icon size={14} strokeWidth={active ? 2.5 : 2} />
              {label}
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
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                1. Choose Channels
              </p>
              <div className="space-y-2">
                {CHANNELS.map(ch => {
                  const Icon = ch.icon;
                  const active = selectedChannels.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => toggleChannel(ch.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left"
                      style={{
                        borderColor: active ? ch.color : '#e2e8f0',
                        background: active ? `${ch.color}0d` : '#fff',
                      }}
                    >
                      <div
                        className="p-2 rounded-xl"
                        style={{ background: active ? `${ch.color}20` : '#f1f5f9', color: active ? ch.color : '#94a3b8' }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">{ch.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{ch.desc}</p>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: active ? ch.color : '#cbd5e1', background: active ? ch.color : 'transparent' }}
                      >
                        {active && <CheckCircle size={12} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedChannels.length === 0 && (
                <p className="text-xs text-red-400 font-medium text-center mt-3">Select at least one channel</p>
              )}
            </div>

            {/* Recipient Filters */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4"
                onClick={() => setShowFilters(v => !v)}
              >
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Recipients</span>
                  {(filterRoles.length + filterStatus.length) > 0 && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: PRIMARY }}
                    >
                      {filterRoles.length + filterStatus.length}
                    </span>
                  )}
                </div>
                {showFilters ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>

              {showFilters && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
                  <div className="pt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">By Role</p>
                    <div className="space-y-1.5">
                      {ROLE_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded"
                            style={{ accentColor: PRIMARY }}
                            checked={filterRoles.includes(opt.value)}
                            onChange={e => {
                              if (e.target.checked) setFilterRoles([...filterRoles, opt.value]);
                              else setFilterRoles(filterRoles.filter(r => r !== opt.value));
                            }}
                          />
                          <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">By Status</p>
                    <div className="space-y-1.5">
                      {STATUS_OPTIONS.map(opt => (
                        <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded"
                            style={{ accentColor: PRIMARY }}
                            checked={filterStatus.includes(opt.value)}
                            onChange={e => {
                              if (e.target.checked) setFilterStatus([...filterStatus, opt.value]);
                              else setFilterStatus(filterStatus.filter(s => s !== opt.value));
                            }}
                          />
                          <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {(filterRoles.length + filterStatus.length) > 0 && (
                    <button
                      onClick={() => { setFilterRoles([]); setFilterStatus([]); }}
                      className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest"
                    >
                      Clear Filters
                    </button>
                  )}
                  {filterRoles.length === 0 && filterStatus.length === 0 && (
                    <p className="text-[10px] text-slate-400 font-medium">All partners · No filter applied</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Composer */}
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">
                3. Compose Message
              </p>

              {/* Source toggle (template vs custom) */}
              <div className="flex gap-3 mb-5">
                {[
                  { use: false, icon: Edit2, label: 'Custom' },
                  { use: true,  icon: FileText, label: 'Template' },
                ].map(({ use, icon: Icon, label }) => {
                  const active = useTemplate === use;
                  return (
                    <button
                      key={String(use)}
                      onClick={() => setUseTemplate(use)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all"
                      style={active ? { borderColor: PRIMARY, background: `${PRIMARY}10`, color: PRIMARY } : { borderColor: '#e2e8f0', color: '#64748b' }}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  );
                })}
              </div>

              {useTemplate ? (
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Select Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={e => setSelectedTemplate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2"
                    style={{ '--tw-ring-color': PRIMARY } as any}
                  >
                    <option value="">Choose a template…</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {templates.length === 0 && (
                    <p className="text-xs text-slate-400">No templates yet. Ask a Super Admin to create some.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Subject — always shown */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject / Title</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="E.g. Important update for all truck owners"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  {/* Plain-text message — for SMS / WhatsApp / In-App */}
                  {needsMessage && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Message
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 normal-case text-[9px] font-bold">
                          SMS · WhatsApp · In-App
                        </span>
                      </label>
                      <textarea
                        rows={4}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Write a concise message (SMS max 160 chars recommended)"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                      <div className="flex justify-between mt-1">
                        <p className="text-[10px] text-slate-400 font-medium">Tip: Keep under 160 chars for SMS compatibility</p>
                        <p className={`text-[10px] font-bold tabular-nums ${message.length > 160 ? 'text-amber-500' : 'text-slate-400'}`}>
                          {message.length} chars
                        </p>
                      </div>
                    </div>
                  )}

                  {/* HTML Body — email specific */}
                  {needsHtml && (
                    <div>
                      <button
                        onClick={() => setShowHtml(v => !v)}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 hover:text-slate-700 transition-colors"
                      >
                        <Mail size={11} />
                        Email HTML Body (optional – uses plain message if blank)
                        {showHtml ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                      {showHtml && (
                        <textarea
                          rows={8}
                          value={htmlBody}
                          onChange={e => setHtmlBody(e.target.value)}
                          placeholder="<p>Dear Partner,</p><p>Write your rich HTML email here…</p>"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-700 outline-none resize-y focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Channel summary + actions */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sending via</p>
                <div className="flex flex-wrap gap-2">
                  {selectedChannels.length === 0
                    ? <span className="text-xs text-red-400 font-medium">No channels selected</span>
                    : selectedChannels.map(ch => <ChannelBadge key={ch} ch={ch} />)
                  }
                </div>
              </div>

              <div className="flex items-center gap-3">
                {needsHtml && !useTemplate && (
                  <button
                    onClick={handlePreview}
                    disabled={!canSend}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Eye size={14} /> Preview
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={loading || !canSend}
                  className="flex items-center gap-2 px-7 py-2.5 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
                  style={{ background: PRIMARY, boxShadow: `0 6px 20px ${PRIMARY}40` }}
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  {loading ? 'Sending…' : 'Launch Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════ TEMPLATES TAB ══════════════════════════ */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800">Email Templates</h3>
              <p className="text-xs text-slate-400 mt-0.5">Managed by Super Admins · use for Rich Email campaigns</p>
            </div>
          </div>

          {templates.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto mb-4">
                <FileText className="text-slate-300" size={32} />
              </div>
              <p className="font-bold text-slate-500">No templates available</p>
              <p className="text-xs text-slate-400 mt-2">Ask a Super Admin to create shared email templates for your org.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {templates.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm">{t.name}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm max-w-sm truncate">{t.subject}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${t.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {t.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          disabled={!t.isActive}
                          onClick={() => { setSelectedTemplate(t.id); setUseTemplate(true); setActiveTab('compose'); }}
                          className="text-[10px] font-black px-4 py-1.5 rounded-xl text-white disabled:opacity-40 transition-all"
                          style={{ background: PRIMARY }}
                        >
                          Use
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════ HISTORY TAB ══════════════════════════ */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800">Campaign History</h3>
              <p className="text-xs text-slate-400 mt-0.5">{logs.length} campaign{logs.length !== 1 ? 's' : ''} found</p>
            </div>
            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-all"
            >
              <RefreshCw size={13} className={logsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto mb-4">
                <Clock className="text-slate-300" size={32} />
              </div>
              <p className="font-bold text-slate-500">No campaigns yet</p>
              <p className="text-xs text-slate-400 mt-2">Your sent campaigns will appear here.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipients</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Sent</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Failed</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700 text-sm max-w-xs truncate">{log.subject}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs font-bold text-slate-600">{log.recipientsCount}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{log.sentCount}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{log.failedCount}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          log.status === 'sent' || log.status === 'sending'
                            ? 'bg-emerald-50 text-emerald-600'
                            : log.status === 'failed'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {log.status}
                        </span>
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

      {/* ── Preview Modal ── */}
      {previewOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-black text-slate-800">Email Preview</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">{previewContent.subject}</p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <XCircle size={22} />
              </button>
            </div>
            <div className="h-[500px] overflow-y-auto">
              <iframe srcDoc={previewContent.html} className="w-full h-full border-0 block" title="Email Preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantBulkEmail;
