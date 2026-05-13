import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsAPI } from '../../services/api';
import { AlertCircle, Clock, AlertTriangle, Inbox, DollarSign } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

const urgencyOf = (dueDate?: string) => {
  if (!dueDate) return 'pending';
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'overdue';
  if (diff <= 7) return 'due-soon';
  return 'pending';
};

const FleetPendingPaymentsPage = () => {
  const [search, setSearch] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['fleet-pending-payments-v2'],
    queryFn: () => paymentsAPI.getTruckOwnerPendingPayments(),
    refetchInterval: 30000,
  });

  const payments: any[] = data?.data?.data?.payments || [];
  const summary = data?.data?.data?.summary || {};

  const enriched = useMemo(() =>
    payments.map((p: any) => ({ ...p, urgency: urgencyOf(p.dueDate) })),
    [payments]
  );

  const filtered = useMemo(() => {
    let list = enriched;
    if (urgencyFilter !== 'ALL') list = list.filter((p: any) => p.urgency === urgencyFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p: any) =>
        (p.referenceNumber || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.trip?.tripNumber || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [enriched, urgencyFilter, search]);

  const overdueList  = enriched.filter((p: any) => p.urgency === 'overdue');
  const dueSoonList  = enriched.filter((p: any) => p.urgency === 'due-soon');
  const pendingList  = enriched.filter((p: any) => p.urgency === 'pending');

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]" />
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <AlertCircle className="w-10 h-10" />
      <p className="text-sm font-bold">Failed to load pending payments</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-slate-600" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Due</span>
          </div>
          <p className="text-xl font-black text-slate-900">{fmt(summary.totalAmount || 0)}</p>
          <p className="text-xs text-slate-500 mt-1">{summary.totalPayments || 0} payments</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Overdue</span>
          </div>
          <p className="text-xl font-black text-rose-700">{fmt(summary.overdueAmount || 0)}</p>
          <p className="text-xs text-rose-600 mt-1">{summary.overdueCount || 0} overdue</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Due Soon</span>
          </div>
          <p className="text-xl font-black text-amber-700">{fmt(summary.dueSoonAmount || 0)}</p>
          <p className="text-xs text-amber-600 mt-1">{summary.dueSoonCount || 0} within 7 days</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-[#345E85]" />
            <span className="text-[10px] font-black text-[#345E85] uppercase tracking-widest">Upcoming</span>
          </div>
          <p className="text-xl font-black text-[#345E85]">{pendingList.length}</p>
          <p className="text-xs text-[#345E85] mt-1">scheduled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by reference, trip, description..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#345E85]/30"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none"
          value={urgencyFilter}
          onChange={e => setUrgencyFilter(e.target.value)}
        >
          <option value="ALL">All ({enriched.length})</option>
          <option value="overdue">Overdue ({overdueList.length})</option>
          <option value="due-soon">Due Soon ({dueSoonList.length})</option>
          <option value="pending">Upcoming ({pendingList.length})</option>
        </select>
      </div>

      {/* Payment list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            <Inbox className="w-10 h-10 text-slate-200" />
            <p className="text-sm font-bold">No pending payments</p>
          </div>
        ) : filtered.map((p: any) => {
          const urgencyConfig: Record<string, { bg: string; badge: string; label: string }> = {
            overdue:  { bg: 'border-rose-200 bg-rose-50/50',   badge: 'bg-rose-500 text-white',   label: 'OVERDUE' },
            'due-soon': { bg: 'border-amber-200 bg-amber-50/50', badge: 'bg-amber-500 text-white', label: 'DUE SOON' },
            pending:  { bg: 'border-slate-200 bg-white',        badge: 'bg-slate-200 text-slate-600', label: 'UPCOMING' },
          };
          const cfg = urgencyConfig[p.urgency] || urgencyConfig.pending;
          return (
            <div key={p.id} className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cfg.bg}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                  <span className="text-xs font-mono text-slate-400">{p.referenceNumber || `PAY-${p.id.slice(0,8)}`}</span>
                </div>
                <p className="text-sm font-bold text-slate-800 truncate">{p.description || `Payment for trip`}</p>
                {p.trip && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Trip: <span className="font-bold">{p.trip.tripNumber}</span>
                    {p.trip.load && ` — ${p.trip.load.title}`}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xl font-black text-slate-900">{fmt(p.amount)}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Due: {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FleetPendingPaymentsPage;
