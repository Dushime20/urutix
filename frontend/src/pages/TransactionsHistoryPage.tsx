import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { 
  FaHistory,
  FaSearch,
  FaDownload,
  FaEye,
  FaPrint,
  FaDollarSign,
  FaPercent,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaUser,
  FaFileAlt,
  FaExchangeAlt,
  FaReceipt,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTimes
} from 'react-icons/fa';

interface Transaction {
  id: string;
  date: string;
  type: 'loan_disbursement' | 'loan_repayment' | 'interest_payment' | 'fee_collection' | 'penalty' | 'refund';
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  borrowerName: string;
  borrowerBusiness: string;
  loanId: string;
  description: string;
  reference: string;
  method: 'bank_transfer' | 'wire' | 'ach' | 'check' | 'cash';
  category: 'lending' | 'collections' | 'fees' | 'other';
  balanceBefore: number;
  balanceAfter: number;
  notes?: string;
}

interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  totalIncoming: number;
  totalOutgoing: number;
  pendingAmount: number;
  completedAmount: number;
}

const TransactionsHistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lender ID - would typically come from context or auth
  const lenderId = "89fa1340-429e-448f-a19d-0e987679d7cd";

  // Mock data for fallback
  const mockTransactions: Transaction[] = [
    {
      id: 'TXN001',
      date: '2024-01-15T10:30:00Z',
      type: 'loan_disbursement',
      amount: -75000,
      status: 'completed',
      borrowerName: 'John Smith',
      borrowerBusiness: 'Smith Logistics LLC',
      loanId: 'LOAN001',
      description: 'Initial loan disbursement for fleet expansion',
      reference: 'REF-001-2024',
      method: 'wire',
      category: 'lending',
      balanceBefore: 500000,
      balanceAfter: 425000
    },
    {
      id: 'TXN002',
      date: '2024-01-14T14:15:00Z',
      type: 'loan_repayment',
      amount: 8500,
      status: 'completed',
      borrowerName: 'Maria Garcia',
      borrowerBusiness: 'Garcia Freight Solutions',
      loanId: 'LOAN002',
      description: 'Monthly loan repayment - Principal + Interest',
      reference: 'REF-002-2024',
      method: 'ach',
      category: 'collections',
      balanceBefore: 425000,
      balanceAfter: 433500
    },
    {
      id: 'TXN003',
      date: '2024-01-13T09:45:00Z',
      type: 'interest_payment',
      amount: 2750,
      status: 'completed',
      borrowerName: 'David Chen',
      borrowerBusiness: 'Chen Import Export',
      loanId: 'LOAN003',
      description: 'Interest payment for Q1 2024',
      reference: 'REF-003-2024',
      method: 'bank_transfer',
      category: 'collections',
      balanceBefore: 433500,
      balanceAfter: 436250
    },
    {
      id: 'TXN004',
      date: '2024-01-12T16:20:00Z',
      type: 'fee_collection',
      amount: 500,
      status: 'completed',
      borrowerName: 'Sarah Johnson',
      borrowerBusiness: 'Johnson Cargo Services',
      loanId: 'LOAN004',
      description: 'Processing fee for loan application',
      reference: 'REF-004-2024',
      method: 'ach',
      category: 'fees',
      balanceBefore: 436250,
      balanceAfter: 436750
    },
    {
      id: 'TXN005',
      date: '2024-01-11T11:10:00Z',
      type: 'loan_disbursement',
      amount: -150000,
      status: 'pending',
      borrowerName: 'Robert Wilson',
      borrowerBusiness: 'Wilson Transportation Inc',
      loanId: 'LOAN005',
      description: 'Loan disbursement for warehouse acquisition',
      reference: 'REF-005-2024',
      method: 'wire',
      category: 'lending',
      balanceBefore: 436750,
      balanceAfter: 286750
    },
    {
      id: 'TXN006',
      date: '2024-01-10T13:30:00Z',
      type: 'penalty',
      amount: 750,
      status: 'completed',
      borrowerName: 'Lisa Brown',
      borrowerBusiness: 'Brown Delivery Systems',
      loanId: 'LOAN006',
      description: 'Late payment penalty fee',
      reference: 'REF-006-2024',
      method: 'ach',
      category: 'fees',
      balanceBefore: 286750,
      balanceAfter: 287500
    }
  ];

  // Load transactions on component mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch disbursements and repayments from API
        const [disbursements, repayments] = await Promise.all([
          lendingApi.getLenderDisbursements(lenderId, { page: 1, limit: 100 }),
          lendingApi.getLenderRepayments(lenderId, { page: 1, limit: 100 })
        ]);

        // Transform disbursements to Transaction format
        const disbursementTransactions: Transaction[] = (disbursements || []).map((d: any) => ({
          id: d.id || Math.random().toString(36).substr(2, 9),
          date: d.disbursement_date || d.created_at || new Date().toISOString(),
          type: 'loan_disbursement' as const,
          amount: -(d.total_amount || d.amount || 0),
          status: d.status === 'success' ? 'completed' as const : 
                 d.status === 'failed' ? 'failed' as const : 'pending' as const,
          borrowerName: d.loan_request?.borrower_name || 'Unknown Borrower',
          borrowerBusiness: d.loan_request?.business_name || 'Unknown Business',
          loanId: d.loan_request_id || '',
          description: `Loan disbursement for ${d.loan_request?.title || 'loan request'}`,
          reference: d.external_txn_ref || `DIS-${d.id}`,
          method: 'wire',
          category: 'lending',
          balanceBefore: 0,
          balanceAfter: 0,
          completedAmount: d.status === 'success' ? Math.abs(d.total_amount || d.amount || 0) : 0
        }));

        // Transform repayments to Transaction format
        const repaymentTransactions: Transaction[] = (repayments || []).map((r: any) => ({
          id: r.id || Math.random().toString(36).substr(2, 9),
          date: r.payment_date || r.created_at || new Date().toISOString(),
          type: 'loan_repayment' as const,
          amount: r.amount || 0,
          status: r.status === 'success' ? 'completed' as const : 
                 r.status === 'failed' ? 'failed' as const : 'pending' as const,
          borrowerName: r.loan_request?.borrower_name || 'Unknown Borrower',
          borrowerBusiness: r.loan_request?.business_name || 'Unknown Business',
          loanId: r.loan_request_id || '',
          description: `Loan repayment for ${r.loan_request?.title || 'loan'}`,
          reference: r.external_txn_ref || `REP-${r.id}`,
          method: r.payment_method || 'bank_transfer',
          category: 'lending',
          balanceBefore: 0,
          balanceAfter: 0,
          completedAmount: r.status === 'success' ? (r.amount || 0) : 0
        }));

        // Combine and sort transactions by date
        const allTransactions = [...disbursementTransactions, ...repaymentTransactions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setTransactions(allTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transaction history');
        
        // Fallback to mock data
        setTransactions(mockTransactions);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [lenderId]);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortField, setSortField] = useState<keyof Transaction>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Calculate transaction summary
  const transactionSummary: TransactionSummary = {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, txn) => sum + Math.abs(txn.amount), 0),
    totalIncoming: transactions.filter(txn => txn.amount > 0).reduce((sum, txn) => sum + txn.amount, 0),
    totalOutgoing: Math.abs(transactions.filter(txn => txn.amount < 0).reduce((sum, txn) => sum + txn.amount, 0)),
    pendingAmount: transactions.filter(txn => txn.status === 'pending').reduce((sum, txn) => sum + Math.abs(txn.amount), 0),
    completedAmount: transactions.filter(txn => txn.status === 'completed').reduce((sum, txn) => sum + Math.abs(txn.amount), 0)
  };

  // Filter and sort transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.borrowerBusiness.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
    
    const transactionDate = new Date(transaction.date);
    const matchesDateRange = 
      (!dateRange.start || transactionDate >= new Date(dateRange.start)) &&
      (!dateRange.end || transactionDate <= new Date(dateRange.end));

    return matchesSearch && matchesStatus && matchesType && matchesCategory && matchesDateRange;
  }).sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'loan_disbursement': return <FaArrowDown className="h-4 w-4 text-red-600" />;
      case 'loan_repayment': return <FaArrowUp className="h-4 w-4 text-green-600" />;
      case 'interest_payment': return <FaPercent className="h-4 w-4 text-blue-600" />;
      case 'fee_collection': return <FaReceipt className="h-4 w-4 text-purple-600" />;
      case 'penalty': return <FaExclamationTriangle className="h-4 w-4 text-orange-600" />;
      case 'refund': return <FaExchangeAlt className="h-4 w-4 text-gray-600" />;
      default: return <FaDollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'loan_disbursement': return 'Loan Disbursement';
      case 'loan_repayment': return 'Loan Repayment';
      case 'interest_payment': return 'Interest Payment';
      case 'fee_collection': return 'Fee Collection';
      case 'penalty': return 'Penalty';
      case 'refund': return 'Refund';
      default: return type;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'wire': return 'Wire Transfer';
      case 'ach': return 'ACH';
      case 'check': return 'Check';
      case 'cash': return 'Cash';
      default: return method;
    }
  };

  const handleSort = (field: keyof Transaction) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: keyof Transaction) => {
    if (field !== sortField) return <FaSort className="h-3 w-3 text-gray-400" />;
    return sortDirection === 'asc' 
      ? <FaSortUp className="h-3 w-3 text-blue-600" />
      : <FaSortDown className="h-3 w-3 text-blue-600" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount);
    const sign = amount >= 0 ? '+' : '-';
    const color = amount >= 0 ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={`font-medium ${color}`}>
        {sign}${absAmount.toLocaleString()}
      </span>
    );
  };

  const exportTransactions = () => {
    // Create CSV content
    const headers = ['Transaction ID', 'Date', 'Type', 'Amount', 'Status', 'Borrower', 'Business', 'Loan ID', 'Description', 'Reference', 'Method'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(txn => [
        txn.id,
        formatDate(txn.date),
        getTypeLabel(txn.type),
        txn.amount,
        txn.status,
        txn.borrowerName,
        txn.borrowerBusiness,
        txn.loanId,
        `"${txn.description}"`,
        txn.reference,
        getMethodLabel(txn.method)
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading transaction history...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => window.location.reload()}
                className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaHistory className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
              <p className="text-gray-600">Complete record of all lending transactions and activities</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{transactionSummary.totalTransactions}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaFileAlt className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${transactionSummary.totalAmount.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaDollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Money In</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${transactionSummary.totalIncoming.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaArrowUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Money Out</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${transactionSummary.totalOutgoing.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <FaArrowDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
              <div className="flex gap-3">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
                <button
                  onClick={exportTransactions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <FaDownload className="h-4 w-4" />
                  Export CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="loan_disbursement">Loan Disbursement</option>
                  <option value="loan_repayment">Loan Repayment</option>
                  <option value="interest_payment">Interest Payment</option>
                  <option value="fee_collection">Fee Collection</option>
                  <option value="penalty">Penalty</option>
                  <option value="refund">Refund</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="lending">Lending</option>
                  <option value="collections">Collections</option>
                  <option value="fees">Fees</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <input
                  type="date"
                  placeholder="Start Date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <input
                  type="date"
                  placeholder="End Date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Transactions ({filteredTransactions.length})
              </h3>
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date {getSortIcon('date')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-1">
                      Type {getSortIcon('type')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-1">
                      Amount {getSortIcon('amount')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Borrower
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(transaction.date)}</div>
                      <div className="text-sm text-gray-500">{transaction.reference}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getTypeLabel(transaction.type)}
                          </div>
                          <div className="text-sm text-gray-500">{transaction.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {formatAmount(transaction.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Balance: ${transaction.balanceAfter.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUser className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.borrowerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.borrowerBusiness}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getMethodLabel(transaction.method)}</div>
                      <div className="text-sm text-gray-500">ID: {transaction.loanId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowTransactionModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FaEye className="h-4 w-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-900"
                          title="Download Receipt"
                        >
                          <FaDownload className="h-4 w-4" />
                        </button>
                        <button
                          className="text-purple-600 hover:text-purple-900"
                          title="Print"
                        >
                          <FaPrint className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm border rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Details Modal */}
        {showTransactionModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Transaction Details
                </h3>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Transaction Header */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(selectedTransaction.type)}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {getTypeLabel(selectedTransaction.type)}
                        </h4>
                        <p className="text-sm text-gray-600">{selectedTransaction.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatAmount(selectedTransaction.amount)}
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedTransaction.date)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTransaction.reference}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                      <p className="mt-1 text-sm text-gray-900">{getMethodLabel(selectedTransaction.method)}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{selectedTransaction.category}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Borrower Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTransaction.borrowerName}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Business Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTransaction.borrowerBusiness}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Loan ID</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTransaction.loanId}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Balance After</label>
                      <p className="mt-1 text-sm text-gray-900">${selectedTransaction.balanceAfter.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.description}</p>
                </div>

                {selectedTransaction.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Download Receipt
                </button>
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Print
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsHistoryPage;
