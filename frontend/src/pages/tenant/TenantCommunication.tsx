import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { StandardDataTable, StatusBadge, type Column } from '../../components/EnliteUI/Tables';
import {
  Send, Users, RefreshCw, Mail, MessageSquare, 
  Smartphone, Bell, ChevronDown, ChevronUp, CheckCircle, 
  Search, X, User, Clock, BarChart2,
  Zap
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Partner {
  id: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  name: string;
  companyName?: string;
  profilePictureUrl?: string;
}

interface GroupedPartners {
  [role: string]: Partner[];
}

interface CampaignLog {
  id: string;
  subject: string;
  message?: string;
  channels: string[];
  sentBy?: string;
  recipientsCount: number;
  sentCount?: number;
  failedCount?: number;
  status: string;
  createdAt: string;
  metadata?: any;
}

type Channel = 'email' | 'sms' | 'whatsapp' | 'in_app';
type TabId = 'compose' | 'logs';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNELS: { 
  id: Channel; 
  label: string; 
  icon: React.ElementType; 
  color: string; 
  bg: string; 
  border: string; 
  desc: string 
}[] = [
  { id: 'email',    label: 'Email',    icon: Mail,          color: '#6366f1', bg: 'bg-indigo-50',  border: 'border-indigo-200', desc: 'Rich HTML campaigns' },
  { id: 'sms',      label: 'SMS',      icon: Smartphone,    color: '#0ea5e9', bg: 'bg-sky-50',     border: 'border-sky-200',    desc: 'Text to all active phones' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: '#22c55e', bg: 'bg-green-50',   border: 'border-green-200',  desc: 'WhatsApp Business API' },
  { id: 'in_app',   label: 'In-App',   icon: Bell,          color: '#f59e0b', bg: 'bg-amber-50',   border: 'border-amber-200',  desc: 'Notification bell & centre' },
];

const ROLE_LABELS: { [key: string]: string } = {
  'CARGO_OWNER': 'Cargo Owners',
  'CARGO_RECEIVER': 'Cargo Receivers', 
  'TRUCK_OWNER': 'Truck Owners',
  'DRIVER': 'Drivers',
  'AGENT': 'Agents',
  'LENDER': 'Lenders',
  'BROKER': 'Brokers'
};

const ROLE_COLORS: { [key: string]: { bg: string; text: string; icon: string } } = {
  'CARGO_OWNER': { bg: 'bg-blue-50', text: 'text-blue-700', icon: '📦' },
  'CARGO_RECEIVER': { bg: 'bg-green-50', text: 'text-green-700', icon: '📥' },
  'TRUCK_OWNER': { bg: 'bg-orange-50', text: 'text-orange-700', icon: '🚛' },
  'DRIVER': { bg: 'bg-purple-50', text: 'text-purple-700', icon: '👨‍💼' },
  'AGENT': { bg: 'bg-teal-50', text: 'text-teal-700', icon: '🤝' },
  'LENDER': { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '💰' },
  'BROKER': { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: '🏢' }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ChannelPill: React.FC<{ ch: Channel }> = ({ ch }) => {
  const c = CHANNELS.find(x => x.id === ch)!;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.bg} dark:bg-opacity-20 ${c.border} dark:border-opacity-30 border`} style={{ color: c.color }}>
      <Icon size={10} />
      {c.label}
    </span>
  );
};
// ─── Main Component ───────────────────────────────────────────────────────────

const TenantCommunication: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('compose');
  const [partners, setPartners] = useState<GroupedPartners>({});
  const [logs, setLogs] = useState<CampaignLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  // Compose
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>(['email']);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Partner selection
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [showPartnerFilters, setShowPartnerFilters] = useState(true);
  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);

  useEffect(() => { 
    fetchPartners(); 
    fetchLogs(); 
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await api.get('/tenant-dashboard/communicate/partners');
      if (res.data.success) {
        setPartners(res.data.data.partners || {});
      } else {
        console.warn('[TenantCommunication] partners error:', res.data.message);
        toast.error(`Could not load partners: ${res.data.message}`);
      }
    } catch (err: any) {
      console.error('[TenantCommunication] fetchPartners failed:', err);
      toast.error('Could not load partner list');
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get('/tenant-dashboard/communicate/logs');
      if (res.data.success) setLogs(res.data.data);
      else toast.error(res.data.message || 'Failed to load history');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load communication history');
    } finally { setLogsLoading(false); }
  };

  const toggleChannel = (ch: Channel) => {
    setSelectedChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const togglePartner = (partnerId: string) => {
    setSelectedPartnerIds(prev => 
      prev.includes(partnerId) 
        ? prev.filter(id => id !== partnerId) 
        : [...prev, partnerId]
    );
  };

  const selectAllPartnersInRole = (role: string) => {
    const rolePartners = partners[role] || [];
    const rolePartnerIds = rolePartners.map(p => p.id);
    setSelectedPartnerIds(prev => [...new Set([...prev, ...rolePartnerIds])]);
  };

  const deselectAllPartnersInRole = (role: string) => {
    const rolePartners = partners[role] || [];
    const rolePartnerIds = rolePartners.map(p => p.id);
    setSelectedPartnerIds(prev => prev.filter(id => !rolePartnerIds.includes(id)));
  };

  const needsMessage = selectedChannels.length > 0; // All channels need at least a plain message

  const canSend = (() => {
    if (!selectedChannels.length) return false;
    if (!subject) return false;
    if (!message) return false;
    if (selectedPartnerIds.length === 0 && selectedRoles.length === 0) return false;
    return true;
  })();

  const handleSend = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedRoles.length) filters.roles = selectedRoles;
      if (selectedPartnerIds.length) filters.partnerIds = selectedPartnerIds;

      const res = await api.post('/tenant-dashboard/communicate/send', {
        channels: selectedChannels,
        subject,
        message,
        htmlBody: `<p>${message}</p>`,
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

        setSubject(''); setMessage('');
        setSelectedPartnerIds([]); setSelectedRoles([]);
        setActiveTab('logs');
        fetchLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPartnersCount = () => {
    let count = 0;
    if (selectedPartnerIds.length > 0) {
      count += selectedPartnerIds.length;
    }
    if (selectedRoles.length > 0) {
      selectedRoles.forEach(role => {
        const rolePartners = partners[role] || [];
        rolePartners.forEach(partner => {
          if (!selectedPartnerIds.includes(partner.id)) {
            count++;
          }
        });
      });
    }
    return count;
  };

  const getAllPartners = () => {
    const allPartners: Partner[] = [];
    Object.values(partners).forEach(rolePartners => {
      allPartners.push(...rolePartners);
    });
    return allPartners;
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'compose', label: 'Compose', icon: Zap },
    { id: 'logs', label: 'History', icon: BarChart2 },
  ];

  const logColumns: Column<CampaignLog>[] = useMemo(() => [
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
      render: (_: unknown, log: CampaignLog) => (
        <span className="font-medium text-slate-700 dark:text-slate-300 text-sm max-w-[180px] truncate block">{log.subject}</span>
      ),
    },
    {
      key: 'channels',
      label: 'Channels',
      sortable: false,
      render: (_: unknown, log: CampaignLog) => {
        const channels = (log.channels || ['email']).map((c: string) => c.toLowerCase()) as Channel[];
        return (
          <div className="flex flex-wrap gap-1">
            {channels.map(ch => <ChannelPill key={ch} ch={ch} />)}
          </div>
        );
      },
    },
    {
      key: 'sentBy',
      label: 'Sent By',
      sortable: true,
      render: (_: unknown, log: CampaignLog) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[140px] truncate block">{log.sentBy || '—'}</span>
      ),
    },
    {
      key: 'recipientsCount',
      label: 'Recipients',
      align: 'center',
      sortable: true,
      render: (_: unknown, log: CampaignLog) => (
        <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">{log.recipientsCount}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      sortable: true,
      render: (_: unknown, log: CampaignLog) => (
        <StatusBadge label={log.status} status={log.status} />
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      align: 'right',
      sortable: true,
      render: (_: unknown, log: CampaignLog) => (
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tabular-nums whitespace-nowrap">
          {new Date(log.createdAt).toLocaleString()}
        </span>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 transition-colors duration-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Partner Communication</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Communicate with your partners across multiple channels</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {CHANNELS.map(ch => {
              const Icon = ch.icon;
              return (
                <div key={ch.id} className="flex flex-col items-center gap-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">{ch.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-1.5 inline-flex gap-1.5 transition-colors duration-200">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              style={active
                ? { background: '#1e293b', color: '#fff', boxShadow: '0 4px 14px rgba(30,41,59,0.3)' }
                : { color: '#64748b' }}>
              <Icon size={14} strokeWidth={active ? 2.5 : 2} />
              <span className={!active ? "dark:text-slate-400" : ""}>{label}</span>
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">1. Channels</p>
              <div className="space-y-2">
                  {CHANNELS.map(ch => {
                    const Icon = ch.icon;
                    const active = selectedChannels.includes(ch.id);
                    return (
                      <button key={ch.id} onClick={() => toggleChannel(ch.id)}
                        style={{ 
                          borderColor: active ? ch.color : undefined, 
                          background: active ? `${ch.color}0d` : undefined
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          active ? '' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}>
                        <div className={`p-2 rounded-xl ${active ? '' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`} 
                          style={{ background: active ? `${ch.color}40` : undefined }}>
                          <Icon size={15} style={active ? { color: ch.color } : {}} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-white">{ch.label}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{ch.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${active ? '' : 'border-slate-300 dark:border-slate-600'}`}
                          style={{ borderColor: active ? ch.color : undefined, background: active ? ch.color : 'transparent' }}>
                          {active && <CheckCircle size={11} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedChannels.length === 0 && (
                  <p className="text-xs text-red-400 font-medium text-center mt-3">Select at least one channel</p>
                )}
              </div>

              {/* Partner Selection */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <button className="w-full flex items-center justify-between px-5 py-4" onClick={() => setShowPartnerFilters(v => !v)}>
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-slate-400 dark:text-slate-500" />
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">2. Select Partners</span>
                    {getSelectedPartnersCount() > 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white bg-slate-800 dark:bg-slate-700">
                        {getSelectedPartnersCount()}
                      </span>
                    )}
                  </div>
                  {showPartnerFilters ? <ChevronUp size={13} className="text-slate-400 dark:text-slate-500" /> : <ChevronDown size={13} className="text-slate-400 dark:text-slate-500" />}
                </button>

                {showPartnerFilters && (
                  <div className="px-5 pb-5 space-y-5 border-t border-slate-100 dark:border-slate-800">
                    <div className="pt-4">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Select by Role</p>
                      <div className="space-y-2">
                        {Object.entries(partners).map(([role, rolePartners]) => {
                          const roleColor = ROLE_COLORS[role] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: '👤' };
                          const isRoleSelected = selectedRoles.includes(role);
                          const selectedInRole = rolePartners.filter(p => selectedPartnerIds.includes(p.id)).length;
                          
                          return (
                             <div key={role} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors duration-200">
                              <label className="flex items-center gap-3 cursor-pointer flex-1">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded accent-slate-800 dark:accent-blue-600"
                                  checked={isRoleSelected}
                                  onChange={() => toggleRole(role)}
                                />
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{roleColor.icon}</span>
                                  <span className="text-sm font-bold text-slate-800 dark:text-white">{ROLE_LABELS[role] || role}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColor.bg} dark:bg-opacity-20 ${roleColor.text} dark:opacity-80`}>
                                    {rolePartners.length}
                                  </span>
                                </div>
                              </label>
                              {selectedInRole > 0 && (
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                  {selectedInRole} selected
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Individual Partner Selection */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Specific Partners</p>
                        <div className="flex items-center gap-2">
                          {selectedPartnerIds.length > 0 && (
                            <button onClick={() => setSelectedPartnerIds([])}
                              className="text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest">
                              Clear ({selectedPartnerIds.length})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Selected partner chips */}
                      {selectedPartnerIds.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {selectedPartnerIds.map(id => {
                            const partner = getAllPartners().find(p => p.id === id);
                            if (!partner) return null;
                            const roleColor = ROLE_COLORS[partner.role] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: '👤' };
                            return (
                              <span key={id}
                                className="inline-flex items-center gap-1 pl-2 pr-1 py-1 bg-slate-800 text-white rounded-lg text-[10px] font-bold">
                                <span>{roleColor.icon}</span>
                                <span className="max-w-[90px] truncate">{partner.name}</span>
                                <button onClick={() => togglePartner(id)}
                                  className="ml-0.5 p-0.5 hover:bg-white/20 rounded">
                                  <X size={9} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Partner picker dropdown */}
                      <button
                        onClick={() => setPartnerPickerOpen(v => !v)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all">
                        <span className="flex items-center gap-2">
                          <User size={13} className="text-slate-400 dark:text-slate-500" />
                          {selectedPartnerIds.length === 0
                            ? 'Select individual partners…'
                            : `${selectedPartnerIds.length} partners selected`}
                        </span>
                        {partnerPickerOpen ? <ChevronUp size={13} className="text-slate-400 dark:text-slate-500" /> : <ChevronDown size={13} className="text-slate-400 dark:text-slate-500" />}
                      </button>
                      {/* Partner dropdown list */}
                      {partnerPickerOpen && (
                        <div className="mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-200">
                          {/* Search input */}
                          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <Search size={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                            <input
                              autoFocus
                              type="text"
                              value={partnerSearch}
                              onChange={e => setPartnerSearch(e.target.value)}
                              placeholder="Search partners…"
                              className="flex-1 text-xs font-medium text-slate-700 dark:text-white outline-none bg-transparent placeholder-slate-400 dark:placeholder-slate-600"
                            />
                            {partnerSearch && (
                              <button onClick={() => setPartnerSearch('')} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                                <X size={12} />
                              </button>
                            )}
                          </div>

                          {/* Partner list grouped by role */}
                          <div className="max-h-64 overflow-y-auto">
                            {Object.entries(partners).map(([role, rolePartners]) => {
                              const filteredPartners = rolePartners.filter(partner => {
                                if (!partnerSearch) return true;
                                const query = partnerSearch.toLowerCase();
                                return partner.name.toLowerCase().includes(query) ||
                                       partner.email.toLowerCase().includes(query) ||
                                       partner.companyName?.toLowerCase().includes(query);
                              });

                              if (filteredPartners.length === 0) return null;

                              const roleColor = ROLE_COLORS[role] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: '👤' };
                              const allSelected = filteredPartners.every(p => selectedPartnerIds.includes(p.id));
                              const someSelected = filteredPartners.some(p => selectedPartnerIds.includes(p.id));

                              return (
                                <div key={role}>
                                  {/* Role header */}
                                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">{roleColor.icon}</span>
                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{ROLE_LABELS[role] || role}</span>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${roleColor.bg} ${roleColor.text} dark:opacity-80`}>
                                        {filteredPartners.length}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {someSelected && !allSelected && (
                                        <button 
                                          onClick={() => selectAllPartnersInRole(role)}
                                          className="text-[9px] font-black text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white uppercase tracking-widest">
                                          All
                                        </button>
                                      )}
                                      {someSelected && (
                                        <button 
                                          onClick={() => deselectAllPartnersInRole(role)}
                                          className="text-[9px] font-black text-red-400 hover:text-red-500 uppercase tracking-widest">
                                          None
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Partners in role */}
                                  <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {filteredPartners.map(partner => {
                                      const selected = selectedPartnerIds.includes(partner.id);
                                      const statusColor = partner.status === 'ACTIVE'
                                        ? { bg: 'bg-emerald-50', text: 'text-emerald-700' }
                                        : { bg: 'bg-slate-100', text: 'text-slate-600' };

                                      return (
                                        <button key={partner.id}
                                          onClick={() => togglePartner(partner.id)}
                                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
                                          {/* Checkbox */}
                                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'bg-slate-800 dark:bg-blue-600 border-slate-800 dark:border-blue-600' : 'border-slate-300 dark:border-slate-700'}`}
                                            style={{ borderColor: selected ? (activeTab === 'compose' ? '#1e293b' : '#3b82f6') : undefined }}>
                                            {selected && <CheckCircle size={10} className="text-white" />}
                                          </div>
                                          {/* Info */}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{partner.name}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{partner.email}</p>
                                            {partner.companyName && (
                                              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{partner.companyName}</p>
                                            )}
                                          </div>
                                          {/* Status badge */}
                                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor.bg} dark:bg-opacity-20 ${statusColor.text} dark:opacity-80`}>
                                            {partner.status}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Footer */}
                          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              {selectedPartnerIds.length} selected · {getAllPartners().length} total
                            </p>
                            <button onClick={() => setPartnerPickerOpen(false)}
                              className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest hover:underline">
                              Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Clear all button */}
                    {(selectedPartnerIds.length > 0 || selectedRoles.length > 0) && (
                      <button onClick={() => { setSelectedPartnerIds([]); setSelectedRoles([]); }}
                        className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest">
                        Clear All Selections
                      </button>
                    )}
                    
                    {selectedPartnerIds.length === 0 && selectedRoles.length === 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium text-center">⚠️ Please select partners by role or individually to send messages</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Composer */}
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-5">3. Compose Message</p>

                <div className="space-y-4">
                  {/* Subject */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Subject / Title</label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                      placeholder="E.g. Important Update for Partners"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-white outline-none focus:border-slate-400 dark:focus:border-slate-600 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" />
                  </div>

                  {/* Plain message (SMS / WhatsApp / In-App) */}
                  {needsMessage && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                        Message Content
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 normal-case text-[9px] font-bold">
                          {selectedChannels.includes('email') ? 'Email Plain-Text & Fallback' : 'SMS · WhatsApp · In-App'}
                        </span>
                      </label>
                      <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)}
                        placeholder="Keep under 160 characters for SMS. Plain text — no HTML."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-white outline-none resize-none focus:border-slate-400 dark:focus:border-slate-600 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-900 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" />
                      <div className="flex justify-between mt-1">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Recommended: ≤ 160 chars for SMS</p>
                        <p className={`text-[10px] font-bold tabular-nums ${message.length > 160 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}`}>{message.length} chars</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Send bar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Sending via</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedChannels.length === 0
                      ? <span className="text-xs text-red-400 font-medium">No channels selected</span>
                      : selectedChannels.map(ch => <ChannelPill key={ch} ch={ch} />)
                    }
                  </div>
                  <p className={`text-[10px] mt-2 font-medium ${getSelectedPartnersCount() === 0 ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    Recipients: {getSelectedPartnersCount()} partners {getSelectedPartnersCount() === 0 ? '⚠️' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">

                  <button 
                    onClick={handleSend} 
                    disabled={loading || !canSend}
                    title={!canSend && getSelectedPartnersCount() === 0 ? 'Please select partners to send messages to' : ''}
                    className="flex items-center gap-2 px-7 py-2.5 text-white rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
                    style={{ background: '#1e293b', boxShadow: '0 6px 20px rgba(30,41,59,0.35)' }}>
                    {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {loading ? 'Sending…' : getSelectedPartnersCount() === 0 ? 'Select Partners First' : 'Send to Partners'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* ════════════════════ HISTORY ════════════════════ */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white">Communication History</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{logs.length} campaign{logs.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={fetchLogs} disabled={logsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-all">
              <RefreshCw size={13} className={logsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {logs.length === 0 && !logsLoading ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
                <Clock className="text-slate-300 dark:text-slate-600" size={32} />
              </div>
              <p className="font-bold text-slate-500 dark:text-slate-400">No communications yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Start communicating with your partners using the compose tab.</p>
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
              className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 transition-colors duration-200"
              emptyMessage="No communications yet"
              ariaLabel="Communication history"
            />
          )}
        </div>
      )}


    </div>
  );
};

export default TenantCommunication;