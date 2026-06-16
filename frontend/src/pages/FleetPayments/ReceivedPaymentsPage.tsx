import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsAPI } from '../../services/api';
import { TrendingUp, Clock, CheckCircle, AlertCircle, Inbox, Building, User } from 'lucide-react';
import { StatCard } from '@/components/EnliteUI/Cards/StatCard';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

// fmt replaced by useCurrencyFormat hook

const statusStyle: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  completed:  'bg-emerald-100 text-emerald-700',
  escrow:     'bg-purple-100 text-purple-700',
  failed:     'bg-rose-100 text-rose-700',
  cancelled:  'bg-slate-100 text-slate-600',
};

const ReceivedPaymentsPage = () => {
  const { compactIn: fmt } = useCurrencyFormat();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'cargo_owner' | 'lender'>('ALL');

  // Use the /all endpoint which combines payeeId-linked + lender phone-matched payments
  const { data, isLoading, isError } = useQuery({
    queryKey: ['truck-owner-received-payments'],
    queryFn: () => paymentsAPI.getAllReceivedPayments({}),
    refetchInterval: 30000,
  });

  const payments: any[] = data?.data?.data?.payments || [];
  const summary = data?.data?.data?.summary || {};

  const filtered = useMemo(() => {
    let list = payments;
    if (statusFilter !== 'ALL') list = list.filter((p: any) => p.status === statusFilter.toLowerCase());
    if (sourceFilter !== 'ALL') {
      list = list.filter((p: any) =>
        sourceFilter === 'lender' ? p.isLenderPayment : !p.isLenderPayment,
      );
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p: any) =>
        (p.referenceNumber || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        String(p.amount).includes(q) ||
        (p.trip?.tripNumber || '').toLowerCase().includes(q) ||
        (p.lenderName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [payments, statusFilter, sourceFilter, search]);

  const totalPending   = payments.filter((p: any) => p.status === 'pending' || p.status === 'processing').reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalCompleted = payments.filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + Number(p.amount), 0);
  const currency = payments[0]?.currency || 'RWF';

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Received"
          value={fmt(totalCompleted, currency)}
          subtitle={`${payments.filter((p: any) => p.status === 'completed').length} completed`}
          icon={<TrendingUp size={24} />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title="Pending / Processing"
          value={fmt(totalPending, currency)}
          subtitle={`${payments.filter((p: any) => p.status === 'pending' || p.status === 'processing').length} in progress`}
          icon={<Clock size={24} />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title="Total Payments"
          value={summary.totalPayments || payments.length}
          subtitle={`${summary.lenderPaymentsCount || 0} via lender · ${(summary.totalPayments || payments.length) - (summary.lenderPaymentsCount || 0)} direct`}
          icon={<CheckCircle size={24} />}
          color="primary"
          variant="classic"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by reference, trip, lender, description..."
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
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#345E85]/30"
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value as any)}
        >
          <option value="ALL">All Sources</option>
          <option value="cargo_owner">Direct (Cargo Owner)</option>
          <option value="lender">Via Lender</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              {['Date', 'Reference', 'Trip', 'Source', 'Amount', 'Status'].map(h => (
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
                  {new Date(p.processedAt || p.dueDate || p.createdAt).toLocaleDateString()}
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
                  {p.isLenderPayment ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-violet-100 text-violet-700">
                        <Building className="w-2.5 h-2.5" /> Lender
                      </span>
                      {p.lenderName && <span className="text-xs text-slate-500 truncate max-w-[80px]">{p.lenderName}</span>}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">
                      <User className="w-2.5 h-2.5" /> Direct
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-base font-black text-emerald-600 whitespace-nowrap">
                  {fmt(p.amount, p.currency)} <span className="text-xs font-bold text-slate-400">{p.currency}</span>
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
