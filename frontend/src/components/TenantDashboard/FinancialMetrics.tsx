import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query'; // Import useQuery
import {
  DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight,
  Landmark, Calendar, Filter, Download, Eye,
  Wallet, Activity, Package, Users, CheckCircle // Import icons
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
import { tenantApi } from '../../services/tenantApi'; // Ensure tenantApi is imported
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { StatCard } from '../EnliteUI/Cards/StatCard';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialMetricsProps {
  tenantId?: string;
  className?: string;
}

const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ className = '' }) => {
  const { tSync } = useTranslation();
  const { format: formatCurrency } = useCurrencyFormat();
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'history'>('overview');

  // Fetch Credit Balance
  const { data: creditBalance } = useQuery({
    queryKey: ['creditBalance'],
    queryFn: () => tenantApi.getCreditBalance(),
  });

  // Fetch Financial Metrics (real data from backend)
  const { data: financialMetrics } = useQuery({
    queryKey: ['financialMetrics', timeRange],
    queryFn: async () => {
      // This will be implemented in the backend
      // For now, return empty structure
      return {
        summary: {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          profitMargin: 0,
          averageRevenuePerLoad: 0,
          averageCostPerLoad: 0,
          totalLoads: 0,
          activeContracts: 0,
        },
        trends: [],
        breakdown: {
          revenue: [],
          expenses: []
        }
      };
    },
  });

  // Fetch Credit Transactions Summary (for Tenant Admin)
  const { data: transactionData } = useQuery({
    queryKey: ['creditTransactionSummary'],
    queryFn: async () => {
      try {
        const response = await tenantApi.getCreditTransactionSummary();
        return response || { transactions: [], summary: null };
      } catch (error) {
        console.error('Failed to fetch transaction summary:', error);
        return { transactions: [], summary: null };
      }
    },
  });

  const transactions = transactionData?.transactions || [];
  const transactionSummary = transactionData?.summary;

  // Fetch Partner Plans Summary for allocation calculation
  const { data: partnerPlans } = useQuery({
    queryKey: ['partnerPlansSummary'],
    queryFn: async () => {
      try {
        const response = await tenantApi.getPartnerPlansSummary();
        return response || [];
      } catch (error) {
        console.error('Failed to fetch partner plans:', error);
        return [];
      }
    },
  });

  // Calculate total allocation and sold credits
  const creditAllocation = useMemo(() => {
    // If we have transaction summary (for Tenant Admin), use it
    if (transactionSummary) {
      // Calculate total allocated from partner plans
      const totalAllocated = partnerPlans?.reduce((sum: number, plan: any) => {
        return sum + ((plan.creditCostPerPartner || 0) * (plan.availableSlots || 0));
      }, 0) || 0;

      return {
        totalAllocated,
        totalSold: transactionSummary.creditsSold || 0,
        unallocated: (transactionSummary.totalPurchased || 0) - totalAllocated,
      };
    }

    // Fallback to credit balance data
    if (!partnerPlans || !creditBalance) {
      return {
        totalAllocated: 0,
        totalSold: 0,
        unallocated: 0,
      };
    }

    const totalAllocated = partnerPlans.reduce((sum: number, plan: any) => {
      return sum + ((plan.creditCostPerPartner || 0) * (plan.availableSlots || 0));
    }, 0);

    const totalSold = creditBalance.creditsAllocatedToPartners || 0;
    const unallocated = (creditBalance.currentBalance || 0) - totalAllocated;

    return {
      totalAllocated,
      totalSold,
      unallocated,
    };
  }, [partnerPlans, creditBalance, transactionSummary]);

  // Enlite Prime Theme Colors (Indigo focus)
  const colors = {
    primary: '#2D5173', // Navy
    primaryLight: '#E8EAF6',
    secondary: '#F50057', // Pink
    background: '#F9FAFB',
    surface: '#FFFFFF',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    success: '#4CAF50',
    successLight: '#E8F5E9',
    error: '#F44336',
    errorLight: '#FFEBEE',
    warning: '#FF9800',
    warningLight: '#FFF3E0',
    info: '#2196F3',
    infoLight: '#E3F2FD'
  };

  // Use real financial data from API
  const financialData = useMemo(() => {
    if (!financialMetrics) {
      return {
        summary: {
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          profitMargin: 0,
          averageRevenuePerLoad: 0,
          averageCostPerLoad: 0,
          totalLoads: 0,
          activeContracts: 0,
        },
        trends: [],
        breakdown: {
          revenue: [],
          expenses: []
        }
      };
    }
    return financialMetrics;
  }, [financialMetrics]);

  // formatCurrency provided by useCurrencyFormat hook above

  const getTrendIcon = (value: number) => {
    return value >= 0
      ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
      : <ArrowDownRight className="w-4 h-4 text-rose-500" />;
  };

  const revenueChartData = {
    labels: financialData.trends.map(t => t.month),
    datasets: [
      {
        label: 'Revenue',
        data: financialData.trends.map(t => t.revenue),
        borderColor: colors.primary,
        backgroundColor: 'rgba(45, 81, 115, 0.05)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: colors.primary,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
      {
        label: 'Expenses',
        data: financialData.trends.map(t => t.expenses),
        borderColor: colors.error,
        backgroundColor: 'rgba(244, 67, 54, 0.05)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: colors.error,
        pointRadius: 0,
        pointHoverRadius: 6,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: colors.surface,
        titleColor: colors.textPrimary,
        bodyColor: colors.textSecondary,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: 'rgba(0, 0, 0, 0.03)' },
        ticks: { font: { size: 10, weight: 600 }, color: '#94A3B8', padding: 10 }
      },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { font: { size: 10, weight: 600 }, color: '#94A3B8', padding: 10 }
      }
    }
  };

  const doughnutData = {
    labels: financialData.breakdown.revenue.map(r => r.label),
    datasets: [{
      data: financialData.breakdown.revenue.map(r => r.value),
      backgroundColor: financialData.breakdown.revenue.map(r => r.color),
      hoverOffset: 4,
      borderWidth: 0,
    }]
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="px-10 py-8 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between rounded-t-[32px]">
        <div>
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1"><TranslatedText text="Financial Status" /></h3>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white"><TranslatedText text="Balance & Revenue" /></h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${timeRange === r ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-100 dark:shadow-slate-950/20 flex items-center text-[10px] font-black uppercase tracking-widest">
            <Download className="w-4 h-4 mr-2" />
            <TranslatedText text="Download Report" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex gap-8">
          {(['overview', 'breakdown', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-5 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
            >
            {tab === 'overview' && tSync('Summary')}
            {tab === 'breakdown' && tSync('Revenue Breakdown')}
            {tab === 'history' && tSync('Transactions')}
            {activeTab === tab && (
              <motion.div
                layoutId="finTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full"
              />
              )}
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Revenue" /></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Expenses" /></span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="pt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {/* Core KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title={<TranslatedText text="Total Earnings" />}
                  value={formatCurrency((creditBalance?.revenueFromPartnerSales || 0) + (financialData.summary.totalRevenue || 0))}
                  icon={<DollarSign size={22} />}
                  color="primary"
                  variant="premium"
                  trendDirection="neutral"
                />
                <StatCard
                  title={<TranslatedText text="Net Profit" />}
                  value={formatCurrency(financialData.summary.netProfit || 0)}
                  icon={<TrendingUp size={22} />}
                  color="emerald"
                  variant="premium"
                  trendDirection="neutral"
                />
                <StatCard
                  title={<TranslatedText text="Average Trip Income" />}
                  value={formatCurrency(financialData.summary.averageRevenuePerLoad || 0)}
                  icon={<Landmark size={22} />}
                  color="info"
                  variant="premium"
                  trendDirection="neutral"
                />
                <StatCard
                  title={<TranslatedText text="Remaining Credits" />}
                  value={(creditBalance?.currentBalance ?? 0).toLocaleString()}
                  icon={<Wallet size={22} />}
                  color="accent"
                  variant="premium"
                  trendDirection="neutral"
                />
              </div>

              {/* Main Chart Section */}
              {financialData.trends.length > 0 ? (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight"><TranslatedText text="Earnings Overview" /></h4>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest italic"><TranslatedText text="Income vs Spend (12 Month History)" /></p>
                    </div>
                    <div className="flex gap-4">
                      <button className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-700 transition-all">
                        <Filter className="w-5 h-5" />
                      </button>
                      <button className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-700 transition-all">
                        <Calendar className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="h-80 relative">
                    <Line data={revenueChartData} options={chartOptions} />
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-center">
                  <div className="py-12">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2"><TranslatedText text="No Financial Data Yet" /></h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400"><TranslatedText text="Start completing trips to see your earnings trends" /></p>
                  </div>
                </div>
              )}

              {/* Detail Metrics Row */}
              {financialData.breakdown.revenue.length > 0 || financialData.breakdown.expenses.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {financialData.breakdown.revenue.length > 0 && (
                    <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6"><TranslatedText text="Revenue Segments" /></h4>
                      <div className="h-48 mb-6">
                        <Doughnut data={doughnutData} options={{ ...chartOptions, plugins: { legend: { display: false } } }} />
                      </div>
                      <div className="space-y-3">
                        {financialData.breakdown.revenue.map(item => (
                          <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                              <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{tSync(item.label)}</span>
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {financialData.breakdown.expenses.length > 0 && (
                    <div className={`${financialData.breakdown.revenue.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)]`}>
                      <div className="flex items-center justify-between mb-8">
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Expense Hierarchy" /></h4>
                      </div>
                      <div className="space-y-6">
                        {financialData.breakdown.expenses.slice(0, 4).map(item => (
                          <div key={item.label} className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                              <span>{tSync(item.label)}</span>
                              <span className="text-slate-900 dark:text-slate-100">{formatCurrency(item.value)}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${financialData.summary.totalExpenses > 0 ? (item.value / financialData.summary.totalExpenses) * 100 : 0}%` }}
                                className="h-full bg-primary-500 rounded-full"
                              />
                            </div>
                          </div>
                        ))}
                        {financialData.summary.totalExpenses > 0 && (
                          <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 grid grid-cols-2 gap-8">
                            <div>
                              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1"><TranslatedText text="Operating Ratio" /></p>
                              <p className="text-xl font-black text-slate-900 dark:text-white">
                                {financialData.summary.totalRevenue > 0 
                                  ? ((financialData.summary.totalExpenses / financialData.summary.totalRevenue) * 100).toFixed(1) 
                                  : 0}%
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1"><TranslatedText text="Net Profit" /></p>
                              <p className="text-xl font-black text-emerald-500">{formatCurrency(financialData.summary.netProfit)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          )}

          {activeTab === 'breakdown' && (
            <motion.div
              key="breakdown"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="py-12 flex flex-col items-center justify-center bg-primary-600 dark:bg-primary-700 rounded-[40px] text-white shadow-xl shadow-primary-100 dark:shadow-slate-950/20 relative overflow-hidden group"
            >
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                  <PieChart className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-black tracking-tight"><TranslatedText text="Advanced Fiscal Segmentation" /></h4>
                <p className="text-sm text-white/70 font-medium mb-6 italic px-10"><TranslatedText text="Deep dive into cost centers and revenue streams with multi-dimensional filters." /></p>
                <button className="bg-white text-primary-600 px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-xl"><TranslatedText text="Launch Fiscal Lab" /></button>
              </div>
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 backdrop-blur-3xl group-hover:bg-white/10 transition-colors duration-700"></div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Credit Balance Summary for Tenant Admin */}
              {creditBalance && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title={<TranslatedText text="Current Balance" />}
                    value={(creditBalance.currentBalance ?? 0).toLocaleString()}
                    icon={<Wallet size={22} />}
                    color="primary"
                    variant="premium"
                    subtitle={<TranslatedText text="Credits available to use" />}
                  />
                  <StatCard
                    title={<TranslatedText text="Subscription Credits" />}
                    value={(creditBalance.subscriptionCredits ?? 0).toLocaleString()}
                    icon={<Package size={22} />}
                    color="info"
                    variant="premium"
                    subtitle={<TranslatedText text="From active subscription plan" />}
                  />
                  <StatCard
                    title={<TranslatedText text="Bonus Credits" />}
                    value={(creditBalance.bonusCredits ?? 0).toLocaleString()}
                    icon={<Activity size={22} />}
                    color="warning"
                    variant="premium"
                    subtitle={<TranslatedText text="Earned from marketplace & bids" />}
                  />
                  <StatCard
                    title={<TranslatedText text="Lifetime Spent" />}
                    value={(creditBalance.lifetimeSpent ?? 0).toLocaleString()}
                    icon={<CheckCircle size={22} />}
                    color="error"
                    variant="premium"
                    subtitle={<TranslatedText text="Total credits consumed" />}
                  />
                </div>
              )}

              {/* Transaction History Table */}
              <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
                {transactions && transactions.length > 0 ? (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Details" /></th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Type" /></th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Amount" /></th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Balance" /></th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right"><TranslatedText text="Date" /></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {transactions.map((txn: any) => (
                        <tr key={txn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-all">
                          <td className="px-10 py-6">
                            <div>
                              <p className="text-sm font-black text-slate-900 dark:text-slate-100">{txn.description || 'Transaction'}</p>
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">
                                {txn.id.substring(0, 8)}
                              </p>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              txn.type === 'SUBSCRIPTION_GRANT' || txn.type === 'PURCHASE' || txn.type === 'BONUS' 
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                            }`}>
                              <TranslatedText text={txn.type.replace(/_/g, ' ')} />
                            </span>
                          </td>
                          <td className="px-10 py-6">
                            <span className={`text-sm font-black ${
                              txn.type === 'SUBSCRIPTION_GRANT' || txn.type === 'PURCHASE' || txn.type === 'BONUS'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {txn.type === 'SUBSCRIPTION_GRANT' || txn.type === 'PURCHASE' || txn.type === 'BONUS' ? '+' : '-'}
                              {txn.amount.toLocaleString()} credits
                            </span>
                          </td>
                          <td className="px-10 py-6 text-sm font-black text-slate-900 dark:text-slate-100">
                            {txn.balanceAfter.toLocaleString()} credits
                          </td>
                          <td className="px-10 py-6 text-right">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              {new Date(txn.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2">
                      <TranslatedText text="No Transactions Yet" />
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      <TranslatedText text="Your credit transaction history will appear here" />
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};

// Simple Icon for the empty state
const PieChart: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
  </svg>
);

export default FinancialMetrics;
