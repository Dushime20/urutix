import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Activity,
  CreditCard,
  Wallet,
  RefreshCw,
  Search,
  Download,
  Eye,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Timer,
  Wallet2,
  FileText,
  Globe,
  Building2,
  TrendingUp,
  Receipt,
  PiggyBank,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TranslatedText } from '../../components/translated-text';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { adminAPI } from '../../services/adminApi';
import ModernLoader from '../../components/common/ModernLoader';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

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
  revenueBreakdown?: Record<string, number>;
}

interface RealFinancialData {
  totalRevenue: number;
  revenueBreakdown?: Record<string, number>;
  error?: string;
}

const FinancialAdminDashboard: React.FC = () => {
  const { format: fmtFull, compact: fmtMoney } = useCurrencyFormat();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realFinancialData, setRealFinancialData] = useState<RealFinancialData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch real financial data
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [financialResponse, creditTxResponse] = await Promise.all([
          adminAPI.getFinancials(),
          adminAPI.getAllCreditTransactions().catch(() => null),
        ]);

        const financialData = financialResponse.data?.data || financialResponse.data;
        setRealFinancialData(financialData);

        // Use real credit transactions from the database
        const rawTxns: any[] = (creditTxResponse as any)?.data?.data
          || (creditTxResponse as any)?.data
          || [];

        if (rawTxns.length > 0) {
          const converted: Transaction[] = rawTxns.map((t: any, i: number) => {
            const amount = Math.abs(parseFloat(t.amount) || 0);
            const isDebit = t.type === 'DEBIT' || t.type === 'debit' || amount < 0;
            return {
              id: t.id || `txn-${i}`,
              transactionId: t.id?.slice(0, 8).toUpperCase() || `TXN-${i}`,
              type: isDebit ? 'withdrawal' : 'deposit',
              status: 'completed' as const,
              amount,
              currency: 'USD',
              description: t.description || t.type || 'Credit transaction',
              fromAccount: t.tenantId ? `Tenant ${t.tenantId.slice(0, 8)}` : 'Platform',
              toAccount: isDebit ? 'Service' : 'Credit Account',
              paymentMethod: 'digital_wallet' as const,
              createdAt: t.createdAt || new Date().toISOString(),
              processedAt: t.createdAt,
              fees: 0,
              netAmount: amount,
            };
          });
          setTransactions(converted);
        } else {
          setTransactions([]);
        }
      } catch (err: any) {
        console.error('Error fetching financial data:', err);
        setError(err.response?.data?.message || 'Failed to load financial data');
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  // Calculate metrics using real data
  const metrics: FinancialMetrics = {
    totalRevenue: realFinancialData?.totalRevenue || 0,
    totalTransactions: transactions.length,
    pendingAmount: transactions.filter(t => t.status === 'pending').reduce((s, t) => s + t.amount, 0),
    escrowBalance: transactions.filter(t => t.type === 'escrow').reduce((s, t) => s + t.amount, 0),
    platformFees: transactions.reduce((s, t) => s + t.fees, 0),
    averageTransactionValue: transactions.length > 0
      ? Math.round(transactions.reduce((s, t) => s + t.amount, 0) / transactions.length)
      : 0,
    // Build daily revenue from real transactions (last 7 days)
    dailyRevenue: (() => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toDateString();
      });
      return days.map(day =>
        transactions
          .filter(t => new Date(t.createdAt).toDateString() === day)
          .reduce((s, t) => s + t.amount, 0)
      );
    })(),
    monthlyGrowth: 0,
    revenueBreakdown: realFinancialData?.revenueBreakdown,
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
      title={<TranslatedText text="Financial Dashboard" />}
      description={<TranslatedText text="Monitor platform revenue, transactions, and financial health" />}
      actions={
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-[#2c5173] hover:bg-[#1e3850] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={14} /> <TranslatedText text="Refresh Data" />
        </button>
      }
    >
      <div className="safe-bottom">
      {loading ? (
        <ModernLoader isLoading={true} type="dashboard" showStats={true} />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-red-400">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Financial Data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-md text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
      <div className="space-y-10">

        {/* Revenue Chart and Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
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
                      className="w-full bg-[#2c5173]/20 rounded-lg transition-all duration-500 group-hover:bg-[#2c5173] overflow-hidden relative border border-gray-100 group-hover:border-[#2c5173]"
                      style={{ height: `${(revenue / Math.max(...metrics.dailyRevenue)) * 180}px` }}
                    >
                      <div className="absolute inset-0 bg-[#2c5173]/10 opacity-100 group-hover:from-black/20" />
                    </div>
                    <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-1">
                      <span className="text-[10px] font-black text-[#2c5173] bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100 leading-none flex items-center gap-1">
                        {fmtMoney(revenue)}
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

          <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col">
            <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase mb-6">Fiscal Intelligence</h3>
            <div className="space-y-4 flex-1">
              <div className="p-4 rounded-xl bg-[#fafafa] border border-gray-100 group hover:border-primary-100 transition-all">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Fees</span>
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-slate-400 group-hover:text-[#2c5173] transition-colors">
                    <Receipt size={14} />
                  </div>
                </div>
                <span className="text-lg font-black text-gray-900 tracking-tight">{fmtMoney(metrics.platformFees)}</span>
                <div className="mt-2 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#2c5173] h-full w-[65%]" />
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
            <button className="w-full mt-6 py-3 bg-[#2c5173] hover:bg-[#1e3850] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Generate Detailed Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative group min-w-[240px]">
                <input
                  type="text"
                  placeholder="SEARCH TRANSACTIONS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent w-full bg-[#fafafa] transition-all"
                />
                <Search className="absolute left-3.5 top-3 text-slate-400 group-hover:text-[#2c5173] transition-colors w-3.5 h-3.5" />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent bg-white cursor-pointer hover:border-primary-200 transition-all"
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
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent bg-white cursor-pointer hover:border-primary-200 transition-all"
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
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent bg-white cursor-pointer hover:border-primary-200 transition-all"
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
                  className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c5173] focus:border-transparent bg-white cursor-pointer hover:border-primary-200 transition-all"
                >
                  <option value="7d">LAST 7 DAYS</option>
                  <option value="30d">LAST 30 DAYS</option>
                  <option value="90d">LAST 90 DAYS</option>
                  <option value="1y">LAST YEAR</option>
                </select>
              </div>
            </div>

            <button className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-xl flex items-center gap-2 hover:bg-gray-50 bg-white transition-all text-slate-600">
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${getTypeColor(transaction.type)} group-hover:scale-105 transition-transform`}>
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
                          <div className="text-sm font-black text-gray-900 tracking-tight leading-none uppercase">{fmtFull(transaction.amount)}</div>
                          <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                            NET: {fmtFull(transaction.netAmount)}
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
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest ${getStatusColor(transaction.status)}`}>
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
                            className="p-2 text-slate-400 hover:text-[#2c5173] hover:bg-primary-50 rounded-xl transition-all bg-white border border-gray-100"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          {transaction.status === 'pending' && (
                            <button
                              onClick={() => handleTransactionStatusChange(transaction.id, 'completed')}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all bg-white border border-gray-100"
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
            <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
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
                    <div className="absolute left-0 top-3 bottom-3 w-[1px] bg-primary-100 border-l border-dashed border-primary-200" />
                    <div className="pl-6 relative">
                      <div className="absolute left-[-2px] top-1.5 w-1 h-1 rounded-full bg-[#2c5173]" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">SOURCE ACCOUNT</p>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedTransaction.fromAccount}</p>
                    </div>
                    <div className="pl-6 relative">
                      <div className="absolute left-[-2px] top-1.5 w-1 h-1 rounded-full bg-[#2c5173]" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TARGET RECIPIENT</p>
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{selectedTransaction.toAccount}</p>
                    </div>
                  </div>
                </div>

                {/* Amount Details */}
                <div className="bg-slate-900 rounded-2xl p-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">FISCAL SUMMARY</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GROSS AMOUNT</span>
                      <span className="text-sm font-black text-white tracking-tight">{fmtFull(selectedTransaction.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">NETWORK FEES</span>
                      <span className="text-sm font-black tracking-tight">-{fmtFull(selectedTransaction.fees)}</span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">NET SETTLEMENT</span>
                      <span className="text-2xl font-black text-emerald-400 tracking-tight">{fmtFull(selectedTransaction.netAmount)}</span>
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
                      className="flex-1 py-4 bg-[#2c5173] hover:bg-[#1e3850] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Authorize Clearance
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 py-4 bg-white text-slate-600 border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Close Audit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
      </div>
    </AdminPageLayout >
  );
};

export default FinancialAdminDashboard;
