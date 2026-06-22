import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Gavel, Search, Plus, Eye, Clock, CheckCircle, AlertTriangle,
  XCircle, Flag, ChevronDown, RefreshCw, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { disputesAPI } from '../../../services/api';
import {
  type Dispute,
  STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS,
  getStatusColor, getPriorityColor, getUserDisplayName, formatRelativeTime,
} from '../../../types/dispute';
import CreateDisputeModal from '../../admin/dispute/CreateDisputeModal';
import UserDisputeDetailModal from './UserDisputeDetailModal';

const DisputesPage: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-disputes', statusFilter, search],
    queryFn: () => disputesAPI.getAll({
      status: statusFilter || undefined,
      search: search || undefined,
      limit: 50,
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const disputes: Dispute[] = data?.data ?? [];

  const statusOptions = [
    { value: '',               label: 'All Statuses' },
    { value: 'OPEN',           label: 'Open' },
    { value: 'UNDER_REVIEW',   label: 'Under Review' },
    { value: 'ESCALATED',      label: 'Escalated' },
    { value: 'RESOLVED',       label: 'Resolved' },
    { value: 'CLOSED',         label: 'Closed' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Disputes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Raise and track disputes related to your shipments and contracts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#2c5173] text-white rounded-xl text-sm font-bold hover:bg-[#1e3a54] flex items-center gap-2">
            <Plus className="w-4 h-4" /> Raise Dispute
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search disputes…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-transparent" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatus(e.target.value)}
              className="pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-[#2c5173]">
              {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#2c5173] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gavel className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-gray-700 mb-1">No disputes yet</h3>
          <p className="text-sm text-gray-400 mb-4">Raise a dispute when you encounter issues with shipments or contracts.</p>
          <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-[#2c5173] text-white rounded-xl text-sm font-bold hover:bg-[#1e3a54]">
            Raise First Dispute
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => (
            <div key={d.id} onClick={() => setSelectedId(d.id)}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-[#2c5173]/30 hover:shadow-sm cursor-pointer transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Gavel className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono font-bold text-[#2c5173]">{d.referenceNumber}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getStatusColor(d.status)}`}>{STATUS_LABELS[d.status]}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getPriorityColor(d.priority)}`}>{PRIORITY_LABELS[d.priority]}</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg border border-gray-200">{CATEGORY_LABELS[d.category]}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 truncate">{d.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{d.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="w-3 h-3" /> {formatRelativeTime(d.createdAt)}
                  </div>
                  {d.trip && <span className="text-[10px] text-gray-400">{d.trip.tripNumber}</span>}
                  <Eye className="w-4 h-4 text-gray-300 group-hover:text-[#2c5173] transition-colors mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedId && (
        <UserDisputeDetailModal
          disputeId={selectedId}
          onClose={() => { setSelectedId(null); qc.invalidateQueries({ queryKey: ['my-disputes'] }); }}
        />
      )}
      {showCreate && (
        <CreateDisputeModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['my-disputes'] }); }}
        />
      )}
    </div>
  );
};

export default DisputesPage;
