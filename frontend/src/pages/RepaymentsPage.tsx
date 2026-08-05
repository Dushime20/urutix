import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { lendingApi } from '../services/lending/lendingApi';
import { Download, RotateCcw } from 'lucide-react';
import RepaymentsEnlite, { type RepaymentEntry } from '../components/LenderDashboard/Repayments.enlite';
import toast from 'react-hot-toast';

const RepaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [repayments, setRepayments] = useState<RepaymentEntry[]>([]);
  const [loading, setLoading]       = useState(true);

  /**
   * Map a raw repayment record from the API.
   * No fallbacks — missing fields stay null.
   */
  const mapRepayment = (rep: any): RepaymentEntry => ({
    id:             rep.id,
    loanId:         rep.loanId ?? null,
    // Borrower from the nested borrower object
    borrowerName:   rep.borrower?.name ?? null,
    borrowerEmail:  rep.borrower?.email ?? null,
    // Amounts — all from real repayment record
    amount:         rep.amount != null ? Number(rep.amount) : null,
    interestPaid:   rep.interestPaid != null ? Number(rep.interestPaid) : null,
    principalPaid:  rep.principalPaid != null ? Number(rep.principalPaid) : null,
    // Dates
    repaymentDate:  rep.repaymentDate ?? null,
    // Loan context
    requestedAmount: rep.loan?.requestedAmount != null ? Number(rep.loan.requestedAmount) : null,
    approvedAmount:  rep.loan?.approvedAmount  != null ? Number(rep.loan.approvedAmount)  : null,
    // Status derived by backend
    status:         rep.status ?? null,
    _rawData:       rep,
  });

  const fetchRepayments = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      toast.error('No lender session found. Please log in again.');
      return;
    }

    try {
      setLoading(true);

      let lenderId = user.id;
      try {
        const resolved = await lendingApi.resolveLenderId();
        if (resolved) lenderId = resolved;
      } catch {
        // Backend also resolves user → lender when user.id is passed
      }

      const response = await lendingApi.getLenderRepayments(lenderId, {
        page: 1,
        limit: 200,
      });

      // API returns { data: [], pagination: {} }
      const raw: any[] = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      setRepayments(raw.map(mapRepayment));

      if (raw.length === 0) {
        toast('No repayment records found.', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load repayments';
      toast.error(msg);
      setRepayments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRepayments();
  }, [fetchRepayments]);

  const handleExport = () => {
    if (repayments.length === 0) return;

    const headers = [
      'Repayment ID', 'Loan ID', 'Borrower', 'Borrower Email',
      'Amount', 'Interest Paid', 'Principal Paid',
      'Repayment Date', 'Status',
      'Loan Requested Amount', 'Loan Approved Amount',
    ];

    const rows = repayments.map(r => [
      r.id,
      r.loanId ?? '',
      r.borrowerName ?? '',
      r.borrowerEmail ?? '',
      r.amount ?? '',
      r.interestPaid ?? '',
      r.principalPaid ?? '',
      r.repaymentDate ?? '',
      r.status ?? '',
      r.requestedAmount ?? '',
      r.approvedAmount ?? '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `repayments-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Repayments exported');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="sticky top-16 sm:top-[4.5rem] lg:top-20 z-40 -mx-4 px-4 py-4 bg-gray-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">
              Repayment <span className="text-[#2c5173]">Tracking</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Verified repayment records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={repayments.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={fetchRepayments}
              disabled={loading}
              className="h-11 w-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all disabled:opacity-40"
              title="Refresh"
            >
              <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <RepaymentsEnlite
          loading={loading}
          repayments={repayments}
        />
      </div>
    </div>
  );
};

export default RepaymentsPage;
