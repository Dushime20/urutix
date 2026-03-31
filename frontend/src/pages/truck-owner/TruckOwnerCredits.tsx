import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/EnliteUI/Cards/StatCard';
import { TranslatedText } from '../../components/translated-text';
import { useTranslation } from '../../hooks/useTranslation';

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
  const { tSync } = useTranslation();
  const [filterType, setFilterType] = useState<'all' | 'DEBIT' | 'CREDIT'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Fetch credit balance and transactions
  const { data: creditData, isLoading } = useQuery<Omit<CreditBalance, 'transactions'>>({
    queryKey: ['truck-owner-credits', user?.id],
    queryFn: async () => {
      const response = await api.get('/credits/balance');
      return {
        balance: response.data.data.currentBalance || 0,
        totalEarned: response.data.data.lifetimeEarned || 0,
        totalSpent: response.data.data.lifetimeSpent || 0,
      };
    },
    enabled: !!user?.id
  });

  const { data: transactionsData } = useQuery<CreditTransaction[]>({
    queryKey: ['truck-owner-transactions', user?.id],
    queryFn: async () => {
      const response = await api.get('/credits/transactions?limit=100');
      return response.data.data || [];
    },
    enabled: !!user?.id
  });

  const transactions = transactionsData || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'CREDIT':
      case 'PURCHASE':
        return <ArrowUpRight className="text-emerald-500" size={18} />;
      case 'DEBIT':
        return <ArrowDownRight className="text-rose-500" size={18} />;
      default:
        return <DollarSign className="text-slate-400" size={18} />;
    }
  };

  const getTransactionColor = (type: CreditTransaction['type']) => {
    switch (type) {
      case 'CREDIT':
      case 'PURCHASE':
        return 'text-emerald-500';
      case 'DEBIT':
        return 'text-rose-500';
      default:
        return 'text-blue-500';
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: CreditTransaction) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const transactionDate = new Date(t.createdAt);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        if (transactionDate < cutoffDate) return false;
      }
      
      return true;
    });
  }, [transactions, filterType, dateRange]);

  return (
    <div className="p-8 space-y-8 transition-colors duration-200">
      {/* Credit Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard
            title={<TranslatedText text="Current Balance" />}
            value={creditData?.balance || 0}
            icon={<CreditCard />}
            subtitle={<TranslatedText text="Available Credits" />}
            color="primary"
            variant="premium"
            loading={isLoading}
          />

        <StatCard
            title={<TranslatedText text="Total Earned" />}
            value={creditData?.totalEarned || 0}
            icon={<TrendingUp />}
            subtitle={<TranslatedText text="All Time" />}
            color="success"
            loading={isLoading}
          />

          <StatCard
            title={<TranslatedText text="Total Spent" />}
            value={creditData?.totalSpent || 0}
            icon={<TrendingDown />}
            subtitle={<TranslatedText text="All Time" />}
            color="accent"
            loading={isLoading}
          />
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-6 mb-6 transition-colors duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Filter size={18} className="text-slate-400 dark:text-slate-500" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                <TranslatedText text="Filter Transactions" />
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-600">
                  <TranslatedText text="Type:" />
                </span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                >
                  <option value="all">{tSync('All Types')}</option>
                  <option value="CREDIT">{tSync('Credits')}</option>
                  <option value="DEBIT">{tSync('Debits')}</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-600">
                  <TranslatedText text="Period:" />
                </span>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                >
                  <option value="7d">{tSync('Last 7 Days')}</option>
                  <option value="30d">{tSync('Last 30 Days')}</option>
                  <option value="90d">{tSync('Last 90 Days')}</option>
                  <option value="all">{tSync('All Time')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  <TranslatedText text="Transaction History" />
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-600 mt-1">
                  {filteredTransactions.length} {tSync('transaction')}{filteredTransactions.length !== 1 ? tSync('s') : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <div className="p-20 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
                <p className="mt-4 text-sm font-bold text-slate-400 dark:text-slate-600">
                  <TranslatedText text="Loading transactions..." />
                </p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-20 text-center">
                <Package size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-sm font-bold text-slate-400 dark:text-slate-600">
                  <TranslatedText text="No transactions found" />
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
                  <TranslatedText text="Your credit transactions will appear here" />
                </p>
              </div>
            ) : (
              filteredTransactions.map((transaction: CreditTransaction, index: number) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-8 py-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center flex-shrink-0">
                        {getTransactionIcon(transaction.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {transaction.description}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            transaction.type === 'CREDIT' || transaction.type === 'PURCHASE'
                               ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                               : transaction.type === 'DEBIT'
                               ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30'
                               : 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'
                           }`}>
                            {transaction.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-600">
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
                        {transaction.amount} {tSync('credits')}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-600 font-bold mt-1">
                        {tSync('Balance')}: {transaction.balance}
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
