import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import {
  FaCreditCard,
  FaSearch,
  FaEye,
  FaBan,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaPlus,
  FaGift,
  FaSync,
  FaTimes,
  FaBuilding,
  FaChartLine,
  FaHistory,
} from 'react-icons/fa';

interface TenantSubscription {
  id: string;
  tenantId: string;
  tenantName: string;
  status: 'active' | 'trial' | 'cancelled' | 'expired' | 'suspended';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  autoRenew: boolean;
  plan: {
    id: string;
    name: string;
    slug: string;
    priceMonthly: number;
    priceYearly: number;
    includedCredits: number;
  };
  creditBalance: number;
  totalRevenue: number;
  createdAt: string;
}

const TenantSubscriptions: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<TenantSubscription | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [creditsToAdd, setCreditsToAdd] = useState(0);
  const [creditReason, setCreditReason] = useState('');

  // Fetch all tenant subscriptions
  const { data: subscriptionsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-tenant-subscriptions', statusFilter, planFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (planFilter !== 'all') params.append('plan', planFilter);
      
      const response = await api.get(`/admin/subscriptions?${params.toString()}`);
      return response.data;
    },
  });

  // Fetch credit transactions for selected tenant
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-credit-transactions', selectedSubscription?.tenantId],
    queryFn: async () => {
      if (!selectedSubscription?.tenantId) return null;
      const response = await api.get(`/admin/credits/transactions/${selectedSubscription.tenantId}?limit=50`);
      return response.data;
    },
    enabled: showTransactionsModal && !!selectedSubscription?.tenantId,
  });

  // Cancel subscription mutation
  const cancelSubscription = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await api.post(`/admin/subscriptions/${subscriptionId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subscription cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-tenant-subscriptions'] });
      setShowDetailsModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    },
  });

  // Reactivate subscription mutation
  const reactivateSubscription = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await api.post(`/admin/subscriptions/${subscriptionId}/reactivate`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subscription reactivated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-tenant-subscriptions'] });
      setShowDetailsModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reactivate subscription');
    },
  });

  // Add credits mutation
  const addCredits = useMutation({
    mutationFn: async ({ tenantId, credits, reason }: { tenantId: string; credits: number; reason: string }) => {
      const response = await api.post(`/admin/credits/add`, {
        tenantId,
        amount: credits,
        reason,
        type: 'bonus',
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Credits added successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-tenant-subscriptions'] });
      setShowAddCreditsModal(false);
      setCreditsToAdd(0);
      setCreditReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add credits');
    },
  });

  const subscriptions: TenantSubscription[] = subscriptionsData?.data || [];

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = 
      sub.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.tenantId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate stats
  const stats = [
    {
      label: 'Total Subscriptions',
      value: subscriptions.length,
      icon: FaCreditCard,
      color: 'from-blue-500 to-blue-600',
      description: 'All tenant subscriptions',
    },
    {
      label: 'Active',
      value: subscriptions.filter(s => s.status === 'active').length,
      icon: FaCheckCircle,
      color: 'from-green-500 to-green-600',
      description: 'Currently active',
    },
    {
      label: 'Trial',
      value: subscriptions.filter(s => s.status === 'trial').length,
      icon: FaClock,
      color: 'from-yellow-500 to-yellow-600',
      description: 'In trial period',
    },
    {
      label: 'Monthly Revenue',
      value: `$${Number(subscriptions.reduce((sum, s) => {
        if ((s.status === 'active' || s.status === 'trial') && s.plan) {
          const monthlyPrice = s.billingCycle === 'monthly' 
            ? (Number(s.plan.priceMonthly) || 0)
            : ((Number(s.plan.priceYearly) || 0) / 12);
          return sum + monthlyPrice;
        }
        return sum;
      }, 0)).toFixed(2)}`,
      icon: FaChartLine,
      color: 'from-purple-500 to-purple-600',
      description: 'Recurring revenue',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaCheckCircle className="text-green-500" />;
      case 'trial': return <FaClock className="text-yellow-500" />;
      case 'cancelled': return <FaBan className="text-red-500" />;
      case 'expired': return <FaTimes className="text-gray-500" />;
      case 'suspended': return <FaExclamationTriangle className="text-orange-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <AdminPageLayout title="Tenant Subscriptions" description="Manage all tenant subscriptions">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading subscriptions...</p>
          </div>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Tenant Subscriptions"
      description="View and manage all tenant subscriptions and billing"
      actions={
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium shadow-sm"
        >
          <FaSync className="text-sm" />
          Refresh
        </button>
      }
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 border-2 border-slate-100 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-r ${stat.color} rounded-xl`}>
                    <Icon className="text-2xl text-white" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{stat.label}</span>
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</div>
                <div className="text-sm text-slate-600">{stat.description}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tenants..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPlanFilter('all');
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <FaTimes className="text-sm" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Billing
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Period End
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FaCreditCard className="text-5xl text-slate-300 mb-4" />
                        <p className="text-slate-600 font-medium">No subscriptions found</p>
                        <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <FaBuilding className="text-indigo-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{subscription.tenantName}</div>
                            <div className="text-xs text-slate-500">{subscription.tenantId.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{subscription.plan.name}</div>
                        <div className="text-xs text-slate-500">
                          {subscription.plan.includedCredits.toLocaleString()} credits/mo
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(subscription.status)}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(subscription.status)}`}>
                            {subscription.status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 capitalize">{subscription.billingCycle}</div>
                        <div className="text-xs text-slate-500">
                          ${subscription.billingCycle === 'monthly' 
                            ? subscription.plan.priceMonthly 
                            : subscription.plan.priceYearly}/
                          {subscription.billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-indigo-600">
                          {(subscription.creditBalance || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-green-600">
                          ${(subscription.totalRevenue || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          {Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => {
                              navigate('/admin/credit-usage', { 
                                state: { tenantId: subscription.tenantId, tenantName: subscription.tenantName } 
                              });
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View Credit Usage History"
                          >
                            <FaHistory />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowTransactionsModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Transactions"
                          >
                            <FaChartLine />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowAddCreditsModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Add Credits"
                          >
                            <FaGift />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Subscription Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FaTimes className="text-slate-600" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Tenant Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-bold text-slate-900 mb-3">Tenant Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-600">Name</div>
                      <div className="font-medium text-slate-900">{selectedSubscription.tenantName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">ID</div>
                      <div className="font-medium text-slate-900 text-xs">{selectedSubscription.tenantId}</div>
                    </div>
                  </div>
                </div>

                {/* Subscription Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-bold text-slate-900 mb-3">Subscription Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-600">Plan</div>
                      <div className="font-medium text-slate-900">{selectedSubscription.plan.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Status</div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedSubscription.status)}`}>
                        {selectedSubscription.status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Billing Cycle</div>
                      <div className="font-medium text-slate-900 capitalize">{selectedSubscription.billingCycle}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Auto Renew</div>
                      <div className="font-medium text-slate-900">{selectedSubscription.autoRenew ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Period Start</div>
                      <div className="font-medium text-slate-900">
                        {new Date(selectedSubscription.currentPeriodStart).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Period End</div>
                      <div className="font-medium text-slate-900">
                        {new Date(selectedSubscription.currentPeriodEnd).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Credits & Revenue */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-bold text-slate-900 mb-3">Credits & Revenue</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-600">Current Balance</div>
                      <div className="text-2xl font-bold text-indigo-600">
                        {(selectedSubscription.creditBalance || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-600">Total Revenue</div>
                      <div className="text-2xl font-bold text-green-600">
                        ${(selectedSubscription.totalRevenue || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {selectedSubscription.status === 'active' && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to cancel this subscription?')) {
                          cancelSubscription.mutate(selectedSubscription.id);
                        }
                      }}
                      disabled={cancelSubscription.isPending}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-bold disabled:opacity-50"
                    >
                      {cancelSubscription.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                    </button>
                  )}
                  {(selectedSubscription.status === 'cancelled' || selectedSubscription.status === 'expired') && (
                    <button
                      onClick={() => reactivateSubscription.mutate(selectedSubscription.id)}
                      disabled={reactivateSubscription.isPending}
                      className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold disabled:opacity-50"
                    >
                      {reactivateSubscription.isPending ? 'Reactivating...' : 'Reactivate Subscription'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Credits Modal */}
        {showAddCreditsModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Add Bonus Credits</h3>
                <button
                  onClick={() => {
                    setShowAddCreditsModal(false);
                    setCreditsToAdd(0);
                    setCreditReason('');
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FaTimes className="text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="text-sm text-indigo-600 mb-1">Tenant</div>
                  <div className="font-bold text-indigo-900">{selectedSubscription.tenantName}</div>
                  <div className="text-sm text-indigo-600 mt-2">Current Balance</div>
                  <div className="text-2xl font-bold text-indigo-900">
                    {(selectedSubscription.creditBalance || 0).toLocaleString()} credits
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Credits to Add
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={creditsToAdd}
                    onChange={(e) => setCreditsToAdd(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter reason for adding credits"
                    rows={3}
                  />
                </div>

                {creditsToAdd > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 mb-1">New Balance</div>
                    <div className="text-2xl font-bold text-green-900">
                      {((selectedSubscription.creditBalance || 0) + creditsToAdd).toLocaleString()} credits
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (creditsToAdd > 0 && creditReason.trim()) {
                        addCredits.mutate({
                          tenantId: selectedSubscription.tenantId,
                          credits: creditsToAdd,
                          reason: creditReason,
                        });
                      } else {
                        toast.error('Please enter credits amount and reason');
                      }
                    }}
                    disabled={addCredits.isPending || creditsToAdd <= 0 || !creditReason.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-bold disabled:opacity-50"
                  >
                    {addCredits.isPending ? 'Adding...' : 'Add Credits'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCreditsModal(false);
                      setCreditsToAdd(0);
                      setCreditReason('');
                    }}
                    className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Modal */}
        {showTransactionsModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Credit Transactions</h3>
                  <p className="text-slate-600 mt-1">{selectedSubscription.tenantName}</p>
                </div>
                <button
                  onClick={() => setShowTransactionsModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FaTimes className="text-slate-600" />
                </button>
              </div>

              {transactionsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-slate-600">Loading transactions...</p>
                </div>
              ) : transactionsData?.data?.length === 0 ? (
                <div className="text-center py-12">
                  <FaChartLine className="text-6xl text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactionsData?.data?.map((transaction: any) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                          }`}
                        >
                          {transaction.amount > 0 ? (
                            <FaPlus className="text-green-600 text-xl" />
                          ) : (
                            <FaChartLine className="text-red-600 text-xl" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{transaction.description}</div>
                          <div className="text-sm text-slate-600">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Type: <span className="font-medium">{transaction.type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-xl font-bold ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.amount > 0 ? '+' : ''}
                          {transaction.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          Balance: {transaction.balanceAfter.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={() => setShowTransactionsModal(false)}
                  className="w-full px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
};

export default TenantSubscriptions;
