import React, { useState } from 'react';
import {
  DollarSign, Activity, CreditCard, Wallet, RefreshCw,
  Search, Download, Eye, Calendar,
  Clock, ArrowUpRight, ArrowDownRight, CheckCircle2,
  XCircle, Timer, Wallet2, FileText, Globe,
  Building2, TrendingUp, Receipt, PiggyBank, X,
  ArrowUp
} from 'lucide-react';
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
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'processing': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'failed': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'cancelled': return 'bg-gray-50 text-gray-500 border-gray-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'refund': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'fee': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'escrow': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'withdrawal': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'deposit': return 'bg-teal-50 text-teal-600 border-teal-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign className="w-3 h-3" />;
      case 'refund': return <RefreshCw className="w-3 h-3" />;
      case 'fee': return <Receipt className="w-3 h-3" />;
      case 'escrow': return <PiggyBank className="w-3 h-3" />;
      case 'withdrawal': return <ArrowDownRight className="w-3 h-3" />;
      case 'deposit': return <ArrowUpRight className="w-3 h-3" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'processing': return <Timer className="w-3 h-3" />;
      case 'failed': return <XCircle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3 opacity-50" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card': return <CreditCard className="w-3 h-3" />;
      case 'bank_transfer': return <Building2 className="w-3 h-3" />;
      case 'digital_wallet': return <Wallet className="w-3 h-3" />;
      case 'crypto': return <Globe className="w-3 h-3" />;
      default: return <Wallet2 className="w-3 h-3" />;
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
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 transition-all">
          <Download size={14} /> Export Report
        </button>
      }
    >
      <div className="space-y-10">
        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
              <DollarSign size={80} className="text-gray-900" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all duration-300 shadow-sm">
                  <DollarSign size={18} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Revenue</p>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-gray-900 leading-none tracking-tight">
                  ${(metrics.totalRevenue / 1000).toFixed(0)}k
                </h3>
                <div className="flex items-center text-emerald-600">
                  <ArrowUp size={10} className="mr-0.5" />
                  <span className="text-[10px] font-black">{metrics.monthlyGrowth}%</span>
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 leading-none">Active yield this month</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
              <Activity size={80} className="text-gray-900" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-amber-600 group-hover:bg-amber-50 transition-all duration-300 shadow-sm">
                  <Activity size={18} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Transactions</p>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-gray-900 leading-none tracking-tight">
                  {metrics.totalTransactions.toLocaleString()}
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">${metrics.averageTransactionValue} AVG</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 leading-none">Network throughput</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
              <Timer size={80} className="text-gray-900" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all duration-300 shadow-sm">
                  <Timer size={18} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Pending</p>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-gray-900 leading-none tracking-tight">
                  ${(metrics.pendingAmount / 1000).toFixed(0)}k
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  {transactions.filter(t => t.status === 'pending').length} TXN
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 leading-none">Assets in processing</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
              <PiggyBank size={80} className="text-gray-900" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-purple-600 group-hover:bg-purple-50 transition-all duration-300 shadow-sm">
                  <PiggyBank size={18} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Escrow Balance</p>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-gray-900 leading-none tracking-tight">
                  ${(metrics.escrowBalance / 1000).toFixed(0)}k
                </h3>
                <div className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">SECURED</div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 leading-none">Guaranteed liquidity</p>
            </div>
          </div>
        </div>

        {/* Revenue Chart and Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase">Revenue Trend</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">LATEST FISCAL PERFORMANCE (7D)</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                  <Calendar size={12} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">LAST 7 DAYS</span>
                </div>
              </div>
            </div>
            <div className="flex items-end space-x-3 h-48">
              {metrics.dailyRevenue.map((revenue, index) => (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full flex flex-col items-center">
                    <div
                      className="w-full bg-indigo-50/50 rounded-lg transition-all duration-500 group-hover:bg-indigo-600 overflow-hidden relative border border-indigo-100/50 group-hover:border-indigo-600 shadow-sm"
                      style={{ height: `${(revenue / Math.max(...metrics.dailyRevenue)) * 180}px` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent opacity-100 group-hover:from-black/20" />
                    </div>
                    <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-1">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 shadow-sm leading-none flex items-center gap-1">
                        ${(revenue / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 group-hover:text-slate-900 transition-colors">
                    {new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase mb-6">Fiscal Intelligence</h3>
            <div className="space-y-4 flex-1">
              <div className="p-4 rounded-xl bg-[#fafafa] border border-gray-100 group hover:border-indigo-100 transition-all">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Fees</span>
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                    <Receipt size={14} />
                  </div>
                </div>
                <span className="text-lg font-black text-gray-900 tracking-tight">${(metrics.platformFees / 1000).toFixed(1)}k</span>
                <div className="mt-2 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-[65%]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#fafafa] border border-gray-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Success</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-emerald-600 tracking-tight">
                      {((transactions.filter(t => t.status === 'completed').length / transactions.length) * 100).toFixed(0)}%
                    </span>
                    <TrendingUp size={14} className="text-emerald-500" />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#fafafa] border border-gray-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Failed</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-rose-600 tracking-tight">
                      {transactions.filter(t => t.status === 'failed').length}
                    </span>
                    <XCircle size={14} className="text-rose-500" />
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200">
              Generate Detailed Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative group min-w-[240px]">
                <input
                  type="text"
                  placeholder="SEARCH TRANSACTIONS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full bg-[#fafafa] transition-all shadow-sm"
                />
                <Search className="absolute left-3.5 top-3 text-slate-400 group-hover:text-indigo-500 transition-colors w-3.5 h-3.5" />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm cursor-pointer hover:border-indigo-200 transition-all"
                >
                  <option value="">ALL STATUS</option>
                  <option value="completed">COMPLETED</option>
                  <option value="pending">PENDING</option>
                  <option value="processing">PROCESSING</option>
                  <option value="failed">FAILED</option>
                  <option value="cancelled">CANCELLED</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm cursor-pointer hover:border-indigo-200 transition-all"
                >
                  <option value="">ALL TYPES</option>
                  <option value="payment">PAYMENT</option>
                  <option value="refund">REFUND</option>
                  <option value="fee">FEE</option>
                  <option value="escrow">ESCROW</option>
                  <option value="withdrawal">WITHDRAWAL</option>
                  <option value="deposit">DEPOSIT</option>
                </select>

                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm cursor-pointer hover:border-indigo-200 transition-all"
                >
                  <option value="">ALL METHODS</option>
                  <option value="credit_card">CREDIT CARD</option>
                  <option value="bank_transfer">BANK TRANSFER</option>
                  <option value="digital_wallet">DIGITAL WALLET</option>
                  <option value="crypto">CRYPTOCURRENCY</option>
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm cursor-pointer hover:border-indigo-200 transition-all"
                >
                  <option value="7d">LAST 7 DAYS</option>
                  <option value="30d">LAST 30 DAYS</option>
                  <option value="90d">LAST 90 DAYS</option>
                  <option value="1y">LAST YEAR</option>
                </select>
              </div>
            </div>

            <button className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 bg-white transition-all shadow-sm text-slate-600">
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#fafafa] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Identity</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parties</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiscal Yield</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Method</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</span>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText size={40} className="text-slate-200" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No transactions identified</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getTypeColor(transaction.type)} shadow-sm group-hover:scale-105 transition-transform`}>
                            {getTypeIcon(transaction.type)}
                          </div>
                          <div>
                            <div className="text-sm font-black text-gray-900 tracking-tight leading-tight uppercase">{transaction.description}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{transaction.transactionId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase">{transaction.fromAccount}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                            <span className="w-4 h-[1px] bg-slate-200" /> TO <span className="w-4 h-[1px] bg-slate-200" />
                          </div>
                          <div className="text-sm font-black text-slate-700 tracking-tight leading-none uppercase">{transaction.toAccount}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase">${transaction.amount.toLocaleString()}</div>
                          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                            NET: ${transaction.netAmount.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100 w-fit">
                          {getPaymentMethodIcon(transaction.paymentMethod)}
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            {transaction.paymentMethod.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest ${getStatusColor(transaction.status)} shadow-sm`}>
                          {getStatusIcon(transaction.status)}
                          {transaction.status}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">{getTimeAgo(transaction.createdAt)}</div>
                          {transaction.processedAt && (
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">SYNCED {getTimeAgo(transaction.processedAt)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewDetails(transaction)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all shadow-sm bg-white border border-gray-100"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          {transaction.status === 'pending' && (
                            <button
                              onClick={() => handleTransactionStatusChange(transaction.id, 'completed')}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm bg-white border border-gray-100"
                              title="Mark Complete"
                            >
                              <CheckCircle2 size={14} />
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
          <div className="fixed inset-0 bg-[#0a0a0b]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-white/20 flex flex-col">
              <div className="p-8 border-b border-gray-100 bg-[#fafafa]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">FISCAL AUDIT</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">TRANSACTION CLEARANCE DATA</p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-8 overflow-y-auto space-y-8">
                {/* Transaction Information */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction ID</p>
                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedTransaction.transactionId}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest ${getStatusColor(selectedTransaction.status)}`}>
                      {getStatusIcon(selectedTransaction.status)}
                      {selectedTransaction.status}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fiscal Type</p>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest ${getTypeColor(selectedTransaction.type)}`}>
                      {getTypeIcon(selectedTransaction.type)}
                      {selectedTransaction.type}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Method</p>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(selectedTransaction.paymentMethod)}
                      <span className="text-sm font-black text-gray-900 uppercase tracking-tight">
                        {selectedTransaction.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">IDENTIFIED PARTIES</h4>
                  <div className="space-y-6 relative ml-2">
                    <div className="absolute left-0 top-3 bottom-3 w-[1px] bg-indigo-100 border-l border-dashed border-indigo-200" />
                    <div className="pl-6 relative">
                      <div className="absolute left-[-2px] top-1.5 w-1 h-1 rounded-full bg-indigo-600" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">SOURCE ACCOUNT</p>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedTransaction.fromAccount}</p>
                    </div>
                    <div className="pl-6 relative">
                      <div className="absolute left-[-2px] top-1.5 w-1 h-1 rounded-full bg-indigo-600" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TARGET RECIPIENT</p>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedTransaction.toAccount}</p>
                    </div>
                  </div>
                </div>

                {/* Amount Details */}
                <div className="bg-slate-900 rounded-2xl p-6 shadow-xl shadow-slate-200">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">FISCAL SUMMARY</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GROSS AMOUNT</span>
                      <span className="text-sm font-black text-white tracking-tight">${selectedTransaction.amount.toLocaleString()} {selectedTransaction.currency}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">NETWORK FEES</span>
                      <span className="text-sm font-black tracking-tight">-${selectedTransaction.fees.toLocaleString()}</span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">NET SETTLEMENT</span>
                      <span className="text-2xl font-black text-emerald-400 tracking-tight">${selectedTransaction.netAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Description & Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">AUDIT NOTES</p>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed uppercase">{selectedTransaction.description}</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">INITIATED</p>
                      <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{formatDateTime(selectedTransaction.createdAt)}</p>
                    </div>
                    {selectedTransaction.processedAt && (
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">FINALIZED</p>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">{formatDateTime(selectedTransaction.processedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-100 bg-[#fafafa]">
                <div className="flex gap-4">
                  {selectedTransaction.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleTransactionStatusChange(selectedTransaction.id, 'completed');
                        setShowDetailsModal(false);
                      }}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      Authorize Clearance
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 py-4 bg-white text-slate-600 border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
                  >
                    Close Audit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout >
  );
};

export default FinancialAdminDashboard;
