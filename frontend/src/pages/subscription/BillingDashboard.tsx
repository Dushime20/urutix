import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  CreditCard,
  TrendingUp,
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Bell,
  Settings as Cog,
  Trophy,
  X
} from 'lucide-react';

interface CreditBalance {
  currentBalance: number;
  subscriptionCredits: number;
  purchasedCredits: number;
  bonusCredits: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  nextRefreshDate: string | null;
}

interface Subscription {
  id: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  autoRenew: boolean;
  plan: {
    name: string;
    slug: string;
    priceMonthly: number;
    priceYearly: number;
    includedCredits: number;
  };
}

const BillingDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'history'>('overview');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch current subscription
  const { data: subscriptionData, isLoading: subLoading, refetch: refetchSubscription } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/current');
      return response.data;
    },
  });

  // Fetch credit balance
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: async () => {
      const response = await api.get('/credits/balance');
      return response.data;
    },
  });

  // Fetch usage statistics
  const { data: usageData } = useQuery({
    queryKey: ['usage-statistics'],
    queryFn: async () => {
      const response = await api.get('/credits/usage/statistics?days=30');
      return response.data;
    },
  });

  // Fetch transaction history
  const { data: transactionsData } = useQuery({
    queryKey: ['credit-transactions'],
    queryFn: async () => {
      const response = await api.get('/credits/transactions?limit=10');
      return response.data;
    },
    enabled: activeTab === 'history',
  });

  // Cancel subscription mutation
  const cancelSubscription = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/subscriptions/${subscription?.id}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subscription cancelled successfully');
      refetchSubscription();
      setShowCancelModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    },
  });

  const subscription: Subscription | null = subscriptionData?.data;
  const balance: CreditBalance | null = balanceData?.data;
  const usage = usageData?.data;
  const transactions = transactionsData?.data || [];

  if (subLoading || balanceLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-[24px]" />)}
        </div>
        <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[24px]" />
        <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-[24px]" />
      </div>
    );
  }

  const daysUntilRenewal = subscription
    ? Math.ceil(
      (new Date(subscription.currentPeriodEnd).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
    )
    : 0;

  const isLowBalance = balance && balance.currentBalance < 100;
  const isTrial = subscription?.status === 'trial';
  const isVeryLowBalance = balance && balance.currentBalance < 50;

  const getBalanceColor = () => {
    if (!balance) return 'text-slate-900';
    if (balance.currentBalance < 50) return 'text-red-600';
    if (balance.currentBalance < 100) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsagePercentage = () => {
    if (!subscription || !usage) return 0;
    return Math.round((usage.totalConsumed / subscription.plan.includedCredits) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Custom Header for Tenant Admin */}
      <div className="bg-white rounded-[24px] shadow-sm p-8 border border-slate-100 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Billing & Credits</h1>
            <p className="text-slate-500 font-medium mt-1">
              Manage your subscription and monitor credit usage
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetchSubscription()}
              className="px-4 py-2 bg-white border border-slate-100 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              onClick={() => navigate('/tenant-admin/settings')}
              className="px-4 py-2 bg-white border border-slate-100 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs flex items-center gap-2"
            >
              <Cog size={14} />
              Settings
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {/* Trial Banner */}
        {isTrial && subscription?.trialEnd && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">🎉 You're on a Free Trial!</h3>
                <p className="text-indigo-100">
                  Your trial ends in{' '}
                  {Math.ceil(
                    (new Date(subscription.trialEnd).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                  )}{' '}
                  days. Add a payment method to continue after trial.
                </p>
              </div>
              <button
                onClick={() => navigate('/tenant-admin/settings')}
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors"
              >
                Add Payment Method
              </button>
            </div>
          </div>
        )}

        {/* Low Balance Warning */}
        {isVeryLowBalance && !isTrial && (
          <div className="bg-red-50 border border-red-100 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <AlertTriangle size={64} className="text-red-600" />
            </div>
            <div className="flex items-center gap-4 relative">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="text-red-600 animate-pulse" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-red-900 text-sm italic uppercase tracking-tight">Critical Balance Warning</h3>
                <p className="text-red-700 text-xs mt-0.5 font-medium">
                  You only have <span className="font-black underline">{balance?.currentBalance} credits</span> remaining. Services may be interrupted soon.
                </p>
              </div>
              <button
                onClick={() => navigate('/tenant-admin/purchase-credits')}
                className="bg-red-600 text-white px-4 py-2 rounded-xl font-black hover:bg-red-700 transition-all text-xs shadow-lg shadow-red-200"
              >
                Buy Credits Now
              </button>
            </div>
          </div>
        )}

        {isLowBalance && !isVeryLowBalance && !isTrial && (
          <div className="bg-yellow-50 border border-yellow-100 p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
                <Bell className="text-yellow-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-yellow-900 text-sm uppercase tracking-tight">Low Credit Balance</h3>
                <p className="text-yellow-700 text-xs mt-0.5 font-medium">
                  You have {balance?.currentBalance} credits remaining. Consider purchasing more to avoid interruption.
                </p>
              </div>
              <button
                onClick={() => navigate('/tenant-admin/purchase-credits')}
                className="bg-yellow-500 text-white px-4 py-2 rounded-xl font-black hover:bg-yellow-600 transition-all text-xs shadow-lg shadow-yellow-100"
              >
                Buy Credits
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Balance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Available Credits</p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-2xl font-black leading-none ${getBalanceColor()}`}>
                    {balance?.currentBalance.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                <CreditCard className="text-white" size={20} />
              </div>
            </div>
            {balance && balance.currentBalance < 100 && (
              <div className="mt-4 flex items-center gap-1 text-[10px] text-yellow-600 font-bold uppercase tracking-wider">
                <AlertTriangle size={12} />
                <span>Critical Balance</span>
              </div>
            )}
          </div>

          {/* Lifetime Consumed */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Consumed</p>
                <p className="text-2xl font-black text-gray-900 leading-none">
                  {balance?.lifetimeSpent.toLocaleString() || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                <TrendingUp className="text-white" size={20} />
              </div>
            </div>
            <div className="mt-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              All-time credits used
            </div>
          </div>

          {/* Purchased Credits */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Purchased Credits</p>
                <p className="text-2xl font-black text-gray-900 leading-none truncate max-w-[120px]">
                  {balance?.purchasedCredits.toLocaleString() || 0}
                </p>
                <p className="text-[10px] text-gray-500 font-bold mt-1.5 uppercase tracking-wider">
                  Top-up credits
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                <Trophy className="text-white" size={20} />
              </div>
            </div>
          </div>

          {/* Bonus Credits */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Bonus Credits</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-gray-900 leading-none">
                    {balance?.bonusCredits.toLocaleString() || 0}
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                <Clock className="text-white" size={20} />
              </div>
            </div>
            <div className="mt-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              Earned from promotions
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50 p-1">
            <nav className="flex gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${activeTab === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('usage')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${activeTab === 'usage'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                Usage Analytics
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all ${activeTab === 'history'
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                Transaction History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Credit Breakdown */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Credit Breakdown</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <div className="text-sm text-indigo-600 font-medium mb-1">Subscription Credits</div>
                      <div className="text-2xl font-bold text-indigo-900">
                        {balance?.subscriptionCredits.toLocaleString()}
                      </div>
                      <div className="text-xs text-indigo-600 mt-1">
                        Available until fully consumed
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 font-medium mb-1">Purchased Credits</div>
                      <div className="text-2xl font-bold text-green-900">
                        {balance?.purchasedCredits.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600 mt-1">Available until fully consumed</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-purple-600 font-medium mb-1">Bonus Credits</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {balance?.bonusCredits.toLocaleString()}
                      </div>
                      <div className="text-xs text-purple-600 mt-1">From promotions</div>
                    </div>
                  </div>
                </div>

                {/* Credit Model Info */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                  <h4 className="font-black text-blue-900 text-sm uppercase tracking-wider mb-2">How Credits Work</h4>
                  <p className="text-xs text-blue-700 font-medium leading-relaxed">
                    Credits are consumed as you use platform features. They remain available until fully used — there is no monthly reset or expiry based on a billing cycle. Purchase more credits at any time to top up your balance.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/tenant-admin/subscription-plans')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-black text-xs shadow-lg shadow-black/10"
                  >
                    <ArrowUp size={14} />
                    Buy More Credits
                  </button>
                  <button
                    onClick={() => navigate('/tenant-admin/purchase-credits')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-900 rounded-xl hover:bg-gray-50 transition-all font-black text-xs"
                  >
                    <ShoppingCart size={14} />
                    Top Up
                  </button>
                </div>
              </div>
            )}

            {/* Usage Tab */}
            {activeTab === 'usage' && usage && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 rounded-lg p-6">
                    <div className="text-sm text-slate-600 mb-1">Total Consumed</div>
                    <div className="text-3xl font-bold text-slate-900">
                      {usage.totalConsumed.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">Last 30 days</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-6">
                    <div className="text-sm text-slate-600 mb-1">Daily Average</div>
                    <div className="text-3xl font-bold text-slate-900">
                      {usage.averageDaily.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">Credits per day</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-6">
                    <div className="text-sm text-slate-600 mb-1">Projected Monthly</div>
                    <div className="text-3xl font-bold text-slate-900">
                      {(usage.averageDaily * 30).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">Based on current usage</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Top Features Used</h3>
                  <div className="space-y-3">
                    {usage.topFeatures.map((feature: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg p-4">
                        <div>
                          <div className="font-medium text-slate-900">{feature.featureCode}</div>
                          <div className="text-sm text-slate-600">{feature.count} uses</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-900">
                            {feature.totalCredits.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-600">credits</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {transactions.map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between bg-slate-50 rounded-lg p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                            }`}
                        >
                          {transaction.amount > 0 ? (
                            <ArrowUp className="text-green-600" size={16} />
                          ) : (
                            <ArrowDown className="text-red-600" size={16} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{transaction.description}</div>
                          <div className="text-sm text-slate-600">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                          {transaction.amount > 0 ? '+' : ''}
                          {transaction.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-600">
                          Balance: {transaction.balanceAfter.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden ring-1 ring-black/5">
            <div className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={18} /> Cancel Subscription
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-600 text-xs font-medium leading-relaxed">
                  Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
                </p>
              </div>

              <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-100">
                <h4 className="font-black text-red-900 text-[10px] uppercase tracking-wider mb-3">Termination Impact</h4>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-2 text-xs text-red-700 font-medium">
                    <CheckCircle2 className="text-red-500 shrink-0" size={12} />
                    <span>Access until {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'end of period'}</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-red-700 font-medium">
                    <CheckCircle2 className="text-red-500 shrink-0" size={12} />
                    <span>Credits remain available until expiry</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-red-700 font-medium">
                    <CheckCircle2 className="text-red-500 shrink-0" size={12} />
                    <span>Autorenewal will be disabled</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-black text-xs"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={() => cancelSubscription.mutate()}
                  disabled={cancelSubscription.isPending}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-black text-xs disabled:opacity-50"
                >
                  {cancelSubscription.isPending ? 'Processing...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingDashboard;
