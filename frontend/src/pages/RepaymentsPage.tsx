import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { lendingApi } from '../services/lending/lendingApi';
import { 
  FaMoneyBillWave, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaSearch,
  FaDownload,
  FaEye,
  FaTimesCircle,
  FaCalendarAlt,
  FaUser,
  FaTruck,
  FaSortAmountDown,
  FaSortAmountUp,
  FaArrowUp,
  FaCreditCard,
  FaExclamationCircle,
  FaPhone,
  FaEnvelope,
  FaFileInvoice,
  FaPercent
} from 'react-icons/fa';

interface Payment {
  id: string;
  loanId: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial' | 'failed';
  paymentMethod?: 'bank_transfer' | 'ach' | 'wire' | 'check' | 'online';
  cargoType: string;
  route: {
    origin: string;
    destination: string;
  };
  loanAmount: number;
  remainingBalance: number;
  paymentNumber: number;
  totalPayments: number;
  daysOverdue?: number;
  lateFee?: number;
  partialAmount?: number;
  transactionId?: string;
  notes?: string;
  contactAttempts: number;
  lastContactDate?: string;
  autoPayEnabled: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

const RepaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [repayments, setRepayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [overdueFilter, setOverdueFilter] = useState<boolean>(false);
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Check authentication and get lender ID from user context
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-500">
            Please log in to access the repayments page.
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

  // Calculate repayment statistics
  const repaymentStats = useMemo(() => {
    const total = repayments.length;
    const pending = repayments.filter(p => p.status === 'pending').length;
    const overdue = repayments.filter(p => p.status === 'overdue').length;
    const paid = repayments.filter(p => p.status === 'paid').length;
    
    const totalAmount = repayments.reduce((sum, p) => sum + p.totalAmount, 0);
    const paidAmount = repayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.totalAmount, 0);
    const overdueAmount = repayments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + p.totalAmount + (p.lateFee || 0), 0);
    
    const collectionRate = total > 0 ? Math.round((paid / total) * 100) : 0;
    const avgDaysOverdue = repayments
      .filter(p => p.status === 'overdue' && p.daysOverdue)
      .reduce((sum, p, _, arr) => sum + (p.daysOverdue || 0) / arr.length, 0);

    return {
      total,
      pending,
      overdue,
      paid,
      totalAmount,
      paidAmount,
      overdueAmount,
      collectionRate,
      avgDaysOverdue: Math.round(avgDaysOverdue)
    };
  }, [repayments]);

  // Filter and sort repayments
  const filteredRepayments = useMemo(() => {
    let filtered = repayments.filter(payment => {
      const matchesSearch = !searchTerm || 
        payment.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.cargoType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      const matchesRisk = riskFilter === 'all' || payment.riskLevel === riskFilter;
      const matchesOverdue = !overdueFilter || payment.status === 'overdue';
      
      return matchesSearch && matchesStatus && matchesRisk && matchesOverdue;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof Payment];
      let bValue: any = b[sortField as keyof Payment];
      
      if (sortField === 'dueDate' || sortField === 'paidDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [repayments, searchTerm, statusFilter, riskFilter, overdueFilter, sortField, sortDirection]);

  useEffect(() => {
    // Only fetch data if authenticated and user has proper access
    if (!user || user.role !== 'LENDER') {
      return;
    }

    const fetchRepayments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch repayments from real API
        const repaymentData = await lendingApi.getLenderRepayments(lenderId, {
          limit: 100,
          page: 1
        });

        // Transform API data to match component interface
        const transformedRepayments: Payment[] = repaymentData.map((rep: any) => ({
          id: rep.id,
          loanId: rep.loan_request_id || rep.loanId,
          borrowerName: rep.loan?.borrower?.name || `${rep.loan?.borrower?.firstName || ''} ${rep.loan?.borrower?.lastName || ''}`.trim() || 'Unknown Borrower',
          borrowerEmail: rep.loan?.borrower?.email || '',
          borrowerPhone: rep.loan?.borrower?.phone || '',
          principalAmount: rep.principal_amount || rep.principalAmount || 0,
          interestAmount: rep.interest_amount || rep.interestAmount || 0,
          totalAmount: rep.total_amount || rep.totalAmount || 0,
          dueDate: rep.due_date || rep.dueDate || '',
          paidDate: rep.payment_date || rep.paidDate,
          status: rep.status || 'pending',
          paymentMethod: rep.payment_method || rep.paymentMethod,
          cargoType: rep.loan?.cargo?.type || rep.cargoType || 'General Cargo',
          route: {
            origin: rep.loan?.cargo?.pickupLocation || rep.route?.origin || '',
            destination: rep.loan?.cargo?.deliveryLocation || rep.route?.destination || ''
          },
          loanAmount: rep.loan?.requested_amount || rep.loanAmount || 0,
          remainingBalance: rep.remaining_balance || rep.remainingBalance || 0,
          paymentNumber: rep.payment_number || rep.paymentNumber || 1,
          totalPayments: rep.total_payments || rep.totalPayments || 12,
          daysOverdue: rep.days_overdue || rep.daysOverdue,
          lateFee: rep.late_fee || rep.lateFee,
          partialAmount: rep.partial_amount || rep.partialAmount,
          transactionId: rep.transaction_id || rep.transactionId,
          notes: rep.notes,
          contactAttempts: rep.contact_attempts || rep.contactAttempts || 0,
          lastContactDate: rep.last_contact_date || rep.lastContactDate,
          autoPayEnabled: rep.auto_pay_enabled || rep.autoPayEnabled || false,
          riskLevel: rep.risk_level || rep.riskLevel || 'medium'
        }));

        setRepayments(transformedRepayments);

      } catch (err: any) {
        console.error('Error fetching repayments:', err);
        console.error('API Error Details:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          url: err.config?.url,
          data: err.response?.data
        });
        
        setError(`Failed to load repayments: ${err.response?.status ? `${err.response.status} - ${err.response.statusText}` : err.message}`);
        
        // Use mock data as fallback if API fails
        setRepayments(mockRepayments);
      } finally {
        setLoading(false);
      }
    };

    fetchRepayments();
  }, [user, lenderId]);

  // Mock data for fallback or development
  const mockRepayments: Payment[] = [
    {
      id: 'PAY-001',
      loanId: 'LOAN-2024-001',
      borrowerName: 'TransGlobal Logistics',
      borrowerEmail: 'finance@transglobal.com',
      borrowerPhone: '+1-555-0123',
      principalAmount: 6250,
      interestAmount: 531.25,
      totalAmount: 6781.25,
      dueDate: '2024-08-15',
      status: 'pending',
      cargoType: 'Electronics',
      route: {
        origin: 'Los Angeles, CA',
        destination: 'New York, NY'
      },
      loanAmount: 75000,
      remainingBalance: 68750,
      paymentNumber: 1,
      totalPayments: 12,
      contactAttempts: 0,
      autoPayEnabled: true,
      riskLevel: 'low'
    },
    {
      id: 'PAY-002',
      loanId: 'LOAN-2024-002',
      borrowerName: 'Pacific Freight Solutions',
      borrowerEmail: 'admin@pacificfreight.com',
      borrowerPhone: '+1-555-0124',
      principalAmount: 2500,
      interestAmount: 230,
      totalAmount: 2730,
      dueDate: '2024-08-10',
      paidDate: '2024-08-12',
      status: 'paid',
      paymentMethod: 'bank_transfer',
      cargoType: 'Automotive Parts',
      route: {
        origin: 'Detroit, MI',
        destination: 'Seattle, WA'
      },
      loanAmount: 45000,
      remainingBalance: 42500,
      paymentNumber: 1,
      totalPayments: 18,
      contactAttempts: 0,
      transactionId: 'TXN-20240812-001',
      autoPayEnabled: false,
      riskLevel: 'low'
    },
    {
      id: 'PAY-003',
      loanId: 'LOAN-2024-003',
      borrowerName: 'Coastal Shipping Corp',
      borrowerEmail: 'finance@coastalship.com',
      borrowerPhone: '+1-555-0125',
      principalAmount: 5000,
      interestAmount: 325,
      totalAmount: 5325,
      dueDate: '2024-08-05',
      status: 'overdue',
      cargoType: 'Industrial Machinery',
      route: {
        origin: 'Houston, TX',
        destination: 'Miami, FL'
      },
      loanAmount: 120000,
      remainingBalance: 115000,
      paymentNumber: 1,
      totalPayments: 24,
      daysOverdue: 7,
      lateFee: 150,
      contactAttempts: 2,
      lastContactDate: '2024-08-11',
      autoPayEnabled: true,
      riskLevel: 'medium'
    },
    {
      id: 'PAY-004',
      loanId: 'LOAN-2024-004',
      borrowerName: 'Metro Transport LLC',
      borrowerEmail: 'operations@metrotransport.com',
      borrowerPhone: '+1-555-0126',
      principalAmount: 3555,
      interestAmount: 299.58,
      totalAmount: 3854.58,
      dueDate: '2024-08-08',
      status: 'partial',
      paymentMethod: 'ach',
      cargoType: 'Perishable Goods',
      route: {
        origin: 'Phoenix, AZ',
        destination: 'Denver, CO'
      },
      loanAmount: 32000,
      remainingBalance: 28445,
      paymentNumber: 1,
      totalPayments: 9,
      partialAmount: 2000,
      daysOverdue: 4,
      lateFee: 75,
      contactAttempts: 1,
      lastContactDate: '2024-08-10',
      transactionId: 'TXN-20240810-002',
      autoPayEnabled: false,
      riskLevel: 'high'
    },
    {
      id: 'PAY-005',
      loanId: 'LOAN-2024-005',
      borrowerName: 'Alpine Logistics Group',
      borrowerEmail: 'finance@alpinelogistics.com',
      borrowerPhone: '+1-555-0127',
      principalAmount: 5666.67,
      interestAmount: 542.92,
      totalAmount: 6209.59,
      dueDate: '2024-07-25',
      status: 'overdue',
      cargoType: 'Construction Materials',
      route: {
        origin: 'Atlanta, GA',
        destination: 'Chicago, IL'
      },
      loanAmount: 85000,
      remainingBalance: 79333.33,
      paymentNumber: 1,
      totalPayments: 15,
      daysOverdue: 18,
      lateFee: 300,
      contactAttempts: 5,
      lastContactDate: '2024-08-10',
      autoPayEnabled: false,
      riskLevel: 'high'
    },
    {
      id: 'PAY-006',
      loanId: 'LOAN-2024-001',
      borrowerName: 'TransGlobal Logistics',
      borrowerEmail: 'finance@transglobal.com',
      borrowerPhone: '+1-555-0123',
      principalAmount: 6250,
      interestAmount: 531.25,
      totalAmount: 6781.25,
      dueDate: '2024-09-15',
      status: 'pending',
      cargoType: 'Electronics',
      route: {
        origin: 'Los Angeles, CA',
        destination: 'New York, NY'
      },
      loanAmount: 75000,
      remainingBalance: 62500,
      paymentNumber: 2,
      totalPayments: 12,
      contactAttempts: 0,
      autoPayEnabled: true,
      riskLevel: 'low'
    }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading repayments...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && repayments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Repayments</h2>
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'paid': return <FaCheckCircle className="text-green-500" />;
      case 'overdue': return <FaExclamationTriangle className="text-red-500" />;
      case 'partial': return <FaExclamationCircle className="text-orange-500" />;
      case 'failed': return <FaTimesCircle className="text-red-600" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetails(true);
  };

  const handleExport = () => {
    const csvContent = [
      'Payment ID,Loan ID,Borrower,Amount,Principal,Interest,Due Date,Status,Days Overdue,Risk Level',
      ...filteredRepayments.map(p => 
        `${p.id},${p.loanId},${p.borrowerName},${p.totalAmount},${p.principalAmount},${p.interestAmount},${p.dueDate},${p.status},${p.daysOverdue || 0},${p.riskLevel}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'repayments-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isPaymentOverdue = (dueDate: string, status: string) => {
    return status === 'overdue' || (status === 'pending' && new Date(dueDate) < new Date());
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Repayments</h1>
          <p className="text-gray-600">Monitor and manage loan repayment schedules and collection activities</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{repaymentStats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaFileInvoice className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">Expected: ${repaymentStats.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Payments</p>
                <p className="text-2xl font-bold text-red-600">{repaymentStats.overdue}</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FaExclamationTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">Amount: ${repaymentStats.overdueAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold text-green-600">{repaymentStats.collectionRate}%</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaPercent className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <FaArrowUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+3%</span>
              <span className="text-gray-600 ml-1">this month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Collected Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${repaymentStats.paidAmount.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaMoneyBillWave className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">Avg delay: {repaymentStats.avgDaysOverdue} days</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by borrower, payment ID, loan ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
                <option value="failed">Failed</option>
              </select>

              {/* Risk Filter */}
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>

              {/* Overdue Toggle */}
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={overdueFilter}
                  onChange={(e) => setOverdueFilter(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Overdue Only</span>
              </label>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FaDownload className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Repayments Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      Payment Info
                      {sortField === 'id' && (
                        sortDirection === 'asc' ? <FaSortAmountUp className="h-3 w-3" /> : <FaSortAmountDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('borrowerName')}
                  >
                    <div className="flex items-center gap-1">
                      Borrower
                      {sortField === 'borrowerName' && (
                        sortDirection === 'asc' ? <FaSortAmountUp className="h-3 w-3" /> : <FaSortAmountDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalAmount')}
                  >
                    <div className="flex items-center gap-1">
                      Amount
                      {sortField === 'totalAmount' && (
                        sortDirection === 'asc' ? <FaSortAmountUp className="h-3 w-3" /> : <FaSortAmountDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center gap-1">
                      Due Date
                      {sortField === 'dueDate' && (
                        sortDirection === 'asc' ? <FaSortAmountUp className="h-3 w-3" /> : <FaSortAmountDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRepayments.map((payment) => (
                  <tr key={payment.id} className={`hover:bg-gray-50 ${isPaymentOverdue(payment.dueDate, payment.status) ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.id}</div>
                      <div className="text-sm text-gray-500">{payment.loanId}</div>
                      <div className="text-xs text-gray-400">
                        Payment {payment.paymentNumber}/{payment.totalPayments}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <FaUser className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{payment.borrowerName}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FaTruck className="h-3 w-3 mr-1" />
                            {payment.cargoType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${payment.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Principal: ${payment.principalAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Interest: ${payment.interestAmount.toLocaleString()}
                      </div>
                      {payment.lateFee && (
                        <div className="text-xs text-red-600">
                          Late Fee: ${payment.lateFee.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <FaCalendarAlt className="h-4 w-4 text-gray-400 mr-2" />
                        {new Date(payment.dueDate).toLocaleDateString()}
                      </div>
                      {payment.daysOverdue && payment.daysOverdue > 0 && (
                        <div className="text-sm text-red-600 mt-1">
                          {payment.daysOverdue} days overdue
                        </div>
                      )}
                      {payment.paidDate && (
                        <div className="text-sm text-green-600 mt-1">
                          Paid: {new Date(payment.paidDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status.toUpperCase()}
                        </span>
                      </div>
                      {payment.partialAmount && (
                        <div className="text-xs text-gray-500 mt-1">
                          Paid: ${payment.partialAmount.toLocaleString()}
                        </div>
                      )}
                      {payment.autoPayEnabled && (
                        <div className="flex items-center text-xs text-blue-600 mt-1">
                          <FaCreditCard className="h-3 w-3 mr-1" />
                          Auto-Pay
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(payment.riskLevel)}`}>
                        {payment.riskLevel.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Attempts: {payment.contactAttempts}
                      </div>
                      {payment.lastContactDate && (
                        <div className="text-xs text-gray-500">
                          Last: {new Date(payment.lastContactDate).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex gap-1 mt-1">
                        <button 
                          title="Call borrower"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaPhone className="h-3 w-3" />
                        </button>
                        <button 
                          title="Email borrower"
                          className="text-green-600 hover:text-green-800"
                        >
                          <FaEnvelope className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(payment)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <FaEye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRepayments.length === 0 && (
            <div className="text-center py-12">
              <FaFileInvoice className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No repayments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}
        </div>

        {/* Payment Details Modal */}
        {showDetails && selectedPayment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Payment Details - {selectedPayment.id}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Payment Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Amount:</span>
                      <span className="text-sm text-gray-900 font-medium">${selectedPayment.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Principal:</span>
                      <span className="text-sm text-gray-900">${selectedPayment.principalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Interest:</span>
                      <span className="text-sm text-gray-900">${selectedPayment.interestAmount.toLocaleString()}</span>
                    </div>
                    {selectedPayment.lateFee && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Late Fee:</span>
                        <span className="text-sm text-red-600">${selectedPayment.lateFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Payment:</span>
                      <span className="text-sm text-gray-900">{selectedPayment.paymentNumber} of {selectedPayment.totalPayments}</span>
                    </div>
                  </div>
                </div>

                {/* Loan Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Loan Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Loan ID:</span>
                      <span className="text-sm text-gray-900">{selectedPayment.loanId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Original Amount:</span>
                      <span className="text-sm text-gray-900">${selectedPayment.loanAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Remaining Balance:</span>
                      <span className="text-sm text-gray-900">${selectedPayment.remainingBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Cargo Type:</span>
                      <span className="text-sm text-gray-900">{selectedPayment.cargoType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Route:</span>
                      <span className="text-sm text-gray-900">{selectedPayment.route.origin} → {selectedPayment.route.destination}</span>
                    </div>
                  </div>
                </div>

                {/* Borrower Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Borrower Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Name:</span>
                      <span className="text-sm text-gray-900">{selectedPayment.borrowerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Email:</span>
                      <span className="text-sm text-gray-900">{selectedPayment.borrowerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Phone:</span>
                      <span className="text-sm text-gray-900">{selectedPayment.borrowerPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Risk Level:</span>
                      <span className={`text-sm px-2 py-1 rounded ${getRiskColor(selectedPayment.riskLevel)}`}>
                        {selectedPayment.riskLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collection Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Collection Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Contact Attempts:</span>
                      <span className="text-sm text-gray-900">{selectedPayment.contactAttempts}</span>
                    </div>
                    {selectedPayment.lastContactDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Last Contact:</span>
                        <span className="text-sm text-gray-900">{new Date(selectedPayment.lastContactDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Auto-Pay:</span>
                      <span className={`text-sm ${selectedPayment.autoPayEnabled ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedPayment.autoPayEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {selectedPayment.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Transaction ID:</span>
                        <span className="text-sm text-gray-900">{selectedPayment.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedPayment.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Notes</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">{selectedPayment.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                {selectedPayment.status === 'overdue' && (
                  <>
                    <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                      Send Reminder
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Contact Borrower
                    </button>
                  </>
                )}
                {(selectedPayment.status === 'pending' || selectedPayment.status === 'partial') && (
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepaymentsPage;
