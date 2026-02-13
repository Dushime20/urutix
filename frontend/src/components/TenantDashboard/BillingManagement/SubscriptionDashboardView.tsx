import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaUsers, FaDollarSign, FaChartLine, FaClock, FaSpinner } from 'react-icons/fa';
import { tenantSubscriptionApi } from '../../../services/tenantSubscriptionApi';

interface SubscriptionDashboardViewProps {
  tenantId: string;
}

const SubscriptionDashboardView: React.FC<SubscriptionDashboardViewProps> = ({ tenantId }) => {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['tenant-subscription-overview', tenantId],
    queryFn: () => tenantSubscriptionApi.getSubscriptionOverview(),
  });

  const { data: expiringData } = useQuery({
    queryKey: ['expiring-subscriptions', tenantId],
    queryFn: () => tenantSubscriptionApi.getExpiringSubscriptions(30),
  });

  const expiringSubscriptions = expiringData?.subscriptions || [];

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="animate-spin text-4xl text-green-600" />
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`text-2xl text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`${overview?.totalRevenue?.toLocaleString() || 0} RWF`}
          icon={FaDollarSign}
          color="green"
        />
        <StatCard
          title="Total Subscribers"
          value={overview?.totalSubscribers || 0}
          icon={FaUsers}
          color="blue"
        />
        <StatCard
          title="Active Plans"
          value={overview?.activePlans || 0}
          icon={FaChartLine}
          color="purple"
        />
        <StatCard
          title="Expiring Soon"
          value={expiringSubscriptions.length}
          icon={FaClock}
          color="orange"
        />
      </div>

      {/* Plans Performance Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Plans Performance</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subscribers</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {overview?.plans?.map((plan) => (
                <tr key={plan.planId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{plan.planName}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        plan.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900">{plan.activeSubscribers}</td>
                  <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                    {plan.revenue.toLocaleString()} RWF
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expiring Subscriptions */}
      {expiringSubscriptions.length > 0 && (
        <div className="bg-white rounded-lg border border-orange-200">
          <div className="px-6 py-4 border-b border-orange-200 bg-orange-50">
            <h4 className="text-lg font-semibold text-gray-900">Expiring Subscriptions (Next 30 Days)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expiringSubscriptions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{sub.user?.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{sub.plan?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(sub.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDashboardView;
