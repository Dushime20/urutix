import React, { useState } from 'react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import CurrencySelector from '../../components/common/CurrencySelector';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FaStore,
  FaCoins,
  FaDollarSign,
  FaChartLine,
  FaCog,
  FaToggleOn,
  FaToggleOff,
  FaShoppingCart,
  FaCheckCircle,
  FaInfoCircle,
} from 'react-icons/fa';
import ModernLoader from '../../components/common/ModernLoader';

interface MarketplaceSettings {
  id: string;
  minPurchaseAmount: number;
  maxPurchaseAmount: number | null;
  pricePerCredit: number;
  isEnabled: boolean;
}

interface MarketplaceStats {
  totalRevenue: number;
  totalCreditsSold: number;
  totalTransactions: number;
  averageTransactionSize: number;
  currentBalance: number;
}

interface CurrentSubscription {
  id: string;
  plan: {
    name: string;
    pricePerCredit: number;
  };
  status: string;
}

const CreditMarketplace: React.FC = () => {
  const { compact: fmtMoney, format: fmtFull } = useCurrencyFormat();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    minPurchaseAmount: 500,
    maxPurchaseAmount: '',
    isEnabled: true,
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['marketplace-settings'],
    queryFn: async () => {
      const response = await api.get('/credits/marketplace/settings');
      return response.data;
    },
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/current');
      return response.data;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['marketplace-stats'],
    queryFn: async () => {
      const response = await api.get('/credits/marketplace/stats');
      return response.data;
    },
  });

  const { data: creditData } = useQuery({
    queryKey: ['credit-balance'],
    queryFn: async () => {
      const response = await api.get('/credits/balance');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const configureMarketplace = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/credits/marketplace/configure', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Marketplace configured successfully!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['marketplace-settings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to configure marketplace');
    },
  });

  const settings: MarketplaceSettings | null = settingsData?.data;
  const currentSubscription: CurrentSubscription | null = subscriptionData?.data ?? null;
  const activePricePerCredit: number =
    Number(currentSubscription?.plan?.pricePerCredit) ||
    Number(settings?.pricePerCredit) ||
    1;
  const activePlanName: string = currentSubscription?.plan?.name ?? '';

  const stats: MarketplaceStats = statsData?.data || {
    totalRevenue: 0,
    totalCreditsSold: 0,
    totalTransactions: 0,
    averageTransactionSize: 0,
    currentBalance: 0,
  };

  React.useEffect(() => {
    if (settings && !isEditing) {
      setFormData({
        minPurchaseAmount: settings.minPurchaseAmount,
        maxPurchaseAmount: settings.maxPurchaseAmount?.toString() || '',
        isEnabled: settings.isEnabled,
      });
    }
  }, [settings, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      minPurchaseAmount: Number(formData.minPurchaseAmount),
      maxPurchaseAmount: formData.maxPurchaseAmount ? Number(formData.maxPurchaseAmount) : undefined,
      pricePerCredit: activePricePerCredit,
      isEnabled: formData.isEnabled,
    };

    if (data.minPurchaseAmount <= 0) {
      toast.error('Minimum purchase amount must be greater than 0');
      return;
    }

    if (data.maxPurchaseAmount && data.maxPurchaseAmount < data.minPurchaseAmount) {
      toast.error('Maximum purchase amount must be greater than minimum');
      return;
    }

    configureMarketplace.mutate(data);
  };

  if (settingsLoading) {
    return <ModernLoader isLoading={true} type="page" />;
  }

  const statCards = [
    {
      label: 'Total Revenue',
      value: fmtMoney(stats.totalRevenue),
      hint: 'From credit sales',
      icon: FaDollarSign,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Credits Sold',
      value: stats.totalCreditsSold.toLocaleString(),
      hint: 'To truck owners',
      icon: FaCoins,
      tone: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Transactions',
      value: stats.totalTransactions.toLocaleString(),
      hint: 'Completed purchases',
      icon: FaShoppingCart,
      tone: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Avg. Purchase',
      value: stats.averageTransactionSize.toLocaleString(),
      hint: 'Credits per sale',
      icon: FaChartLine,
      tone: 'bg-slate-100 text-slate-600',
    },
  ];

  return (
    <div className="space-y-6 antialiased">
      {/* Header strip */}
      <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#345E85]/10 flex items-center justify-center">
              <FaStore className="text-2xl text-[#345E85]" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Credit Marketplace</h2>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    settings?.isEnabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {settings?.isEnabled ? 'Live' : settings ? 'Paused' : 'Not Set Up'}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Sell credits to truck owners at your plan rate — flexible amounts, no slots.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CurrencySelector variant="full" />
            {settings && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-3 bg-[#345E85] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2a4d6d] transition-all flex items-center gap-2"
              >
                <FaCog className="text-xs" />
                Edit Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
          >
            <div className={`w-10 h-10 rounded-xl ${card.tone} flex items-center justify-center mb-4`}>
              <card.icon className="text-sm" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              {card.label}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{card.hint}</div>
          </div>
        ))}
      </div>

      {/* Inventory + pricing */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Available to Sell
              </div>
              <div className="text-4xl font-black text-[#345E85] tracking-tight">
                {(creditData?.data?.currentBalance ?? 0).toLocaleString()}
                <span className="text-base font-bold text-slate-400 ml-2">credits</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 max-w-md">
                Credits drawn from your subscription balance when truck owners buy.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center shrink-0">
              <FaCoins className="text-sky-600 text-lg" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Price per Credit
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {fmtFull(activePricePerCredit)}
          </div>
          {activePlanName ? (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
              <FaCheckCircle className="text-[10px] text-[#345E85]" />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                {activePlanName}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 mt-2">Inherited from active plan</p>
          )}
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <FaCog className="text-[#345E85]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Marketplace Configuration</h3>
            <p className="text-xs text-slate-500 font-medium">Purchase limits and storefront status</p>
          </div>
        </div>

        {!settings && !isEditing ? (
          <div className="text-center py-14 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50">
            <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <FaStore className="text-2xl text-slate-300" />
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-2 tracking-tight">
              Marketplace Not Configured
            </h4>
            <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">
              Set purchase limits and go live so truck owners can buy credits directly from you.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="px-8 py-3.5 bg-[#345E85] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2a4d6d] transition-all shadow-lg"
            >
              Configure Marketplace
            </button>
          </div>
        ) : isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Minimum Purchase
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.minPurchaseAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, minPurchaseAmount: Number(e.target.value) })
                    }
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#345E85]/20 focus:border-[#345E85] outline-none transition-all"
                    placeholder="500"
                    min="1"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    credits
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Lowest amount partners can buy</p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Maximum Purchase
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.maxPurchaseAmount}
                    onChange={(e) => setFormData({ ...formData, maxPurchaseAmount: e.target.value })}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#345E85]/20 focus:border-[#345E85] outline-none transition-all"
                    placeholder="No limit"
                    min="1"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    credits
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Leave empty for unlimited</p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Price per Credit
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fmtFull(activePricePerCredit)}
                    readOnly
                    className="w-full px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#345E85] uppercase tracking-widest bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    From Plan
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Locked to your subscription{activePlanName ? ` — ${activePlanName}` : ''}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Marketplace Status
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isEnabled: !formData.isEnabled })}
                  className={`w-full px-4 py-3.5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 border ${
                    formData.isEnabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  {formData.isEnabled ? (
                    <FaToggleOn className="text-2xl" />
                  ) : (
                    <FaToggleOff className="text-2xl" />
                  )}
                  {formData.isEnabled ? 'Enabled — Accepting Purchases' : 'Disabled — Closed'}
                </button>
                <p className="text-[11px] text-slate-400">Toggle storefront availability</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <FaInfoCircle className="text-slate-400 text-xs" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Configuration Preview
                </h4>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Purchase Range
                  </div>
                  <div className="text-base font-black text-slate-900">
                    {formData.minPurchaseAmount.toLocaleString()} – {formData.maxPurchaseAmount || '∞'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Sample (1,000 Credits)
                  </div>
                  <div className="text-base font-black text-slate-900">
                    {fmtFull(1000 * activePricePerCredit)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Status
                  </div>
                  <div
                    className={`text-base font-black ${
                      formData.isEnabled ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {formData.isEnabled ? 'Accepting Purchases' : 'Closed'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={configureMarketplace.isPending}
                className="flex-1 px-6 py-4 bg-[#345E85] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#2a4d6d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {configureMarketplace.isPending ? 'Saving...' : 'Save Configuration'}
              </button>
              {settings && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : settings ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Minimum Purchase',
                value: `${settings.minPurchaseAmount.toLocaleString()} credits`,
              },
              {
                label: 'Maximum Purchase',
                value: settings.maxPurchaseAmount
                  ? `${settings.maxPurchaseAmount.toLocaleString()} credits`
                  : 'No Limit',
              },
              {
                label: 'Price per Credit',
                value: fmtFull(Number(activePricePerCredit)),
              },
              {
                label: 'Status',
                value: settings.isEnabled ? 'Active' : 'Disabled',
                accent: settings.isEnabled ? 'text-emerald-600' : 'text-slate-400',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-slate-50 rounded-2xl p-5 border border-slate-100"
              >
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {item.label}
                </div>
                <div className={`text-xl font-black tracking-tight ${item.accent || 'text-slate-900'}`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CreditMarketplace;
