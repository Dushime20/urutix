import React, { useMemo } from 'react';
import { useSearchParams, Navigate, useLocation } from 'react-router-dom';
import {
  FileCheck, FileText, Tags, CreditCard, Wallet,
} from 'lucide-react';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';
import TenantSubscriptions from './TenantSubscriptions';
import SubscriptionPlansMgmt from './SubscriptionPlansMgmt';
import CreditPricingRules from './CreditPricingRules';
import CreditUsageHistory from './CreditUsageHistory';
import SubscriptionPaymentConfig from './SubscriptionPaymentConfig';

export type SubscriptionTab =
  | 'subscriptions'
  | 'plans'
  | 'pricing-rules'
  | 'credit-usage'
  | 'payment-methods';

const TABS: { id: SubscriptionTab; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
  { id: 'subscriptions', label: 'Subscriptions', icon: FileCheck },
  { id: 'plans', label: 'Subscription Plans', icon: FileText },
  { id: 'pricing-rules', label: 'Pricing Rules', icon: Tags },
  { id: 'credit-usage', label: 'Credit Usage', icon: CreditCard },
  { id: 'payment-methods', label: 'Payment Methods', icon: Wallet },
];

const SubscriptionManagement: React.FC = () => {
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin-tenant')
    ? '/admin-tenant/subscriptions'
    : '/admin/subscriptions';
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as SubscriptionTab) || 'subscriptions';

  const setTab = (tab: SubscriptionTab) => {
    setSearchParams({ tab }, { replace: true });
  };

  const panel = useMemo(() => {
    switch (activeTab) {
      case 'plans':
        return <SubscriptionPlansMgmt embedded />;
      case 'pricing-rules':
        return <CreditPricingRules embedded />;
      case 'credit-usage':
        return <CreditUsageHistory embedded />;
      case 'payment-methods':
        return <SubscriptionPaymentConfig />;
      case 'subscriptions':
      default:
        return <TenantSubscriptions embedded />;
    }
  }, [activeTab]);

  if (!TABS.some(t => t.id === activeTab)) {
    return <Navigate to={`${basePath}?tab=subscriptions`} replace />;
  }

  return (
    <AdminPageLayout>
      <div className="space-y-6">
        <nav className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-1">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider transition-all border-b-2 -mb-px ${
                  isActive
                    ? 'border-primary-600 text-primary-600 bg-primary-50/80 dark:bg-primary-950/30'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={16} />
                <TranslatedText text={tab.label} />
              </button>
            );
          })}
        </nav>

        <div>{panel}</div>
      </div>
    </AdminPageLayout>
  );
};

export default SubscriptionManagement;
