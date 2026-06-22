import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gavel, AlertTriangle, Search, Download, Eye, Clock,
  CheckCircle, XCircle, Flag, RefreshCw, Plus, Filter,
  BarChart3, MessageSquare, Paperclip, Scale, TrendingUp,
  ChevronDown, X, FileText, User, Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';
import { disputesAPI } from '../../services/api';
import ModernLoader from '../../components/common/ModernLoader';
import {
  type Dispute, type DisputeStatus, type DisputeCategory, type DisputePriority,
  type DisputeAnalytics,
  STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS,
  getStatusColor, getPriorityColor, getUserDisplayName, formatRelativeTime,
} from '../../types/dispute';
import DisputeDetailModal from './dispute/DisputeDetailModal';
import CreateDisputeModal from './dispute/CreateDisputeModal';

// ── Stat card ──────────────────────────────────────────────────────────────────
const Stat: React.FC<{ label: string; value: number | string; icon: React.ReactNode; color?: string }> = ({
  label, value, icon, color = 'bg-slate-50 text-slate-700',
}) => (
  <div className={`flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const DisputeResolutionCenter: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('');
  const [categoryFilter, setCategory] = useState('');
  const [priorityFilter, setPriority] = useState('');
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [period, setPeriod]           = useState('month');

  const { data: listData, isLoading, refetch } = useQuery({
    queryKey: ['disputes-admin', statusFilter, categoryFilter, priorityFilter, search],
    queryFn: () => disputesAPI.getAll({
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
      priority: priorityFilter || undefined,
      search: search || undefined,
      limit: 100,
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['disputes-analytics', period],
    queryFn: () => disputesAPI.getAnalytics(period).then(r => r.data),
    staleTime: 60_000,
  });

  const disputes: Dispute[] = listData?.data ?? [];
  const analytics: DisputeAnalytics | null = analyticsData?.data ?? null;

  const handleExport = useCallback(() => {
    const headers = ['Ref', 'Title', 'Category', 'Priority', 'Status', 'Complainant', 'Created'];
    const rows = disputes.map(d => [
      d.referenceNumber, d.title, CATEGORY_LABELS[d.category], PRIORITY_LABELS[d.priority],
      STATUS_LABELS[d.status], getUserDisplayName(d.complainant),
      new Date(d.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `disputes-${Date.now()}.csv`,
    });
    a.click();
  }, [disputes]);

  if (isLoading) {
    return (
      <AdminPageLayout title="Dispute Resolution Center" description="Manage and resolve platform disputes">
        <ModernLoader isLoading type="table" />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={<TranslatedText text="Dispute Resolution Center" />}
      description={<TranslatedText text="Investigate, communicate, and resolve platform disputes" />}
      actions={
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleExport} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#2c5173] text-white rounded-xl text-sm font-bold hover:bg-[#1e3a54] flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Dispute
          </button>
        </div>
      }
    >
      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <Stat label="Total"       value={analytics.total}        icon={<Gavel size={16} />}         color="bg-slate-100 text-slate-700" />
          <Stat label="Open"        value={analytics.open}         icon={<Flag size={16} />}          color="bg-blue-100 text-blue-700" />
          <Stat label="Under Review" value={analytics.underReview} icon={<Eye size={16} />}           color="bg-amber-100 text-amber-700" />
          <Stat label="Escalated"   value={analytics.escalated}    icon={<AlertTriangle size={16} />} color="bg-orange-100 text-orange-700" />
          <Stat label="Resolved"    value={analytics.resolved}     icon={<CheckCircle size={16} />}   color="bg-green-100 text-green-700" />
          <Stat label="Rejected"    value={analytics.rejected}     icon={<XCircle size={16} />}       color="bg-red-100 text-red-700" />
          <Stat label="Closed"      value={analytics.closed}       icon={<Scale size={16} />}         color="bg-gray-100 text-gray-700" />
          <Stat label="Avg Res. (h)" value={analytics.avgResolutionTimeHours} icon={<Clock size={16} />} color="bg-purple-100 text-purple-700" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search by reference, title..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-transparent" />
          </div>
          {[
            { label: 'All Status', value: statusFilter, setter: setStatus, options: Object.entries(STATUS_LABELS) },
            { label: 'All Categories', value: categoryFilter, setter: setCategory, options: Object.entries(CATEGORY_LABELS) },
            { label: 'All Priorities', value: priorityFilter, setter: setPriority, options: Object.entries(PRIORITY_LABELS) },
          ].map(({ label, value, setter, options }) => (
            <div key={label} className="relative">
              <select value={value} onChange={e => setter(e.target.value)}
                className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-[#2c5173]">
                <option value="">{label}</option>
                {options.map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          ))}
          <span className="px-3 py-2 bg-slate-100 text-[#2c5173] rounded-xl text-sm font-semibold self-center">{disputes.length} disputes</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Reference', 'Title', 'Category', 'Priority', 'Status', 'Complainant', 'Created', 'Actions'].map(h => (
                  <th key={h} className={`px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {disputes.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-16 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Gavel className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">No disputes found</p>
                </td></tr>
              ) : disputes.map(d => (
                <tr key={d.id} className="hover:bg-gray-50/60 transition-colors group">
                  <td className="px-5 py-4 font-mono text-xs text-[#2c5173] font-bold whitespace-nowrap">{d.referenceNumber}</td>
                  <td className="px-5 py-4 max-w-[180px]">
                    <p className="text-sm font-bold text-gray-900 truncate">{d.title}</p>
                    {d.trip && <p className="text-[10px] text-gray-400 mt-0.5">{d.trip.tripNumber}</p>}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-600 whitespace-nowrap">{CATEGORY_LABELS[d.category]}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(d.priority)}`}>{PRIORITY_LABELS[d.priority]}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(d.status)}`}>{STATUS_LABELS[d.status]}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-700 whitespace-nowrap">{getUserDisplayName(d.complainant)}</td>
                  <td className="px-5 py-4 text-[10px] text-gray-400 whitespace-nowrap">
                    <div>{formatRelativeTime(d.createdAt)}</div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => setSelectedId(d.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 ml-auto opacity-0 group-hover:opacity-100 transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {disputes.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-gray-900">{disputes.length}</span> disputes
            </p>
          </div>
        )}
      </div>

      {selectedId && (
        <DisputeDetailModal disputeId={selectedId} onClose={() => { setSelectedId(null); qc.invalidateQueries({ queryKey: ['disputes-admin'] }); }} />
      )}
      {showCreate && (
        <CreateDisputeModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['disputes-admin'] }); }} />
      )}
    </AdminPageLayout>
  );
};

export default DisputeResolutionCenter;
