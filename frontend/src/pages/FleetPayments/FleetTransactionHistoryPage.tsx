import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsAPI } from '../../services/api';
import { AlertCircle, CheckCircle, DollarSign, Inbox, ChevronLeft, ChevronRight, Building, User } from 'lucide-react';
import { StatCard } from '@/components/EnliteUI/Cards/StatCard';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

// fmt replaced by useCurrencyFormat hook

const methodLabel: Record<string, string> = {
  credit_card: 'Card',
  digital_wallet: 'Mobile Money',
  bank_transfer: 'Bank Transfer',
  wallet: 'Wallet',
  wire_transfer: 'Wire',
};

const PAGE_SIZE = 20;

const FleetTransactionHistoryPage = () => {
  const { compactIn: fmt } = useCurrencyFormat();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'cargo_owner' | 'lender'>('ALL');
  const [page, setPage] = useState(1);

  // Use completed endpoint — now includes lender disbursements matched by phone
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
    if (sourceFilter !== 'ALL') {
      list = list.filter((t: any) =>
        sourceFilter === 'lender' ? t.isLenderPayment : !t.isLenderPayment,
      );
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t: any) =>
        (t.referenceNumber || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.trip?.tripNumber || '').toLowerCase().includes(q) ||
        (t.lenderName || '').toLowerCase().includes(q) ||
        String(t.amount).includes(q)
      );
    }
    return list;
  }, [transactions, typeFilter, sourceFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const types = useMemo(() =>
    [...new Set(transactions.map((t: any) => t.paymentType).filter(Boolean))],
    [transactions]
  );

  const currency = transactions[0]?.currency || 'RWF';

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Received"
          value={fmt(summary.totalAmount || 0, currency)}
          subtitle={`${summary.totalPayments || 0} transactions`}
          icon={<CheckCircle size={24} />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title="Showing"
          value={filtered.length}
          subtitle="matching filter"
          icon={<DollarSign size={24} />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title="Currency"
          value={currency}
          subtitle="all transactions"
          icon={<CheckCircle size={24} />}
          color="primary"
          variant="classic"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by reference, trip, lender, amount..."
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
        <select
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none"
          value={sourceFilter}
          onChange={e => { setSourceFilter(e.target.value as any); setPage(1); }}
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
              {['Date', 'Reference', 'Trip / Load', 'Source', 'Method', 'Amount'].map(h => (
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
                  {t.isLenderPayment ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-violet-100 text-violet-700">
                        <Building className="w-2.5 h-2.5" /> Lender
                      </span>
                      {t.lenderName && (
                        <span className="text-xs text-slate-500 truncate max-w-[80px]">{t.lenderName}</span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700">
                      <User className="w-2.5 h-2.5" /> Direct
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs font-medium text-slate-500">
                    {methodLabel[t.paymentMethod] || t.paymentMethod || '—'}
                  </span>
                </td>
                <td className="px-5 py-4 text-base font-black text-emerald-600 whitespace-nowrap">
                  {fmt(t.amount, t.currency)} <span className="text-xs font-bold text-slate-400">{t.currency}</span>
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
