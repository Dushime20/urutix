import React, { useState } from 'react';
import {
  FaDollarSign, FaChartLine, FaCreditCard, FaWallet, FaExchangeAlt,
  FaSearch, FaDownload, FaEye, FaEdit, FaCalendar,
  FaClock, FaArrowUp, FaArrowDown,
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaPiggyBank,
  FaReceipt, FaMoneyBillWave, FaUniversity, FaTimes
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';

interface Transaction {
  id: string;
  transactionId: string;
  type: 'payment' | 'refund' | 'fee' | 'escrow' | 'withdrawal' | 'deposit';
  status: 'completed' | 'pending' | 'failed' | 'cancelled' | 'processing';
  amount: number;
  currency: string;
  description: string;
  fromAccount: string;
  toAccount: string;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'digital_wallet' | 'crypto';
  createdAt: string;
  processedAt?: string;
  cargoId?: string;
  tripId?: string;
  fees: number;
  netAmount: number;
}

interface FinancialMetrics {
  totalRevenue: number;
  totalTransactions: number;
  pendingAmount: number;
  escrowBalance: number;
  platformFees: number;
  averageTransactionValue: number;
  dailyRevenue: number[];
  monthlyGrowth: number;
}

const FinancialAdminDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      transactionId: 'TXN-2024-001',
      type: 'payment',
      status: 'completed',
      amount: 1500,
      currency: 'USD',
      description: 'Payment for electronics shipment',
      fromAccount: 'TechCorp Industries',
      toAccount: 'FastTrans Ltd',
      paymentMethod: 'credit_card',
      createdAt: '2024-08-10T09:30:00Z',
      processedAt: '2024-08-10T09:35:00Z',
      cargoId: 'CRG-001',
      tripId: 'TRP-001',
      fees: 45,
      netAmount: 1455
    },
    {
      id: '2',
      transactionId: 'TXN-2024-002',
      type: 'escrow',
      status: 'pending',
      amount: 2200,
      currency: 'USD',
      description: 'Escrow for medical supplies delivery',
      fromAccount: 'MedSupply Corp',
      toAccount: 'Escrow Account',
      paymentMethod: 'bank_transfer',
      createdAt: '2024-08-10T11:15:00Z',
      cargoId: 'CRG-002',
      tripId: 'TRP-002',
      fees: 66,
      netAmount: 2134
    },
    {
      id: '3',
      transactionId: 'TXN-2024-003',
      type: 'fee',
      status: 'completed',
      amount: 150,
      currency: 'USD',
      description: 'Platform service fee',
      fromAccount: 'Platform Revenue',
      toAccount: 'UrutiX Platform',
      paymentMethod: 'digital_wallet',
      createdAt: '2024-08-10T14:20:00Z',
      processedAt: '2024-08-10T14:22:00Z',
      fees: 0,
      netAmount: 150
    },
    {
      id: '4',
      transactionId: 'TXN-2024-004',
      type: 'refund',
      status: 'processing',
      amount: 800,
      currency: 'USD',
      description: 'Refund for cancelled shipment',
      fromAccount: 'Escrow Account',
      toAccount: 'Global Shipping Co',
      paymentMethod: 'bank_transfer',
      createdAt: '2024-08-10T16:45:00Z',
      cargoId: 'CRG-003',
      fees: 24,
      netAmount: 776
    },
    {
      id: '5',
      transactionId: 'TXN-2024-005',
      type: 'withdrawal',
      status: 'completed',
      amount: 3200,
      currency: 'USD',
      description: 'Driver payout for completed deliveries',
      fromAccount: 'Platform Wallet',
      toAccount: 'Highway Haulers',
      paymentMethod: 'bank_transfer',
      createdAt: '2024-08-09T18:30:00Z',
      processedAt: '2024-08-10T08:15:00Z',
      fees: 32,
      netAmount: 3168
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Mock financial metrics
  const metrics: FinancialMetrics = {
    totalRevenue: 847520,
    totalTransactions: 1247,
    pendingAmount: 15600,
    escrowBalance: 89400,
    platformFees: 42376,
    averageTransactionValue: 680,
    dailyRevenue: [12500, 15800, 11200, 18900, 14300, 22100, 16700],
    monthlyGrowth: 12.5
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'processing': return 'bg-gray-100 text-gray-600';
      case 'failed': return 'bg-gray-100 text-gray-600';
      case 'cancelled': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-gray-100 text-gray-700';
      case 'refund': return 'bg-gray-100 text-gray-600';
      case 'fee': return 'bg-gray-100 text-gray-700';
      case 'escrow': return 'bg-gray-100 text-gray-600';
      case 'withdrawal': return 'bg-gray-100 text-gray-600';
      case 'deposit': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <FaDollarSign className="text-gray-600 text-xs" />;
      case 'refund': return <FaArrowUp className="text-gray-600 text-xs" />;
      case 'fee': return <FaReceipt className="text-gray-600 text-xs" />;
      case 'escrow': return <FaPiggyBank className="text-gray-600 text-xs" />;
      case 'withdrawal': return <FaArrowDown className="text-gray-600 text-xs" />;
      case 'deposit': return <FaArrowUp className="text-gray-600 text-xs" />;
      default: return <FaExchangeAlt className="text-gray-600 text-xs" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FaCheckCircle className="text-gray-600 text-xs" />;
      case 'pending': return <FaClock className="text-gray-500 text-xs" />;
      case 'processing': return <FaHourglassHalf className="text-gray-500 text-xs" />;
      case 'failed': return <FaTimesCircle className="text-gray-500 text-xs" />;
      case 'cancelled': return <FaTimesCircle className="text-gray-400 text-xs" />;
      default: return <FaClock className="text-gray-500 text-xs" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return <FaCreditCard className="text-gray-600 text-xs" />;
      case 'bank_transfer': return <FaUniversity className="text-gray-600 text-xs" />;
      case 'digital_wallet': return <FaWallet className="text-gray-600 text-xs" />;
      case 'crypto': return <FaExchangeAlt className="text-gray-600 text-xs" />;
      default: return <FaMoneyBillWave className="text-gray-600 text-xs" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.fromAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.toAccount.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || transaction.status === filterStatus;
    const matchesType = !filterType || transaction.type === filterType;
    const matchesPaymentMethod = !filterPaymentMethod || transaction.paymentMethod === filterPaymentMethod;
    return matchesSearch && matchesStatus && matchesType && matchesPaymentMethod;
  });

  const handleTransactionStatusChange = (transactionId: string, newStatus: string) => {
    setTransactions(transactions.map(transaction =>
      transaction.id === transactionId
        ? { ...transaction, status: newStatus as any, processedAt: new Date().toISOString() }
        : transaction
    ));
    toast.success(`Transaction status updated to ${newStatus}`);
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  return (
    <AdminPageLayout
      title="Financial Dashboard"
      description="Monitor platform revenue, transactions, and financial health"
      actions={
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-600/20 transition-all">
          <FaDownload size={14} /> Export Report
        </button>
      }
    >
      <div className="space-y-6">

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">${(metrics.totalRevenue / 1000).toFixed(0)}k</p>
                <p className="text-xs text-gray-600">Total Revenue</p>
                <div className="flex items-center mt-1">
                  <FaArrowUp className="text-gray-600 text-[10px] mr-0.5" />
                  <span className="text-xs text-gray-600 font-medium">+{metrics.monthlyGrowth}%</span>
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <FaDollarSign className="text-white text-xs" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{metrics.totalTransactions.toLocaleString()}</p>
                <p className="text-xs text-gray-600">Transactions</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-600 font-medium">${metrics.averageTransactionValue} avg</span>
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <FaExchangeAlt className="text-white text-xs" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">${(metrics.pendingAmount / 1000).toFixed(0)}k</p>
                <p className="text-xs text-gray-600">Pending</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-600 font-medium">
                    {transactions.filter(t => t.status === 'pending').length} txn
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <FaHourglassHalf className="text-white text-xs" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">${(metrics.escrowBalance / 1000).toFixed(0)}k</p>
                <p className="text-xs text-gray-600">Escrow</p>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-600 font-medium">Secured</span>
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                <FaPiggyBank className="text-white text-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart and Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-3">
            <h3 className="text-xs font-semibold text-gray-900 mb-3">Revenue Trend (Last 7 Days)</h3>
            <div className="flex items-end space-x-1.5 h-32">
              {metrics.dailyRevenue.map((revenue, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gray-600 rounded-t transition-all duration-300 hover:bg-gray-700"
                    style={{ height: `${(revenue / Math.max(...metrics.dailyRevenue)) * 100}%` }}
                  ></div>
                  <span className="text-[10px] text-gray-500 mt-1">
                    {new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-[10px] font-medium text-gray-700">${(revenue / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <h3 className="text-xs font-semibold text-gray-900 mb-3">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Platform Fees</span>
                <span className="text-xs font-medium text-gray-900">${(metrics.platformFees / 1000).toFixed(0)}k</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Completed</span>
                <span className="text-xs font-medium text-gray-900">
                  {transactions.filter(t => t.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Failed</span>
                <span className="text-xs font-medium text-gray-900">
                  {transactions.filter(t => t.status === 'failed').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Success Rate</span>
                <span className="text-xs font-medium text-gray-900">
                  {((transactions.filter(t => t.status === 'completed').length / transactions.length) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-2.5">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            <div className="relative">
              <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
            >
              <option value="">All Types</option>
              <option value="payment">Payment</option>
              <option value="refund">Refund</option>
              <option value="fee">Fee</option>
              <option value="escrow">Escrow</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="deposit">Deposit</option>
            </select>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
            >
              <option value="">All Methods</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="digital_wallet">Digital Wallet</option>
              <option value="crypto">Cryptocurrency</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs">
              <FaDownload className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Transaction</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Parties</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment Method</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0">
                            {getTypeIcon(transaction.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-gray-900">{transaction.description}</div>
                            <div className="text-[10px] text-gray-500">{transaction.transactionId}</div>
                            <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full mt-0.5 ${getTypeColor(transaction.type)}`}>
                              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-xs">
                          <div className="font-medium text-gray-900">{transaction.fromAccount}</div>
                          <div className="text-[10px] text-gray-500">to</div>
                          <div className="text-xs text-gray-700">{transaction.toAccount}</div>
                          {transaction.cargoId && (
                            <div className="text-[10px] text-gray-400 mt-0.5">Cargo: {transaction.cargoId}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-xs">
                          <div className="text-sm font-bold text-gray-900">${transaction.amount.toLocaleString()}</div>
                          <div className="text-[10px] text-gray-500">Fee: ${transaction.fees}</div>
                          <div className="text-[10px] text-gray-600 font-medium">Net: ${transaction.netAmount.toLocaleString()}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getPaymentMethodIcon(transaction.paymentMethod)}
                          <span className="text-xs text-gray-700">
                            {transaction.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(transaction.status)}
                          <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-900">
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-gray-600">{getTimeAgo(transaction.createdAt)}</div>
                          {transaction.processedAt && (
                            <div className="text-[10px] text-gray-500">Processed: {getTimeAgo(transaction.processedAt)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs font-medium">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewDetails(transaction)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                            title="View Details"
                          >
                            <FaEye className="w-3 h-3" />
                          </button>
                          {transaction.status === 'pending' && (
                            <button
                              onClick={() => handleTransactionStatusChange(transaction.id, 'completed')}
                              className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                              title="Mark Complete"
                            >
                              <FaCheckCircle className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction Details Modal */}
        {showDetailsModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Transaction Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {/* Transaction Information */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                    <div className="text-[10px] text-gray-600 mb-0.5">Transaction ID</div>
                    <div className="text-xs font-medium text-gray-900">{selectedTransaction.transactionId}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                    <div className="text-[10px] text-gray-600 mb-0.5">Status</div>
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(selectedTransaction.status)}
                      <span className={`text-xs font-medium ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                    <div className="text-[10px] text-gray-600 mb-0.5">Type</div>
                    <div className="flex items-center gap-1.5">
                      {getTypeIcon(selectedTransaction.type)}
                      <span className="text-xs font-medium text-gray-900">{selectedTransaction.type.charAt(0).toUpperCase() + selectedTransaction.type.slice(1)}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                    <div className="text-[10px] text-gray-600 mb-0.5">Payment Method</div>
                    <div className="flex items-center gap-1.5">
                      {getPaymentMethodIcon(selectedTransaction.paymentMethod)}
                      <span className="text-xs font-medium text-gray-900">
                        {selectedTransaction.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-xs font-medium text-gray-900 mb-2">Parties</div>
                  <div className="space-y-1.5">
                    <div>
                      <div className="text-[10px] text-gray-600">From</div>
                      <div className="text-xs text-gray-900">{selectedTransaction.fromAccount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600">To</div>
                      <div className="text-xs text-gray-900">{selectedTransaction.toAccount}</div>
                    </div>
                    {selectedTransaction.cargoId && (
                      <div>
                        <div className="text-[10px] text-gray-600">Cargo ID</div>
                        <div className="text-xs text-gray-900">{selectedTransaction.cargoId}</div>
                      </div>
                    )}
                    {selectedTransaction.tripId && (
                      <div>
                        <div className="text-[10px] text-gray-600">Trip ID</div>
                        <div className="text-xs text-gray-900">{selectedTransaction.tripId}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount Details */}
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-xs font-medium text-gray-900 mb-2">Amount Details</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-600">Gross Amount</span>
                      <span className="text-xs font-medium text-gray-900">${selectedTransaction.amount.toLocaleString()} {selectedTransaction.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-600">Fees</span>
                      <span className="text-xs font-medium text-gray-900">${selectedTransaction.fees.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200">
                      <span className="text-xs font-medium text-gray-900">Net Amount</span>
                      <span className="text-sm font-bold text-gray-900">${selectedTransaction.netAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-xs font-medium text-gray-900 mb-1">Description</div>
                  <div className="text-xs text-gray-700">{selectedTransaction.description}</div>
                </div>

                {/* Timeline */}
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-xs font-medium text-gray-900 mb-2">Timeline</div>
                  <div className="space-y-1.5">
                    <div>
                      <div className="text-[10px] text-gray-600">Created</div>
                      <div className="text-xs text-gray-900">{formatDateTime(selectedTransaction.createdAt)}</div>
                    </div>
                    {selectedTransaction.processedAt && (
                      <div>
                        <div className="text-[10px] text-gray-600">Processed</div>
                        <div className="text-xs text-gray-900">{formatDateTime(selectedTransaction.processedAt)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {selectedTransaction.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleTransactionStatusChange(selectedTransaction.id, 'completed');
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-xs font-medium"
                    >
                      Mark Complete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout >
  );
};

export default FinancialAdminDashboard;
