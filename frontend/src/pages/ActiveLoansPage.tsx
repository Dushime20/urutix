import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { lendingApi } from '../services/lending/lendingApi';
import {
  FaSearch,
  FaEye,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChartLine,
  FaDollarSign,
  FaArrowUp,
  FaDownload,
  FaEllipsisH,
  FaHistory,
  FaEnvelope,
  FaBuilding,
  FaStar,
  FaBars,
  FaCalendarAlt,
  FaFileContract,
  FaPercent,
  FaPiggyBank,
  FaHandshake,
  FaTimesCircle
} from 'react-icons/fa';

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

const mockFetchActiveLoans = async (): Promise<ActiveLoan[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return [
    {
      id: 'loan_001',
      loan_request_id: 'req_001',
      borrower: {
        id: 'borrower_001',
        name: 'Jean Baptiste Uwimana',
        email: 'jean@cargoservices.rw',
        phone: '+250788123456',
        company: 'Kigali Cargo Services',
        credit_score: 750,
        verification_status: 'verified'
      },
      cargo: {
        id: 'cargo_001',
        type: 'Electronics',
        weight: 2500,
        value: 25000000,
        pickup_location: 'Kigali, Rwanda',
        delivery_location: 'Kampala, Uganda',
        distance: 380,
        estimated_duration: 8
      },
      principal_amount: 15000000,
      interest_rate: 12.5,
      loan_term_months: 12,
      monthly_payment: 1406250,
      total_amount: 16875000,
      amount_disbursed: 15000000,
      amount_repaid: 4218750,
      outstanding_balance: 11656250,
      disbursement_date: '2025-06-15T10:00:00Z',
      maturity_date: '2026-06-15T10:00:00Z',
      next_payment_date: '2025-09-15T10:00:00Z',
      next_payment_amount: 1406250,
      status: 'active',
      risk_score: 78,
      collateral_type: 'Vehicle',
      collateral_value: 18000000,
      performance_rating: 'excellent',
      days_since_disbursement: 58,
      payments_made: 3,
      payments_remaining: 9,
      payment_schedule: [
        { payment_number: 1, due_date: '2025-07-15T10:00:00Z', amount: 1406250, status: 'paid', paid_date: '2025-07-14T09:30:00Z' },
        { payment_number: 2, due_date: '2025-08-15T10:00:00Z', amount: 1406250, status: 'paid', paid_date: '2025-08-15T08:45:00Z' },
        { payment_number: 3, due_date: '2025-09-15T10:00:00Z', amount: 1406250, status: 'pending' },
        { payment_number: 4, due_date: '2025-10-15T10:00:00Z', amount: 1406250, status: 'pending' },
      ],
      created_at: '2025-06-10T14:30:00Z'
    },
    {
      id: 'loan_002',
      loan_request_id: 'req_002',
      borrower: {
        id: 'borrower_002',
        name: 'Marie Claire Mukamana',
        email: 'marie@expresstransport.rw',
        phone: '+250788654321',
        company: 'Express Transport Ltd',
        credit_score: 680,
        verification_status: 'verified'
      },
      cargo: {
        id: 'cargo_002',
        type: 'Textiles',
        weight: 1800,
        value: 12000000,
        pickup_location: 'Nairobi, Kenya',
        delivery_location: 'Dar es Salaam, Tanzania',
        distance: 460,
        estimated_duration: 10
      },
      principal_amount: 8500000,
      interest_rate: 14.0,
      loan_term_months: 12,
      monthly_payment: 807500,
      total_amount: 9690000,
      amount_disbursed: 8500000,
      amount_repaid: 1615000,
      outstanding_balance: 7075000,
      disbursement_date: '2025-07-01T14:00:00Z',
      maturity_date: '2026-07-01T14:00:00Z',
      next_payment_date: '2025-09-01T14:00:00Z',
      next_payment_amount: 807500,
      status: 'active',
      risk_score: 85,
      collateral_type: 'Cargo',
      collateral_value: 12000000,
      performance_rating: 'good',
      days_since_disbursement: 42,
      payments_made: 2,
      payments_remaining: 10,
      payment_schedule: [
        { payment_number: 1, due_date: '2025-08-01T14:00:00Z', amount: 807500, status: 'paid', paid_date: '2025-08-01T13:15:00Z' },
        { payment_number: 2, due_date: '2025-09-01T14:00:00Z', amount: 807500, status: 'pending' },
      ],
      created_at: '2025-06-25T10:15:00Z'
    },
    {
      id: 'loan_003',
      loan_request_id: 'req_003',
      borrower: {
        id: 'borrower_003',
        name: 'Paul Ntakirutimana',
        email: 'paul@elitecargo.rw',
        phone: '+250788111222',
        company: 'Elite Cargo Services',
        credit_score: 720,
        verification_status: 'verified'
      },
      cargo: {
        id: 'cargo_003',
        type: 'Machinery',
        weight: 4200,
        value: 45000000,
        pickup_location: 'Durban, South Africa',
        delivery_location: 'Kigali, Rwanda',
        distance: 2100,
        estimated_duration: 48
      },
      principal_amount: 22000000,
      interest_rate: 11.0,
      loan_term_months: 18,
      monthly_payment: 1450000,
      total_amount: 26100000,
      amount_disbursed: 22000000,
      amount_repaid: 2900000,
      outstanding_balance: 23200000,
      disbursement_date: '2025-05-20T09:00:00Z',
      maturity_date: '2026-11-20T09:00:00Z',
      next_payment_date: '2025-08-20T09:00:00Z',
      next_payment_amount: 1450000,
      status: 'overdue',
      risk_score: 92,
      collateral_type: 'Real Estate',
      collateral_value: 30000000,
      performance_rating: 'fair',
      days_since_disbursement: 84,
      payments_made: 2,
      payments_remaining: 16,
      payment_schedule: [
        { payment_number: 1, due_date: '2025-06-20T09:00:00Z', amount: 1450000, status: 'paid', paid_date: '2025-06-19T16:30:00Z' },
        { payment_number: 2, due_date: '2025-07-20T09:00:00Z', amount: 1450000, status: 'paid', paid_date: '2025-07-22T11:45:00Z' },
        { payment_number: 3, due_date: '2025-08-20T09:00:00Z', amount: 1450000, status: 'overdue' },
      ],
      created_at: '2025-05-15T16:45:00Z'
    },
    {
      id: 'loan_004',
      loan_request_id: 'req_004',
      borrower: {
        id: 'borrower_004',
        name: 'Grace Mukamana',
        email: 'grace@freightco.rw',
        phone: '+250788777888',
        company: 'Freight Solutions Co.',
        credit_score: 590,
        verification_status: 'verified'
      },
      cargo: {
        id: 'cargo_004',
        type: 'Construction Materials',
        weight: 3500,
        value: 15000000,
        pickup_location: 'Mombasa, Kenya',
        delivery_location: 'Kigali, Rwanda',
        distance: 1100,
        estimated_duration: 20
      },
      principal_amount: 7500000,
      interest_rate: 16.0,
      loan_term_months: 12,
      monthly_payment: 725000,
      total_amount: 8700000,
      amount_disbursed: 7500000,
      amount_repaid: 0,
      outstanding_balance: 8700000,
      disbursement_date: '2025-07-25T11:30:00Z',
      maturity_date: '2026-07-25T11:30:00Z',
      next_payment_date: '2025-08-25T11:30:00Z',
      next_payment_amount: 725000,
      status: 'overdue',
      risk_score: 65,
      collateral_type: 'Equipment',
      collateral_value: 10000000,
      performance_rating: 'poor',
      days_since_disbursement: 18,
      payments_made: 0,
      payments_remaining: 12,
      payment_schedule: [
        { payment_number: 1, due_date: '2025-08-25T11:30:00Z', amount: 725000, status: 'overdue' },
      ],
      created_at: '2025-07-20T08:30:00Z'
    },
    {
      id: 'loan_005',
      loan_request_id: 'req_005',
      borrower: {
        id: 'borrower_005',
        name: 'Eric Habimana',
        email: 'eric@medicaltransport.rw',
        phone: '+250788555666',
        company: 'Medical Transport Solutions',
        credit_score: 640,
        verification_status: 'verified'
      },
      cargo: {
        id: 'cargo_005',
        type: 'Medical Supplies',
        weight: 800,
        value: 20000000,
        pickup_location: 'Mumbai, India',
        delivery_location: 'Kigali, Rwanda',
        distance: 6500,
        estimated_duration: 120
      },
      principal_amount: 12800000,
      interest_rate: 13.5,
      loan_term_months: 12,
      monthly_payment: 1216533,
      total_amount: 14598400,
      amount_disbursed: 12800000,
      amount_repaid: 2433066,
      outstanding_balance: 12165334,
      disbursement_date: '2025-06-01T15:00:00Z',
      maturity_date: '2026-06-01T15:00:00Z',
      next_payment_date: '2025-09-01T15:00:00Z',
      next_payment_amount: 1216533,
      status: 'active',
      risk_score: 88,
      collateral_type: 'Cargo',
      collateral_value: 20000000,
      performance_rating: 'good',
      days_since_disbursement: 72,
      payments_made: 2,
      payments_remaining: 10,
      payment_schedule: [
        { payment_number: 1, due_date: '2025-07-01T15:00:00Z', amount: 1216533, status: 'paid', paid_date: '2025-06-30T14:00:00Z' },
        { payment_number: 2, due_date: '2025-08-01T15:00:00Z', amount: 1216533, status: 'paid', paid_date: '2025-08-01T10:30:00Z' },
        { payment_number: 3, due_date: '2025-09-01T15:00:00Z', amount: 1216533, status: 'pending' },
      ],
      created_at: '2025-05-25T11:00:00Z'
    }
  ];
};

const mockFetchPortfolioAnalytics = async (): Promise<LoanPortfolioAnalytics> => {
  return {
    totalActiveLoans: 5,
    totalOutstanding: 62796584,
    totalDisbursed: 65800000,
    totalRepaid: 11166816,
    averageInterestRate: 13.4,
    portfolioYield: 14.2,
    defaultRate: 2.1,
    onTimePaymentRate: 87.5,
    monthlyCollections: 6605533,
    expectedMonthlyIncome: 7500000
  };
};

// Helper functions for styling
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-50 text-green-700 border-green-200';
    case 'overdue': return 'bg-red-50 text-red-700 border-red-200';
    case 'defaulted': return 'bg-red-100 text-red-800 border-red-300';
    case 'early_repayment': return 'bg-blue-50 text-blue-700 border-blue-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getPerformanceColor = (rating: string) => {
  switch (rating) {
    case 'excellent': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'good': return 'bg-green-50 text-green-700 border-green-200';
    case 'fair': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'poor': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-200';
  }
};

const getRiskScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const ActiveLoansPage: React.FC = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<ActiveLoan[]>([]);
  const [analytics, setAnalytics] = useState<LoanPortfolioAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'disbursement_date' | 'outstanding_balance' | 'next_payment_date' | 'borrower_name'>('disbursement_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [openActionRow, setOpenActionRow] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'overdue' | 'defaulted' | 'early_repayment'>('all');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'excellent' | 'good' | 'fair' | 'poor'>('all');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [groupByStatus, setGroupByStatus] = useState(false);

  // Check authentication and get lender ID from user context
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-500">
            Please log in to access the active loans page.
          </p>
        </div>
      </div>
    );
  }

  if (user.role !== 'LENDER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-500">
            This page is only accessible to lenders.
          </p>
        </div>
      </div>
    );
  }

  const lenderId = user.id;

  useEffect(() => {
    // Only fetch data if authenticated and user has proper access
    if (!user || user.role !== 'LENDER') {
      return;
    }

    const fetchActiveLoans = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch active loans and analytics from real APIs
        const [loansData, analyticsData] = await Promise.all([
          lendingApi.getActiveLoans(lenderId),
          lendingApi.getLenderAnalytics(lenderId, '12months')
        ]);

        // Transform API data to match component interface
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

        const transformedAnalytics: LoanPortfolioAnalytics = {
          totalActiveLoans: analyticsData.totalActiveLoans || transformedLoans.length,
          totalOutstanding: analyticsData.totalOutstanding || 0,
          totalDisbursed: analyticsData.totalDisbursed || 0,
          totalRepaid: analyticsData.totalRepaid || 0,
          averageInterestRate: analyticsData.averageInterestRate || 0,
          portfolioYield: analyticsData.portfolioYield || 0,
          defaultRate: analyticsData.defaultRate || 0,
          onTimePaymentRate: analyticsData.onTimePaymentRate || 0,
          monthlyCollections: analyticsData.monthlyCollections || 0,
          expectedMonthlyIncome: analyticsData.expectedMonthlyIncome || 0
        };

        setLoans(transformedLoans);
        setAnalytics(transformedAnalytics);

      } catch (err: any) {
        console.error('Error fetching active loans:', err);
        setError(err.message || 'Failed to load active loans');
        
        // Fallback to mock data if API fails
        try {
          const [mockLoansData, mockAnalyticsData] = await Promise.all([
            mockFetchActiveLoans(),
            mockFetchPortfolioAnalytics()
          ]);
          setLoans(mockLoansData);
          setAnalytics(mockAnalyticsData);
        } catch {
          setLoans([]);
          setAnalytics(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActiveLoans();
  }, [user, lenderId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading active loans...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && loans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Loans</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const toggleSort = (field: 'disbursement_date' | 'outstanding_balance' | 'next_payment_date' | 'borrower_name') => {
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
      'Company': loan.borrower.company || 'N/A',
      'Principal Amount': loan.principal_amount,
      'Outstanding Balance': loan.outstanding_balance,
      'Interest Rate': loan.interest_rate + '%',
      'Monthly Payment': loan.monthly_payment,
      'Status': loan.status,
      'Performance': loan.performance_rating,
      'Next Payment Date': new Date(loan.next_payment_date).toLocaleDateString(),
      'Next Payment Amount': loan.next_payment_amount,
      'Disbursement Date': new Date(loan.disbursement_date).toLocaleDateString(),
      'Maturity Date': new Date(loan.maturity_date).toLocaleDateString(),
      'Payments Made': loan.payments_made,
      'Payments Remaining': loan.payments_remaining,
      'Risk Score': loan.risk_score,
      'Cargo Type': loan.cargo.type
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
    if (!search && statusFilter === 'all' && performanceFilter === 'all') return true;
    
    const matchesSearch = !search || [
      loan.borrower.name,
      loan.borrower.email,
      loan.borrower.company,
      loan.cargo.type,
      loan.cargo.pickup_location,
      loan.cargo.delivery_location,
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

  // Group by status if enabled
  const groupedByStatus = sorted.reduce((groups, loan) => {
    if (!groups[loan.status]) {
      groups[loan.status] = [];
    }
    groups[loan.status].push(loan);
    return groups;
  }, {} as Record<string, ActiveLoan[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Active Loans Portfolio</h1>
            <p className="text-gray-600 mt-1">Monitor and manage your active loan portfolio performance</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGroupByStatus(!groupByStatus)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                groupByStatus 
                  ? 'bg-purple-50 border-purple-200 text-purple-700' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <FaBars className="text-purple-600" />
              {groupByStatus ? 'Grouped by Status' : 'Group by Status'}
            </button>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaChartLine className="text-green-600" />
              {showAnalytics ? 'Hide' : 'Show'} Analytics
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaDownload className="text-blue-600" /> Export
            </button>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {showAnalytics && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Active Loans</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.totalActiveLoans}</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                    <FaArrowUp /> Portfolio growing
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaFileContract className="text-green-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Outstanding Balance</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">RWF {(analytics.totalOutstanding / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-2">
                    <FaDollarSign /> Active capital
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaMoneyBillWave className="text-blue-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Portfolio Yield</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.portfolioYield.toFixed(1)}%</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-2">
                    <FaPercent /> Avg rate: {analytics.averageInterestRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FaPiggyBank className="text-emerald-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">On-Time Payment Rate</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.onTimePaymentRate.toFixed(1)}%</p>
                  <p className="text-xs text-purple-600 flex items-center gap-1 mt-2">
                    <FaHandshake /> Default: {analytics.defaultRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-purple-600 text-xl" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Loans Management Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Active Loan Portfolio</h2>
                <p className="text-sm text-gray-500 mt-1">Monitor loan performance, payments, and borrower status</p>
              </div>
              
              {/* Advanced Filters */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search loans..."
                    className="pl-10 pr-3 py-2 w-full sm:w-64 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="overdue">Overdue</option>
                  <option value="defaulted">Defaulted</option>
                  <option value="early_repayment">Early Repayment</option>
                </select>
                
                <select
                  value={performanceFilter}
                  onChange={e => setPerformanceFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="all">All Performance</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading && (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_,i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                ))}
              </div>
            )}

            {!loading && sorted.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  <FaFileContract className="text-green-500 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No active loans found</h3>
                <p className="text-gray-500 text-sm mb-6">
                  {search || statusFilter !== 'all' || performanceFilter !== 'all'
                    ? 'Try adjusting your filters or search terms.'
                    : 'No loans have been disbursed yet.'
                  }
                </p>
              </div>
            )}

            {!loading && sorted.length > 0 && (
              <div className="relative">
                {groupByStatus ? (
                  // Grouped by Status View
                  <div className="space-y-6">
                    {Object.entries(groupedByStatus).map(([status, statusLoans]) => (
                      <div key={status} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Status Header */}
                        <div className={`px-6 py-4 border-b border-gray-200 ${
                          status === 'active' ? 'bg-green-50' :
                          status === 'overdue' ? 'bg-red-50' :
                          status === 'defaulted' ? 'bg-red-100' : 'bg-blue-50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(status)}`}>
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                {status.charAt(0).toUpperCase() + status.slice(1)} Loans
                              </span>
                              <span className="text-sm text-gray-600">
                                {statusLoans.length} loan{statusLoans.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                RWF {(statusLoans.reduce((sum, loan) => sum + loan.outstanding_balance, 0) / 1000000).toFixed(1)}M
                              </div>
                              <div className="text-xs text-gray-500">Outstanding balance</div>
                            </div>
                          </div>
                        </div>

                        {/* Loans Table for this Status */}
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600 select-none">
                              <tr>
                                <th className="pl-6 pr-3 py-3 font-semibold text-left">Borrower</th>
                                <th className="px-3 py-3 font-semibold text-left">Loan Details</th>
                                <th className="px-3 py-3 font-semibold text-left">Outstanding</th>
                                <th className="px-3 py-3 font-semibold text-left">Next Payment</th>
                                <th className="px-3 py-3 font-semibold text-left">Performance</th>
                                <th className="px-3 py-3 font-semibold text-left">Cargo Info</th>
                                <th className="pr-6 pl-3 py-3 font-semibold text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {statusLoans.map((loan) => (
                                <tr key={loan.id} className="group hover:bg-green-50/60 transition-colors">
                                  <td className="pl-6 pr-3 py-4 align-middle">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                        loan.performance_rating === 'excellent' ? 'bg-emerald-500' :
                                        loan.performance_rating === 'good' ? 'bg-green-500' :
                                        loan.performance_rating === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}>
                                        {loan.borrower.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-gray-900">{loan.borrower.name}</p>
                                        {loan.borrower.company && (
                                          <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <FaBuilding className="text-xs" />
                                            {loan.borrower.company}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                          <FaEnvelope className="text-xs" />
                                          {loan.borrower.email}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 align-middle">
                                    <div className="space-y-1">
                                      <p className="font-semibold text-gray-900">RWF {(loan.principal_amount / 1000000).toFixed(1)}M</p>
                                      <p className="text-sm text-gray-600">{loan.interest_rate}% • {loan.loan_term_months} months</p>
                                      <p className="text-xs text-gray-500">
                                        Loan #{loan.id.slice(-6)}
                                      </p>
                                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getRiskScoreColor(loan.risk_score)}`}>
                                        <FaStar className="w-3 h-3" />
                                        Risk: {loan.risk_score}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 align-middle">
                                    <div className="space-y-1">
                                      <p className="font-semibold text-gray-900">RWF {(loan.outstanding_balance / 1000000).toFixed(1)}M</p>
                                      <p className="text-sm text-gray-600">
                                        Paid: RWF {(loan.amount_repaid / 1000000).toFixed(1)}M
                                      </p>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-green-600 h-2 rounded-full" 
                                          style={{ width: `${(loan.amount_repaid / loan.total_amount) * 100}%` }}
                                        ></div>
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {((loan.amount_repaid / loan.total_amount) * 100).toFixed(1)}% repaid
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 align-middle">
                                    <div className="space-y-1">
                                      <p className="font-semibold text-gray-900">
                                        RWF {(loan.next_payment_amount / 1000).toFixed(0)}K
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {new Date(loan.next_payment_date).toLocaleDateString()}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {loan.payments_made}/{loan.payments_made + loan.payments_remaining} payments
                                      </p>
                                      {loan.status === 'overdue' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                          <FaExclamationTriangle className="w-3 h-3" />
                                          Overdue
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 align-middle">
                                    <div className="space-y-1">
                                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPerformanceColor(loan.performance_rating)}`}>
                                        <FaStar className="w-3 h-3" />
                                        {loan.performance_rating.charAt(0).toUpperCase() + loan.performance_rating.slice(1)}
                                      </span>
                                      <p className="text-sm text-gray-600">Credit: {loan.borrower.credit_score}</p>
                                      <p className="text-xs text-gray-500">
                                        {loan.days_since_disbursement} days active
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 align-middle">
                                    <div className="space-y-1">
                                      <p className="font-medium text-gray-900">{loan.cargo.type}</p>
                                      <p className="text-sm text-gray-600">{loan.cargo.weight}kg</p>
                                      <p className="text-xs text-gray-500">
                                        {loan.cargo.pickup_location} → {loan.cargo.delivery_location}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {loan.cargo.distance}km • {loan.cargo.estimated_duration}h
                                      </p>
                                    </div>
                                  </td>
                                  <td className="pr-6 pl-3 py-4 text-right relative">
                                    <div className="inline-flex items-center gap-1">
                                      <button
                                        onClick={() => setOpenActionRow(r => r === loan.id ? null : loan.id)}
                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
                                        title="More Actions"
                                      >
                                        <FaEllipsisH />
                                      </button>
                                    </div>
                                    {openActionRow === loan.id && (
                                      <div className="absolute right-6 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1 text-sm">
                                        <button
                                          onClick={() => { setOpenActionRow(null); }}
                                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                                        >
                                          <FaEye className="text-blue-500" /> View Details
                                        </button>
                                        <button
                                          onClick={() => { setOpenActionRow(null); }}
                                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                                        >
                                          <FaHistory className="text-purple-500" /> Payment History
                                        </button>
                                        <button
                                          onClick={() => { setOpenActionRow(null); }}
                                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                                        >
                                          <FaCalendarAlt className="text-green-500" /> Payment Schedule
                                        </button>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button
                                          onClick={() => { setOpenActionRow(null); }}
                                          className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-600 flex items-center gap-2"
                                        >
                                          <FaEnvelope className="text-blue-500" /> Contact Borrower
                                        </button>
                                        {loan.status === 'overdue' && (
                                          <button
                                            onClick={() => { setOpenActionRow(null); }}
                                            className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                                          >
                                            <FaTimesCircle className="text-red-500" /> Mark Default
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Standard Ungrouped View
                  <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600 select-none">
                        <tr>
                          <th onClick={() => toggleSort('borrower_name')} className="pl-6 pr-3 py-4 font-semibold text-left cursor-pointer group">
                            <div className="inline-flex items-center gap-1">
                              Borrower
                              {sortBy === 'borrower_name' && <span className="text-[10px] font-normal">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                              {sortBy !== 'borrower_name' && <span className="opacity-0 group-hover:opacity-60 transition">⇅</span>}
                            </div>
                          </th>
                          <th className="px-3 py-4 font-semibold text-left">Loan Details</th>
                          <th onClick={() => toggleSort('outstanding_balance')} className="px-3 py-4 font-semibold text-left cursor-pointer group">
                            <div className="inline-flex items-center gap-1">
                              Outstanding
                              {sortBy === 'outstanding_balance' && <span className="text-[10px] font-normal">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                              {sortBy !== 'outstanding_balance' && <span className="opacity-0 group-hover:opacity-60 transition">⇅</span>}
                            </div>
                          </th>
                          <th onClick={() => toggleSort('next_payment_date')} className="px-3 py-4 font-semibold text-left cursor-pointer group">
                            <div className="inline-flex items-center gap-1">
                              Next Payment
                              {sortBy === 'next_payment_date' && <span className="text-[10px] font-normal">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                              {sortBy !== 'next_payment_date' && <span className="opacity-0 group-hover:opacity-60 transition">⇅</span>}
                            </div>
                          </th>
                          <th className="px-3 py-4 font-semibold text-left">Status & Performance</th>
                          <th className="px-3 py-4 font-semibold text-left">Cargo Info</th>
                          <th className="pr-6 pl-3 py-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {sorted.map((loan) => (
                          <tr key={loan.id} className="group hover:bg-green-50/60 transition-colors">
                            <td className="pl-6 pr-3 py-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                  loan.performance_rating === 'excellent' ? 'bg-emerald-500' :
                                  loan.performance_rating === 'good' ? 'bg-green-500' :
                                  loan.performance_rating === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}>
                                  {loan.borrower.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{loan.borrower.name}</p>
                                  {loan.borrower.company && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <FaBuilding className="text-xs" />
                                      {loan.borrower.company}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                    <FaEnvelope className="text-xs" />
                                    {loan.borrower.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-4 align-middle">
                              <div className="space-y-1">
                                <p className="font-semibold text-gray-900">RWF {(loan.principal_amount / 1000000).toFixed(1)}M</p>
                                <p className="text-sm text-gray-600">{loan.interest_rate}% • {loan.loan_term_months} months</p>
                                <p className="text-xs text-gray-500">
                                  Loan #{loan.id.slice(-6)}
                                </p>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getRiskScoreColor(loan.risk_score)}`}>
                                  <FaStar className="w-3 h-3" />
                                  Risk: {loan.risk_score}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-4 align-middle">
                              <div className="space-y-1">
                                <p className="font-semibold text-gray-900">RWF {(loan.outstanding_balance / 1000000).toFixed(1)}M</p>
                                <p className="text-sm text-gray-600">
                                  Paid: RWF {(loan.amount_repaid / 1000000).toFixed(1)}M
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full" 
                                    style={{ width: `${(loan.amount_repaid / loan.total_amount) * 100}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {((loan.amount_repaid / loan.total_amount) * 100).toFixed(1)}% repaid
                                </p>
                              </div>
                            </td>
                            <td className="px-3 py-4 align-middle">
                              <div className="space-y-1">
                                <p className="font-semibold text-gray-900">
                                  RWF {(loan.next_payment_amount / 1000).toFixed(0)}K
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(loan.next_payment_date).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {loan.payments_made}/{loan.payments_made + loan.payments_remaining} payments
                                </p>
                                {loan.status === 'overdue' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                    <FaExclamationTriangle className="w-3 h-3" />
                                    Overdue
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-4 align-middle">
                              <div className="space-y-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                  {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                                </span>
                                <div>
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPerformanceColor(loan.performance_rating)}`}>
                                    <FaStar className="w-3 h-3" />
                                    {loan.performance_rating.charAt(0).toUpperCase() + loan.performance_rating.slice(1)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {loan.days_since_disbursement} days active
                                </p>
                              </div>
                            </td>
                            <td className="px-3 py-4 align-middle">
                              <div className="space-y-1">
                                <p className="font-medium text-gray-900">{loan.cargo.type}</p>
                                <p className="text-sm text-gray-600">{loan.cargo.weight}kg</p>
                                <p className="text-xs text-gray-500">
                                  {loan.cargo.pickup_location} → {loan.cargo.delivery_location}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {loan.cargo.distance}km • {loan.cargo.estimated_duration}h
                                </p>
                              </div>
                            </td>
                            <td className="pr-6 pl-3 py-4 text-right relative">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => setOpenActionRow(r => r === loan.id ? null : loan.id)}
                                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
                                  title="More Actions"
                                >
                                  <FaEllipsisH />
                                </button>
                              </div>
                              {openActionRow === loan.id && (
                                <div className="absolute right-6 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1 text-sm">
                                  <button
                                    onClick={() => { setOpenActionRow(null); }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                                  >
                                    <FaEye className="text-blue-500" /> View Details
                                  </button>
                                  <button
                                    onClick={() => { setOpenActionRow(null); }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                                  >
                                    <FaHistory className="text-purple-500" /> Payment History
                                  </button>
                                  <button
                                    onClick={() => { setOpenActionRow(null); }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                                  >
                                    <FaCalendarAlt className="text-green-500" /> Payment Schedule
                                  </button>
                                  <div className="border-t border-gray-100 my-1"></div>
                                  <button
                                    onClick={() => { setOpenActionRow(null); }}
                                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-600 flex items-center gap-2"
                                  >
                                    <FaEnvelope className="text-blue-500" /> Contact Borrower
                                  </button>
                                  {loan.status === 'overdue' && (
                                    <button
                                      onClick={() => { setOpenActionRow(null); }}
                                      className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                                    >
                                      <FaTimesCircle className="text-red-500" /> Mark Default
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                  <span>{sorted.length} loan{sorted.length !== 1 && 's'} shown</span>
                  <div className="flex items-center gap-4">
                    <span className="hidden sm:inline">Sorted by {sortBy} ({sortDir})</span>
                    <span>Total Outstanding: RWF {(sorted.reduce((acc, loan) => acc + loan.outstanding_balance, 0) / 1000000).toFixed(1)}M</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveLoansPage;
