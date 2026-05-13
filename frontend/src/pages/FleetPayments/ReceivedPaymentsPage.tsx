import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsAPI } from '../../services/api';
import { TrendingUp, Clock, CheckCircle, AlertCircle, Inbox } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

const statusStyle: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  completed:  'bg-emerald-100 text-emerald-700',
  escrow:     'bg-purple-100 text-purple-700',
  failed:     'bg-rose-100 text-rose-700',
  cancelled:  'bg-slate-100 text-slate-600',
};

const ReceivedPaymentsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['truck-owner-received-payments'],
    queryFn: () => paymentsAPI.getTruckOwnerReceivedPayments(),
    refetchInterval: 30000,
  });

  const payments: any[] = data?.data?.data?.payments || [];
  const summary = data?.data?.data?.summary || {};

  const filtered = useMemo(() => {
    let list = payments;
    if (statusFilter !== 'ALL') list = list.filter((p: any) => p.status === statusFilter.toLowerCase());
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p: any) =>
        (p.referenceNumber || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        String(p.amount).includes(q) ||
        (p.trip?.tripNumber || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [payments, statusFilter, search]);

  const totalPending   = payments.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + p.amount, 0);
  const totalCompleted = payments.filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + p.amount, 0);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]" />
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <AlertCircle className="w-10 h-10" />
      <p className="text-sm font-bold">Failed to load payments</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Expected</span>
          </div>
          <p className="text-2xl font-black text-emerald-900">{fmt(summary.totalAmount || 0)}</p>
          <p className="text-xs text-emerald-600 mt-1">{summary.totalPayments || 0} payments</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pending</span>
          </div>
          <p className="text-2xl font-black text-amber-900">{fmt(totalPending)}</p>
          <p className="text-xs text-amber-600 mt-1">{payments.filter((p: any) => p.status === 'pending').length} awaiting</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-[#345E85]" />
            <span className="text-[10px] font-black text-[#345E85] uppercase tracking-widest">Received</span>
          </div>
          <p className="text-2xl font-black text-[#345E85]">{fmt(totalCompleted)}</p>
          <p className="text-xs text-[#345E85] mt-1">{payments.filter((p: any) => p.status === 'completed').length} completed</p>
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
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#345E85]/30"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="PROCESSING">Processing</option>
          <option value="ESCROW">Escrow</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              {['Date', 'Reference', 'Trip', 'Type', 'Amount', 'Status'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <Inbox className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No payments found</p>
                </td>
              </tr>
            ) : filtered.map((p: any) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                  {new Date(p.dueDate || p.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-xs font-mono text-slate-500">
                  {p.referenceNumber || `PAY-${p.id.slice(0, 8)}`}
                </td>
                <td className="px-5 py-4">
                  {p.trip ? (
                    <div>
                      <p className="text-sm font-bold text-slate-800">{p.trip.tripNumber}</p>
                      {p.trip.load && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">{p.trip.load.title}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs font-bold text-slate-600 capitalize">{(p.paymentType || '').replace(/_/g, ' ')}</span>
                </td>
                <td className="px-5 py-4 text-base font-black text-emerald-600 whitespace-nowrap">
                  {fmt(p.amount)} <span className="text-xs font-bold text-slate-400">{p.currency}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${statusStyle[p.status] || 'bg-slate-100 text-slate-600'}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReceivedPaymentsPage;
