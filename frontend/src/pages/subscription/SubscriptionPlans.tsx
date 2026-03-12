import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
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
  FaLightbulb,
  FaArrowLeft,
  FaGift
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
    return billingCycle === 'monthly' ? Number(plan.priceMonthly) : Number(plan.priceYearly);
  };

  const getMonthlyEquivalent = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly') {
      return (Number(plan.priceYearly) / 12).toFixed(2);
    }
    return Number(plan.priceMonthly).toFixed(2);
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (billingCycle === 'yearly') {
      const monthlyTotal = Number(plan.priceMonthly) * 12;
      const savings = monthlyTotal - Number(plan.priceYearly);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#345E85] mx-auto"></div>
          <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Subscription Plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 antialiased">
      {/* Header - Enlite Prime Style */}
      <div className="bg-white rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-8 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Decorative Background Blur */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100/50 shadow-sm">
            <FaCrown className="w-6 h-6 text-[#345E85]" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Billing & Operations</h3>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Choose Your Perfect Plan</h1>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 relative z-10">
          <button
            onClick={() => navigate('/tenant-admin/billing')}
            className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-sm whitespace-nowrap"
          >
            <FaArrowLeft className="text-xs" />
            Back to Billing
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Header Actions */}
        <div className="flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#345E85] px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm">
            <FaGift className="text-blue-500" />
            🎉 14-Day Free Trial • No Credit Card Required
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-[#345E85] rounded-2xl hover:bg-slate-50 transition-all font-black text-[11px] uppercase tracking-widest shadow-sm"
            >
              <FaCalculator />
              {showCalculator ? 'Hide Calculator' : 'Credit Calculator'}
            </button>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-[#345E85] rounded-2xl hover:bg-slate-50 transition-all font-black text-[11px] uppercase tracking-widest shadow-sm"
            >
              <FaChartBar />
              Compare Plans
            </button>
          </div>

          {/* Credit Calculator */}
          {showCalculator && (
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] max-w-3xl mx-auto w-full">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-[14px] bg-slate-50 flex items-center justify-center border border-slate-100">
                  <FaCalculator className="w-4 h-4 text-slate-400" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Estimate Your Credit Needs
                </h3>
              </div>
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                    How many loads do you post per month?
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={estimatedLoads}
                    onChange={(e) => setEstimatedLoads(Number(e.target.value))}
                    className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#345E85]"
                  />
                  <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest mt-4">
                    <span>10</span>
                    <span className="text-[#345E85] scale-125 transform transition-transform">{estimatedLoads} loads</span>
                    <span>500+</span>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-[24px] p-6 border border-blue-100/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Recommended Plan</span>
                      <div className="text-2xl font-black text-[#345E85] tracking-tight mt-1 capitalize">
                        {getRecommendedPlan()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-[#345E85] tracking-tight">
                        ~{calculateCreditsNeeded().toLocaleString()}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        Estimated Credits Needed
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-[20px] p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly'
                ? 'bg-[#345E85] text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-400 hover:text-slate-900'
                }`}
            >
              Monthly Billed
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all relative ${billingCycle === 'yearly'
                ? 'bg-[#345E85] text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-400 hover:text-slate-900'
                }`}
            >
              Yearly Billed
              <span className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[9px] px-2 py-1 rounded-[10px] font-black shadow-md">
                SAVE 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const savings = getSavings(plan);
            const isPopular = plan.slug === 'professional';
            const isEnterprise = plan.slug === 'enterprise';
            const isRecommended = plan.slug === getRecommendedPlan();

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-[32px] p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] border ${
                  isPopular
                    ? 'border-[#345E85]/20 shadow-[0_4px_20px_rgba(52,94,133,0.15)] ring-1 ring-[#345E85]/10'
                    : isRecommended
                    ? 'border-emerald-200 shadow-[0_4px_20px_rgba(16,185,129,0.08)] ring-1 ring-emerald-500/10'
                    : 'border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-[#345E85] text-white px-4 py-2 rounded-bl-[20px] rounded-tr-[30px] shadow-sm flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                    <FaStar className="w-2.5 h-2.5" /> MOST POPULAR
                  </div>
                )}

                {/* Recommended Badge */}
                {isRecommended && !isPopular && showCalculator && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-2 rounded-bl-[20px] rounded-tr-[30px] shadow-sm flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                    <FaLightbulb className="w-2.5 h-2.5" /> RECOMMENDED
                  </div>
                )}

                {/* Plan Header */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
                    <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center ${isPopular ? 'bg-[#345E85] text-white' :
                      isEnterprise ? 'bg-slate-900 text-white' :
                        'bg-blue-50 text-[#345E85]'
                      }`}>
                      {plan.slug === 'starter' && <FaRocket className="text-xl" />}
                      {plan.slug === 'professional' && <FaStar className="text-xl" />}
                      {plan.slug === 'enterprise' && <FaCrown className="text-xl" />}
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 min-h-[48px]">{plan.description}</p>

                  {/* Pricing */}
                  <div className="mb-8">
                    <div className="flex items-baseline mb-2">
                      <span className="text-5xl font-black text-[#345E85] tracking-tight">
                        ${getMonthlyEquivalent(plan)}
                      </span>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">/ month</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        Billed ${getPrice(plan)} annually
                      </p>
                    )}
                    {savings && (
                      <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                        <FaLightbulb className="text-emerald-500 w-3 h-3" />
                        Save ${savings.amount.toFixed(0)}/year ({savings.percentage}%)
                      </div>
                    )}
                  </div>

                  {/* Credits */}
                  <div className="bg-slate-50/50 rounded-[24px] p-6 mb-8 border border-slate-100">
                    <div className="text-center">
                      <div className="text-3xl font-black text-slate-900 tracking-tight mb-1">
                        {plan.includedCredits.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">credits / month</div>
                      <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-2 bg-blue-50 inline-block px-3 py-1 rounded-full">
                        ~{Math.floor(plan.includedCredits / 7)} loads capacity
                      </div>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={createSubscription.isPending && selectedPlan === plan.id}
                    className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isPopular
                      ? 'bg-[#345E85] text-white hover:bg-[#2a4d6d] hover:shadow-lg hover:shadow-blue-900/20'
                      : isEnterprise
                        ? 'bg-slate-900 text-white hover:bg-black hover:shadow-lg hover:shadow-black/20'
                        : 'bg-white border border-[#345E85]/20 text-[#345E85] hover:bg-blue-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {createSubscription.isPending && selectedPlan === plan.id
                      ? 'Processing...'
                      : 'Start 14-Day Free Trial'}
                  </button>
                  <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4">
                    No credit card required • Cancel anytime
                  </p>
                </div>

                {/* Features List */}
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">What's included in this plan</h4>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3 group">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                        <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {plan.features.maxTrucks ? `Up to ${plan.features.maxTrucks} trucks` : 'Unlimited trucks'}
                      </span>
                    </li>
                    <li className="flex items-start gap-3 group">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                        <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {plan.features.maxUsers ? `Up to ${plan.features.maxUsers} users` : 'Unlimited users'}
                      </span>
                    </li>
                    <li className="flex items-start gap-3 group">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                        <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {plan.features.maxLoadsPerMonth ? `${plan.features.maxLoadsPerMonth} loads/month` : 'Unlimited loads'}
                      </span>
                    </li>
                    <li className="flex items-start gap-3 group">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${plan.features.aiMatching ? 'bg-emerald-50 group-hover:bg-emerald-100' : 'bg-slate-50'}`}>
                        {plan.features.aiMatching ? (
                          <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
                        ) : (
                          <FaTimes className="w-2.5 h-2.5 text-slate-300" />
                        )}
                      </div>
                      <span className={`text-xs font-bold ${plan.features.aiMatching ? 'text-slate-700' : 'text-slate-400'}`}>
                        AI-powered matching
                      </span>
                    </li>
                    <li className="flex items-start gap-3 group">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${plan.features.advancedAnalytics ? 'bg-emerald-50 group-hover:bg-emerald-100' : 'bg-slate-50'}`}>
                        {plan.features.advancedAnalytics ? (
                          <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
                        ) : (
                          <FaTimes className="w-2.5 h-2.5 text-slate-300" />
                        )}
                      </div>
                      <span className={`text-xs font-bold ${plan.features.advancedAnalytics ? 'text-slate-700' : 'text-slate-400'}`}>
                        Advanced analytics
                      </span>
                    </li>
                    <li className="flex items-start gap-3 group">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${plan.features.brokerManagement ? 'bg-emerald-50 group-hover:bg-emerald-100' : 'bg-slate-50'}`}>
                        {plan.features.brokerManagement ? (
                          <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
                        ) : (
                          <FaTimes className="w-2.5 h-2.5 text-slate-300" />
                        )}
                      </div>
                      <span className={`text-xs font-bold ${plan.features.brokerManagement ? 'text-slate-700' : 'text-slate-400'}`}>
                        Broker management
                      </span>
                    </li>
                    <li className="flex items-start gap-3 group">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${plan.features.apiAccess ? 'bg-emerald-50 group-hover:bg-emerald-100' : 'bg-slate-50'}`}>
                         {plan.features.apiAccess ? (
                          <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
                        ) : (
                          <FaTimes className="w-2.5 h-2.5 text-slate-300" />
                        )}
                      </div>
                      <span className={`text-xs font-bold ${plan.features.apiAccess ? 'text-slate-700' : 'text-slate-400'}`}>
                        API access
                      </span>
                    </li>
                    <li className="flex items-start gap-3 group">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                        <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {plan.limits.storageGB}GB storage
                      </span>
                    </li>
                    <li className="flex items-start gap-3 group">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                        <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">
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
    </div>
  );
};

export default SubscriptionPlans;
