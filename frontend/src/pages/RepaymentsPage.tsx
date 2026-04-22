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

  const lenderId = user?.id;

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
    if (!lenderId) {
      setLoading(false);
      toast.error('No lender session found. Please log in again.');
      return;
    }

    try {
      setLoading(true);

      const response = await lendingApi.getLenderRepayments(lenderId, {
        page: 1,
        limit: 200,
      });

      // API returns { data: [], pagination: {} }
      const raw: any[] = response?.data ?? [];
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
  }, [lenderId]);

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
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">
              Repayment Tracking
            </h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">
              Verified repayment records — real data only
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={repayments.length === 0}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={fetchRepayments}
              disabled={loading}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading...' : 'Refresh'}
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
