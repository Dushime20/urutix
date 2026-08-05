import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Phone, Building2, Save, ShieldCheck, Info } from 'lucide-react';
import api from '../../services/api';
import { TranslatedText } from '../../components/translated-text';
import ModernLoader from '../../components/common/ModernLoader';

interface SubscriptionPaymentConfigData {
  payment_method: 'mobile_money' | 'bank_transfer';
  momo_phone: string;
  momo_provider: string;
  bank_name: string;
  bank_account: string;
  account_holder: string;
}

const DEFAULT_CONFIG: SubscriptionPaymentConfigData = {
  payment_method: 'mobile_money',
  momo_phone: '',
  momo_provider: 'MTN',
  bank_name: '',
  bank_account: '',
  account_holder: '',
};

const normalizeMomoPhone = (raw: string): string | null => {
  let cleaned = raw.replace(/\D/g, '');
  while (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  if (!cleaned.startsWith('250')) cleaned = `250${cleaned}`;
  return /^2507\d{8}$/.test(cleaned) ? cleaned : null;
};

const SubscriptionPaymentConfig: React.FC = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SubscriptionPaymentConfigData>(DEFAULT_CONFIG);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscription-payment-config'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/settings/category/subscription', {
          params: { includePrivate: 'true' },
        });
        const rows: any[] = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const map: Record<string, string> = {};
        rows.forEach((row: any) => {
          const val = row.value ?? row.parsedValue;
          map[row.key] = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
        });
        return {
          payment_method: (map.payment_method as SubscriptionPaymentConfigData['payment_method']) || 'mobile_money',
          momo_phone: map.momo_phone || '',
          momo_provider: map.momo_provider || 'MTN',
          bank_name: map.bank_name || '',
          bank_account: map.bank_account || '',
          account_holder: map.account_holder || '',
        } satisfies SubscriptionPaymentConfigData;
      } catch {
        return DEFAULT_CONFIG;
      }
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: SubscriptionPaymentConfigData) => {
      await api.put('/admin/settings/bulk/subscription', payload);
    },
    onSuccess: () => {
      toast.success('Subscription payment configuration saved');
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-payment-config'] });
      queryClient.invalidateQueries({ queryKey: ['public-subscription-payment-config'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save payment configuration');
    },
  });

  const handleSave = () => {
    if (form.payment_method === 'mobile_money') {
      if (!form.momo_phone.trim()) {
        toast.error('Enter the MoMo number that receives subscription fees');
        return;
      }
      if (!normalizeMomoPhone(form.momo_phone)) {
        toast.error('Enter a valid Rwanda MoMo number, e.g. 0788123456');
        return;
      }
    } else {
      if (!form.bank_name.trim() || !form.bank_account.trim() || !form.account_holder.trim()) {
        toast.error('Fill in bank name, account number, and account holder');
        return;
      }
      if (!/^\d{8,20}$/.test(form.bank_account.replace(/\s/g, ''))) {
        toast.error('Enter a valid bank account number (8–20 digits)');
        return;
      }
    }

    const payload = {
      ...form,
      momo_phone:
        form.payment_method === 'mobile_money'
          ? normalizeMomoPhone(form.momo_phone) || form.momo_phone
          : form.momo_phone,
    };
    saveMutation.mutate(payload);
  };

  if (isLoading) {
    return <ModernLoader isLoading type="section" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-bold mb-1">
            <TranslatedText text="Platform subscription collection account" />
          </p>
          <p>
            <TranslatedText text="Tenant admins pay subscription fees to this account via Ishema mobile money or bank transfer. This replaces manual env-only setup for receiving subscription revenue." />
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
            <TranslatedText text="Primary collection method" />
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {(['mobile_money', 'bank_transfer'] as const).map(method => (
              <button
                key={method}
                type="button"
                onClick={() => setForm(f => ({ ...f, payment_method: method }))}
                className={`p-4 rounded-xl border-2 text-xs font-black uppercase tracking-wider ${
                  form.payment_method === method
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-slate-100 dark:border-slate-800 text-slate-500'
                }`}
              >
                {method === 'mobile_money' ? '📱 Mobile Money' : '🏦 Bank Transfer'}
              </button>
            ))}
          </div>
        </div>

        {form.payment_method === 'mobile_money' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <TranslatedText text="MoMo receiving number" />
              </label>
              <input
                type="tel"
                value={form.momo_phone}
                onChange={e => setForm(f => ({ ...f, momo_phone: e.target.value }))}
                placeholder="0788123456"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                <TranslatedText text="Tenant subscription payments are sent to this Ishema-registered number." />
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                <TranslatedText text="Provider" />
              </label>
              <select
                value={form.momo_provider}
                onChange={e => setForm(f => ({ ...f, momo_provider: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="MTN">MTN MoMo</option>
                <option value="Airtel">Airtel Money</option>
              </select>
            </div>
          </div>
        )}

        {form.payment_method === 'bank_transfer' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                <TranslatedText text="Account holder" />
              </label>
              <input
                type="text"
                value={form.account_holder}
                onChange={e => setForm(f => ({ ...f, account_holder: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <TranslatedText text="Bank name" />
              </label>
              <input
                type="text"
                value={form.bank_name}
                onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                <TranslatedText text="Account number" />
              </label>
              <input
                type="text"
                value={form.bank_account}
                onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-800 font-medium">
            <TranslatedText text="Active configuration is used when tenant admins purchase or renew subscriptions. Mobile money uses the Ishema API from your environment." />
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#2c5173] text-white rounded-lg font-bold text-sm hover:bg-[#1e3850] disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <TranslatedText text="Save payment configuration" />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPaymentConfig;
