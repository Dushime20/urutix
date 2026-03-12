import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FaShoppingCart,
  FaCheck,
  FaStar,
  FaBolt,
  FaArrowLeft,
  FaGift,
  FaCalculator,
  FaInfoCircle,
  FaCreditCard,
  FaClock
} from 'react-icons/fa';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  discountPercentage: number;
}

const PurchaseCredits: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [estimatedUsage, setEstimatedUsage] = useState(100);

  // Fetch credit packages
  const { data: packagesData, isLoading } = useQuery({
    queryKey: ['credit-packages'],
    queryFn: async () => {
      const response = await api.get('/credits/packages');
      return response.data;
    },
  });

  // Fetch current balance
  const { data: balanceData } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: async () => {
      const response = await api.get('/credits/balance');
      return response.data;
    },
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const response = await api.post('/credits/purchase', {
        packageId,
        paymentMethodId: 'pm_default', // TODO: Integrate with actual payment method
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Successfully purchased ${data.data.package.credits} credits!`);
      queryClient.invalidateQueries({ queryKey: ['credit-balance'] });
      queryClient.invalidateQueries({ queryKey: ['credit-transactions'] });
      navigate('/tenant-admin/billing');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to purchase credits');
    },
  });

  const handlePurchase = (packageId: string) => {
    setSelectedPackage(packageId);
    purchaseMutation.mutate(packageId);
  };

  const packages: CreditPackage[] = packagesData?.data || [];
  const currentBalance = balanceData?.data?.currentBalance || 0;

  const getPricePerCredit = (pkg: CreditPackage) => {
    const price = Number(pkg.price);
    const credits = Number(pkg.credits);
    return (price / credits).toFixed(4);
  };

  const getSavings = (pkg: CreditPackage) => {
    const baseRate = 0.15; // $0.15 per credit
    const credits = Number(pkg.credits);
    const price = Number(pkg.price);
    const basePrice = credits * baseRate;
    const savings = basePrice - price;
    return savings > 0 ? savings.toFixed(2) : '0.00';
  };

  const getRecommendedPackage = () => {
    if (estimatedUsage <= 100) return packages.find(p => p.credits === 100);
    if (estimatedUsage <= 500) return packages.find(p => p.credits === 500);
    if (estimatedUsage <= 1000) return packages.find(p => p.credits === 1000);
    return packages.find(p => p.credits === 5000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#345E85] mx-auto"></div>
          <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Credit Hub...</p>
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
            <FaShoppingCart className="w-6 h-6 text-[#345E85]" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Billing & Operations</h3>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Purchase Credits</h1>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 relative z-10">
          <div className="text-right px-6 py-2 border-r border-slate-100 hidden md:block">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</div>
            <div className="text-2xl font-black text-[#345E85] leading-tight flex items-center gap-2 justify-end">
              <FaCreditCard className="w-5 h-5 text-blue-400" />
              {currentBalance.toLocaleString()}
            </div>
          </div>
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
        {/* Header Info Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm">
            <FaGift className="text-emerald-500" />
            Volume Discounts • Save Up To 47%
          </div>

          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-[#345E85] rounded-2xl hover:bg-slate-50 transition-all font-black text-[11px] uppercase tracking-widest shadow-sm"
          >
            <FaCalculator />
            {showCalculator ? 'Hide Calculator' : 'Credit Calculator'}
          </button>
        </div>

        {/* Calculator */}
        {showCalculator && (
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-[14px] bg-slate-50 flex items-center justify-center border border-slate-100">
                <FaCalculator className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Estimate Credit Needs
              </h3>
            </div>

            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Monthly Credit Requirement
                </label>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={estimatedUsage}
                  onChange={(e) => setEstimatedUsage(Number(e.target.value))}
                  className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#345E85]"
                />
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest mt-4">
                  <span>50</span>
                  <span className="text-[#345E85] scale-125 transform transition-transform">{estimatedUsage} Unit{estimatedUsage !== 1 ? 's' : ''}</span>
                  <span>5,000</span>
                </div>
              </div>

              {getRecommendedPackage() && (
                <div className="bg-blue-50/50 rounded-[24px] p-6 border border-blue-100/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Recommended Tier</span>
                      <div className="text-2xl font-black text-[#345E85] tracking-tight mt-1">
                        {getRecommendedPackage()?.credits.toLocaleString()} Credits
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-emerald-500 tracking-tight">
                        ${Number(getRecommendedPackage()?.price).toFixed(2)}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        ${getPricePerCredit(getRecommendedPackage()!)} / unit
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Packages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => {
            const isPopular = pkg.credits === 500 || pkg.credits === 1000;
            const isBestValue = pkg.credits === 5000;
            const isRecommended = getRecommendedPackage()?.id === pkg.id && showCalculator;
            const pricePerCredit = getPricePerCredit(pkg);
            const savings = getSavings(pkg);

            return (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-[32px] p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] border ${
                  isBestValue
                    ? 'border-emerald-200 shadow-[0_4px_20px_rgba(16,185,129,0.08)] ring-1 ring-emerald-500/10'
                    : isPopular
                    ? 'border-[#345E85]/20 shadow-[0_4px_20px_rgba(52,94,133,0.15)] ring-1 ring-[#345E85]/10'
                    : isRecommended
                    ? 'border-purple-200 shadow-[0_4px_20px_rgba(168,85,247,0.08)] ring-1 ring-purple-500/10'
                    : 'border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]'
                }`}
              >
                {/* Badge */}
                {isBestValue && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white px-4 py-2 rounded-bl-[20px] rounded-tr-[30px] shadow-sm flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                    <FaBolt className="w-2.5 h-2.5" /> BEST VALUE
                  </div>
                )}
                {isPopular && !isBestValue && (
                  <div className="absolute top-0 right-0 bg-[#345E85] text-white px-4 py-2 rounded-bl-[20px] rounded-tr-[30px] shadow-sm flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                    <FaStar className="w-2.5 h-2.5" /> POPULAR
                  </div>
                )}
                {isRecommended && !isBestValue && !isPopular && (
                  <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-2 rounded-bl-[20px] rounded-tr-[30px] shadow-sm flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                    FOR YOU
                  </div>
                )}

                {/* Package Content */}
                <div className="flex-1 flex flex-col justify-between mt-2">
                  <div>
                    <div className="text-center mb-8">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Credit Volume</div>
                      <div className={`text-5xl font-black tracking-tight mb-2 ${
                        isBestValue ? 'text-emerald-500' : isPopular ? 'text-[#345E85]' : isRecommended ? 'text-purple-500' : 'text-slate-800'
                      }`}>
                        {pkg.credits.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-center mb-8 border-t border-b border-slate-50 py-6">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cost Structure</div>
                      <div className="text-3xl font-black text-slate-900 tracking-tight mb-1">
                        ${Number(pkg.price).toFixed(2)}
                      </div>
                      <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        ${pricePerCredit} / unit
                      </div>
                    </div>

                    {pkg.discountPercentage > 0 && (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 mb-6 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-emerald-600 text-[11px] font-black uppercase tracking-widest mb-1">
                          <FaGift />
                          {pkg.discountPercentage}% OFF
                        </div>
                        <div className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                          Save ${savings}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={purchaseMutation.isPending && selectedPackage === pkg.id}
                      className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 ${
                        isBestValue
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-emerald-200'
                          : isPopular
                          ? 'bg-[#345E85] text-white hover:bg-slate-800 hover:shadow-blue-900/10'
                          : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {purchaseMutation.isPending && selectedPackage === pkg.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          PROCESSING...
                        </>
                      ) : (
                        <>
                          <FaShoppingCart className="w-3.5 h-3.5" />
                          PURCHASE TIER
                        </>
                      )}
                    </button>
                    <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4">
                      Valid for 12 months
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-10 mt-8 border border-slate-100">
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 pb-8 border-b border-slate-50 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[18px] bg-slate-50 flex items-center justify-center border border-slate-100">
                <FaInfoCircle className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Credit Mechanics</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Value & Terms</p>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/tenant-admin/subscription-plans')}
              className="px-6 py-3 bg-blue-50 border border-blue-100 text-[#345E85] rounded-2xl hover:bg-blue-100 transition-all font-black text-[11px] uppercase tracking-widest flex items-center gap-2"
            >
              View Subscription Plans →
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="flex gap-5">
              <div className="w-12 h-12 bg-blue-50 rounded-[16px] flex items-center justify-center flex-shrink-0 border border-blue-100">
                <FaCheck className="text-[#345E85] text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight mb-2">Uninterrupted Operations</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Maintain system continuity across all platform vectors without artificial limitations or soft caps.
                </p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="w-12 h-12 bg-emerald-50 rounded-[16px] flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <FaClock className="text-emerald-500 text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight mb-2">12-Month Roll-over</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Acquired tokens remain active in your fiscal ledger for a full calendar year before expiry.
                </p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="w-12 h-12 bg-amber-50 rounded-[16px] flex items-center justify-center flex-shrink-0 border border-amber-100">
                <FaGift className="text-amber-500 text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight mb-2">Tiered Economics</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Economies of scale applied to higher-volume transactions. Procure more, optimize unit costs.
                </p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="w-12 h-12 bg-blue-50 rounded-[16px] flex items-center justify-center flex-shrink-0 border border-blue-100">
                <FaBolt className="text-blue-500 text-lg" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight mb-2">Zero-Latency Allocation</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Direct provisioning pipeline ensures purchased credits are injected into your balance instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseCredits;
