import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Send, Users, RefreshCw, Mail, MessageSquare, 
  Smartphone, Bell, ChevronDown, ChevronUp, CheckCircle, 
  XCircle, Search, X, User, Clock, BarChart2,
  Zap, Eye
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
  recipientsCount: number;
  sentCount: number;
  failedCount: number;
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
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.border} border`} style={{ color: c.color }}>
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
  const [htmlBody, setHtmlBody] = useState('');
  const [showHtml, setShowHtml] = useState(false);

  // Partner selection
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [showPartnerFilters, setShowPartnerFilters] = useState(true);
  const [partnerPickerOpen, setPartnerPickerOpen] = useState(false);

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: '', html: '' });

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
    } catch { /* silent */ } finally { setLogsLoading(false); }
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

  const needsHtml = selectedChannels.includes('email');
  const needsMessage = selectedChannels.some(c => ['sms', 'whatsapp', 'in_app'].includes(c));

  const canSend = (() => {
    if (!selectedChannels.length) return false;
    if (!subject) return false;
    if (needsHtml && !htmlBody && !message) return false;
    if (needsMessage && !message) return false;
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
        htmlBody: htmlBody || `<p>${message}</p>`,
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

  const handlePreview = () => {
    if (!subject) return;
    setPreviewContent({ subject, html: htmlBody || `<p>${message}</p>` });
    setPreviewOpen(true);
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

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-100 rounded-xl">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Partner Communication</h1>
                <p className="text-slate-500 text-sm font-medium">Communicate with your partners across multiple channels</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {CHANNELS.map(ch => {
              const Icon = ch.icon;
              return (
                <div key={ch.id} className="flex flex-col items-center gap-1 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <Icon className="w-4 h-4 text-slate-600" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{ch.label}</span>
                </div>
              );
            })}
          </div>
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
              {label}
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">1. Channels</p>
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
                  <p className="text-xs text-red-400 font-medium text-center mt-3">Select at least one channel</p>
                )}
              </div>

              {/* Partner Selection */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button className="w-full flex items-center justify-between px-5 py-4" onClick={() => setShowPartnerFilters(v => !v)}>
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Select Partners</span>
                    {getSelectedPartnersCount() > 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white bg-slate-800">
                        {getSelectedPartnersCount()}
                      </span>
                    )}
                  </div>
                  {showPartnerFilters ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                </button>

                {showPartnerFilters && (
                  <div className="px-5 pb-5 space-y-5 border-t border-slate-100">
                    <div className="pt-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select by Role</p>
                      <div className="space-y-2">
                        {Object.entries(partners).map(([role, rolePartners]) => {
                          const roleColor = ROLE_COLORS[role] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: '👤' };
                          const isRoleSelected = selectedRoles.includes(role);
                          const selectedInRole = rolePartners.filter(p => selectedPartnerIds.includes(p.id)).length;
                          
                          return (
                            <div key={role} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                              <label className="flex items-center gap-3 cursor-pointer flex-1">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded accent-slate-800"
                                  checked={isRoleSelected}
                                  onChange={() => toggleRole(role)}
                                />
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{roleColor.icon}</span>
                                  <span className="text-sm font-bold text-slate-800">{ROLE_LABELS[role] || role}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${roleColor.bg} ${roleColor.text}`}>
                                    {rolePartners.length}
                                  </span>
                                </div>
                              </label>
                              {selectedInRole > 0 && (
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
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
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specific Partners</p>
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
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all">
                        <span className="flex items-center gap-2">
                          <User size={13} className="text-slate-400" />
                          {selectedPartnerIds.length === 0
                            ? 'Select individual partners…'
                            : `${selectedPartnerIds.length} partners selected`}
                        </span>
                        {partnerPickerOpen ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                      </button>
                      {/* Partner dropdown list */}
                      {partnerPickerOpen && (
                        <div className="mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                          {/* Search input */}
                          <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                            <Search size={13} className="text-slate-400 flex-shrink-0" />
                            <input
                              autoFocus
                              type="text"
                              value={partnerSearch}
                              onChange={e => setPartnerSearch(e.target.value)}
                              placeholder="Search partners…"
                              className="flex-1 text-xs font-medium text-slate-700 outline-none bg-transparent placeholder-slate-400"
                            />
                            {partnerSearch && (
                              <button onClick={() => setPartnerSearch('')} className="text-slate-400 hover:text-slate-600">
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
                                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">{roleColor.icon}</span>
                                      <span className="text-xs font-bold text-slate-700">{ROLE_LABELS[role] || role}</span>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${roleColor.bg} ${roleColor.text}`}>
                                        {filteredPartners.length}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      {someSelected && !allSelected && (
                                        <button 
                                          onClick={() => selectAllPartnersInRole(role)}
                                          className="text-[9px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest">
                                          All
                                        </button>
                                      )}
                                      {someSelected && (
                                        <button 
                                          onClick={() => deselectAllPartnersInRole(role)}
                                          className="text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest">
                                          None
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Partners in role */}
                                  <div className="divide-y divide-slate-50">
                                    {filteredPartners.map(partner => {
                                      const selected = selectedPartnerIds.includes(partner.id);
                                      const statusColor = partner.status === 'ACTIVE'
                                        ? { bg: 'bg-emerald-50', text: 'text-emerald-700' }
                                        : { bg: 'bg-slate-100', text: 'text-slate-600' };

                                      return (
                                        <button key={partner.id}
                                          onClick={() => togglePartner(partner.id)}
                                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left">
                                          {/* Checkbox */}
                                          <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                                            style={{ borderColor: selected ? '#1e293b' : '#cbd5e1', background: selected ? '#1e293b' : 'transparent' }}>
                                            {selected && <CheckCircle size={10} className="text-white" />}
                                          </div>
                                          {/* Info */}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 truncate">{partner.name}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{partner.email}</p>
                                            {partner.companyName && (
                                              <p className="text-[10px] text-slate-400 truncate">{partner.companyName}</p>
                                            )}
                                          </div>
                                          {/* Status badge */}
                                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor.bg} ${statusColor.text}`}>
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
                          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <p className="text-[10px] text-slate-400 font-medium">
                              {selectedPartnerIds.length} selected · {getAllPartners().length} total
                            </p>
                            <button onClick={() => setPartnerPickerOpen(false)}
                              className="text-[10px] font-black text-slate-800 uppercase tracking-widest hover:underline">
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
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-xs text-red-600 font-medium text-center">⚠️ Please select partners by role or individually to send messages</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Composer */}
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">3. Compose Message</p>

                <div className="space-y-4">
                  {/* Subject */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject / Title</label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                      placeholder="E.g. Important Update for Partners"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" />
                  </div>

                  {/* Plain message (SMS / WhatsApp / In-App) */}
                  {needsMessage && (
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Message
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 normal-case text-[9px] font-bold">SMS · WhatsApp · In-App</span>
                      </label>
                      <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)}
                        placeholder="Keep under 160 characters for SMS. Plain text — no HTML."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none resize-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" />
                      <div className="flex justify-between mt-1">
                        <p className="text-[10px] text-slate-400 font-medium">Recommended: ≤ 160 chars for SMS</p>
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
                        Email HTML Body (optional — uses message text if blank)
                        {showHtml ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                      {showHtml && (
                        <>
                          <textarea rows={9} value={htmlBody} onChange={e => setHtmlBody(e.target.value)}
                            placeholder="<p>Dear Partner,</p><p>Write your rich HTML message here…</p>"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-700 outline-none resize-y focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Send bar */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sending via</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedChannels.length === 0
                      ? <span className="text-xs text-red-400 font-medium">No channels selected</span>
                      : selectedChannels.map(ch => <ChannelPill key={ch} ch={ch} />)
                    }
                  </div>
                  <p className={`text-[10px] mt-2 font-medium ${getSelectedPartnersCount() === 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    Recipients: {getSelectedPartnersCount()} partners {getSelectedPartnersCount() === 0 ? '⚠️' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {needsHtml && (
                    <button onClick={handlePreview} disabled={!canSend}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                      <Eye size={14} /> Preview
                    </button>
                  )}
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800">Communication History</h3>
              <p className="text-xs text-slate-400 mt-0.5">{logs.length} campaign{logs.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={fetchLogs} disabled={logsLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-all">
              <RefreshCw size={13} className={logsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto mb-4">
                <Clock className="text-slate-300" size={32} />
              </div>
              <p className="font-bold text-slate-500">No communications yet</p>
              <p className="text-xs text-slate-400 mt-1">Start communicating with your partners using the compose tab.</p>
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

      {/* ── Preview Modal ── */}
      {previewOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-base font-black text-slate-800">Email Preview</h2>
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
    </div>
  );
};

export default TenantCommunication;