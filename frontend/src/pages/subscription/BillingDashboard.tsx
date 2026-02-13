import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import {
  FaCreditCard,
  FaChartLine,
  FaHistory,
  FaShoppingCart,
  FaArrowUp,
  FaArrowDown,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaDownload,
  FaSync,
  FaBell,
  FaCog,
  FaTrophy,
  FaFire,
} from 'react-icons/fa';

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading billing information...</p>
        </div>
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
    <AdminPageLayout
      title="Billing & Credits"
      description="Manage your subscription and monitor credit usage"
      actions={
        <div className="flex gap-3">
          <button
            onClick={() => refetchSubscription()}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium shadow-sm"
          >
            <FaSync className="text-sm" />
            Refresh
          </button>
          <button
            onClick={() => navigate('/admin/billing/settings')}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium shadow-sm"
          >
            <FaCog className="text-sm" />
            Settings
          </button>
        </div>
      }
    >
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
                onClick={() => navigate('/admin/billing/payment-methods')}
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors"
              >
                Add Payment Method
              </button>
            </div>
          </div>
        )}

        {/* Low Balance Warning */}
        {isVeryLowBalance && !isTrial && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="text-red-500 text-3xl animate-pulse" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-bold text-red-900 text-lg">Critical: Very Low Credit Balance!</h3>
                <p className="text-red-800 text-sm mt-1">
                  You only have {balance?.currentBalance} credits remaining. Your services may be interrupted soon.
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/billing/purchase-credits')}
                className="ml-4 bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-all shadow-lg animate-pulse"
              >
                Buy Credits Now
              </button>
            </div>
          </div>
        )}
        
        {isLowBalance && !isVeryLowBalance && !isTrial && (
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-400 p-5 rounded-lg shadow-md">
            <div className="flex items-center">
              <FaBell className="text-yellow-500 text-2xl mr-4" />
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900">Low Credit Balance</h3>
                <p className="text-yellow-800 text-sm">
                  You have {balance?.currentBalance} credits remaining. Consider purchasing more or upgrading your plan.
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/billing/purchase-credits')}
                className="bg-yellow-500 text-yellow-900 px-5 py-2 rounded-lg font-bold hover:bg-yellow-600 transition-all shadow-md"
              >
                Buy Credits
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          {/* Current Balance */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <FaCreditCard className="text-2xl text-white" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Balance</span>
            </div>
            <div className={`text-4xl font-bold mb-1 ${getBalanceColor()}`}>
              {balance?.currentBalance.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600 font-medium">Available Credits</div>
            {balance && balance.currentBalance < 100 && (
              <div className="mt-3 flex items-center gap-1 text-xs text-yellow-600">
                <FaExclamationTriangle />
                <span>Low balance</span>
              </div>
            )}
          </div>

          {/* Monthly Usage */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <FaChartLine className="text-2xl text-white" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Usage</span>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-1">
              {usage?.totalConsumed.toLocaleString() || 0}
            </div>
            <div className="text-sm text-slate-600 font-medium">Credits Used (30 days)</div>
            {subscription && usage && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>{getUsagePercentage()}% of plan</span>
                  <span>{subscription.plan.includedCredits.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      getUsagePercentage() > 90 ? 'bg-red-500' :
                      getUsagePercentage() > 70 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Current Plan */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <FaTrophy className="text-2xl text-white" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Plan</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {subscription?.plan.name}
            </div>
            <div className="text-sm text-slate-600 font-medium capitalize">{subscription?.billingCycle}</div>
            {isTrial && (
              <div className="mt-3 flex items-center gap-1 text-xs text-indigo-600 font-medium">
                <FaFire />
                <span>Free Trial Active</span>
              </div>
            )}
          </div>

          {/* Next Renewal */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <FaClock className="text-2xl text-white" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Renewal</span>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-1">{daysUntilRenewal}</div>
            <div className="text-sm text-slate-600 font-medium">Days Remaining</div>
            {daysUntilRenewal <= 7 && (
              <div className="mt-3 text-xs text-orange-600 font-medium">
                Renews soon
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-slate-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('usage')}
                className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'usage'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Usage Analytics
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
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
                        Refreshes {balance?.nextRefreshDate ? new Date(balance.nextRefreshDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 font-medium mb-1">Purchased Credits</div>
                      <div className="text-2xl font-bold text-green-900">
                        {balance?.purchasedCredits.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-600 mt-1">Valid for 12 months</div>
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

                {/* Subscription Details */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Subscription Details</h3>
                  <div className="bg-slate-50 rounded-lg p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-slate-600 mb-1">Current Plan</div>
                        <div className="text-xl font-bold text-slate-900">{subscription?.plan.name}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600 mb-1">Billing Cycle</div>
                        <div className="text-xl font-bold text-slate-900 capitalize">
                          {subscription?.billingCycle}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600 mb-1">Monthly Credits</div>
                        <div className="text-xl font-bold text-slate-900">
                          {subscription?.plan.includedCredits.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-600 mb-1">Next Billing Date</div>
                        <div className="text-xl font-bold text-slate-900">
                          {subscription?.currentPeriodEnd
                            ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                            : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={() => navigate('/admin/subscription/plans')}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-bold shadow-lg"
                      >
                        <FaArrowUp />
                        Upgrade Plan
                      </button>
                      <button
                        onClick={() => navigate('/admin/billing/purchase-credits')}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-bold shadow-lg"
                      >
                        <FaShoppingCart />
                        Buy Credits
                      </button>
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all font-medium"
                      >
                        Cancel Subscription
                      </button>
                    </div>
                  </div>
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
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                          }`}
                        >
                          {transaction.amount > 0 ? (
                            <FaArrowUp className="text-green-600" />
                          ) : (
                            <FaArrowDown className="text-red-600" />
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
                          className={`text-lg font-bold ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="text-3xl text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Cancel Subscription?</h3>
              <p className="text-slate-600">
                Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
              </p>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <h4 className="font-bold text-slate-900 mb-2">What happens next:</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>You'll keep access until {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'end of period'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Your remaining credits will be available until then</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>No further charges will be made</span>
                </li>
                <li className="flex items-start gap-2">
                  <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>You can reactivate anytime</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all font-bold"
              >
                Keep Subscription
              </button>
              <button
                onClick={() => cancelSubscription.mutate()}
                disabled={cancelSubscription.isPending}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-bold disabled:opacity-50"
              >
                {cancelSubscription.isPending ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default BillingDashboard;
