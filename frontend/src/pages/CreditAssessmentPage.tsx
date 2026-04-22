import React, { useState, useEffect, useCallback } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { useAuth } from '../contexts/AuthContext';
import CreditAssessmentEnlite, { type CreditApplication } from '../components/LenderDashboard/CreditAssessment.enlite';
import { Download, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const CreditAssessmentPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const lenderId = user?.id;

  /**
   * Map a raw loan request from the API into a CreditApplication.
   * No fallbacks — if a field is missing it stays null/undefined.
   */
  const mapLoanToApplication = (loan: any): CreditApplication => {
    const borrower = loan.borrower ?? null;

    return {
      // Use full UUID so the table can show a truncated version itself
      id: loan.id,
      applicantName: borrower?.contact_name ?? borrower?.company_name ?? null,
      businessName: borrower?.company_name ?? null,
      applicationDate: loan.created_at ?? null,
      requestedAmount: loan.requested_amount ?? null,
      // Only use metadata.purpose — no invented fallbacks
      purpose: loan.metadata?.purpose ?? null,
      status: loan.status,
      // Only real credit score from borrower record
      creditScore: borrower?.credit_score ?? null,
      // Risk level derived only when we have a real credit score
      riskLevel: borrower?.credit_score != null
        ? deriveRiskLevel(borrower.credit_score, loan.requested_amount)
        : null,
      // Fund split from requested_split array
      requestedSplit: loan.requested_split ?? [],
      // Lender info
      lenderName: loan.lender?.name ?? null,
      // Dates
      dueDate: loan.due_date ?? null,
      updatedAt: loan.updated_at ?? null,
      // Full raw data for detail views
      _rawData: loan,
    };
  };

  /**
   * Derive risk level from real credit score + amount.
   * Only called when credit_score is a real number.
   */
  const deriveRiskLevel = (
    creditScore: number,
    amount: number,
  ): 'low' | 'medium' | 'high' => {
    if (creditScore >= 750 && amount <= 10000) return 'low';
    if (creditScore >= 650 && amount <= 25000) return 'medium';
    return 'high';
  };

  const fetchApplications = useCallback(async () => {
    if (!lenderId) {
      setLoading(false);
      toast.error('No lender session found. Please log in again.');
      return;
    }

    try {
      setLoading(true);

      const response = await lendingApi.getLenderLoanRequests(lenderId, 'pending', 1, 100);
      const loanRequests: any[] = response?.data ?? [];

      const mapped = loanRequests.map(mapLoanToApplication);
      setApplications(mapped);

      if (mapped.length === 0) {
        toast('No pending applications in queue.', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load applications';
      toast.error(msg);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [lenderId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  /**
   * Export — only real fields, no invented data.
   */
  const handleExport = () => {
    if (applications.length === 0) return;

    const headers = [
      'Loan ID', 'Applicant', 'Business', 'Application Date',
      'Requested Amount', 'Purpose', 'Status', 'Risk Level',
      'Credit Score', 'Due Date',
    ];

    const rows = applications.map(app => [
      app.id,
      app.applicantName ?? '',
      app.businessName ?? '',
      app.applicationDate ?? '',
      app.requestedAmount ?? '',
      app.purpose ?? '',
      app.status,
      app.riskLevel ?? '',
      app.creditScore ?? '',
      app.dueDate ?? '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Exported successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">
              Credit Assessment Engine
            </h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">
              Risk analysis and borrower eligibility terminal
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={applications.length === 0}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={fetchApplications}
              disabled={loading}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Assessment Interface */}
        <CreditAssessmentEnlite
          loading={loading}
          applications={applications}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
};

export default CreditAssessmentPage;
