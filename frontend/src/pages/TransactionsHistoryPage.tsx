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
    if (!user?.id) {
      setLoading(false);
      toast.error('No lender session found. Please log in again.');
      return;
    }

    try {
      setLoading(true);

      // Prefer lenders.id over users.id — history APIs filter by loan.lender_id
      let lenderId = user.id;
      try {
        const resolved = await lendingApi.resolveLenderId();
        if (resolved) lenderId = resolved;
      } catch {
        // Fall back to user.id; backend also resolves user → lender
      }

      const [disbResponse, repResponse] = await Promise.all([
        lendingApi.getLenderDisbursements(lenderId, { page: 1, limit: 200 }),
        lendingApi.getLenderRepayments(lenderId, { page: 1, limit: 200 }),
      ]);

      // getLenderDisbursements returns { disbursements: [], pagination: {}, stats: {} }
      const disbursements: any[] = Array.isArray(disbResponse?.disbursements)
        ? disbResponse.disbursements
        : Array.isArray(disbResponse)
          ? disbResponse
          : [];
      // getLenderRepayments returns { data: [], pagination: {} }
      const repayments: any[] = Array.isArray(repResponse?.data)
        ? repResponse.data
        : Array.isArray(repResponse)
          ? repResponse
          : [];

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
  }, [user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleExport = () => {
    if (entries.length === 0) {
      toast.error('Nothing to export');
      return;
    }

    const headers = ['Date', 'Type', 'Borrower', 'Amount', 'Status', 'Loan ID', 'Reference'];
    const rows = entries.map((e) => [
      e.date ?? '',
      e.source,
      e.borrowerName ?? '',
      e.amount != null ? String(e.amount) : '',
      e.status ?? '',
      e.loanId ?? '',
      e.reference ?? '',
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transaction history exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#345E85]/10 flex items-center justify-center text-[#345E85]">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Transaction History</h1>
            <p className="text-sm text-slate-500">Disbursements and repayments across your portfolio</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <Download size={16} />
            Export
          </button>
          <button
            type="button"
            onClick={fetchHistory}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-[#345E85] text-white hover:bg-[#2a4c6b]"
          >
            <RotateCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <HistoryEnlite
        loading={loading}
        entries={entries}
      />
    </div>
  );
};

export default TransactionsHistoryPage;
