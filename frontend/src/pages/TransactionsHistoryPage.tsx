import React, { useState, useCallback, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { useAuth } from '../contexts/AuthContext';
import { History, Download, RotateCcw } from 'lucide-react';
import HistoryEnlite, { type TxEntry } from '../components/LenderDashboard/History.enlite';
import toast from 'react-hot-toast';

const TransactionsHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TxEntry[]>([]);
  const [loading, setLoading]  = useState(true);

  const lenderId = user?.id;

  /**
   * Map a raw disbursement record to a TxEntry.
   * No fallbacks — missing fields stay null.
   */
  const mapDisbursement = (d: any): TxEntry => ({
    id:             d.id,
    source:         'disbursement',
    date:           d.disbursedDate ?? d.approvedDate ?? d.requestedDate ?? null,
    amount:         d.amount != null ? -Math.abs(Number(d.amount)) : null, // outflow = negative
    status:         d.status ?? null,
    borrowerName:   d.borrowerName !== 'Unknown' ? d.borrowerName : null,
    loanId:         d.loanId ?? null,
    reference:      null, // disbursements don't have external_txn_ref in the formatted response
    purpose:        d.purpose !== 'Cargo financing' ? d.purpose : null,
    interestRate:   d.interestRate > 0 ? d.interestRate : null,
    notes:          d.notes || null,
    _rawData:       d,
  });

  /**
   * Map a raw repayment record to a TxEntry.
   * No fallbacks — missing fields stay null.
   */
  const mapRepayment = (r: any): TxEntry => ({
    id:             r.id,
    source:         'repayment',
    date:           r.repaymentDate ?? null,
    amount:         r.amount != null ? Math.abs(Number(r.amount)) : null, // inflow = positive
    status:         r.status ?? null,
    borrowerName:   r.borrower?.name ?? null,
    loanId:         r.loanId ?? null,
    reference:      null,
    purpose:        null,
    interestRate:   null,
    interestPaid:   r.interestPaid != null ? Number(r.interestPaid) : null,
    principalPaid:  r.principalPaid != null ? Number(r.principalPaid) : null,
    notes:          null,
    _rawData:       r,
  });

  const fetchHistory = useCallback(async () => {
    if (!lenderId) {
      setLoading(false);
      toast.error('No lender session found. Please log in again.');
      return;
    }

    try {
      setLoading(true);

      const [disbResponse, repResponse] = await Promise.all([
        lendingApi.getLenderDisbursements(lenderId, { page: 1, limit: 200 }),
        lendingApi.getLenderRepayments(lenderId, { page: 1, limit: 200 }),
      ]);

      // getLenderDisbursements returns { disbursements: [], pagination: {}, stats: {} }
      const disbursements: any[] = disbResponse?.disbursements ?? [];
      // getLenderRepayments returns { data: [], pagination: {} }
      const repayments: any[]    = repResponse?.data ?? [];

      const all: TxEntry[] = [
        ...disbursements.map(mapDisbursement),
        ...repayments.map(mapRepayment),
      ].sort((a, b) => {
        // Sort by date descending — nulls last
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setEntries(all);

      if (all.length === 0) {
        toast('No transaction history found.', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load transaction history';
      toast.error(msg);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [lenderId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleExport = () => {
    if (entries.length === 0) return;

    const headers = [
      'ID', 'Type', 'Date', 'Amount', 'Status',
      'Borrower', 'Loan ID', 'Reference', 'Purpose',
      'Interest Rate', 'Interest Paid', 'Principal Paid', 'Notes',
    ];

    const rows = entries.map(e => [
      e.id,
      e.source,
      e.date ?? '',
      e.amount ?? '',
      e.status ?? '',
      e.borrowerName ?? '',
      e.loanId ?? '',
      e.reference ?? '',
      e.purpose ?? '',
      e.interestRate ?? '',
      e.interestPaid ?? '',
      e.principalPaid ?? '',
      e.notes ?? '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `transaction-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Transaction history exported');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase flex items-center gap-3">
              <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200">
                <History size={24} />
              </div>
              Transaction Vault
            </h1>
            <p className="text-gray-500 mt-2 uppercase text-[10px] font-black tracking-[0.2em] opacity-70">
              Verified ledger of all capital movements — real data only
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={entries.length === 0}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        <HistoryEnlite
          loading={loading}
          entries={entries}
        />
      </div>
    </div>
  );
};

export default TransactionsHistoryPage;
