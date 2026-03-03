import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { lendingApi } from '../services/lending/lendingApi';
import {
  FaExclamationTriangle
} from 'react-icons/fa';
import { Search, LayoutGrid, List } from 'lucide-react';
import ActiveLoansEnlite from '../components/LenderDashboard/ActiveLoans.enlite';

interface Borrower {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  credit_score: number;
  verification_status: 'verified' | 'pending' | 'unverified';
}

interface CargoDetails {
  id: string;
  type: string;
  weight: number;
  value: number;
  pickup_location: string;
  delivery_location: string;
  distance: number;
  estimated_duration: number;
}

interface PaymentSchedule {
  payment_number: number;
  due_date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paid_date?: string;
}

interface ActiveLoan {
  id: string;
  loan_request_id: string;
  borrower: Borrower;
  cargo: CargoDetails;
  principal_amount: number;
  interest_rate: number;
  loan_term_months: number;
  monthly_payment: number;
  total_amount: number;
  amount_disbursed: number;
  amount_repaid: number;
  outstanding_balance: number;
  disbursement_date: string;
  maturity_date: string;
  next_payment_date: string;
  next_payment_amount: number;
  status: 'active' | 'overdue' | 'defaulted' | 'early_repayment';
  risk_score: number;
  collateral_type?: string;
  collateral_value?: number;
  performance_rating: 'excellent' | 'good' | 'fair' | 'poor';
  days_since_disbursement: number;
  payments_made: number;
  payments_remaining: number;
  payment_schedule: PaymentSchedule[];
  created_at: string;
}

interface LoanPortfolioAnalytics {
  totalActiveLoans: number;
  totalOutstanding: number;
  totalDisbursed: number;
  totalRepaid: number;
  averageInterestRate: number;
  portfolioYield: number;
  defaultRate: number;
  onTimePaymentRate: number;
  monthlyCollections: number;
  expectedMonthlyIncome: number;
}

const ActiveLoansPage: React.FC = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<ActiveLoan[]>([]);
  const [analytics, setAnalytics] = useState<LoanPortfolioAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'disbursement_date' | 'outstanding_balance' | 'next_payment_date' | 'borrower_name'>('disbursement_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'defaulted' | 'early_repayment'>('all');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'excellent' | 'good' | 'fair' | 'poor'>('all');
  const [groupByStatus, setGroupByStatus] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'LENDER') return;

    const fetchActiveLoans = async () => {
      setLoading(true);
      setError(null);
      try {
        const [loansData, analyticsData] = await Promise.all([
          lendingApi.getActiveLoans(user.id),
          lendingApi.getLenderAnalytics(user.id, '12months')
        ]);

        const transformedLoans: ActiveLoan[] = loansData.map((loan: any) => ({
          id: loan.id,
          loan_request_id: loan.loanRequestId || loan.id,
          borrower: {
            id: loan.borrower?.id || loan.borrowerId,
            name: loan.borrower?.name || `${loan.borrower?.firstName} ${loan.borrower?.lastName}`,
            email: loan.borrower?.email || '',
            phone: loan.borrower?.phone || '',
            company: loan.borrower?.companyName || '',
            credit_score: loan.borrower?.creditScore || 0,
            verification_status: loan.borrower?.verificationStatus || 'pending'
          },
          cargo: {
            id: loan.cargo?.id || loan.cargoId,
            type: loan.cargo?.type || 'General Cargo',
            weight: loan.cargo?.weight || 0,
            value: loan.cargo?.value || 0,
            pickup_location: loan.cargo?.pickupLocation || '',
            delivery_location: loan.cargo?.deliveryLocation || '',
            distance: loan.cargo?.distance || 0,
            estimated_duration: loan.cargo?.estimatedDuration || 0
          },
          principal_amount: loan.principalAmount || 0,
          interest_rate: loan.interestRate || 0,
          loan_term_months: loan.loanTermMonths || 0,
          monthly_payment: loan.monthlyPayment || 0,
          total_amount: loan.totalAmount || 0,
          amount_disbursed: loan.amountDisbursed || 0,
          amount_repaid: loan.amountRepaid || 0,
          outstanding_balance: loan.outstandingBalance || 0,
          disbursement_date: loan.disbursementDate || loan.createdAt,
          maturity_date: loan.maturityDate || '',
          next_payment_date: loan.nextPaymentDate || '',
          next_payment_amount: loan.nextPaymentAmount || 0,
          status: loan.status || 'active',
          risk_score: loan.riskScore || 50,
          collateral_type: loan.collateralType,
          collateral_value: loan.collateralValue,
          performance_rating: loan.performanceRating || 'good',
          days_since_disbursement: loan.daysSinceDisbursement || 0,
          payments_made: loan.paymentsMade || 0,
          payments_remaining: loan.paymentsRemaining || 0,
          payment_schedule: loan.paymentSchedule || [],
          created_at: loan.createdAt
        }));

        setLoans(transformedLoans);
        setAnalytics(analyticsData);
      } catch (err: any) {
        console.error('Error fetching active loans:', err);
        setError(err.message || 'Failed to load active loans');
      } finally {
        setLoading(false);
      }
    };

    fetchActiveLoans();
  }, [user]);

  const toggleSort = (field: any) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const handleExport = () => {
    const csvData = filtered.map(loan => ({
      'Loan ID': loan.id,
      'Borrower Name': loan.borrower.name,
      'Principal Amount': loan.principal_amount,
      'Outstanding Balance': loan.outstanding_balance,
      'Status': loan.status,
      'Next Payment Date': new Date(loan.next_payment_date).toLocaleDateString(),
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `active-loans-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = loans.filter(loan => {
    const matchesSearch = !search || [
      loan.borrower.name,
      loan.borrower.company,
      loan.id
    ].some(field => field?.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    const matchesPerformance = performanceFilter === 'all' || loan.performance_rating === performanceFilter;

    return matchesSearch && matchesStatus && matchesPerformance;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'borrower_name') return a.borrower.name.localeCompare(b.borrower.name) * dir;
    if (sortBy === 'outstanding_balance') return (a.outstanding_balance - b.outstanding_balance) * dir;
    if (sortBy === 'disbursement_date') return (new Date(a.disbursement_date).getTime() - new Date(b.disbursement_date).getTime()) * dir;
    if (sortBy === 'next_payment_date') return (new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime()) * dir;
    return 0;
  });

  if (!user || user.role !== 'LENDER') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <FaExclamationTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-tight">Access Restricted</h2>
          <p className="text-gray-500 text-sm">Please authenticate as a Lender to access this console.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Active Loans Portfolio</h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">Monitor and manage your active loan portfolio performance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setGroupByStatus(false)}
                className={`p-1.5 rounded-lg transition-all ${!groupByStatus ? 'bg-slate-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Table View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setGroupByStatus(true)}
                className={`p-1.5 rounded-lg transition-all ${groupByStatus ? 'bg-slate-100 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                title="Grouped View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 transition-all w-fit"
            >
              <Search size={14} className="rotate-90" /> Export Portfolio
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative group min-w-[240px]">
                <input
                  type="text"
                  placeholder="SEARCH PORTFOLIO..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full bg-[#fafafa] transition-all shadow-sm"
                />
                <Search className="absolute left-3.5 top-3 text-slate-400 group-hover:text-indigo-500 transition-colors w-3.5 h-3.5" />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm cursor-pointer hover:border-indigo-200 transition-all"
                >
                  <option value="all">ALL STATUS</option>
                  <option value="active">ACTIVE</option>
                  <option value="overdue">OVERDUE</option>
                  <option value="defaulted">DEFAULTED</option>
                  <option value="early_repayment">EARLY REPAYMENT</option>
                </select>

                <select
                  value={performanceFilter}
                  onChange={(e) => setPerformanceFilter(e.target.value as any)}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm cursor-pointer hover:border-indigo-200 transition-all"
                >
                  <option value="all">ALL PERFORMANCE</option>
                  <option value="excellent">EXCELLENT</option>
                  <option value="good">GOOD</option>
                  <option value="fair">FAIR</option>
                  <option value="poor">POOR</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <ActiveLoansEnlite
          loading={loading}
          loans={sorted}
          analytics={analytics}
          onSort={toggleSort}
          sortKey={sortBy}
          sortDirection={sortDir}
          onViewDetails={(loan) => console.log('View details', loan)}
          onViewHistory={(loan) => console.log('View history', loan)}
          onContactBorrower={(loan) => console.log('Contact borrower', loan)}
          onExport={handleExport}
        />
      </div>
    </div>
  );
};

export default ActiveLoansPage;
