import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FaCheck,
  FaTimes,
  FaCrown,
  FaRocket,
  FaStar,
  FaShieldAlt,
  FaInfoCircle,
  FaChartBar,
  FaChartLine,
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PartnerPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricePerCredit: number;
  creditCostPerPartner: number;
  availableSlots: number;
  creditsPerTonTruckOwner: number;
  isActive: boolean;
  parentSubscriptionId: string;
  purchasedCount?: number;
  slotsRemaining?: number;
  isFull?: boolean;
}

const TruckOwnerPartnerPlans: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<PartnerPlan | null>(null);
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
  const [activeTab, setActiveTab] = useState<'available' | 'active'>('available');

  // Fetch available partner plans
  const { data: plansData, isLoading } = useQuery({
    queryKey: ['available-partner-plans'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/available-plans');
      return response.data;
    },
  });


  // Fetch my subscriptions
  const { data: mySubscriptionsData } = useQuery({
    queryKey: ['my-partner-subscriptions'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/my-subscriptions');
      return response.data;
    },
  });

  // Fetch credit balance
  const { data: creditAccountData } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: async () => {
      const response = await api.get('/credits/balance');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
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
      toast.success('Partner plan purchased successfully! Credits have been added to your account.');
      setShowPaymentModal(false);
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ['my-partner-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['credit-account'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to purchase plan');
    },
  });

  const handleSelectPlan = (plan: PartnerPlan) => {
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

  const partnerPlans: PartnerPlan[] = plansData?.data?.filter((p: any) => p.parentSubscriptionId) || [];
  const mySubscriptions: any[] = mySubscriptionsData?.data || [];

  const getTotalAmount = (plan: PartnerPlan) => {
    return Number(plan.pricePerCredit) * plan.creditCostPerPartner;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#345E85] mx-auto"></div>
          <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white rounded-[24px] p-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sticky top-[72px] z-30 transition-all duration-300">
        {/* Nav Tabs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'available'
                ? 'bg-[#345E85] text-white shadow-lg shadow-blue-900/10'
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-500'
            }`}
          >
            Available Plans
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'active'
                ? 'bg-[#345E85] text-white shadow-lg shadow-blue-900/10'
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-500'
            }`}
          >
            My Subscriptions
          </button>
        </div>

        {/* Action Items (Pill) */}
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#345E85] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
            <FaRocket className="text-blue-500" />
            🚀 Instant Activation
          </div>
        </div>
      </div>

      {activeTab === 'available' ? (
        /* Available Plans Tab */
        <div className="space-y-8">
          {partnerPlans.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {partnerPlans.map((plan) => {
                const totalAmount = getTotalAmount(plan);

                return (
                  <div
                    key={plan.id}
                    className="relative bg-white rounded-[32px] p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                  >
                    {/* Plan Header */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
                        <div className="w-12 h-12 rounded-[16px] flex items-center justify-center bg-blue-50 text-[#345E85]">
                          <FaRocket className="text-xl" />
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
                        <div className="mt-4 space-y-2">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            Total: {plan.creditCostPerPartner.toLocaleString()} credits
                          </p>
                          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                            <FaStar className="text-emerald-500 w-3 h-3" />
                            Package: ${totalAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Credit Consumption */}
                      <div className="bg-slate-50/50 rounded-[24px] p-6 mb-6 border border-slate-100">
                        <div className="space-y-3">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Credit Consumption</div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 font-semibold">Per Ton:</span>
                            <span className="font-black text-indigo-600">{Number(plan.creditsPerTonTruckOwner).toFixed(1)} credits</span>
                          </div>
                        </div>
                      </div>

                      {/* Slot Availability */}
                      {plan.parentSubscriptionId && (
                        <div className={`rounded-[20px] p-4 mb-6 border ${
                          plan.isFull 
                            ? 'bg-red-50 border-red-200' 
                            : plan.slotsRemaining && plan.slotsRemaining <= 2
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-emerald-50 border-emerald-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                              Available Slots
                            </span>
                            <span className={`text-sm font-black ${
                              plan.isFull 
                                ? 'text-red-600' 
                                : plan.slotsRemaining && plan.slotsRemaining <= 2
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}>
                              {plan.slotsRemaining || 0} / {plan.availableSlots}
                            </span>
                          </div>
                          {plan.isFull && (
                            <p className="text-[9px] font-bold text-red-600 mt-2">
                              All slots have been purchased
                            </p>
                          )}
                          {!plan.isFull && plan.slotsRemaining && plan.slotsRemaining <= 2 && (
                            <p className="text-[9px] font-bold text-amber-600 mt-2">
                              Only {plan.slotsRemaining} slot{plan.slotsRemaining > 1 ? 's' : ''} remaining!
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* CTA Button */}
                      <button
                        onClick={() => handleSelectPlan(plan)}
                        disabled={plan.isFull}
                        className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                          plan.isFull
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-[#345E85] text-white hover:bg-[#2a4d6d] hover:shadow-lg hover:shadow-blue-900/20'
                        }`}
                      >
                        {plan.isFull ? 'Sold Out' : 'Buy Now'}
                      </button>
                      <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4">
                        {plan.isFull ? 'No slots available' : 'Secure payment • Instant activation'}
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="mt-8 pt-8 border-t border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">What's included</h4>
                      <ul className="space-y-4">
                        <li className="flex items-start gap-3 group">
                          <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                            <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {plan.creditCostPerPartner.toLocaleString()} credits included
                          </span>
                        </li>
                        <li className="flex items-start gap-3 group">
                          <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                            <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            Track credit usage in real-time
                          </span>
                        </li>
                        <li className="flex items-start gap-3 group">
                          <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-100 transition-colors">
                            <FaCheck className="w-2.5 h-2.5 text-emerald-500" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            Access to cargo matching system
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                <FaCrown className="text-4xl text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                No Partner Plans Available
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Your tenant admin hasn't created any partner plans yet. Contact them to set up subscription plans for truck owners.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* My Subscriptions Tab */
        <div className="space-y-8">
          {/* My Active Subscriptions Grid */}
          {mySubscriptions.length > 0 ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[32px] p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-blue-100 shadow-sm">
                  <FaStar className="text-[#345E85]" />
                </div>
                <h2 className="text-xl font-black text-slate-900">Active Subscriptions</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {mySubscriptions.map((sub: any) => (
                  <div key={sub.id} className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">{sub.plan?.name}</h3>
                        <p className="text-xs text-slate-500 mt-1">{sub.plan?.description}</p>
                      </div>
                      <div className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {sub.status}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Credits Remaining:</span>
                        <span className="font-black text-blue-600">
                          {(() => {
                            const totalCredits = sub.plan?.creditCostPerPartner || sub.plan?.totalCredits || 0;
                            const usedCredits = creditAccountData?.data?.lifetimeSpent || 0;
                            const remaining = totalCredits - usedCredits;
                            return remaining.toLocaleString();
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Credits Used:</span>
                        <span className="font-black text-slate-700">
                          {creditAccountData?.data?.lifetimeSpent?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Total Credits:</span>
                        <span className="font-black text-slate-900">
                          {(sub.plan?.creditCostPerPartner || sub.plan?.totalCredits || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Expires:</span>
                        <span className="font-bold text-slate-700">
                          {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(sub.plan?.creditCostPerPartner || sub.plan?.totalCredits) > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Usage</span>
                          <span className="text-[9px] font-bold text-blue-600">
                            {(() => {
                              const totalCredits = sub.plan?.creditCostPerPartner || sub.plan?.totalCredits || 1;
                              const usedCredits = creditAccountData?.data?.lifetimeSpent || 0;
                              return ((usedCredits / totalCredits) * 100).toFixed(1);
                            })()}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(() => {
                                const totalCredits = sub.plan?.creditCostPerPartner || sub.plan?.totalCredits || 1;
                                const usedCredits = creditAccountData?.data?.lifetimeSpent || 0;
                                return Math.min(100, (usedCredits / totalCredits) * 100);
                              })()}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                <FaStar className="text-4xl text-slate-300" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
                No Active Subscriptions
              </h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                You don't have any active subscriptions yet.
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="px-8 py-3 bg-[#345E85] text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2a4d6d] transition-all"
              >
                View Available Plans
              </button>
            </div>
          )}

          {/* Credit Usage Graph */}
          {mySubscriptions.length > 0 && (
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <FaChartLine className="text-[#345E85]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Credit Usage Over Time</h2>
                    <p className="text-sm text-slate-500 mt-1">Track your credit consumption trends</p>
                  </div>
                </div>
              </div>

              {/* Usage Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Total Credits</div>
                  <div className="text-3xl font-black text-blue-900">
                    {(() => {
                      const total = mySubscriptions.reduce((sum, sub) => 
                        sum + (sub.plan?.creditCostPerPartner || sub.plan?.totalCredits || 0), 0
                      );
                      return total.toLocaleString();
                    })()}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Available</div>
                  <div className="text-3xl font-black text-emerald-900">
                    {(() => {
                      const total = mySubscriptions.reduce((sum, sub) => 
                        sum + (sub.plan?.creditCostPerPartner || sub.plan?.totalCredits || 0), 0
                      );
                      const used = creditAccountData?.data?.lifetimeSpent || 0;
                      return (total - used).toLocaleString();
                    })()}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-5 border border-red-200">
                  <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Used</div>
                  <div className="text-3xl font-black text-red-900">
                    {(creditAccountData?.data?.lifetimeSpent || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border border-purple-200">
                  <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Usage Rate</div>
                  <div className="text-3xl font-black text-purple-900">
                    {(() => {
                      const total = mySubscriptions.reduce((sum, sub) => 
                        sum + (sub.plan?.creditCostPerPartner || sub.plan?.totalCredits || 0), 0
                      );
                      const used = creditAccountData?.data?.lifetimeSpent || 0;
                      return total > 0 ? ((used / total) * 100).toFixed(1) : '0.0';
                    })()}%
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart
                    data={(() => {
                      // Generate mock data for the last 30 days
                      const data = [];
                      const today = new Date();
                      const totalCredits = mySubscriptions.reduce((sum, sub) => 
                        sum + (sub.plan?.creditCostPerPartner || sub.plan?.totalCredits || 0), 0
                      );
                      const currentUsed = creditAccountData?.data?.lifetimeSpent || 0;
                      
                      for (let i = 29; i >= 0; i--) {
                        const date = new Date(today);
                        date.setDate(date.getDate() - i);
                        
                        // Simulate gradual usage over time
                        const dayProgress = (29 - i) / 29;
                        const used = Math.floor(currentUsed * dayProgress);
                        const remaining = totalCredits - used;
                        
                        data.push({
                          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                          used: used,
                          remaining: remaining,
                          total: totalCredits,
                        });
                      }
                      
                      return data;
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
                      style={{ fontSize: '12px', fontWeight: 600 }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      style={{ fontSize: '12px', fontWeight: 600 }}
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
                    <Area 
                      type="monotone" 
                      dataKey="used" 
                      stackId="1"
                      stroke="#ef4444" 
                      fillOpacity={1} 
                      fill="url(#colorUsed)" 
                      name="Credits Used"
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="remaining" 
                      stackId="1"
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorRemaining)" 
                      name="Credits Remaining"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Info Note */}
              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FaInfoCircle className="text-blue-500 text-sm mt-0.5 shrink-0" />
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-black">Note:</span> Credit usage is tracked in real-time as you transport cargo. 
                    Credits are deducted based on the weight of cargo transported and the rate specified in your plan.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
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
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {/* Order Summary */}
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">
                  Order Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Plan:</span>
                    <span className="font-bold text-slate-900">{selectedPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Credits:</span>
                    <span className="font-bold text-slate-900">
                      {selectedPlan.creditCostPerPartner.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Price per Credit:</span>
                    <span className="font-bold text-slate-900">
                      ${Number(selectedPlan.pricePerCredit).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-slate-900">Total Amount:</span>
                      <span className="text-2xl font-black text-[#345E85]">
                        ${getTotalAmount(selectedPlan).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">
                  Payment Method
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-[#345E85] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">💳</div>
                      <div className="text-sm font-bold text-slate-900">Credit Card</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mobile_money')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'mobile_money'
                        ? 'border-[#345E85] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">📱</div>
                      <div className="text-sm font-bold text-slate-900">Mobile Money</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Form - Credit Card */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={paymentData.cardName}
                      onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
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
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
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
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Form - Mobile Money */}
              {paymentMethod === 'mobile_money' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Mobile Provider
                    </label>
                    <select
                      value={paymentData.mobileProvider}
                      onChange={(e) => setPaymentData({ ...paymentData, mobileProvider: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                    >
                      <option value="mtn">MTN Mobile Money</option>
                      <option value="airtel">Airtel Money</option>
                      <option value="tigo">Tigo Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+250 788 123 456"
                      value={paymentData.phoneNumber}
                      onChange={(e) => setPaymentData({ ...paymentData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      You will receive a prompt on your phone to confirm the payment
                    </p>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <FaShieldAlt className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-slate-900 mb-1">
                    Secure Payment
                  </div>
                  <p className="text-xs text-slate-600">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-4">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedPlan(null);
                }}
                className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
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

export default TruckOwnerPartnerPlans;
