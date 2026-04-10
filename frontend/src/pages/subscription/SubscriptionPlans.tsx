import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  FaUsers,
  FaPlus,
  FaInfoCircle,
  FaEdit,
  FaTrash,
  FaSave,
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

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
  const queryClient = useQueryClient();
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
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [partnerFormData, setPartnerFormData] = useState({
    name: '',
    slug: '',
    description: '',
    totalCredits: '',
    availableSlots: '',
    isActive: true,
  });

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
  const { data: creditAccountData, refetch: refetchCreditBalance } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: async () => {
      const response = await api.get('/credits/balance');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch partner plans created by tenant
  const { data: partnerPlansData, isLoading: isLoadingPartnerPlans } = useQuery({
    queryKey: ['partner-plans'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/partner-plans');
      return response.data;
    },
  });

  // Fetch truck owners who purchased partner plans
  const { data: partnerSubscribersData } = useQuery({
    queryKey: ['partner-subscribers'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/partner-subscribers');
      return response.data;
    },
  });

  // Create partner plan mutation
  const createPartnerPlan = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/subscriptions/partner-plans', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Partner plan created successfully!');
      queryClient.invalidateQueries({ queryKey: ['partner-plans'] });
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
      setShowCreatePlanModal(false);
      resetPartnerForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create partner plan');
    },
  });

  // Update partner plan mutation
  const updatePartnerPlan = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/subscriptions/partner-plans/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Partner plan updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['partner-plans'] });
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
      setShowCreatePlanModal(false);
      resetPartnerForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update partner plan');
    },
  });

  // Delete partner plan mutation
  const deletePartnerPlan = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/subscriptions/partner-plans/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Partner plan deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['partner-plans'] });
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete partner plan');
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

  const resetPartnerForm = () => {
    setPartnerFormData({
      name: '',
      slug: '',
      description: '',
      totalCredits: '',
      availableSlots: '',
      isActive: true,
    });
    setSelectedParent('');
    setEditingPlan(null);
  };

  const handleOpenPartnerModal = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setSelectedParent(plan.parentSubscriptionId || '');
      setPartnerFormData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        totalCredits: plan.creditCostPerPartner.toString(),
        availableSlots: plan.availableSlots.toString(),
        isActive: plan.isActive,
      });
    } else {
      resetPartnerForm();
    }
    setShowCreatePlanModal(true);
  };

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedParent) {
      toast.error('Please select a parent subscription');
      return;
    }

    const parent = subscriptionsData?.data?.find((s: any) => s.id === selectedParent);
    if (!parent) {
      toast.error('Invalid parent subscription');
      return;
    }

    const creditCostPerPartner = parseInt(partnerFormData.totalCredits);
    const availableSlots = parseInt(partnerFormData.availableSlots);
    const totalAllocation = creditCostPerPartner * availableSlots;

    // Validate total allocation doesn't exceed available credits
    if (totalAllocation > parent.availableCredits) {
      toast.error(`Total allocation (${totalAllocation.toLocaleString()} credits) exceeds available credits (${parent.availableCredits.toLocaleString()})`);
      return;
    }

    const planData = {
      name: partnerFormData.name,
      slug: partnerFormData.slug,
      description: partnerFormData.description,
      parentSubscriptionId: selectedParent,
      pricePerCredit: parent.plan.pricePerCredit,
      creditCostPerPartner,
      availableSlots,
      totalCredits: totalAllocation,
      creditsPerTonTruckOwner: parent.plan.creditsPerTonTruckOwner,
      isActive: partnerFormData.isActive,
    };

    if (editingPlan) {
      updatePartnerPlan.mutate({ id: editingPlan.id, data: planData });
    } else {
      createPartnerPlan.mutate(planData);
    }
  };

  const handleDeletePartnerPlan = (id: string) => {
    if (window.confirm('Are you sure you want to delete this partner plan?')) {
      deletePartnerPlan.mutate(id);
    }
  };

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
  const partnerPlans: any[] = partnerPlansData?.data || [];
  const parents: any[] = subscriptionsData?.data || [];
  const selectedParentDetails = parents.find(p => p.id === selectedParent);

  const getParentInfo = (parentId?: string) => {
    return parents.find(p => p.id === parentId);
  };

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
            onClick={() => navigate('/tenant-admin/partner-plans')}
            className="px-6 py-3.5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg whitespace-nowrap"
          >
            <FaPlus className="text-xs" />
            Create Partner Plan
          </button>
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

      {/* My Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Sub-navigation for My Subscriptions */}
          <div className="flex items-center gap-6 border-b border-slate-100 mb-2">
            <button
              onClick={() => setManagedTab('purchases')}
              className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${
                managedTab === 'purchases' ? 'text-[#345E85]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              My Purchases
              {managedTab === 'purchases' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#345E85] rounded-full" />
              )}
            </button>
            <button
              onClick={() => setManagedTab('partners')}
              className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative ${
                managedTab === 'partners' ? 'text-[#345E85]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Manage Partners
              {managedTab === 'partners' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#345E85] rounded-full" />
              )}
            </button>
          </div>

          {managedTab === 'purchases' ? (
            /* Existing Purchases View */
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

                    <div className="grid md:grid-cols-4 gap-6 mb-6">
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
                      <div className="bg-blue-50/50 rounded-[20px] p-5 border border-blue-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Available Credits
                        </div>
                        <div className="text-lg font-black text-blue-600">
                          {subscription.availableCredits?.toLocaleString() || subscription.plan?.totalCredits?.toLocaleString() || 0}
                        </div>
                      </div>
                    </div>

                    {/* Credit Usage Section */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-[24px] p-6 mb-6 border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                          <FaChartBar className="text-blue-500" />
                          Credit Usage & Allocation
                        </h4>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {subscription.plan?.totalCredits > 0 && creditAccountData?.data ? 
                            `${((creditAccountData.data.lifetimeSpent / subscription.plan.totalCredits) * 100).toFixed(1)}% Consumed` 
                            : 'Pay as you go'}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4">
                        {/* Total Credits Purchased */}
                        <div className="bg-white rounded-[16px] p-4 border border-slate-100">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Total Purchased
                          </div>
                          <div className="text-2xl font-black text-slate-900">
                            {subscription.plan?.totalCredits === -1 ? '∞' : subscription.plan?.totalCredits?.toLocaleString() || 0}
                          </div>
                          <div className="text-[9px] font-bold text-slate-500 mt-1">
                            From System Admin
                          </div>
                        </div>

                        {/* Allocated to Partner Plans */}
                        <div className="bg-white rounded-[16px] p-4 border border-amber-100">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Allocated
                          </div>
                          <div className="text-2xl font-black text-amber-600">
                            {subscription.plan?.totalCredits > 0 
                              ? ((subscription.plan?.totalCredits || 0) - (subscription.availableCredits || 0)).toLocaleString()
                              : '0'}
                          </div>
                          <div className="text-[9px] font-bold text-amber-500 mt-1">
                            To Partner Plans
                          </div>
                        </div>

                        {/* Actually Used/Consumed */}
                        <div className="bg-white rounded-[16px] p-4 border border-red-100">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Used (Consumed)
                          </div>
                          <div className="text-2xl font-black text-red-600">
                            {creditAccountData?.data?.lifetimeSpent?.toLocaleString() || '0'}
                          </div>
                          <div className="text-[9px] font-bold text-red-500 mt-1">
                            From Cargo Ops
                          </div>
                        </div>

                        {/* Available (Not Allocated) */}
                        <div className="bg-white rounded-[16px] p-4 border border-emerald-100">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            Available
                          </div>
                          <div className="text-2xl font-black text-emerald-600">
                            {subscription.availableCredits?.toLocaleString() || '0'}
                          </div>
                          <div className="text-[9px] font-bold text-emerald-500 mt-1">
                            Not Allocated
                          </div>
                        </div>
                      </div>

                      {/* Breakdown Info */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="grid md:grid-cols-2 gap-4 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold">Current Balance:</span>
                            <span className="font-black text-blue-600">
                              {creditAccountData?.data?.currentBalance?.toLocaleString() || '0'} credits
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 font-semibold">Lifetime Earned:</span>
                            <span className="font-black text-slate-700">
                              {creditAccountData?.data?.lifetimeEarned?.toLocaleString() || '0'} credits
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bars */}
                      {subscription.plan?.totalCredits > 0 && (
                        <div className="mt-4 space-y-3">
                          {/* Allocation Progress */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Allocation</span>
                              <span className="text-[9px] font-bold text-amber-600">
                                {((((subscription.plan?.totalCredits || 0) - (subscription.availableCredits || 0)) / (subscription.plan?.totalCredits || 1)) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${Math.min(100, ((((subscription.plan?.totalCredits || 0) - (subscription.availableCredits || 0)) / (subscription.plan?.totalCredits || 1)) * 100))}%` 
                                }}
                              />
                            </div>
                          </div>

                          {/* Consumption Progress */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Consumption</span>
                              <span className="text-[9px] font-bold text-red-600">
                                {creditAccountData?.data?.lifetimeSpent 
                                  ? ((creditAccountData.data.lifetimeSpent / subscription.plan.totalCredits) * 100).toFixed(1)
                                  : '0'}%
                              </span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${Math.min(100, creditAccountData?.data?.lifetimeSpent 
                                    ? ((creditAccountData.data.lifetimeSpent / subscription.plan.totalCredits) * 100)
                                    : 0)}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Info Note */}
                      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <FaInfoCircle className="text-blue-500 text-xs mt-0.5 shrink-0" />
                          <div className="text-[10px] text-slate-600 leading-relaxed">
                            <span className="font-black">Allocated</span> credits are reserved for partner plans. 
                            <span className="font-black"> Consumed</span> credits are deducted when truck owners transport cargo 
                            (based on {subscription.plan?.creditsPerTonTenant || 0} credits/ton for you).
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Credit Usage Trending Graph */}
                    <div className="bg-white rounded-[24px] p-6 border border-slate-100">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <FaChartBar className="text-blue-500" />
                          </div>
                          <div>
                            <h4 className="text-base font-black text-slate-900">Credit Usage Trend</h4>
                            <p className="text-xs text-slate-500 mt-0.5">30-day credit consumption history</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-red-600"></div>
                            <span className="text-xs font-bold text-slate-600">Used</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                            <span className="text-xs font-bold text-slate-600">Remaining</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats Cards */}
                      <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                          <div className="text-[9px] font-black text-blue-600 uppercase tracking-wider mb-1">Total Credits</div>
                          <div className="text-2xl font-black text-blue-900">
                            {subscription.plan?.totalCredits === -1 ? '∞' : subscription.plan?.totalCredits?.toLocaleString() || 0}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                          <div className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mb-1">Available</div>
                          <div className="text-2xl font-black text-emerald-900">
                            {(subscription.plan?.totalCredits || 0) - (creditAccountData?.data?.lifetimeSpent || 0) > 0
                              ? ((subscription.plan?.totalCredits || 0) - (creditAccountData?.data?.lifetimeSpent || 0)).toLocaleString()
                              : '0'}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                          <div className="text-[9px] font-black text-red-600 uppercase tracking-wider mb-1">Used Credits</div>
                          <div className="text-2xl font-black text-red-900">
                            {creditAccountData?.data?.lifetimeSpent?.toLocaleString() || '0'}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                          <div className="text-[9px] font-black text-purple-600 uppercase tracking-wider mb-1">Usage Rate</div>
                          <div className="text-2xl font-black text-purple-900">
                            {subscription.plan?.totalCredits > 0 && creditAccountData?.data?.lifetimeSpent
                              ? `${((creditAccountData.data.lifetimeSpent / subscription.plan.totalCredits) * 100).toFixed(1)}%`
                              : '0%'}
                          </div>
                        </div>
                      </div>

                      {/* Area Chart */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart
                            data={(() => {
                              const totalCredits = subscription.plan?.totalCredits || 0;
                              const usedCredits = creditAccountData?.data?.lifetimeSpent || 0;
                              const days = 30;
                              
                              // Generate 30 days of data
                              return Array.from({ length: days }, (_, i) => {
                                const dayNumber = i + 1;
                                const progressRatio = dayNumber / days;
                                
                                // Simulate gradual credit consumption over time
                                const dailyUsed = Math.floor(usedCredits * progressRatio);
                                const dailyRemaining = totalCredits - dailyUsed;
                                
                                return {
                                  day: `Day ${dayNumber}`,
                                  used: dailyUsed,
                                  remaining: dailyRemaining > 0 ? dailyRemaining : 0,
                                  date: new Date(Date.now() - (days - dayNumber) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                };
                              });
                            })()}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
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
                              dataKey="used" 
                              stackId="1"
                              stroke="#ef4444" 
                              strokeWidth={2}
                              fill="url(#colorUsed)" 
                              name="Credits Used"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="remaining" 
                              stackId="1"
                              stroke="#10b981" 
                              strokeWidth={2}
                              fill="url(#colorRemaining)" 
                              name="Credits Remaining"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Info Note */}
                      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <div className="flex items-start gap-2">
                          <FaInfoCircle className="text-blue-500 text-xs mt-0.5 shrink-0" />
                          <div className="text-[10px] text-slate-600 leading-relaxed">
                            <span className="font-black">Credit Usage Tracking:</span> This graph shows your credit consumption pattern over the last 30 days. 
                            Credits are deducted when cargo is transported based on weight ({subscription.plan?.creditsPerTonTenant || 0} credits per ton).
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-6 border-t border-slate-100">
                      <button
                        onClick={() => {
                          // Navigate to partner plans page with this subscription pre-selected
                          window.location.href = `/tenant-admin/partner-plans?subscription=${subscription.id}`;
                        }}
                        className="flex-1 px-6 py-3.5 bg-[#345E85] text-white rounded-2xl hover:bg-[#2a4d6d] transition-all font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                      >
                        <FaPlus className="text-xs" />
                        Create Partner Plan
                      </button>
                      <button
                        onClick={() => setManagedTab('partners')}
                        className="px-6 py-3.5 bg-slate-50 text-slate-700 rounded-2xl hover:bg-slate-100 transition-all font-bold text-[11px] uppercase tracking-widest flex items-center gap-2"
                      >
                        <FaUsers className="text-xs" />
                        View Partners
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
            /* Partner Plans Management View */
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                      <FaUsers className="text-xl" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Total Plans
                      </h4>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">
                        {partnerPlans.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                      <FaRocket className="text-xl" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Active Plans
                      </h4>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">
                        {partnerPlans.filter(p => p.isActive).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center shrink-0">
                      <FaStar className="text-xl" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Total Slots
                      </h4>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">
                        {partnerPlans.reduce((sum, p) => sum + (p.availableSlots || 0), 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                      <FaGift className="text-xl" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Allocated Credits
                      </h4>
                      <p className="text-2xl font-black text-slate-900 tracking-tight">
                        {partnerPlans.reduce((sum, p) => sum + (p.totalCredits || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slots Usage Graph */}
              {partnerPlans.length > 0 && (
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <FaChartBar className="text-purple-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Partner Plan Slots Overview</h2>
                        <p className="text-sm text-slate-500 mt-1">Track sold and available slots for each plan</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Total Slots</div>
                      <div className="text-3xl font-black text-blue-900">
                        {partnerPlans.reduce((sum, p) => sum + (p.availableSlots || 0), 0)}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border border-emerald-200">
                      <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Slots Sold</div>
                      <div className="text-3xl font-black text-emerald-900">
                        {partnerSubscribersData?.data?.length || 0}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-5 border border-amber-200">
                      <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Slots Available</div>
                      <div className="text-3xl font-black text-amber-900">
                        {partnerPlans.reduce((sum, p) => sum + (p.availableSlots || 0), 0) - (partnerSubscribersData?.data?.length || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart
                        data={partnerPlans.map(plan => {
                          const soldSlots = partnerSubscribersData?.data?.filter(
                            (sub: any) => sub.planSlug === plan.slug
                          ).length || 0;
                          const availableSlots = (plan.availableSlots || 0) - soldSlots;
                          
                          return {
                            name: plan.name,
                            sold: soldSlots,
                            available: availableSlots,
                            total: plan.availableSlots || 0,
                          };
                        })}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#64748b"
                          style={{ fontSize: '12px', fontWeight: 600 }}
                        />
                        <YAxis 
                          stroke="#64748b"
                          style={{ fontSize: '12px', fontWeight: 600 }}
                          label={{ value: 'Slots', angle: -90, position: 'insideLeft', style: { fontWeight: 700 } }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}
                          labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="circle"
                        />
                        <Bar 
                          dataKey="sold" 
                          stackId="a" 
                          fill="#10b981" 
                          name="Slots Sold"
                          radius={[0, 0, 8, 8]}
                        />
                        <Bar 
                          dataKey="available" 
                          stackId="a" 
                          fill="#f59e0b" 
                          name="Slots Available"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Plan Details Table */}
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="pb-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Name</th>
                          <th className="pb-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Slots</th>
                          <th className="pb-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Sold</th>
                          <th className="pb-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</th>
                          <th className="pb-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilization</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {partnerPlans.map((plan) => {
                          const soldSlots = partnerSubscribersData?.data?.filter(
                            (sub: any) => sub.planSlug === plan.slug
                          ).length || 0;
                          const availableSlots = (plan.availableSlots || 0) - soldSlots;
                          const utilization = plan.availableSlots > 0 
                            ? ((soldSlots / plan.availableSlots) * 100).toFixed(1) 
                            : '0.0';

                          return (
                            <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 text-left">
                                <div className="font-black text-slate-900">{plan.name}</div>
                                <div className="text-xs text-slate-500 mt-0.5">{plan.slug}</div>
                              </td>
                              <td className="py-4 text-center">
                                <span className="font-bold text-slate-700">{plan.availableSlots}</span>
                              </td>
                              <td className="py-4 text-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                  {soldSlots}
                                </span>
                              </td>
                              <td className="py-4 text-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                  {availableSlots}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <div className="w-24 bg-slate-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        parseFloat(utilization) >= 80 ? 'bg-emerald-500' :
                                        parseFloat(utilization) >= 50 ? 'bg-blue-500' :
                                        parseFloat(utilization) >= 20 ? 'bg-amber-500' :
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${utilization}%` }}
                                    />
                                  </div>
                                  <span className="font-black text-slate-900 text-sm w-12 text-right">
                                    {utilization}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Info Note */}
                  <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <FaInfoCircle className="text-blue-500 text-sm mt-0.5 shrink-0" />
                      <div className="text-xs text-slate-600 leading-relaxed">
                        <span className="font-black">Slots Management:</span> Each partner plan has a limited number of slots. 
                        When a truck owner purchases a plan, one slot is consumed. Monitor utilization to know when to create more plans or increase slots.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Parent Subscriptions Summary */}
              {parents.length > 0 && (
                <div className="grid md:grid-cols-3 gap-4">
                  {parents.map((parent) => (
                    <div key={parent.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[20px] p-5 border border-blue-100">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        {parent.plan.name}
                      </div>
                      <div className="text-2xl font-black text-[#345E85] tracking-tight">
                        {parent.availableCredits?.toLocaleString() || 0}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Credits available for allocation
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {parents.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex items-start gap-4">
                  <FaInfoCircle className="text-yellow-600 text-xl flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-2">No Parent Subscription</h3>
                    <p className="text-sm text-yellow-800">
                      You need to purchase a subscription plan first before creating partner plans for truck owners.
                    </p>
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-all font-bold text-xs uppercase tracking-widest"
                    >
                      Purchase Subscription
                    </button>
                  </div>
                </div>
              )}

              {/* Partner Plans Grid */}
              {partnerPlans.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {partnerPlans.map((plan) => {
                    const parent = getParentInfo(plan.parentSubscriptionId);
                    return (
                      <div
                        key={plan.id}
                        className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-[16px] bg-blue-50 flex items-center justify-center">
                              <FaRocket className="text-xl text-[#345E85]" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                {plan.name}
                              </h3>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {plan.slug}
                              </p>
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                            plan.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-slate-50 text-slate-600 border border-slate-200'
                          }`}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 mb-4 min-h-[40px]">
                          {plan.description}
                        </p>

                        {parent && (
                          <div className="bg-blue-50/50 rounded-xl p-3 mb-4 border border-blue-100">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              Parent: {parent.plan.name}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-semibold">Price per Credit:</span>
                            <span className="font-black text-[#345E85]">
                              ${Number(plan.pricePerCredit).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-semibold">Credits Per Partner:</span>
                            <span className="font-black text-blue-600">
                              {plan.creditCostPerPartner.toLocaleString()}
                            </span>
                          </
div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-semibold">Available Slots:</span>
                            <span className="font-black text-purple-600">
                              {plan.availableSlots} partners
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                            <span className="text-slate-600 font-semibold">Total Allocation:</span>
                            <span className="font-black text-emerald-600">
                              {plan.totalCredits.toLocaleString()} credits
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-semibold">Credits/Ton:</span>
                            <span className="font-bold text-slate-700">
                              {Number(plan.creditsPerTonTruckOwner).toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => handleOpenPartnerModal(plan)}
                            className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <FaEdit className="text-xs" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePartnerPlan(plan.id)}
                            className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <FaTrash className="text-xs" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : parents.length > 0 ? (
                <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                  <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                    <FaCrown className="text-4xl text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                    No Partner Plans Yet
                  </h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto">
                    Create partner plans to allow truck owners to purchase credits from your allocation.
                  </p>
                  <button
                    onClick={() => handleOpenPartnerModal()}
                    className="px-8 py-4 bg-[#345E85] text-white rounded-2xl hover:bg-[#2a4d6d] transition-all font-black text-[11px] uppercase tracking-widest shadow-lg inline-flex items-center gap-2"
                  >
                    <FaPlus />
                    Create Your First Plan
                  </button>
                </div>
              ) : null}

              {/* Create Partner Plan Button (Floating) */}
              {parents.length > 0 && partnerPlans.length > 0 && (
                <div className="flex justify-center">
                  <button
                    onClick={() => handleOpenPartnerModal()}
                    className="px-8 py-4 bg-[#345E85] text-white rounded-2xl hover:bg-[#2a4d6d] transition-all font-black text-[11px] uppercase tracking-widest shadow-lg inline-flex items-center gap-2"
                  >
                    <FaPlus />
                    Create New Partner Plan
                  </button>
                </div>
              )}

              {/* Truck Owners Subscriptions Table */}
              {partnerPlans.length > 0 && (
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        Partner Subscriptions
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Truck owners who purchased your partner plans
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                        <span className="text-xs font-bold text-blue-600">
                          {partnerSubscribersData?.data?.length || 0} Active Subscribers
                        </span>
                      </div>
                    </div>
                  </div>

                  {partnerSubscribersData?.data?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Truck Owner
                            </th>
                            <th className="pb-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Plan
                            </th>
                            <th className="pb-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Status
                            </th>
                            <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Credits
                            </th>
                            <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Purchase Date
                            </th>
                            <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Expiry Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {partnerSubscribersData.data.map((subscriber: any) => (
                            <tr key={subscriber.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 pr-4">
                                <div>
                                  <div className="font-black text-slate-900 text-sm">
                                    {subscriber.truckOwnerName}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {subscriber.email}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                                  <FaCrown className="text-[#345E85] text-xs" />
                                  <span className="text-xs font-bold text-slate-700">
                                    {subscriber.planName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  subscriber.status === 'active' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : subscriber.status === 'expiring'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {subscriber.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="text-sm font-black text-slate-900">
                                  {subscriber.creditsTotal.toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  Credits Purchased
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="text-sm text-slate-600">
                                  {new Date(subscriber.purchaseDate).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="py-4 pl-4 text-right">
                                <div className="text-sm text-slate-600">
                                  {new Date(subscriber.expiryDate).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {Math.ceil((new Date(subscriber.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                        <FaUsers className="text-3xl text-slate-300" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-2">
                        No Subscribers Yet
                      </h4>
                      <p className="text-sm text-slate-500">
                        Truck owners haven't purchased any partner plans yet
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
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
        {/* Create/Edit Partner Plan Modal */}
      {showCreatePlanModal && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingPlan ? 'Edit Partner Plan' : 'Create Partner Plan'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreatePlanModal(false);
                    resetPartnerForm();
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handlePartnerSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Parent Subscription Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Parent Subscription *
                </label>
                <select
                  required
                  value={selectedParent}
                  onChange={(e) => setSelectedParent(e.target.value)}
                  disabled={!!editingPlan}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] disabled:opacity-50"
                >
                  <option value="">Select parent subscription</option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.plan.name} - {parent.availableCredits} credits available
                    </option>
                  ))}
                </select>
                {selectedParentDetails && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-xs text-blue-800">
                      <div className="font-bold mb-1">Inherited Values:</div>
                      <div>Price per Credit: ${Number(selectedParentDetails.plan.pricePerCredit).toFixed(2)}</div>
                      <div>Credits per Ton: {Number(selectedParentDetails.plan.creditsPerTonTruckOwner).toFixed(1)}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={partnerFormData.name}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                    placeholder="e.g., Starter Plan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={partnerFormData.slug}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                    placeholder="e.g., starter-plan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={partnerFormData.description}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                  placeholder="Describe what this plan offers..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Total Credits *
                </label>
                <input
                  type="number"
                  required
                  value={partnerFormData.totalCredits}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, totalCredits: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                  placeholder="1000"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Credits required per partner slot
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Available Slots *
                </label>
                <input
                  type="number"
                  required
                  value={partnerFormData.availableSlots}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, availableSlots: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                  placeholder="4"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Number of partners who can purchase this plan
                </p>
              </div>

              {/* Allocation Summary */}
              {partnerFormData.totalCredits && partnerFormData.availableSlots && selectedParent && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Allocation Summary</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Credits Per Partner:</span>
                      <span className="font-bold text-slate-900">{parseInt(partnerFormData.totalCredits).toLocaleString()} credits</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Available Slots:</span>
                      <span className="font-bold text-slate-900">{parseInt(partnerFormData.availableSlots)} partners</span>
                    </div>
                    <div className="pt-2 border-t border-blue-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-semibold">Total Allocation:</span>
                        <span className="font-black text-blue-600">
                          {(parseInt(partnerFormData.totalCredits) * parseInt(partnerFormData.availableSlots)).toLocaleString()} credits
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-slate-600">Available from Parent:</span>
                        <span className={`font-bold ${
                          (parseInt(partnerFormData.totalCredits) * parseInt(partnerFormData.availableSlots)) > (parents.find((s: any) => s.id === selectedParent)?.availableCredits || 0)
                            ? 'text-red-600'
                            : 'text-emerald-600'
                        }`}>
                          {(parents.find((s: any) => s.id === selectedParent)?.availableCredits || 0).toLocaleString()} credits
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={partnerFormData.isActive}
                  onChange={(e) => setPartnerFormData({ ...partnerFormData, isActive: e.target.checked })}
                  className="w-5 h-5 text-[#345E85] border-slate-300 rounded focus:ring-[#345E85]"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-700">
                  Plan is active and available for purchase
                </label>
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreatePlanModal(false);
                  resetPartnerForm();
                }}
                className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePartnerSubmit}
                disabled={createPartnerPlan.isPending || updatePartnerPlan.isPending}
                className="px-8 py-3 text-sm font-black bg-[#345E85] hover:bg-[#2a4d6d] text-white shadow-md hover:shadow-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center gap-2"
              >
                <FaSave />
                {editingPlan ? 'Update Plan' : 'Create Plan'}
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
