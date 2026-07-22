import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Headphones, AlertTriangle, Search, Download, Eye, Clock,
  CheckCircle, XCircle, Flag, RefreshCw, Plus, BarChart3,
  ChevronDown, Users, Timer, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { disputesAPI } from '../../services/api';
import {
  type Dispute,
  STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS,
  getStatusColor, getPriorityColor, getPriorityDot,
  getUserDisplayName, formatRelativeTime, getSlaStatus,
} from '../../types/dispute';
import SupportTicketDetailModal from './SupportTicketDetailModal';
import CreateTicketModal from './CreateTicketModal';
import SupportAnalyticsDashboard from './SupportAnalyticsDashboard';
import { TranslatedText } from '../../components/translated-text';

// ── Status tab config ─────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: '',                    label: 'All Reports',      icon: Activity },
  { key: 'OPEN',                label: 'Open',             icon: Flag },
  { key: 'UNDER_REVIEW',        label: 'In Progress',      icon: Eye },
  { key: 'ASSIGNED',            label: 'Assigned',         icon: Users },
  { key: 'AWAITING_INFORMATION',label: 'Waiting for User', icon: Clock },
  { key: 'ESCALATED',           label: 'Escalated',        icon: AlertTriangle },
  { key: 'RESOLVED',            label: 'Resolved',         icon: CheckCircle },
  { key: 'CLOSED',              label: 'Closed',           icon: XCircle },
];

// ── SLA badge ─────────────────────────────────────────────────────────────────
const SlaBadge: React.FC<{ dispute: Dispute }> = ({ dispute }) => {
  const status = getSlaStatus(dispute);
  if (status === 'ok') return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black border ${
      status === 'breached' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'
    }`}>
      <Timer className="w-2.5 h-2.5" />
      {status === 'breached' ? 'SLA BREACH' : 'SLA WARN'}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const TenantSupportCenter: React.FC = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab]     = useState('');
  const [search, setSearch]           = useState('');
  const [categoryFilter, setCategory] = useState('');
  const [priorityFilter, setPriority] = useState('');
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { data: listData, isLoading, refetch } = useQuery({
    queryKey: ['support-admin', activeTab, categoryFilter, priorityFilter, search],
    queryFn: () => disputesAPI.getAll({
      status: activeTab || undefined,
      category: categoryFilter || undefined,
      priority: priorityFilter || undefined,
      search: search || undefined,
      limit: 100,
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const disputes: Dispute[] = listData?.data ?? [];

  const handleExport = useCallback(() => {
    const headers = ['Ticket#', 'Title', 'Category', 'Priority', 'Status', 'Reporter', 'Assigned To', 'SLA', 'Created'];
    const rows = disputes.map(d => [
      d.ticketNumber ?? d.referenceNumber,
      d.title,
      CATEGORY_LABELS[d.category],
      PRIORITY_LABELS[d.priority],
      STATUS_LABELS[d.status],
      getUserDisplayName(d.complainant),
      getUserDisplayName(d.assignedTo),
      getSlaStatus(d),
      new Date(d.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `support-tickets-${Date.now()}.csv`,
    });
    a.click();
  }, [disputes]);

  const checkSlaMut = useMutation({
    mutationFn: () => disputesAPI.checkSla(),
    onSuccess: (r: any) => {
      toast.success(r.data?.message ?? 'SLA check complete');
      qc.invalidateQueries({ queryKey: ['support-admin'] });
    },
  });

  if (showAnalytics) {
    return <SupportAnalyticsDashboard onBack={() => setShowAnalytics(false)} />;
  }

  return (
    <div className="p-4 md:p-6 space-y-5 safe-bottom">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-8 h-8 bg-[#2c5173]/10 rounded-xl flex items-center justify-center">
              <Headphones className="w-4 h-4 text-[#2c5173]" />
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">
              <TranslatedText text="Support Center" />
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 ml-10">
            <TranslatedText text="Manage and resolve all tenant support requests" />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAnalytics(true)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </button>
          <button onClick={() => checkSlaMut.mutate()} disabled={checkSlaMut.isPending} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5" /> Check SLA
          </button>
          <button onClick={() => refetch()} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={handleExport} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => setShowCreate(true)} className="px-3 py-2 bg-[#2c5173] text-white rounded-xl text-xs font-bold hover:bg-[#1e3a54] flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Ticket
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-x-auto">
        <div className="flex gap-1 p-2 min-w-max">
          {STATUS_TABS.map(tab => {
            const Icon = tab.icon;
            const count = tab.key === '' ? disputes.length : disputes.filter(d => d.status === tab.key).length;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-[#2c5173] text-white shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input type="text" placeholder="Search by ticket#, title, reporter..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-[#2c5173] dark:text-slate-200" />
          </div>
          {[
            { label: 'All Categories', value: categoryFilter, setter: setCategory, options: Object.entries(CATEGORY_LABELS) },
            { label: 'All Priorities', value: priorityFilter, setter: setPriority, options: Object.entries(PRIORITY_LABELS) },
          ].map(({ label, value, setter, options }) => (
            <div key={label} className="relative">
              <select value={value} onChange={e => setter(e.target.value)}
                className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-[#2c5173] dark:text-slate-200">
                <option value="">{label}</option>
                {options.map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
            </div>
          ))}
          <span className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-[#2c5173] dark:text-slate-300 rounded-xl text-xs font-bold self-center">{disputes.length} tickets</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#2c5173] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-400">Loading tickets...</p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Headphones className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-500 mb-1">No support tickets found</p>
            <p className="text-xs text-gray-400">Try adjusting your filters or create a new ticket.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700 border-b border-gray-100 dark:border-slate-600">
                <tr>
                  {['Ticket', 'Title', 'Category', 'Priority', 'Status', 'Reporter', 'Assigned', 'SLA', 'Created', ''].map(h => (
                    <th key={h} className={`px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {disputes.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-[#2c5173] dark:text-blue-400">{d.ticketNumber ?? d.referenceNumber}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{d.title}</p>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-gray-500 dark:text-slate-400 whitespace-nowrap">{CATEGORY_LABELS[d.category]}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border ${getPriorityColor(d.priority)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(d.priority)}`} />
                        {PRIORITY_LABELS[d.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black border ${getStatusColor(d.status)}`}>{STATUS_LABELS[d.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-300 whitespace-nowrap">{getUserDisplayName(d.complainant)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      {d.assignedTo ? getUserDisplayName(d.assignedTo) : <span className="text-gray-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3"><SlaBadge dispute={d} /></td>
                    <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">{formatRelativeTime(d.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelectedId(d.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing <span className="text-gray-700 dark:text-slate-300">{disputes.length}</span> tickets
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedId && (
        <SupportTicketDetailModal
          disputeId={selectedId}
          isAdmin
          onClose={() => { setSelectedId(null); qc.invalidateQueries({ queryKey: ['support-admin'] }); }}
        />
      )}
      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['support-admin'] }); }}
        />
      )}
    </div>
  );
};

export default TenantSupportCenter;
