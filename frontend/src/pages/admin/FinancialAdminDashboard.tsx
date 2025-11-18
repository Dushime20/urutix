import React, { useState } from 'react';
import { 
  FaDollarSign, FaChartLine, FaCreditCard, FaWallet, FaExchangeAlt,
  FaSearch, FaDownload, FaEye, FaEdit, FaPlus, FaCalendar,
  FaClock, FaArrowUp, FaArrowDown, FaCaretUp,
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaPiggyBank,
  FaReceipt, FaMoneyBillWave, FaUniversity
} from 'react-icons/fa';

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
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-green-100 text-green-800';
      case 'refund': return 'bg-orange-100 text-orange-800';
      case 'fee': return 'bg-purple-100 text-purple-800';
      case 'escrow': return 'bg-blue-100 text-blue-800';
      case 'withdrawal': return 'bg-indigo-100 text-indigo-800';
      case 'deposit': return 'bg-primary-100 text-primary-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <FaDollarSign className="text-green-600" />;
      case 'refund': return <FaArrowUp className="text-orange-600" />;
      case 'fee': return <FaReceipt className="text-purple-600" />;
      case 'escrow': return <FaPiggyBank className="text-blue-600" />;
      case 'withdrawal': return <FaArrowDown className="text-indigo-600" />;
      case 'deposit': return <FaArrowUp className="text-primary-600" />;
      default: return <FaExchangeAlt className="text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FaCheckCircle className="text-green-500" />;
      case 'pending': return <FaClock className="text-yellow-500" />;
      case 'processing': return <FaHourglassHalf className="text-blue-500" />;
      case 'failed': return <FaTimesCircle className="text-red-500" />;
      case 'cancelled': return <FaTimesCircle className="text-gray-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return <FaCreditCard className="text-blue-600" />;
      case 'bank_transfer': return <FaUniversity className="text-green-600" />;
      case 'digital_wallet': return <FaWallet className="text-purple-600" />;
      case 'crypto': return <FaExchangeAlt className="text-orange-600" />;
      default: return <FaMoneyBillWave className="text-gray-600" />;
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
  };

  return (
            <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Financial Dashboard</h1>
          <p className="text-gray-600">Monitor platform revenue, transactions, and financial health</p>
        </div>
        <div className="flex gap-2 items-center">
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors">
            <FaPlus />
            <span>Manual Transaction</span>
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100">
            <FaDownload />
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-800">${metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-gray-600">Total Revenue</p>
              <div className="flex items-center mt-2">
                <FaCaretUp className="text-green-500 mr-1" />
                <span className="text-green-600 text-sm font-medium">+{metrics.monthlyGrowth}%</span>
                <span className="text-gray-500 text-sm ml-1">this month</span>
              </div>
            </div>
            <FaDollarSign className="text-green-500 text-4xl" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-800">{metrics.totalTransactions.toLocaleString()}</p>
              <p className="text-gray-600">Total Transactions</p>
              <div className="flex items-center mt-2">
                <span className="text-blue-600 text-sm font-medium">${metrics.averageTransactionValue}</span>
                <span className="text-gray-500 text-sm ml-1">avg value</span>
              </div>
            </div>
            <FaExchangeAlt className="text-blue-500 text-4xl" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-800">${metrics.pendingAmount.toLocaleString()}</p>
              <p className="text-gray-600">Pending Amount</p>
              <div className="flex items-center mt-2">
                <FaClock className="text-yellow-500 mr-1" />
                <span className="text-yellow-600 text-sm font-medium">
                  {transactions.filter(t => t.status === 'pending').length} transactions
                </span>
              </div>
            </div>
            <FaHourglassHalf className="text-yellow-500 text-4xl" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-800">${metrics.escrowBalance.toLocaleString()}</p>
              <p className="text-gray-600">Escrow Balance</p>
              <div className="flex items-center mt-2">
                <FaPiggyBank className="text-purple-500 mr-1" />
                <span className="text-purple-600 text-sm font-medium">Secured funds</span>
              </div>
            </div>
            <FaPiggyBank className="text-purple-500 text-4xl" />
          </div>
        </div>
      </div>

      {/* Revenue Chart and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend (Last 7 Days)</h3>
          <div className="flex items-end space-x-2 h-48">
            {metrics.dailyRevenue.map((revenue, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                  style={{ height: `${(revenue / Math.max(...metrics.dailyRevenue)) * 100}%` }}
                ></div>
                <span className="text-xs text-gray-500 mt-2">
                  {new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-xs font-medium text-gray-700">${(revenue / 1000).toFixed(1)}k</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Platform Fees Collected</span>
              <span className="font-semibold text-green-600">${metrics.platformFees.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed Transactions</span>
              <span className="font-semibold text-blue-600">
                {transactions.filter(t => t.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Failed Transactions</span>
              <span className="font-semibold text-red-600">
                {transactions.filter(t => t.status === 'failed').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="font-semibold text-green-600">
                {((transactions.filter(t => t.status === 'completed').length / transactions.length) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <FaDownload />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parties</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getTypeIcon(transaction.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                        <div className="text-sm text-gray-500">{transaction.transactionId}</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getTypeColor(transaction.type)}`}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{transaction.fromAccount}</div>
                      <div className="text-gray-500">to</div>
                      <div className="text-gray-700">{transaction.toAccount}</div>
                      {transaction.cargoId && (
                        <div className="text-xs text-gray-400 mt-1">Cargo: {transaction.cargoId}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-lg font-bold text-gray-900">${transaction.amount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Fee: ${transaction.fees}</div>
                      <div className="text-xs text-green-600 font-medium">Net: ${transaction.netAmount.toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(transaction.paymentMethod)}
                      <span className="text-sm text-gray-700">
                        {transaction.paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(transaction.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <FaCalendar className="text-gray-400 mr-2" />
                        {formatDate(transaction.createdAt)}
                      </div>
                      {transaction.processedAt && (
                        <div className="flex items-center">
                          <FaCheckCircle className="text-green-400 mr-2" />
                          {formatDateTime(transaction.processedAt)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors" title="View Details">
                        <FaEye />
                      </button>
                      <button className="text-green-600 hover:text-green-900 p-1 rounded transition-colors" title="Edit">
                        <FaEdit />
                      </button>
                      {transaction.status === 'pending' && (
                        <button 
                          onClick={() => handleTransactionStatusChange(transaction.id, 'completed')}
                          className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                          title="Mark Complete"
                        >
                          <FaCheckCircle />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Financial Activity</h3>
        <div className="space-y-3">
          {filteredTransactions.slice(0, 3).map((transaction) => (
            <div key={transaction.id} className="border-l-4 border-green-500 pl-4 py-2">
              <div className="text-sm font-medium text-gray-900">
                {transaction.transactionId} - ${transaction.amount.toLocaleString()} {transaction.type}
              </div>
              <div className="text-sm text-gray-600">{transaction.description}</div>
              <div className="text-xs text-gray-500 mt-1">
                {transaction.fromAccount} → {transaction.toAccount} • {formatDateTime(transaction.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialAdminDashboard;
