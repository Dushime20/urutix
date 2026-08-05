import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FaShoppingCart,
  FaCoins,
  FaDollarSign,
  FaInfoCircle,
  FaCheckCircle,
  FaTimes,
  FaShieldAlt,
  FaHistory,
} from 'react-icons/fa';
import ModernLoader from '../../components/common/ModernLoader';
import PaymentCurrencySelect from '../../components/common/PaymentCurrencySelect';

interface MarketplaceAvailability {
  isEnabled: boolean;
  availableCredits: number;
  minPurchaseAmount: number;
  maxPurchaseAmount: number | null;
  pricePerCredit: number;
  /** ISO 4217 currency code for prices in this marketplace */
  currency?: string;
}

const BuyCredits: React.FC = () => {
  const queryClient = useQueryClient();
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('card');
  const [paymentCurrency, setPaymentCurrency] = useState<string>(
    () => localStorage.getItem('preferredCurrency') || 'RWF'
  );
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    phoneNumber: '',
    mobileProvider: 'mtn'
  });

  // Fetch marketplace availability
  const { data: availabilityData, isLoading } = useQuery({
    queryKey: ['marketplace-availability'],
    queryFn: async () => {
      const response = await api.get('/credits/marketplace/availability');
      return response.data;
    },
  });

  // Fetch credit balance
  const { data: creditData } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: async () => {
      const response = await api.get('/credits/balance');
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Fetch purchase history
  const { data: historyData } = useQuery({
    queryKey: ['purchase-history'],
    queryFn: async () => {
      const response = await api.get('/credits/marketplace/purchase-history');
      return response.data;
    },
  });

  // Purchase mutation
  const purchaseCredits = useMutation({
    mutationFn: async (data: { creditAmount: number; paymentMethod: string; paymentDetails: any; currency?: string }) => {
      const response = await api.post('/credits/marketplace/purchase', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Credits purchased successfully!');
      setShowPaymentModal(false);
      setCreditAmount('');
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-availability'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-history'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to purchase credits');
    },
  });

  const availability: MarketplaceAvailability | null = availabilityData?.data;
  const currentBalance = creditData?.data?.currentBalance || 0;
  const purchaseHistory = historyData?.data || [];

  const amount = Number(creditAmount) || 0;
  const totalCost = availability ? amount * availability.pricePerCredit : 0;

  // Validation
  const isValidAmount = availability && amount >= availability.minPurchaseAmount &&
    (!availability.maxPurchaseAmount || amount <= availability.maxPurchaseAmount) &&
    amount <= availability.availableCredits;

  const getValidationMessage = () => {
    if (!amount) return null;
    if (!availability) return null;
    
    if (amount < availability.minPurchaseAmount) {
      return `Minimum purchase is ${availability.minPurchaseAmount.toLocaleString()} credits`;
    }
    if (availability.maxPurchaseAmount && amount > availability.maxPurchaseAmount) {
      return `Maximum purchase is ${availability.maxPurchaseAmount.toLocaleString()} credits`;
    }
    if (amount > availability.availableCredits) {
      return `Only ${availability.availableCredits.toLocaleString()} credits available`;
    }
    return null;
  };

  const handlePurchase = () => {
    if (!isValidAmount) return;

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

    purchaseCredits.mutate({
      creditAmount: amount,
      paymentMethod,
      currency: paymentCurrency,
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

  const inputClass =
    'w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-[#345E85]/20 focus:border-[#345E85] outline-none transition-all';

  if (isLoading) {
    return <ModernLoader isLoading={true} type="cards" />;
  }

  if (!availability || !availability.isEnabled) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-6">
            <FaShoppingCart className="text-4xl text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Marketplace Not Available</h3>
          <p className="text-slate-600 dark:text-slate-400">
            The credit marketplace is currently not available. Please contact your tenant administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-colors duration-200">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            <FaShoppingCart className="text-2xl text-[#345E85] dark:text-slate-300" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-1">Buy Credits</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-lg leading-relaxed">
              Purchase any amount of credits you need — flexible and instant.
            </p>
          </div>
        </div>
      </div>

      {/* Current Balance */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <FaCoins className="text-[#345E85] dark:text-slate-300 text-2xl" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Your Current Balance</div>
              <div className="text-4xl font-black text-slate-900 dark:text-white">
                {currentBalance.toLocaleString()} <span className="text-xl text-slate-400 dark:text-slate-500">credits</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Purchase Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Purchase Credits</h2>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                How many credits do you want?
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className={`w-full px-6 py-4 text-2xl font-black bg-white dark:bg-slate-950 text-slate-900 dark:text-white border rounded-2xl focus:ring-2 focus:ring-[#345E85]/20 transition-all outline-none ${
                    getValidationMessage()
                      ? 'border-red-300 dark:border-red-800 focus:border-red-400'
                      : 'border-slate-200 dark:border-slate-700 focus:border-[#345E85]'
                  }`}
                  placeholder="0"
                  min={availability.minPurchaseAmount}
                  max={availability.maxPurchaseAmount || availability.availableCredits}
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">credits</span>
              </div>
              {getValidationMessage() && (
                <p className="text-sm text-red-600 dark:text-red-400 font-semibold mt-2 flex items-center gap-2">
                  <FaInfoCircle /> {getValidationMessage()}
                </p>
              )}
            </div>

            {/* Purchase Limits Info */}
            <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 mb-8 border border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div>
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Minimum</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{availability.minPurchaseAmount.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Maximum</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {availability.maxPurchaseAmount ? availability.maxPurchaseAmount.toLocaleString() : '∞'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Available</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{availability.availableCredits.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Price</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight">${availability.pricePerCredit.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-8">
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Quick Select Units</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[500, 1000, 1500, 2000].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setCreditAmount(quickAmount.toString())}
                    disabled={quickAmount > availability.availableCredits}
                    className={`px-4 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${
                      Number(creditAmount) === quickAmount
                        ? 'bg-[#345E85] text-white border-[#345E85]'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#345E85]/50'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    {quickAmount.toLocaleString()} UNIT
                  </button>
                ))}
              </div>
            </div>

            {/* Total Cost */}
            {amount > 0 && (
              <div className="bg-white dark:bg-slate-950 rounded-2xl p-8 mb-8 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Calculated Total Cost</div>
                    <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                      ${totalCost.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                       {amount.toLocaleString()} credits @ ${availability.pricePerCredit.toFixed(2)}
                    </div>
                  </div>
                  <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <FaDollarSign className="text-4xl text-slate-300 dark:text-slate-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Button */}
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={!isValidAmount || !amount}
              className="w-full py-5 bg-[#345E85] text-white rounded-[24px] font-black text-xl uppercase tracking-widest hover:bg-[#2a4d6d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!amount ? 'Enter Amount' : !isValidAmount ? 'Review Amount' : `Continue to Payment`}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Benefits */}
          <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <FaCheckCircle className="text-[#345E85] dark:text-slate-300 text-sm" />
              </div>
              Benefits
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                'Buy exactly what you need',
                'Instant activation',
                'No expiration date',
                'Secure payment processing',
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FaCheckCircle className="w-3 h-3 text-[#345E85] dark:text-slate-400" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Purchase History */}
          {purchaseHistory.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 tracking-tight">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <FaHistory className="text-[#345E85] dark:text-slate-300 text-sm" />
                </div>
                History
              </h3>
              <div className="space-y-3">
                {purchaseHistory.slice(0, 5).map((purchase: any) => (
                  <div key={purchase.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{purchase.creditAmount} credits</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(purchase.purchaseDate).toLocaleDateString()}</div>
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 font-bold">+{purchase.creditAmount}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    Complete Your Purchase
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {amount.toLocaleString()} credits for ${totalCost.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-white dark:bg-slate-900">
              {/* Order Summary */}
              <div className="bg-white dark:bg-slate-950 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">
                  Order Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Credits:</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{amount.toLocaleString()} Units</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Price per Unit:</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">${availability.pricePerCredit.toFixed(2)}</span>
                  </div>
                  <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-slate-900 dark:text-white uppercase">Total Amount:</span>
                      <span className="text-3xl font-black text-[#345E85] dark:text-white">${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Currency */}
              <PaymentCurrencySelect
                value={paymentCurrency}
                onChange={setPaymentCurrency}
                label="Payment Currency"
              />

              {/* Payment Method Selection */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                  Payment Method
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-6 rounded-2xl border transition-all ${
                      paymentMethod === 'card'
                        ? 'border-[#345E85] bg-white dark:bg-slate-950'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-3">💳</div>
                      <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Credit Card</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('mobile_money')}
                    className={`p-6 rounded-2xl border transition-all ${
                      paymentMethod === 'mobile_money'
                        ? 'border-[#345E85] bg-white dark:bg-slate-950'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-3">📱</div>
                      <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Mobile Money</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Form - Card */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="XXXX XXXX XXXX XXXX"
                      maxLength={19}
                      value={paymentData.cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, '');
                        const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                        setPaymentData({ ...paymentData, cardNumber: formatted });
                      }}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={paymentData.cardName}
                      onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                      className={inputClass}
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
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="CVV"
                        maxLength={4}
                        value={paymentData.cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setPaymentData({ ...paymentData, cvv: value });
                        }}
                        className={inputClass}
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
                      className={`${inputClass} appearance-none`}
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
                      placeholder="+250 7XX XXX XXX"
                      value={paymentData.phoneNumber}
                      onChange={(e) => setPaymentData({ ...paymentData, phoneNumber: e.target.value })}
                      className={inputClass}
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      You will receive a prompt on your phone to confirm the payment
                    </p>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="flex items-start gap-4 bg-white dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                <FaShieldAlt className="w-6 h-6 text-[#345E85] dark:text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-white mb-1 tracking-tight">
                    Secure Payment Protocol
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    Your payment information is encrypted and secure. We never store your sensitive card details or pin codes.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center gap-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-8 py-4 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchaseCredits.isPending}
                className="flex-1 px-8 py-4 text-xs font-black bg-[#345E85] hover:bg-[#2a4d6d] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest"
              >
                {purchaseCredits.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Confirm Payment • $${totalCost.toFixed(2)}`
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
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};

export default BuyCredits;
