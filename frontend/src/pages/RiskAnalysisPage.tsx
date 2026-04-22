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
  const [activeTab, setActiveTab] = useState('overview');

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
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">
              Risk Intelligence
            </h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">
              Portfolio exposure and default probability — real data only
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
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        <RiskAnalysisEnlite
          loading={loading}
          entries={entries}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
};

export default RiskAnalysisPage;
