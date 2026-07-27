import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  Headphones, Search, Plus, Eye, Clock, CheckCircle,
  AlertTriangle, XCircle, Flag, ChevronDown, RefreshCw, Timer,
  MessageSquare, FileText, Zap,
} from 'lucide-react';
import { disputesAPI } from '../../services/api';
import {
  type Dispute,
  STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS,
  getStatusColor, getPriorityColor, getPriorityDot, getSlaStatus,
  getUserDisplayName, formatRelativeTime,
  asDisputeList,
} from '../../types/dispute';
import CreateTicketModal from './CreateTicketModal';
import SupportTicketDetailModal from './SupportTicketDetailModal';
import { TranslatedText } from '../../components/translated-text';

// Status icon mapping
const statusIcons: Record<string, React.ReactNode> = {
  OPEN:                 <Flag className="w-4 h-4" />,
  UNDER_REVIEW:         <Eye className="w-4 h-4" />,
  ASSIGNED:             <Eye className="w-4 h-4" />,
  INVESTIGATING:        <Eye className="w-4 h-4" />,
  AWAITING_INFORMATION: <Clock className="w-4 h-4" />,
  ESCALATED:            <AlertTriangle className="w-4 h-4" />,
  RESOLVED:             <CheckCircle className="w-4 h-4" />,
  REJECTED:             <XCircle className="w-4 h-4" />,
  CLOSED:               <XCircle className="w-4 h-4" />,
  REOPENED:             <Flag className="w-4 h-4" />,
};

const UserSupportPage: React.FC = () => {
  const qc = useQueryClient();
  const location = useLocation();
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Auto-open create modal when navigating to /support/new
  const [showCreate, setShowCreate] = useState(location.pathname.endsWith('/new'));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-disputes', statusFilter, search],
    queryFn: () => disputesAPI.getAll({
      status: statusFilter || undefined,
      search: search || undefined,
      limit: 50,
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const disputes: Dispute[] = asDisputeList(data);
  const openCount     = disputes.filter(d => ['OPEN','REOPENED'].includes(d.status)).length;
  const pendingCount  = disputes.filter(d => ['UNDER_REVIEW','ASSIGNED','INVESTIGATING','AWAITING_INFORMATION'].includes(d.status)).length;
  const resolvedCount = disputes.filter(d => ['RESOLVED','CLOSED'].includes(d.status)).length;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2c5173]/10 rounded-2xl flex items-center justify-center">
            <Headphones className="w-5 h-5 text-[#2c5173]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">
              <TranslatedText text="Support" />
            </h1>
            <p className="text-xs text-gray-400">
              <TranslatedText text="Report issues and track your requests" />
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#2c5173] text-white rounded-xl text-xs font-bold hover:bg-[#1e3a54] flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Report Issue
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open',       value: openCount,     color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20', icon: <Flag className="w-4 h-4" /> },
          { label: 'In Progress', value: pendingCount, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20', icon: <Clock className="w-4 h-4" /> },
          { label: 'Resolved',   value: resolvedCount, color: 'bg-green-50 text-green-600 dark:bg-green-900/20', icon: <CheckCircle className="w-4 h-4" /> },
        ].map(c => (
          <div key={c.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.color}`}>{c.icon}</div>
            <div>
              <p className="text-xl font-black text-gray-900 dark:text-white">{c.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input type="text" placeholder="Search tickets…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-[#2c5173] dark:text-slate-200" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatus(e.target.value)}
              className="pl-3 pr-8 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-[#2c5173] dark:text-slate-200">
              <option value="">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tickets list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#2c5173] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 bg-[#2c5173]/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Headphones className="w-8 h-8 text-[#2c5173]/30" />
          </div>
          <h3 className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">No tickets yet</h3>
          <p className="text-xs text-gray-400 mb-4">When you experience an issue, report it here. We'll respond as quickly as possible.</p>
          <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-[#2c5173] text-white rounded-xl text-xs font-bold hover:bg-[#1e3a54]">
            Report Your First Issue
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {disputes.map(d => {
            const sla = getSlaStatus(d);
            return (
              <div key={d.id} onClick={() => setSelectedId(d.id)}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 hover:border-[#2c5173]/30 hover:shadow-sm cursor-pointer transition-all group">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${getStatusColor(d.status).split(' ').slice(0,2).join(' ')}`}>
                    {statusIcons[d.status] ?? <Headphones className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-[11px] font-mono font-bold text-[#2c5173] dark:text-blue-400">{d.ticketNumber ?? d.referenceNumber}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getStatusColor(d.status)}`}>{STATUS_LABELS[d.status]}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black border ${getPriorityColor(d.priority)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${getPriorityDot(d.priority)}`} />
                        {PRIORITY_LABELS[d.priority]}
                      </span>
                      {sla !== 'ok' && (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black border ${sla === 'breached' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                          <Timer className="w-2.5 h-2.5" /> {sla === 'breached' ? 'SLA BREACH' : 'SLA WARN'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{d.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">{d.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-lg">{CATEGORY_LABELS[d.category]}</span>
                      {d.assignedTo && <span className="text-[10px] text-gray-400 flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" /> Assigned to {getUserDisplayName(d.assignedTo)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock className="w-3 h-3" /> {formatRelativeTime(d.createdAt)}
                    </div>
                    <Eye className="w-4 h-4 text-gray-300 group-hover:text-[#2c5173] transition-colors mt-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedId && (
        <SupportTicketDetailModal
          disputeId={selectedId}
          isAdmin={false}
          onClose={() => { setSelectedId(null); qc.invalidateQueries({ queryKey: ['my-disputes'] }); }}
        />
      )}
      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['my-disputes'] }); }}
        />
      )}
    </div>
  );
};

export default UserSupportPage;
