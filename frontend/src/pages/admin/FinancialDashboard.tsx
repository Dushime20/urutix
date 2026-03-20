import React, { useState } from 'react';
import {
  FaDollarSign, FaChartLine, FaCreditCard, FaWallet, FaExchangeAlt,
  FaSearch, FaFilter, FaDownload, FaEye, FaEdit, FaPlus, FaCalendar,
  FaClock, FaArrowUp, FaArrowDown, FaCaretUp, FaCaretDown,
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaPiggyBank,
  FaReceipt, FaMoneyBillWave, FaUniversity, FaHandshake, FaShoppingCart
} from 'react-icons/fa';
import { TranslatedText } from '../../components/translated-text';
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

const FinancialDashboard: React.FC = () => {
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
      tripId: 'TRP-003',
      fees: 24,
      netAmount: 776
    }
  ]);

  const [metrics] = useState<FinancialMetrics>({
    totalRevenue: 12500000,
    totalTransactions: 1247,
    pendingAmount: 45000,
    escrowBalance: 125000,
    platformFees: 375000,
    averageTransactionValue: 10032,
    dailyRevenue: [180000, 220000, 195000, 250000, 280000, 320000, 305000],
    monthlyGrowth: 12.5
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'escrow': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'fee': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'refund': return 'bg-red-100 text-red-800 border-red-200';
      case 'withdrawal': return 'bg-green-100 text-green-800 border-green-200';
      case 'deposit': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <FaCreditCard className="w-4 h-4" />;
      case 'escrow': return <FaWallet className="w-4 h-4" />;
      case 'fee': return <FaReceipt className="w-4 h-4" />;
      case 'refund': return <FaExchangeAlt className="w-4 h-4" />;
      case 'withdrawal': return <FaDownload className="w-4 h-4" />;
      case 'deposit': return <FaPlus className="w-4 h-4" />;
      default: return <FaDollarSign className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FaCheckCircle className="w-4 h-4" />;
      case 'pending': return <FaClock className="w-4 h-4" />;
      case 'failed': return <FaTimesCircle className="w-4 h-4" />;
      case 'cancelled': return <FaTimesCircle className="w-4 h-4" />;
      case 'processing': return <FaHourglassHalf className="w-4 h-4" />;
      default: return <FaClock className="w-4 h-4" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return <FaCreditCard className="w-4 h-4" />;
      case 'bank_transfer': return <FaUniversity className="w-4 h-4" />;
      case 'digital_wallet': return <FaWallet className="w-4 h-4" />;
      case 'crypto': return <FaExchangeAlt className="w-4 h-4" />;
      default: return <FaDollarSign className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTransactionStatusChange = (transactionId: string, newStatus: string) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === transactionId
          ? { ...t, status: newStatus as any }
          : t
      )
    );
  };

  return (
    <AdminPageLayout
      title={<TranslatedText text="Financial Dashboard" />}
      description={<TranslatedText text="Monitor transactions, revenue, and financial metrics" />}
    >

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-800">${metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-gray-600"><TranslatedText text="Total Revenue" /></p>
              <div className="flex items-center mt-2">
                <FaCaretUp className="text-green-500 mr-1" />
                <span className="text-green-600 text-sm font-medium">+{metrics.monthlyGrowth}%</span>
                <span className="text-gray-500 text-sm ml-1"><TranslatedText text="this month" /></span>
              </div>
            </div>
            <FaDollarSign className="text-green-500 text-4xl" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-800">{metrics.totalTransactions.toLocaleString()}</p>
              <p className="text-gray-600"><TranslatedText text="Total Transactions" /></p>
              <div className="flex items-center mt-2">
                <span className="text-blue-600 text-sm font-medium">${metrics.averageTransactionValue}</span>
                <span className="text-gray-500 text-sm ml-1"><TranslatedText text="avg value" /></span>
              </div>
            </div>
            <FaExchangeAlt className="text-blue-500 text-4xl" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-800">${metrics.pendingAmount.toLocaleString()}</p>
              <p className="text-gray-600"><TranslatedText text="Pending Amount" /></p>
              <div className="flex items-center mt-2">
                <FaClock className="text-yellow-500 mr-1" />
                <span className="text-yellow-600 text-sm font-medium">
                  {transactions.filter(t => t.status === 'pending').length} <TranslatedText text="transactions" />
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
              <p className="text-gray-600"><TranslatedText text="Escrow Balance" /></p>
              <div className="flex items-center mt-2">
                <FaPiggyBank className="text-purple-500 mr-1" />
                <span className="text-purple-600 text-sm font-medium"><TranslatedText text="Secured funds" /></span>
              </div>
            </div>
            <FaPiggyBank className="text-purple-500 text-4xl" />
          </div>
        </div>
      </div>

      {/* Revenue Chart and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
              <span className="text-sm text-gray-600">Pending Transactions</span>
              <span className="font-semibold text-yellow-600">
                {transactions.filter(t => t.status === 'pending').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <FaFilter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <FaDownload className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.transactionId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(transaction.type)}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(transaction.type)}`}>
                        {transaction.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${transaction.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      Fees: ${transaction.fees}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(transaction.status)}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <select
                        value={transaction.status}
                        onChange={(e) => handleTransactionStatusChange(transaction.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default FinancialDashboard;
