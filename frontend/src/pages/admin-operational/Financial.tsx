import React, { useState, useEffect } from 'react';
import { FaWallet, FaMoneyBillWave, FaExchangeAlt, FaChartBar } from 'react-icons/fa';
import OperationalPageLayout from '../../components/Admin/OperationalPageLayout';
import { operationalAdminApi } from '../../services/operationalAdminApi';
import type { FinancialMetrics } from '../../services/tenantApi';
import ModernLoader from '../../components/common/ModernLoader';
import { StatCard } from '../../components/EnliteUI';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const OperationalAdminFinancial: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (user?.tenantId) {
      fetchFinancialData(user.tenantId, timeRange);
    } else {
      setLoading(false);
    }
  }, [user?.tenantId, timeRange]);

  const fetchFinancialData = async (tenantId: string, range: string) => {
    try {
      setLoading(true);
      const data = await operationalAdminApi.getFinancials();
      setMetrics(data);
    } catch (error) {
      toast.error('Failed to load financial metrics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <OperationalPageLayout
      title="Financial Overview"
      description="Monitor revenue, transactions, and account balances"
    >
      {loading && !metrics ? (
        <ModernLoader isLoading={true} type="page" />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end mb-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(metrics?.totalRevenue)}
              icon={<FaMoneyBillWave size={22} />}
              color="primary"
              variant="classic"
              subtitle={`Earned over ${timeRange}`}
            />
            <StatCard
              title="Transactions"
              value={metrics?.totalTransactions || 0}
              icon={<FaExchangeAlt size={22} />}
              color="primary"
              variant="classic"
              subtitle="Processed payments"
            />
            <StatCard
              title="Pending Amount"
              value={formatCurrency(metrics?.pendingAmount)}
              icon={<FaWallet size={22} />}
              color="warning"
              variant="classic"
              subtitle="Awaiting clearance"
            />
            <StatCard
              title="Escrow Balance"
              value={formatCurrency(metrics?.escrowBalance)}
              icon={<FaWallet size={22} />}
              color="success"
              variant="classic"
              subtitle="Secured funds"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 lg:col-span-2">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                 <FaChartBar className="text-primary-500" /> Revenue Growth
               </h3>
               <div className="h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                 <div className="text-center">
                    <FaChartBar size={40} className="mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                    <p className="text-gray-500 font-medium">Chart visualization ready</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Monthly Growth: {metrics?.monthlyGrowth ? `${metrics.monthlyGrowth}%` : '0%'}
                    </p>
                 </div>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
               <div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Financial Summary</h3>
                 <div className="space-y-6">
                   <div>
                     <p className="text-sm text-gray-500 dark:text-gray-400">Average Transaction Value</p>
                     <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                       {formatCurrency(metrics?.averageTransactionValue)}
                     </p>
                   </div>
                   <div className="h-px bg-gray-100 dark:bg-slate-800 w-full"></div>
                   <div>
                     <p className="text-sm text-gray-500 dark:text-gray-400">Platform Fees</p>
                     <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                       {formatCurrency(metrics?.platformFees)}
                     </p>
                     <p className="text-xs text-gray-400 mt-1">Deducted automatically</p>
                   </div>
                 </div>
               </div>
               <button className="w-full py-3 mt-8 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
                 Download Statement
               </button>
            </div>
          </div>
        </div>
      )}
    </OperationalPageLayout>
  );
};

export default OperationalAdminFinancial;
