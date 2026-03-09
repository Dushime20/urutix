import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/EnliteUI/Cards/StatCard';

interface CreditTransaction {
  id: string;
  type: 'DEBIT' | 'CREDIT' | 'PURCHASE' | 'REFUND';
  amount: number;
  balance: number;
  description: string;
  featureName?: string;
  metadata?: any;
  createdAt: string;
}

interface CreditBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: CreditTransaction[];
}

const TruckOwnerCredits: React.FC = () => {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<'all' | 'DEBIT' | 'CREDIT'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Fetch credit balance and transactions
  const { data: creditData, isLoading, refetch } = useQuery({
    queryKey: ['truck-owner-credits', user?.id],
    queryFn: async () => {
      const response = await authAPI.get('/credits/balance');
      return {
        balance: response.data.data.currentBalance || 0,
        totalEarned: response.data.data.lifetimeEarned || 0,
        totalSpent: response.data.data.lifetimeSpent || 0,
        transactions: [] // Will be fetched separately
      };
    },
    enabled: !!user?.id
  });

  // Fetch transactions separately
  const { data: transactionsData } = useQuery({
    queryKey: ['truck-owner-transactions', user?.id],
    queryFn: async () => {
      const response = await authAPI.get('/credits/transactions?limit=100');
      return response.data.data || [];
    },
    enabled: !!user?.id
  });

  const transactions = transactionsData || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CREDIT':
      case 'PURCHASE':
        return <ArrowUpRight className="text-emerald-500" size={18} />;
      case 'DEBIT':
        return <ArrowDownRight className="text-rose-500" size={18} />;
      case 'REFUND':
        return <RefreshCw className="text-blue-500" size={18} />;
      default:
        return <DollarSign className="text-slate-400" size={18} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'CREDIT':
      case 'PURCHASE':
        return 'text-emerald-600';
      case 'DEBIT':
        return 'text-rose-600';
      case 'REFUND':
        return 'text-blue-600';
      default:
        return 'text-slate-600';
    }
  };

  const filteredTransactions = transactions?.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const transactionDate = new Date(t.createdAt);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      if (transactionDate < cutoffDate) return false;
    }
    
    return true;
  }) || [];

  return (
    <div className="p-8 space-y-8">
      {/* Credit Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard
            title="Current Balance"
            value={creditData?.balance || 0}
            icon={<CreditCard />}
            subtitle="Available Credits"
            color="primary"
            loading={isLoading}
          />

          <StatCard
            title="Total Earned"
            value={creditData?.totalEarned || 0}
            icon={<TrendingUp />}
            subtitle="All Time"
            color="success"
            loading={isLoading}
          />

          <StatCard
            title="Total Spent"
            value={creditData?.totalSpent || 0}
            icon={<TrendingDown />}
            subtitle="All Time"
            color="accent"
            loading={isLoading}
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Filter size={18} className="text-slate-400" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">
                Filter Transactions
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Type:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="CREDIT">Credits</option>
                  <option value="DEBIT">Debits</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Period:</span>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Transaction History
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-20 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
                <p className="mt-4 text-sm font-bold text-slate-400">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-20 text-center">
                <Package size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm font-bold text-slate-400">No transactions found</p>
                <p className="text-xs text-slate-400 mt-2">
                  Your credit transactions will appear here
                </p>
              </div>
            ) : (
              filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-8 py-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                        {getTransactionIcon(transaction.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-sm font-black text-slate-900 truncate">
                            {transaction.description}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            transaction.type === 'CREDIT' || transaction.type === 'PURCHASE'
                              ? 'bg-emerald-50 text-emerald-600'
                              : transaction.type === 'DEBIT'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}>
                            {transaction.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} />
                            <span>{formatDate(transaction.createdAt)}</span>
                          </div>
                          {transaction.featureName && (
                            <div className="flex items-center gap-1.5">
                              <Truck size={12} />
                              <span>{transaction.featureName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-black ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'DEBIT' ? '-' : '+'}
                        {transaction.amount} credits
                      </p>
                      <p className="text-xs text-slate-400 font-bold mt-1">
                        Balance: {transaction.balance}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
    </div>
  );
};

export default TruckOwnerCredits;
