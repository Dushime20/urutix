import React, { useState } from 'react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
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
  FaUsers,
  FaShoppingCart,
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

const CreditMarketplace: React.FC = () => {
  const { compact: fmtMoney } = useCurrencyFormat();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    minPurchaseAmount: 500,
    maxPurchaseAmount: '',
    pricePerCredit: 1, // Fixed to 1
    isEnabled: true,
  });

  // Fetch marketplace settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['marketplace-settings'],
    queryFn: async () => {
      const response = await api.get('/credits/marketplace/settings');
      return response.data;
    },
  });

  // Fetch marketplace stats
  const { data: statsData } = useQuery({
    queryKey: ['marketplace-stats'],
    queryFn: async () => {
      const response = await api.get('/credits/marketplace/stats');
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

  // Configure marketplace mutation
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
  const stats: MarketplaceStats = statsData?.data || {
    totalRevenue: 0,
    totalCreditsSold: 0,
    totalTransactions: 0,
    averageTransactionSize: 0,
    currentBalance: 0,
  };

  // Initialize form with existing settings
  React.useEffect(() => {
    if (settings && !isEditing) {
      setFormData({
        minPurchaseAmount: settings.minPurchaseAmount,
        maxPurchaseAmount: settings.maxPurchaseAmount?.toString() || '',
        pricePerCredit: 1, // Fixed to 1
        isEnabled: settings.isEnabled,
      });
    }
  }, [settings, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      minPurchaseAmount: Number(formData.minPurchaseAmount),
      maxPurchaseAmount: formData.maxPurchaseAmount ? Number(formData.maxPurchaseAmount) : undefined,
      pricePerCredit: 1, // Enforce 1 on submission
      isEnabled: formData.isEnabled,
    };

    // Validation
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#345E85] rounded-[32px] p-8 text-white border-b-4 border-indigo-900/20">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center">
            <FaStore className="text-4xl" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">Credit Marketplace</h1>
            <p className="text-indigo-100/80 text-sm font-bold max-w-lg leading-relaxed">
              Sell credits directly to truck owners - no plans, no slots, just flexible purchases.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-[24px] p-6 border-2 border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FaDollarSign className="text-emerald-700 text-xl" />
            </div>
            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
              settings?.isEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              {settings?.isEnabled ? 'Active' : 'Disabled'}
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">
            {fmtMoney(stats.totalRevenue)}
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total Revenue</div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border-2 border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <FaCoins className="text-blue-700 text-xl" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">
            {stats.totalCreditsSold.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Credits Sold</div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border-2 border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <FaShoppingCart className="text-purple-700 text-xl" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">
            {stats.totalTransactions}
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Transactions</div>
        </div>

        <div className="bg-white rounded-[24px] p-6 border-2 border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <FaChartLine className="text-amber-700 text-xl" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1">
            {stats.averageTransactionSize.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Avg. Purchase</div>
        </div>
      </div>

      {/* Available Credits Banner */}
      <div className="bg-slate-50 rounded-[24px] p-6 border-2 border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
              <FaCoins className="text-[#345E85] text-2xl" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available to Sell</div>
              <div className="text-4xl font-black text-[#345E85]">
                {creditData?.data?.currentBalance?.toLocaleString() || 0} <span className="text-xl text-slate-400">credits</span>
              </div>
            </div>
          </div>
          {settings && (
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Price per Credit</div>
              <div className="text-3xl font-black text-slate-900">
                ${Number(settings.pricePerCredit).toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Section */}
      <div className="bg-white rounded-[32px] p-8 border-2 border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              <FaCog className="text-[#345E85] text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Marketplace Configuration</h2>
              <p className="text-sm font-bold text-slate-400">Set purchase limits and pricing</p>
            </div>
          </div>
          {!isEditing && settings && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-3 bg-[#345E85] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#2a4d6d] transition-all border-b-4 border-indigo-900/20"
            >
              Edit Settings
            </button>
          )}
        </div>

        {!settings && !isEditing ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
            <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center mx-auto mb-6">
              <FaStore className="text-4xl text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Marketplace Not Configured</h3>
            <p className="text-sm font-bold text-slate-400 mb-8 max-w-md mx-auto">
              Set up your credit marketplace to start selling credits directly to truck owners with flexible amounts.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="px-10 py-4 bg-[#345E85] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#2a4d6d] transition-all border-b-4 border-indigo-900/20"
            >
              Configure Marketplace
            </button>
          </div>
        ) : isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Minimum Purchase Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.minPurchaseAmount}
                    onChange={(e) => setFormData({ ...formData, minPurchaseAmount: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="500"
                    min="1"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">credits</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Minimum credits truck owners must purchase</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Maximum Purchase Amount (Optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.maxPurchaseAmount}
                    onChange={(e) => setFormData({ ...formData, maxPurchaseAmount: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="No limit"
                    min="1"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">credits</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Leave empty for no maximum limit</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Price per Credit
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#345E85]">$</span>
                  <input
                    type="number"
                    value={1}
                    readOnly
                    className="w-full pl-8 pr-4 py-3 bg-slate-100 border-2 border-slate-100 rounded-xl text-sm font-black text-slate-900 cursor-not-allowed"
                    placeholder="1.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">Fixed</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">Marketplace price is fixed at $1.00 per credit</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Marketplace Status
                </label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isEnabled: !formData.isEnabled })}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-3 ${
                    formData.isEnabled
                      ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-2 border-slate-200'
                  }`}
                >
                  {formData.isEnabled ? <FaToggleOn className="text-2xl" /> : <FaToggleOff className="text-2xl" />}
                  {formData.isEnabled ? 'Enabled' : 'Disabled'}
                </button>
                <p className="text-xs text-slate-500 mt-2">Enable or disable credit sales</p>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-200 pb-2">Configuration Preview</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Purchase Range</div>
                  <div className="text-lg font-black text-slate-900">
                    {formData.minPurchaseAmount.toLocaleString()} - {formData.maxPurchaseAmount || '∞'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sample (1,000 Credits)</div>
                  <div className="text-lg font-black text-slate-900">
                    ${(1000 * formData.pricePerCredit).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Marketplace Status</div>
                  <div className={`text-lg font-black ${formData.isEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {formData.isEnabled ? 'Accepting Purchases' : 'Closed'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={configureMarketplace.isPending}
                className="flex-1 px-6 py-4 bg-[#345E85] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#2a4d6d] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-b-4 border-indigo-900/20"
              >
                {configureMarketplace.isPending ? 'Saving...' : 'Save Configuration'}
              </button>
              {settings && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-4 bg-slate-50 text-slate-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border-2 border-slate-100"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : settings ? (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Minimum Purchase</div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">{settings.minPurchaseAmount.toLocaleString()} credits</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Maximum Purchase</div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {settings.maxPurchaseAmount ? `${settings.maxPurchaseAmount.toLocaleString()} credits` : 'No Limit'}
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Price per Credit</div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">${Number(settings.pricePerCredit).toFixed(2)}</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</div>
                <div className={`text-2xl font-black tracking-tight ${settings.isEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {settings.isEnabled ? 'Active' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CreditMarketplace;
