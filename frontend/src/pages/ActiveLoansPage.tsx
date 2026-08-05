import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { lendingApi } from '../services/lending/lendingApi';
import {
  FaExclamationTriangle
} from 'react-icons/fa';
import { Search, LayoutGrid, List, RotateCcw } from 'lucide-react';
import ActiveLoansEnlite from '../components/LenderDashboard/ActiveLoans.enlite';
import LoanDetailModal from '../components/LenderDashboard/LoanDetailModal';
import toast from 'react-hot-toast';

interface Borrower {
  id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  credit_score: number | null;
  verification_status: string | null;
}

interface ActiveLoan {
  id: string;
  loan_request_id: string;
  borrower: Borrower;
  principal_amount: number;
  approved_amount: number | null;
  interest_rate: number | null;
  loan_term_months: number | null;
  total_amount: number;
  amount_repaid: number;
  outstanding_balance: number;
  total_principal_paid: number;
  total_interest_paid: number;
  created_at: string | null;
  due_date: string | null;
  status: string;
  purpose: string | null;
  repayment_count: number;
  lender_name: string | null;
  currency: string;
  _rawData?: any;
}

const ActiveLoansPage: React.FC = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<ActiveLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailLoan, setDetailLoan] = useState<any | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'LENDER') return;

    const fetchActiveLoans = async () => {
      setLoading(true);
      try {
        const loansData = await lendingApi.getActiveLoans(user.id);

        // API returns { data: [], total, page, limit, totalPages }
        const loans: any[] = loansData?.data ?? [];

        const transformedLoans: ActiveLoan[] = loans.map((loan: any) => {
          // Borrower — use actual API field names
          const borrower = loan.borrower ?? null;
          const borrowerName = borrower?.contact_name ?? borrower?.company_name ?? null;

          // Repayment totals from embedded repayments array
          const repayments: any[] = loan.repayments ?? [];
          const totalPrincipalPaid = repayments.reduce((s: number, r: any) => s + (Number(r.principal_paid) || 0), 0);
          const totalInterestPaid  = repayments.reduce((s: number, r: any) => s + (Number(r.interest_paid) || 0), 0);
          const totalRepaid        = repayments.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);

          const approvedAmount  = loan.approved_amount  != null ? Number(loan.approved_amount)  : null;
          const requestedAmount = loan.requested_amount != null ? Number(loan.requested_amount) : null;
          const principal       = approvedAmount ?? requestedAmount ?? 0;
          const outstanding     = Math.max(0, principal - totalPrincipalPaid);

          // Determine overdue status from due_date
          const dueDate = loan.due_date ?? null;
          const isOverdue = dueDate && new Date(dueDate) < new Date() && loan.status !== 'repaid';
          const derivedStatus = isOverdue ? 'overdue' : loan.status;

          return {
            id:                loan.id,
            loan_request_id:   loan.id,
            borrower: {
              id:                  borrower?.id ?? null,
              name:                borrowerName,
              email:               borrower?.email ?? null,
              phone:               borrower?.phone ?? null,
              company:             borrower?.company_name ?? null,
              credit_score:        borrower?.credit_score ?? null,
              verification_status: borrower?.status ?? null,
            },
            // Loan financials — from real API fields
            principal_amount:      principal,
            approved_amount:       approvedAmount,
            interest_rate:         loan.interest_rate ?? loan.interestRate ?? null,
            loan_term_months:      loan.loan_term_months ?? loan.loanTermMonths ?? null,
            total_amount:          principal,
            amount_repaid:         totalRepaid,
            outstanding_balance:   outstanding,
            total_principal_paid:  totalPrincipalPaid,
            total_interest_paid:   totalInterestPaid,
            // Dates
            created_at:            loan.created_at ?? null,
            due_date:              dueDate,
            // Status
            status:                derivedStatus,
            // Purpose from metadata
            purpose:               loan.metadata?.purpose ?? null,
            // Repayment count
            repayment_count:       repayments.length,
            // Lender
            lender_name:           loan.lender?.name ?? null,
            currency:              loan.currency || 'RWF',
            // Raw data for detail modal
            _rawData:              loan,
          };
        });

        setLoans(transformedLoans);

        if (transformedLoans.length === 0) {
          toast('No active loans found.', { icon: 'ℹ️' });
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to load active loans';
        toast.error(msg);
        setLoans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveLoans();
  }, [user]);

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  const filtered = loans.filter(loan => {
    const q = search.toLowerCase();
    const matchesSearch = !search || [
      loan.borrower.name,
      loan.borrower.company,
      loan.id,
      loan.purpose,
    ].some(field => field?.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'outstanding_balance') return (a.outstanding_balance - b.outstanding_balance) * dir;
    if (sortBy === 'created_at') return (new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()) * dir;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6 md:p-8 transition-colors duration-200">
      <div className="max-w-[1536px] mx-auto space-y-8">
        <div className="sticky top-16 sm:top-[4.5rem] lg:top-20 z-40 -mx-4 px-4 py-4 bg-gray-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight uppercase">Active Loan Book</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">
              Approved and disbursed loans — real data only
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setLoading(true); lendingApi.getActiveLoans(user!.id).then(r => { const d = r?.data ?? []; setLoans(d.map((loan: any) => { const borrower = loan.borrower ?? null; const borrowerName = borrower?.contact_name ?? borrower?.company_name ?? null; const repayments: any[] = loan.repayments ?? []; const totalPrincipalPaid = repayments.reduce((s: number, r: any) => s + (Number(r.principal_paid) || 0), 0); const totalInterestPaid = repayments.reduce((s: number, r: any) => s + (Number(r.interest_paid) || 0), 0); const totalRepaid = repayments.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0); const approvedAmount = loan.approved_amount != null ? Number(loan.approved_amount) : null; const requestedAmount = loan.requested_amount != null ? Number(loan.requested_amount) : null; const principal = approvedAmount ?? requestedAmount ?? 0; const outstanding = Math.max(0, principal - totalPrincipalPaid); const dueDate = loan.due_date ?? null; const isOverdue = dueDate && new Date(dueDate) < new Date() && loan.status !== 'repaid'; return { id: loan.id, loan_request_id: loan.id, borrower: { id: borrower?.id ?? null, name: borrowerName, email: borrower?.email ?? null, phone: borrower?.phone ?? null, company: borrower?.company_name ?? null, credit_score: borrower?.credit_score ?? null, verification_status: borrower?.status ?? null }, principal_amount: principal, approved_amount: approvedAmount, interest_rate: loan.interest_rate ?? null, loan_term_months: loan.loan_term_months ?? null, total_amount: principal, amount_repaid: totalRepaid, outstanding_balance: outstanding, total_principal_paid: totalPrincipalPaid, total_interest_paid: totalInterestPaid, created_at: loan.created_at ?? null, due_date: dueDate, status: isOverdue ? 'overdue' : loan.status, purpose: loan.metadata?.purpose ?? null, repayment_count: repayments.length, lender_name: loan.lender?.name ?? null, currency: loan.currency || 'RWF', _rawData: loan }; })); }).catch(() => toast.error('Failed to refresh')).finally(() => setLoading(false)); }}
              disabled={loading}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="SEARCH LOANS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#345E85] focus:border-transparent w-full bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="all">ALL STATUS</option>
            <option value="approved">APPROVED</option>
            <option value="disbursed">DISBURSED</option>
            <option value="overdue">OVERDUE</option>
          </select>
        </div>

        <ActiveLoansEnlite
          loading={loading}
          loans={sorted}
          onSort={toggleSort}
          sortKey={sortBy}
          sortDirection={sortDir}
          onViewDetails={(loan) => setDetailLoan(loan._rawData)}
        />

        {detailLoan && (
          <LoanDetailModal
            loan={detailLoan}
            onClose={() => setDetailLoan(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ActiveLoansPage;
