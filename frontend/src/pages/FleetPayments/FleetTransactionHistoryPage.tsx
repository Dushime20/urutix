import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsAPI } from '../../services/api';
import { AlertCircle, CheckCircle, DollarSign, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

const methodLabel: Record<string, string> = {
  credit_card: 'Card',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  wallet: 'Wallet',
  wire_transfer: 'Wire',
};

const PAGE_SIZE = 20;

const FleetTransactionHistoryPage = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['fleet-completed-transactions'],
    queryFn: () => paymentsAPI.getTruckOwnerCompletedPayments(),
    refetchInterval: 60000,
  });

  const transactions: any[] = data?.data?.data?.payments || [];
  const summary = data?.data?.data?.summary || {};

  const filtered = useMemo(() => {
    let list = transactions;
    if (typeFilter !== 'ALL') list = list.filter((t: any) => t.paymentType === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t: any) =>
        (t.referenceNumber || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.trip?.tripNumber || '').toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      );
    }
    return list;
  }, [transactions, typeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const types = useMemo(() =>
    [...new Set(transactions.map((t: any) => t.paymentType).filter(Boolean))],
    [transactions]
  );

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]" />
    </div>
  );

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <AlertCircle className="w-10 h-10" />
      <p className="text-sm font-bold">Failed to load transaction history</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Received</span>
          </div>
          <p className="text-2xl font-black text-emerald-900">{fmt(summary.totalAmount || 0)}</p>
          <p className="text-xs text-emerald-600 mt-1">{summary.totalPayments || 0} transactions</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-slate-600" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Showing</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{filtered.length}</p>
          <p className="text-xs text-slate-500 mt-1">matching filter</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-[#345E85]" />
            <span className="text-[10px] font-black text-[#345E85] uppercase tracking-widest">Currency</span>
          </div>
          <p className="text-2xl font-black text-[#345E85]">{summary.currency || 'USD'}</p>
          <p className="text-xs text-[#345E85] mt-1">all transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by reference, trip, amount..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#345E85]/30"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none"
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
        >
          <option value="ALL">All Types</option>
          {types.map((t: string) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              {['Date', 'Reference', 'Trip / Load', 'Type', 'Method', 'Amount'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <Inbox className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No transactions found</p>
                </td>
              </tr>
            ) : paginated.map((t: any) => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 text-sm text-slate-700 whitespace-nowrap">
                  {new Date(t.processedAt || t.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-xs font-mono text-slate-400">
                  {t.referenceNumber || `PAY-${t.id.slice(0, 8)}`}
                </td>
                <td className="px-5 py-4">
                  {t.trip ? (
                    <div>
                      <p className="text-sm font-bold text-slate-800">{t.trip.tripNumber}</p>
                      {t.trip.load && (
                        <p className="text-xs text-slate-400 truncate max-w-[160px]">
                          {t.trip.load.origin?.city && t.trip.load.destination?.city
                            ? `${t.trip.load.origin.city} → ${t.trip.load.destination.city}`
                            : t.trip.load.title}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs font-bold text-slate-600 capitalize">{(t.paymentType || '').replace(/_/g, ' ')}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs font-medium text-slate-500">{methodLabel[t.paymentMethod] || t.paymentMethod || '—'}</span>
                </td>
                <td className="px-5 py-4 text-base font-black text-emerald-600 whitespace-nowrap">
                  {fmt(t.amount)} <span className="text-xs font-bold text-slate-400">{t.currency}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold text-slate-600">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetTransactionHistoryPage;
