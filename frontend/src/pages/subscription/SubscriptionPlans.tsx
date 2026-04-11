import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  FaCalculator,
  FaChartBar,
  FaShieldAlt,
  FaHeadset,
  FaLightbulb,
  FaArrowLeft,
  FaGift,
  FaStore,
  FaInfoCircle,
} from 'react-icons/fa';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import CreditMarketplace from '../tenant-admin/CreditMarketplace';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricePerCredit: number;
  totalCredits: number;
  creditsPerTonTenant: number;
  creditsPerTonTruckOwner: number;
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
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [estimatedTons, setEstimatedTons] = useState(50);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('card');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    phoneNumber: '',
    mobileProvider: 'mtn'
  });
  const [managedTab, setManagedTab] = useState<'purchases' | 'partners'>('purchases');

  // Fetch plans
  const { data: plansData, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/plans');
      return response.data;
    },
  });

  // Fetch user's subscriptions
  const { data: subscriptionsData, isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/my-subscriptions');
      return response.data;
    },
  });

  // Fetch credit balance for usage data
  const { data: creditAccountData } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: async () => {
      const response = await api.get('/credits/balance');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch marketplace stats
  const { data: marketplaceStatsData } = useQuery({
    queryKey: ['marketplace-stats'],
    queryFn: async () => {
      const response = await api.get('/credits/marketplace/stats');
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Fetch partner plans created by tenant (kept for future use)
  useQuery({
    queryKey: ['partner-plans'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/partner-plans');
      return response.data;
    },
  });


  // Purchase subscription mutation
  const purchaseSubscription = useMutation({
    mutationFn: async (data: { 
      planId: string; 
      paymentMethod: string;
      paymentDetails: any;
    }) => {
      const response = await api.post('/subscriptions/purchase', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subscription purchased successfully! Credits have been added to your account.');
      setShowPaymentModal(false);
      setSelectedPlan(null);
      navigate('/tenant-admin/billing');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to purchase subscription');
    },
  });


  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePayment = () => {
    if (!selectedPlan) return;

    // Validate payment data
    if (paymentMethod === 'card') {
      if (!paymentData.cardNumber || !paymentData.cardName || !paymentData.expiryDate || !paymentData.cvv) {
        toast.error('Please fill in all card details');
        return;
      }
    } else {
      if (!paymentData.phoneNumber) {
        toast.error('Please enter your phone number');
        return;
      }
    }

    purchaseSubscription.mutate({
      planId: selectedPlan.id,
      paymentMethod,
      paymentDetails: paymentMethod === 'card' ? {
        cardNumber: paymentData.cardNumber,
        cardName: paymentData.cardName,
        expiryDate: paymentData.expiryDate,
        cvv: paymentData.cvv
      } : {
        phoneNumber: paymentData.phoneNumber,
        provider: paymentData.mobileProvider
      }
    });
  };

  const plans: SubscriptionPlan[] = plansData?.data || [];

  const getTotalAmount = (plan: SubscriptionPlan) => {
    if (plan.totalCredits === -1) {
      return 0; // Unlimited credits - pay as you go
    }
    return Number(plan.pricePerCredit) * plan.totalCredits;
  };

  const getRecommendedPlan = () => {
    if (estimatedTons <= 50) return 'starter';
    if (estimatedTons <= 200) return 'professional';
    return 'enterprise';
  };

  const calculateCreditsNeeded = (plan: SubscriptionPlan) => {
    // Calculate credits needed based on estimated tons
    return estimatedTons * Number(plan.creditsPerTonTenant);
  };

  const calculateCost = (plan: SubscriptionPlan) => {
    const creditsNeeded = calculateCreditsNeeded(plan);
    return creditsNeeded * Number(plan.pricePerCredit);
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
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white rounded-[24px] p-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        {/* Nav Tabs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'plans'
                ? 'bg-[#345E85] text-white shadow-lg'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Available Plans
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'subscriptions'
                ? 'bg-[#345E85] text-white shadow-lg'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            My Subscriptions
          </button>
        </div>

        {/* Action Items (Pill + Buttons) - Only for Plans Tab */}
        {activeTab === 'plans' && (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#345E85] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
              <FaGift className="text-blue-500" />
              🎉 Instant Activation
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[#345E85] rounded-xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
              >
                <FaCalculator className="text-xs" />
                {showCalculator ? 'Hide' : 'Calculator'}
              </button>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-[#345E85] rounded-xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
              >
                <FaChartBar className="text-xs" />
                Compare
              </button>
            </div>
          </div>
        )}
      </div>

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

      {activeTab === 'plans' && (
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-6">

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
                    How many tons do you ship per month?
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={estimatedTons}
                    onChange={(e) => setEstimatedTons(Number(e.target.value))}
                    className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#345E85]"
                  />
                  <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest mt-4">
                    <span>10</span>
                    <span className="text-[#345E85] scale-125 transform transition-transform">{estimatedTons} tons</span>
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
                        {estimatedTons * 2} credits
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
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isPopular = plan.slug === 'professional';
            const isEnterprise = plan.slug === 'enterprise';
            const isRecommended = plan.slug === getRecommendedPlan();
            const totalAmount = getTotalAmount(plan);
            const isUnlimited = plan.totalCredits === -1;

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
                        ${Number(plan.pricePerCredit).toFixed(2)}
                      </span>
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">/ credit</span>
                    </div>
                    {!isUnlimited && (
                      <div className="mt-4 space-y-2">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                          Total: {plan.totalCredits.toLocaleString()} credits
                        </p>
                        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                          <FaLightbulb className="text-emerald-500 w-3 h-3" />
                          Package: ${totalAmount.toFixed(2)}
                        </div>
                      </div>
                    )}
                    {isUnlimited && (
                      <div className="mt-4">
                        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                          <FaRocket className="text-blue-500 w-3 h-3" />
                          Pay as you go
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Credit Consumption */}
                  <div className="bg-slate-50/50 rounded-[24px] p-6 mb-8 border border-slate-100">
                    <div className="space-y-3">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Credit Consumption</div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-semibold">Per Ton (You):</span>
                        <span className="font-black text-blue-600">{Number(plan.creditsPerTonTenant).toFixed(1)} credits</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-semibold">Per Ton (Truck Owner):</span>
                        <span className="font-black text-indigo-600">{Number(plan.creditsPerTonTruckOwner).toFixed(1)} credits</span>
                      </div>
                      {showCalculator && (
                        <div className="pt-3 border-t border-slate-200 mt-3">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Estimated Cost</div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600">{estimatedTons} tons/month:</span>
                            <span className="font-black text-emerald-600">${calculateCost(plan).toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isPopular
                      ? 'bg-[#345E85] text-white hover:bg-[#2a4d6d] hover:shadow-lg hover:shadow-blue-900/20'
                      : isEnterprise
                        ? 'bg-slate-900 text-white hover:bg-black hover:shadow-lg hover:shadow-black/20'
                        : 'bg-white border border-[#345E85]/20 text-[#345E85] hover:bg-blue-50'
                      }`}
                  >
                    Buy Now
                  </button>
                  <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4">
                    Secure payment • Instant activation
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
                    <td className="py-4 px-4 font-medium text-slate-700">Price per Credit</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4 font-bold text-indigo-600">
                        ${Number(plan.pricePerCredit).toFixed(2)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-700">Total Credits</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4 font-bold text-indigo-600">
                        {plan.totalCredits === -1 ? 'Unlimited' : plan.totalCredits.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-700">Credits/Ton (Tenant)</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4 font-bold text-blue-600">
                        {Number(plan.creditsPerTonTenant).toFixed(1)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-medium text-slate-700">Credits/Ton (Truck Owner)</td>
                    {plans.map(plan => (
                      <td key={plan.id} className="text-center py-4 px-4 font-bold text-indigo-600">
                        {Number(plan.creditsPerTonTruckOwner).toFixed(1)}
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
      </div>
      )}

      {/* Subscriptions & Marketplace Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-8">
          {/* Sub-navigation Toggle */}
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-2xl p-2 border border-slate-100 shadow-sm flex items-center gap-2 w-fit">
              <button
                onClick={() => setManagedTab('purchases')}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  managedTab === 'purchases'
                    ? 'bg-[#345E85] text-white shadow-lg'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <FaCrown className={managedTab === 'purchases' ? 'text-white' : 'text-slate-400'} />
                My Purchases
              </button>
              <button
                onClick={() => setManagedTab('partners')}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  managedTab === 'partners'
                    ? 'bg-[#345E85] text-white shadow-lg'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <FaStore className={managedTab === 'partners' ? 'text-white' : 'text-slate-400'} />
                Marketplace (Partners)
              </button>
            </div>
          </div>

          {managedTab === 'purchases' ? (
            isLoadingSubscriptions ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#345E85] mx-auto"></div>
                  <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Subscriptions...</p>
                </div>
              </div>
            ) : subscriptionsData?.data?.length > 0 ? (
              <div className="grid gap-6">
                {subscriptionsData.data.map((subscription: any) => (
                  <div
                    key={subscription.id}
                    className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center ${
                          subscription.status === 'active' ? 'bg-emerald-50' :
                          subscription.status === 'cancelled' ? 'bg-slate-50' :
                          'bg-yellow-50'
                        }`}>
                          <FaCrown className={`text-2xl ${
                            subscription.status === 'active' ? 'text-emerald-500' :
                            subscription.status === 'cancelled' ? 'text-slate-400' :
                            'text-yellow-500'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            {subscription.plan?.name || 'Unknown Plan'}
                          </h3>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {subscription.plan?.description}
                          </p>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                        subscription.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        subscription.status === 'cancelled' ? 'bg-slate-50 text-slate-600 border border-slate-200' :
                        'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      }`}>
                        {subscription.status}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-slate-50/50 rounded-[20px] p-5 border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Billing Cycle
                        </div>
                        <div className="text-lg font-black text-slate-900 capitalize">
                          {subscription.billingCycle}
                        </div>
                      </div>
                      <div className="bg-slate-50/50 rounded-[20px] p-5 border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Current Period
                        </div>
                        <div className="text-sm font-bold text-slate-700">
                          {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="bg-slate-50/50 rounded-[20px] p-5 border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Auto Renew
                        </div>
                        <div className="text-lg font-black text-slate-900">
                          {subscription.autoRenew ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </div>

                    {/* Marketplace Performance Chart */}
                    <div className="bg-white rounded-[24px] p-6 border border-slate-100">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <FaChartBar className="text-emerald-500" />
                          </div>
                          <div>
                            <h4 className="text-base font-black text-slate-900">Marketplace Performance</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Credit sales and usage over time</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                            <span className="text-xs font-bold text-slate-600">Sold</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-red-600"></div>
                            <span className="text-xs font-bold text-slate-600">Used</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                            <span className="text-xs font-bold text-slate-600">Balance</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
                          <div className="text-[9px] font-black text-[#345E85] uppercase tracking-wider mb-1">Total Purchased</div>
                          <div className="text-2xl font-black text-slate-900">
                            {subscription.plan?.totalCredits === -1 ? '∞' : subscription.plan?.totalCredits?.toLocaleString() || 0}
                          </div>
                        </div>
                        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-xl p-4">
                          <div className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mb-1">Sold via Marketplace</div>
                          <div className="text-2xl font-black text-slate-900">
                            {marketplaceStatsData?.data?.totalCreditsSold?.toLocaleString() || '0'}
                          </div>
                        </div>
                        <div className="bg-red-50 border-2 border-red-100 rounded-xl p-4">
                          <div className="text-[9px] font-black text-red-600 uppercase tracking-wider mb-1">Used in Operations</div>
                          <div className="text-2xl font-black text-slate-900">
                            {creditAccountData?.data?.lifetimeSpent?.toLocaleString() || '0'}
                          </div>
                        </div>
                        <div className="bg-purple-50 border-2 border-purple-100 rounded-xl p-4">
                          <div className="text-[9px] font-black text-purple-600 uppercase tracking-wider mb-1">Current Balance</div>
                          <div className="text-2xl font-black text-slate-900">
                            {creditAccountData?.data?.currentBalance?.toLocaleString() || '0'}
                          </div>
                        </div>
                      </div>

                      {/* Area Chart */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart
                            data={(() => {
                              const totalCredits = subscription.plan?.totalCredits || 0;
                              const soldCredits = marketplaceStatsData?.data?.totalCreditsSold || 0;
                              const usedCredits = creditAccountData?.data?.lifetimeSpent || 0;
                              const days = 30;
                              
                              // Generate 30 days of data showing marketplace activity
                              return Array.from({ length: days }, (_, i) => {
                                const dayNumber = i + 1;
                                const progressRatio = dayNumber / days;
                                
                                // Simulate gradual marketplace sales and usage
                                const dailySold = Math.floor(soldCredits * progressRatio);
                                const dailyUsed = Math.floor(usedCredits * progressRatio);
                                const dailyBalance = totalCredits - dailySold - dailyUsed;
                                
                                return {
                                  day: `Day ${dayNumber}`,
                                  sold: dailySold,
                                  used: dailyUsed,
                                  balance: dailyBalance > 0 ? dailyBalance : 0,
                                  date: new Date(Date.now() - (days - dayNumber) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                };
                              });
                            })()}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#64748b"
                              style={{ fontSize: '11px', fontWeight: 600 }}
                              interval={4}
                            />
                            <YAxis 
                              stroke="#64748b"
                              style={{ fontSize: '11px', fontWeight: 600 }}
                              tickFormatter={(value) => value.toLocaleString()}
                            />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                padding: '12px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                              }}
                              labelStyle={{ fontWeight: 'bold', marginBottom: '8px', color: '#1e293b' }}
                              formatter={(value: any) => [value.toLocaleString() + ' credits', '']}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="sold" 
                              stroke="#10b981" 
                              strokeWidth={2}
                              fill="url(#colorSold)" 
                              name="Credits Sold"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="used" 
                              stroke="#ef4444" 
                              strokeWidth={2}
                              fill="url(#colorUsed)" 
                              name="Credits Used"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="balance" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              fill="url(#colorBalance)" 
                              name="Balance"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Info Note */}
                      <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <FaInfoCircle className="text-emerald-500 text-xs mt-0.5 shrink-0" />
                          <div className="text-[10px] text-slate-600 leading-relaxed">
                            <span className="font-black">Marketplace Activity:</span> This chart shows your credit marketplace performance. 
                            <span className="font-black text-emerald-700"> Sold</span> credits generate revenue (${marketplaceStatsData?.data?.totalRevenue?.toLocaleString() || '0'} total). 
                            <span className="font-black text-red-700"> Used</span> credits are consumed during cargo operations.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                      <button
                        onClick={() => setManagedTab('partners')}
                        className="px-6 py-3.5 bg-slate-50 text-slate-700 rounded-2xl hover:bg-slate-100 transition-all font-bold text-[11px] uppercase tracking-widest flex items-center gap-2"
                      >
                        <FaStore className="text-xs" />
                        View Marketplace
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                  <FaCrown className="text-4xl text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                  No Subscriptions Yet
                </h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  You haven't purchased any subscription plans yet. Browse our available plans to get started.
                </p>
                <button
                  onClick={() => setActiveTab('plans')}
                  className="px-8 py-4 bg-[#345E85] text-white rounded-2xl hover:bg-[#2a4d6d] transition-all font-black text-[11px] uppercase tracking-widest shadow-lg"
                >
                  View Available Plans
                </button>
              </div>
            )
          ) : (
            <CreditMarketplace />
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Complete Your Purchase
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedPlan.name} Plan
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedPlan(null);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                {/* Order Summary */}
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Plan:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedPlan.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Credits:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedPlan.totalCredits === -1 ? 'Unlimited' : selectedPlan.totalCredits.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Price per Credit:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        ${Number(selectedPlan.pricePerCredit).toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-blue-200 dark:border-blue-700">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-slate-900 dark:text-white">Total Amount:</span>
                        <span className="text-2xl font-black text-[#345E85] dark:text-blue-400">
                          ${getTotalAmount(selectedPlan).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'card'
                          ? 'border-[#345E85] bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">💳</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Credit Card</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('mobile_money')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === 'mobile_money'
                          ? 'border-[#345E85] bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-2">📱</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Mobile Money</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Payment Form - Credit Card */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        value={paymentData.cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\s/g, '');
                          const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                          setPaymentData({ ...paymentData, cardNumber: formatted });
                        }}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={paymentData.cardName}
                        onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={paymentData.expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2, 4);
                            }
                            setPaymentData({ ...paymentData, expiryDate: value });
                          }}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          maxLength={4}
                          value={paymentData.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setPaymentData({ ...paymentData, cvv: value });
                          }}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Form - Mobile Money */}
                {paymentMethod === 'mobile_money' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Mobile Provider
                      </label>
                      <select
                        value={paymentData.mobileProvider}
                        onChange={(e) => setPaymentData({ ...paymentData, mobileProvider: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] dark:text-white"
                      >
                        <option value="mtn">MTN Mobile Money</option>
                        <option value="airtel">Airtel Money</option>
                        <option value="tigo">Tigo Cash</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+250 788 123 456"
                        value={paymentData.phoneNumber}
                        onChange={(e) => setPaymentData({ ...paymentData, phoneNumber: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] dark:text-white"
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        You will receive a prompt on your phone to confirm the payment
                      </p>
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                  <FaShieldAlt className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      Secure Payment
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center gap-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPlan(null);
                  }}
                  className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={purchaseSubscription.isPending}
                  className="px-8 py-3 text-sm font-black bg-[#345E85] hover:bg-[#2a4d6d] text-white shadow-md hover:shadow-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                >
                  {purchaseSubscription.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Pay $${getTotalAmount(selectedPlan).toFixed(2)}`
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionPlans;
