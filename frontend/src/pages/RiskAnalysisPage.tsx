import React, { useState, useCallback, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { useAuth } from '../contexts/AuthContext';
import RiskAnalysisEnlite, { type RiskEntry } from '../components/LenderDashboard/RiskAnalysis.enlite';
import { Download, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const RiskAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries]     = useState<RiskEntry[]>([]);
  const [loading, setLoading]     = useState(true);

  const lenderId = user?.id;

  /**
   * Map a raw loan request to a RiskEntry.
   * Only fields that exist in the API response are populated.
   * No fallbacks, no invented values.
   */
  const mapLoan = (loan: any): RiskEntry => {
    const borrower = loan.borrower ?? null;

    return {
      loanId:          loan.id,
      borrowerName:    borrower?.contact_name ?? borrower?.company_name ?? null,
      businessName:    borrower?.company_name ?? null,
      requestedAmount: loan.requested_amount ?? null,
      status:          loan.status,
      // Credit score only from real borrower record
      creditScore:     borrower?.credit_score ?? null,
      // Risk tier derived only when credit score exists
      riskTier:        borrower?.credit_score != null
                         ? deriveRiskTier(borrower.credit_score, loan.requested_amount)
                         : null,
      purpose:         loan.metadata?.purpose ?? null,
      requestedSplit:  loan.requested_split ?? [],
      lenderName:      loan.lender?.name ?? null,
      dueDate:         loan.due_date ?? null,
      createdAt:       loan.created_at ?? null,
      updatedAt:       loan.updated_at ?? null,
      _rawData:        loan,
    };
  };

  /**
   * Derive risk tier from real credit score + amount.
   * Only called when credit_score is a verified number.
   */
  const deriveRiskTier = (
    creditScore: number,
    amount: number | null,
  ): 'low' | 'medium' | 'high' | 'critical' => {
    if (creditScore >= 750 && (amount ?? 0) <= 10000) return 'low';
    if (creditScore >= 700 && (amount ?? 0) <= 20000) return 'medium';
    if (creditScore >= 600)                            return 'high';
    return 'critical';
  };

  const fetchData = useCallback(async () => {
    if (!lenderId) {
      setLoading(false);
      toast.error('No lender session found. Please log in again.');
      return;
    }

    try {
      setLoading(true);

      // Fetch all non-rejected loans for portfolio risk view
      const response = await lendingApi.getLenderLoanRequests(
        lenderId,
        undefined, // all statuses
        1,
        200,
      );

      const loans: any[] = response?.data ?? [];
      setEntries(loans.map(mapLoan));

      if (loans.length === 0) {
        toast('No loan data available for risk analysis.', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load risk data';
      toast.error(msg);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [lenderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Export — only real fields.
   */
  const handleExport = () => {
    if (entries.length === 0) return;

    const headers = [
      'Loan ID', 'Borrower', 'Business', 'Requested Amount',
      'Status', 'Credit Score', 'Risk Tier', 'Purpose',
      'Lender', 'Due Date', 'Created At',
    ];

    const rows = entries.map(e => [
      e.loanId,
      e.borrowerName ?? '',
      e.businessName ?? '',
      e.requestedAmount ?? '',
      e.status,
      e.creditScore ?? '',
      e.riskTier ?? '',
      e.purpose ?? '',
      e.lenderName ?? '',
      e.dueDate ?? '',
      e.createdAt ?? '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `risk-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Risk report exported');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="sticky top-16 sm:top-[4.5rem] lg:top-20 z-40 -mx-4 px-4 py-4 bg-gray-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">
              Risk <span className="text-[#2c5173]">Intelligence</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Portfolio exposure and default probability
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={entries.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="h-11 w-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all disabled:opacity-40"
              title="Refresh"
            >
              <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <RiskAnalysisEnlite
          loading={loading}
          entries={entries}
        />
      </div>
    </div>
  );
};

export default RiskAnalysisPage;
