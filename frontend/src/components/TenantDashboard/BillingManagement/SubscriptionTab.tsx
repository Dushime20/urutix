import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaCheckCircle, FaCrown, FaRocket, FaBuilding,
  FaCalendarAlt, FaCreditCard, FaExclamationTriangle,
  FaDollarSign
} from 'react-icons/fa';
import { billingApi, type Subscription } from '../../../services/billingApi';

interface SubscriptionTabProps {
  tenantId: string;
}

const SubscriptionTab: React.FC<SubscriptionTabProps> = ({ tenantId }) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', tenantId],
    queryFn: () => billingApi.getSubscription(tenantId)
  });

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      icon: FaCheckCircle,
      price: 99,
      features: [
        'Up to 5 users',
        'Up to 10 trucks',
        'Up to 100 loads/month',
        '10GB storage',
        'Basic analytics',
        'Email support'
      ],
      color: 'blue'
    },
    {
      id: 'professional',
      name: 'Professional Plan',
      icon: FaRocket,
      price: 299,
      features: [
        'Unlimited users',
        'Up to 50 trucks',
        'Unlimited loads',
        '100GB storage',
        'Advanced analytics',
        'Priority support',
        'API access'
      ],
      color: 'green',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      icon: FaBuilding,
      price: 999,
      features: [
        'Unlimited everything',
        'Unlimited trucks',
        'Unlimited loads',
        '1TB storage',
        'Custom analytics',
        '24/7 dedicated support',
        'API access',
        'Custom integrations',
        'White-label options'
      ],
      color: 'purple'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      suspended: 'bg-yellow-100 text-yellow-800'
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <FaCrown className="text-yellow-500 text-2xl" />
              <h3 className="text-xl font-bold text-gray-900">{subscription?.planName}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(subscription?.status || 'active')}`}>
                {subscription?.status?.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              Your current subscription plan with all the features you need
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <FaDollarSign className="text-green-600" />
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-semibold text-gray-900">
                    ${subscription?.amount}/{subscription?.billingCycle}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">Next Billing</p>
                  <p className="font-semibold text-gray-900">
                    {subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <FaCreditCard className="text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-semibold text-gray-900">•••• 4242</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3">Current Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subscription?.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <FaCheckCircle className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Usage Limits</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Users</span>
                    <span className="font-semibold text-gray-900">
                      {subscription?.limits.users === -1 ? 'Unlimited' : `0 / ${subscription?.limits.users}`}
                    </span>
                  </div>
                  {subscription?.limits.users !== -1 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Trucks</span>
                    <span className="font-semibold text-gray-900">
                      {subscription?.limits.trucks === -1 ? 'Unlimited' : `4 / ${subscription?.limits.trucks}`}
                    </span>
                  </div>
                  {subscription?.limits.trucks !== -1 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '8%' }}></div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Storage</span>
                    <span className="font-semibold text-gray-900">2.5GB / {subscription?.limits.storage}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '2.5%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscription?.planType === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border-2 p-6 ${
                  isCurrentPlan
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${plan.popular ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <Icon className={`text-4xl mx-auto mb-2 text-${plan.color}-600`} />
                  <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <FaCheckCircle className={`text-${plan.color}-500 flex-shrink-0 mt-0.5`} />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrentPlan && setShowUpgradeModal(true)}
                  disabled={isCurrentPlan}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                    isCurrentPlan
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : `bg-${plan.color}-600 text-white hover:bg-${plan.color}-700`
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FaExclamationTriangle className="text-blue-600 mt-1" />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Need to change your plan?</h4>
            <p className="text-sm text-gray-600 mb-3">
              Contact our support team to upgrade, downgrade, or cancel your subscription.
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
              Contact Support →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTab;
