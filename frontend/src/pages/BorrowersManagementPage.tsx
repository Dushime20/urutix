import React, { useState, useCallback, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { useAuth } from '../contexts/AuthContext';
import BorrowersEnlite, { type BorrowerEntry } from '../components/LenderDashboard/Borrowers.enlite';
import { Download, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const BorrowersManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [borrowers, setBorrowers] = useState<BorrowerEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const lenderId = user?.id;

  /**
   * Map a raw borrower record from the API.
   * No fallbacks — missing fields stay null.
   */
  const mapBorrower = (b: any): BorrowerEntry => ({
    borrowerId:       b.borrowerId,
    companyName:      b.companyName ?? null,
    contactName:      b.contactName ?? null,
    email:            b.email ?? null,
    phone:            b.phone ?? null,
    businessType:     b.businessType ?? null,
    creditScore:      b.creditScore ?? null,
    status:           b.status ?? null,
    createdAt:        b.createdAt ?? null,
    loanCount:        b.loanCount,
    activeLoans:      b.activeLoans,
    pendingLoans:     b.pendingLoans,
    repaidLoans:      b.repaidLoans,
    defaultedLoans:   b.defaultedLoans,
    overdueLoans:     b.overdueLoans,
    totalRequested:   b.totalRequested,
    totalApproved:    b.totalApproved,
    totalInterestPaid: b.totalInterestPaid,
    totalPrincipalPaid: b.totalPrincipalPaid,
    outstanding:      b.outstanding,
    lastLoanDate:     b.lastLoanDate ?? null,
  });

  const fetchBorrowers = useCallback(async () => {
    if (!lenderId) {
      setLoading(false);
      toast.error('No lender session found. Please log in again.');
      return;
    }

    try {
      setLoading(true);

      const response = await lendingApi.getLenderBorrowers(lenderId, 1, 200);
      const raw: any[] = response?.data ?? [];
      setBorrowers(raw.map(mapBorrower));

      if (raw.length === 0) {
        toast('No borrowers found for this lender.', { icon: 'ℹ️' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load borrowers';
      toast.error(msg);
      setBorrowers([]);
    } finally {
      setLoading(false);
    }
  }, [lenderId]);

  useEffect(() => {
    fetchBorrowers();
  }, [fetchBorrowers]);

  const handleExport = () => {
    if (borrowers.length === 0) return;

    const headers = [
      'Borrower ID', 'Company Name', 'Contact Name', 'Email', 'Phone',
      'Business Type', 'Credit Score', 'Status',
      'Total Loans', 'Active Loans', 'Repaid Loans', 'Defaulted Loans', 'Overdue Loans',
      'Total Requested', 'Total Approved', 'Outstanding',
      'Total Interest Paid', 'Total Principal Paid',
      'Last Loan Date', 'Member Since',
    ];

    const rows = borrowers.map(b => [
      b.borrowerId,
      b.companyName ?? '',
      b.contactName ?? '',
      b.email ?? '',
      b.phone ?? '',
      b.businessType ?? '',
      b.creditScore ?? '',
      b.status ?? '',
      b.loanCount,
      b.activeLoans,
      b.repaidLoans,
      b.defaultedLoans,
      b.overdueLoans,
      b.totalRequested,
      b.totalApproved,
      b.outstanding,
      b.totalInterestPaid,
      b.totalPrincipalPaid,
      b.lastLoanDate ?? '',
      b.createdAt ?? '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `borrowers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Borrowers exported');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="sticky top-16 sm:top-[4.5rem] lg:top-20 z-40 -mx-4 px-4 py-4 bg-gray-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">
              Borrower <span className="text-[#2c5173]">Directory</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Verified borrowers from loan history
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={borrowers.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={fetchBorrowers}
              disabled={loading}
              className="h-11 w-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all disabled:opacity-40"
              title="Refresh"
            >
              <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <BorrowersEnlite
          loading={loading}
          borrowers={borrowers}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
        />
      </div>
    </div>
  );
};

export default BorrowersManagementPage;
