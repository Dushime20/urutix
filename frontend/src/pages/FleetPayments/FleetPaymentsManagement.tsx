import { useState } from 'react';
import { TrendingDown, AlertCircle, History } from 'lucide-react';
import { cn } from '@/utils/cn';
import ReceivedPaymentsPage from './ReceivedPaymentsPage';
import FleetPendingPaymentsPage from './FleetPendingPaymentsPage';
import FleetTransactionHistoryPage from './FleetTransactionHistoryPage';

type SubTabType = 'received' | 'pending' | 'history';

const FleetPaymentsManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('received');

  const subTabs = [
    {
      id: 'received' as SubTabType,
      label: 'Received Payments',
      icon: TrendingDown,
      description: 'Payments from bidding and cargo shipments',
    },
    {
      id: 'pending' as SubTabType,
      label: 'Pending Payments',
      icon: AlertCircle,
      description: 'Payments you need to make',
    },
    {
      id: 'history' as SubTabType,
      label: 'Transaction History',
      icon: History,
      description: 'Completed transactions',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-1.5 shadow-inner">
        <nav className="flex items-center gap-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300",
                  isActive
                    ? "bg-white text-blue-600 shadow-md border border-slate-200"
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sub-Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeSubTab === 'received' && <ReceivedPaymentsPage />}
        {activeSubTab === 'pending' && <FleetPendingPaymentsPage />}
        {activeSubTab === 'history' && <FleetTransactionHistoryPage />}
      </div>
    </div>
  );
};

export default FleetPaymentsManagement;
