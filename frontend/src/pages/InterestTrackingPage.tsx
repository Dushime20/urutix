import React, { useState, useCallback, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { useAuth } from '../contexts/AuthContext';
import InterestTrackingEnlite, { type InterestLoan } from '../components/LenderDashboard/InterestTracking.enlite';
import { Download, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const InterestTrackingPage: React.FC = () => {
  const { user } = useAuth();
  const [loans, setLoans]       = useState<InterestLoan[]>([]);
  const [summary, setSummary]   = useState<any | null>(null);
  const [loading, setLoading]   = useState(true);

  const lenderId = user?.id;

  const fetchData = useCallback(async () => {
    if (!lenderId) {
      setLoading(false);
      toast.error('No lender session found. Please log in again.');
      return;
    }

    try {
      setLoading(true);

      const response = await lendingApi.getLenderInterestSummary(lenderId);

      // Map each loan from the API response — no fallbacks
      const mapped: InterestLoan[] = (response?.loans ?? []).map((l: any) => ({
        loanId:              l.loanId,
        borrowerName:        l.borrowerName ?? null,
        businessName:        l.borrowerCompany ?? null,
        requestedAmount:     l.requestedAmount ?? null,
        approvedAmount:      l.approvedAmount ?? null,
        status:              l.status,
        dueDate:             l.dueDate ?? null,
        createdAt:           l.createdAt ?? null,
        contractedInterest:  l.contractedInterest ?? null,
        totalInterestPaid:   l.totalInterestPaid,
        outstandingInterest: l.outstandingInterest ?? null,
        totalPrincipalPaid:  l.totalPrincipalPaid,
        totalRepaid:         l.totalRepaid,
        repaymentCount:      l.repaymentCount,
        purpose:             l.purpose ?? null,
      }));

      setLoans(mapped);
      setSummary(response?.summary ?? null);

      if (mapped.length === 0) {
        toast('No loan data available for interest tracking.', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load interest data';
      toast.error(msg);
      setLoans([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [lenderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    if (loans.length === 0) return;

    const headers = [
      'Loan ID', 'Borrower', 'Business', 'Requested Amount', 'Approved Amount',
      'Status', 'Contracted Interest', 'Interest Paid', 'Outstanding Interest',
      'Principal Paid', 'Total Repaid', 'Repayment Count', 'Purpose', 'Due Date', 'Created At',
    ];

    const rows = loans.map(l => [
      l.loanId,
      l.borrowerName ?? '',
      l.businessName ?? '',
      l.requestedAmount ?? '',
      l.approvedAmount ?? '',
      l.status,
      l.contractedInterest ?? '',
      l.totalInterestPaid,
      l.outstandingInterest ?? '',
      l.totalPrincipalPaid,
      l.totalRepaid,
      l.repaymentCount,
      l.purpose ?? '',
      l.dueDate ?? '',
      l.createdAt ?? '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `interest-tracking-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Interest report exported');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">
              Interest <span className="text-[#2c5173]">Tracking</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Revenue auditing and yield performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={loans.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="h-11 w-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-all disabled:opacity-40"
              title="Refresh"
            >
              <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <InterestTrackingEnlite
          loading={loading}
          loans={loans}
          summary={summary}
        />
      </div>
    </div>
  );
};

export default InterestTrackingPage;
