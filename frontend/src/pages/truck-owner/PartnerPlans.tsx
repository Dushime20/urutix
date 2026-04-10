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
} from 'react-icons/fa';

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

  // Fetch credit account
  const { data: creditAccountData } = useQuery({
    queryKey: ['credit-account'],
    queryFn: async () => {
      const response = await api.get('/credits/account');
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
      {/* Header */}
      <div className="bg-white rounded-[32px] shadow-sm p-8 border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100/50 shadow-sm">
            <FaCrown className="w-6 h-6 text-[#345E85]" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Partner Plans</h3>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Available Subscription Plans</h1>
          </div>
        </div>
      </div>

      {/* My Active Subscriptions */}
      {mySubscriptions.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[32px] p-8 border border-blue-100">
          <h2 className="text-xl font-black text-slate-900 mb-6">My Active Subscriptions</h2>
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
                      {creditAccountData?.data?.current_balance?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Credits Used:</span>
                    <span className="font-black text-slate-700">
                      {creditAccountData?.data?.lifetime_spent?.toLocaleString() || 0}
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
                {sub.plan?.totalCredits > 0 && creditAccountData?.data && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Usage</span>
                      <span className="text-[9px] font-bold text-blue-600">
                        {((creditAccountData.data.lifetime_spent / sub.plan.totalCredits) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, (creditAccountData.data.lifetime_spent / sub.plan.totalCredits) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Partner Plans */}
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
                  <div className="bg-slate-50/50 rounded-[24px] p-6 mb-8 border border-slate-100">
                    <div className="space-y-3">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Credit Consumption</div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-semibold">Per Ton:</span>
                        <span className="font-black text-indigo-600">{Number(plan.creditsPerTonTruckOwner).toFixed(1)} credits</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all bg-[#345E85] text-white hover:bg-[#2a4d6d] hover:shadow-lg hover:shadow-blue-900/20"
                  >
                    Buy Now
                  </button>
                  <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4">
                    Secure payment • Instant activation
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
