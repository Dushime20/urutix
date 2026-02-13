import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { 
  FaCheck, 
  FaTimes, 
  FaCrown, 
  FaRocket, 
  FaStar, 
  FaQuestionCircle,
  FaCalculator,
  FaChartBar,
  FaShieldAlt,
  FaHeadset,
  FaLightbulb
} from 'react-icons/fa';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  includedCredits: number;
  features: {
    maxTrucks?: number;
    maxUsers?: number;
    maxLoadsPerMonth?: number;
    aiMatching?: boolean;
    advancedAnalytics?: boolean;
    brokerManagement?: boolean;
    apiAccess?: boolean;
    whiteLabel?: boolean;
    prioritySupport?: boolean;
    dedicatedSupport?: boolean;
  };
  limits: {
    storageGB?: number;
  };
}

const SubscriptionPlans: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [estimatedLoads, setEstimatedLoads] = useState(50);

  // Fetch plans
  const { data: plansData, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/plans');
      return response.data;
    },
  });

  // Create subscription mutation
  const createSubscription = useMutation({
    mutationFn: async (data: { planId: string; billingCycle: string }) => {
      const response = await api.post('/subscriptions', {
        ...data,
        startTrial: true,
        trialDays: 14,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subscription created successfully! Your 14-day trial has started.');
      navigate('/billing');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create subscription');
    },
  });

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    createSubscription.mutate({ planId, billingCycle });
  };

  const plans: SubscriptionPlan[] = plansData?.data || [];

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  };

  const getMonthlyEquivalent = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly') {
      return (plan.priceYearly / 12).toFixed(2);
    }
    return plan.priceMonthly.toFixed(2);
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly') {
      const monthlyTotal = plan.priceMonthly * 12;
      const savings = monthlyTotal - plan.priceYearly;
      const percentage = Math.round((savings / monthlyTotal) * 100);
      return { amount: savings, percentage };
    }
    return null;
  };

  const getRecommendedPlan = () => {
    if (estimatedLoads <= 50) return 'starter';
    if (estimatedLoads <= 200) return 'professional';
    return 'enterprise';
  };

  const calculateCreditsNeeded = () => {
    // Estimate: 5 credits per load posting + 2 credits per AI match
    return estimatedLoads * 7;
  };

  if (isLoading) {
    return (
      <AdminPageLayout title="Subscription Plans" description="Choose your perfect plan">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading subscription plans...</p>
          </div>
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title="Choose Your Perfect Plan"
      description="Flexible pricing that grows with your business"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col items-center gap-4">
          <div className="inline-block">
            <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold">
              🎉 14-Day Free Trial • No Credit Card Required
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all font-medium"
            >
              <FaCalculator />
              Credit Calculator
            </button>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all font-medium"
            >
              <FaChartBar />
              Compare Plans
            </button>
          </div>

          {/* Credit Calculator */}
          {showCalculator && (
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FaCalculator className="text-indigo-600" />
                Estimate Your Credit Needs
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    How many loads do you post per month?
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={estimatedLoads}
                    onChange={(e) => setEstimatedLoads(Number(e.target.value))}
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-slate-600 mt-2">
                    <span>10</span>
                    <span className="font-bold text-indigo-600 text-lg">{estimatedLoads} loads</span>
                    <span>500+</span>
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-700">Estimated Credits Needed:</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ~{calculateCreditsNeeded().toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Recommended Plan: <span className="font-bold text-indigo-600 capitalize">{getRecommendedPlan()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-xl p-1.5 shadow-lg border-2 border-indigo-100">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-8 py-3 rounded-lg font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-8 py-3 rounded-lg font-bold transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md animate-pulse">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const savings = getSavings(plan);
            const isPopular = plan.slug === 'professional';
            const isEnterprise = plan.slug === 'enterprise';
            const isRecommended = plan.slug === getRecommendedPlan();

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all hover:scale-105 hover:shadow-2xl ${
                  isPopular ? 'ring-4 ring-indigo-600 transform scale-105' : ''
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 text-sm font-bold rounded-bl-xl shadow-lg">
                    ⭐ MOST POPULAR
                  </div>
                )}

                {/* Recommended Badge */}
                {isRecommended && !isPopular && showCalculator && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 text-sm font-bold rounded-bl-xl shadow-lg">
                    💡 RECOMMENDED
                  </div>
                )}

                {/* Plan Header */}
                <div className={`p-8 ${
                  isPopular 
                    ? 'bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100' 
                    : isEnterprise
                    ? 'bg-gradient-to-br from-slate-50 to-slate-100'
                    : 'bg-gradient-to-br from-slate-50 to-white'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                    <div className={`p-3 rounded-xl ${
                      isPopular ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                      isEnterprise ? 'bg-gradient-to-br from-slate-700 to-slate-900' :
                      'bg-gradient-to-br from-indigo-400 to-indigo-600'
                    }`}>
                      {plan.slug === 'starter' && <FaRocket className="text-2xl text-white" />}
                      {plan.slug === 'professional' && <FaStar className="text-2xl text-white" />}
                      {plan.slug === 'enterprise' && <FaCrown className="text-2xl text-white" />}
                    </div>
                  </div>
                  <p className="text-slate-600 mb-6 min-h-[48px]">{plan.description}</p>

                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex items-baseline mb-2">
                      <span className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        ${getMonthlyEquivalent(plan)}
                      </span>
                      <span className="text-slate-600 ml-2 font-medium">/month</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-sm text-slate-600">
                        Billed ${getPrice(plan)} annually
                      </p>
                    )}
                    {savings && (
                      <div className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                        <FaLightbulb className="text-green-600" />
                        Save ${savings.amount.toFixed(0)}/year ({savings.percentage}%)
                      </div>
                    )}
                  </div>

                  {/* Credits */}
                  <div className="bg-white rounded-xl p-5 mb-6 shadow-md border-2 border-indigo-100">
                    <div className="text-center">
                      <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
                        {plan.includedCredits.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">credits/month</div>
                      <div className="text-xs text-slate-500 mt-1">
                        ~{Math.floor(plan.includedCredits / 7)} loads
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={createSubscription.isPending && selectedPlan === plan.id}
                    className={`w-full py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg ${
                      isPopular
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                        : isEnterprise
                        ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-900 hover:to-black'
                        : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                  >
                    {createSubscription.isPending && selectedPlan === plan.id
                      ? 'Processing...'
                      : '🚀 Start 14-Day Free Trial'}
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-3">
                    No credit card required • Cancel anytime
                  </p>
                </div>

                {/* Features List */}
                <div className="p-8">
                  <h4 className="font-bold text-slate-900 mb-4">What's included:</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-slate-700">
                        {plan.features.maxTrucks ? `Up to ${plan.features.maxTrucks} trucks` : 'Unlimited trucks'}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-slate-700">
                        {plan.features.maxUsers ? `Up to ${plan.features.maxUsers} users` : 'Unlimited users'}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-slate-700">
                        {plan.features.maxLoadsPerMonth ? `${plan.features.maxLoadsPerMonth} loads/month` : 'Unlimited loads'}
                      </span>
                    </li>
                    <li className="flex items-start">
                      {plan.features.aiMatching ? (
                        <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                      ) : (
                        <FaTimes className="text-slate-300 mt-1 mr-3 flex-shrink-0" />
                      )}
                      <span className={plan.features.aiMatching ? 'text-slate-700' : 'text-slate-400'}>
                        AI-powered matching
                      </span>
                    </li>
                    <li className="flex items-start">
                      {plan.features.advancedAnalytics ? (
                        <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                      ) : (
                        <FaTimes className="text-slate-300 mt-1 mr-3 flex-shrink-0" />
                      )}
                      <span className={plan.features.advancedAnalytics ? 'text-slate-700' : 'text-slate-400'}>
                        Advanced analytics
                      </span>
                    </li>
                    <li className="flex items-start">
                      {plan.features.brokerManagement ? (
                        <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                      ) : (
                        <FaTimes className="text-slate-300 mt-1 mr-3 flex-shrink-0" />
                      )}
                      <span className={plan.features.brokerManagement ? 'text-slate-700' : 'text-slate-400'}>
                        Broker management
                      </span>
                    </li>
                    <li className="flex items-start">
                      {plan.features.apiAccess ? (
                        <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                      ) : (
                        <FaTimes className="text-slate-300 mt-1 mr-3 flex-shrink-0" />
                      )}
                      <span className={plan.features.apiAccess ? 'text-slate-700' : 'text-slate-400'}>
                        API access
                      </span>
                    </li>
                    <li className="flex items-start">
                      <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-slate-700">
                        {plan.limits.storageGB}GB storage
                      </span>
                    </li>
                    <li className="flex items-start">
                      <FaCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" />
                      <span className="text-slate-700">
                        {plan.features.prioritySupport
                          ? 'Priority support'
                          : plan.features.dedicatedSupport
                          ? 'Dedicated support'
                          : 'Email support'}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        {showComparison && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-100">
            <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">
              Detailed Feature Comparison
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-4 px-4 font-bold text-slate-900">Feature</th>
                    {plans.map(plan => (
                      <th key={plan.id} className="text-center py-4 px-4 font-bold text-slate-900">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-700">Monthly Credits</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4 font-bold text-indigo-600">
                        {plan.includedCredits.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-700">Max Trucks</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4">
                        {plan.features.maxTrucks || '∞'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-700">Max Users</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4">
                        {plan.features.maxUsers || '∞'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-700">Loads per Month</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4">
                        {plan.features.maxLoadsPerMonth || '∞'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-700">AI Matching</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4">
                        {plan.features.aiMatching ? (
                          <FaCheck className="text-green-500 mx-auto text-xl" />
                        ) : (
                          <FaTimes className="text-slate-300 mx-auto text-xl" />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-700">Advanced Analytics</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4">
                        {plan.features.advancedAnalytics ? (
                          <FaCheck className="text-green-500 mx-auto text-xl" />
                        ) : (
                          <FaTimes className="text-slate-300 mx-auto text-xl" />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-700">Broker Management</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4">
                        {plan.features.brokerManagement ? (
                          <FaCheck className="text-green-500 mx-auto text-xl" />
                        ) : (
                          <FaTimes className="text-slate-300 mx-auto text-xl" />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-700">API Access</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4">
                        {plan.features.apiAccess ? (
                          <FaCheck className="text-green-500 mx-auto text-xl" />
                        ) : (
                          <FaTimes className="text-slate-300 mx-auto text-xl" />
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-700">Storage</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4">
                        {plan.limits.storageGB}GB
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-700">Support</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4">
                        {plan.features.dedicatedSupport ? '24/7 Dedicated' :
                         plan.features.prioritySupport ? 'Priority' : 'Email'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <FaShieldAlt className="text-4xl text-indigo-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 mb-2">Secure & Compliant</h3>
            <p className="text-sm text-slate-600">Bank-level encryption</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <FaHeadset className="text-4xl text-green-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 mb-2">24/7 Support</h3>
            <p className="text-sm text-slate-600">Always here to help</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <FaRocket className="text-4xl text-purple-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 mb-2">Easy Setup</h3>
            <p className="text-sm text-slate-600">Up and running in minutes</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <FaLightbulb className="text-4xl text-yellow-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 mb-2">No Hidden Fees</h3>
            <p className="text-sm text-slate-600">Transparent pricing</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto border-2 border-indigo-100">
          <div className="flex items-center justify-center gap-3 mb-8">
            <FaQuestionCircle className="text-3xl text-indigo-600" />
            <h2 className="text-3xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-lg p-5">
              <h3 className="font-bold text-slate-900 mb-2 flex items-start gap-2">
                <span className="text-indigo-600">Q:</span>
                What are credits?
              </h3>
              <p className="text-slate-600 text-sm pl-6">
                Credits are used to access platform features. Each action (like posting a load or using AI matching) costs a certain number of credits. Your plan includes monthly credits, and you can purchase more if needed.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-5">
              <h3 className="font-bold text-slate-900 mb-2 flex items-start gap-2">
                <span className="text-indigo-600">Q:</span>
                Can I change plans later?
              </h3>
              <p className="text-slate-600 text-sm pl-6">
                Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately with prorated credits, while downgrades take effect at the end of your billing period.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-5">
              <h3 className="font-bold text-slate-900 mb-2 flex items-start gap-2">
                <span className="text-indigo-600">Q:</span>
                What happens after the trial?
              </h3>
              <p className="text-slate-600 text-sm pl-6">
                After your 14-day trial, you'll be charged based on your selected plan and billing cycle. You can cancel anytime during the trial with no charges.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-5">
              <h3 className="font-bold text-slate-900 mb-2 flex items-start gap-2">
                <span className="text-indigo-600">Q:</span>
                Do unused credits roll over?
              </h3>
              <p className="text-slate-600 text-sm pl-6">
                Subscription credits expire at the end of each billing period. However, purchased credit top-ups are valid for 12 months.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-5">
              <h3 className="font-bold text-slate-900 mb-2 flex items-start gap-2">
                <span className="text-indigo-600">Q:</span>
                Can I cancel anytime?
              </h3>
              <p className="text-slate-600 text-sm pl-6">
                Absolutely! There are no long-term contracts. You can cancel your subscription at any time from your billing dashboard.
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-5">
              <h3 className="font-bold text-slate-900 mb-2 flex items-start gap-2">
                <span className="text-indigo-600">Q:</span>
                What payment methods do you accept?
              </h3>
              <p className="text-slate-600 text-sm pl-6">
                We accept all major credit cards, debit cards, and mobile money payments. All transactions are secure and encrypted.
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-slate-600 mb-4">Still have questions?</p>
            <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg">
              Contact Sales Team
            </button>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default SubscriptionPlans;
