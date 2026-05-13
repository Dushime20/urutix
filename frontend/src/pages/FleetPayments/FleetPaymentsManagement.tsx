import { useState } from 'react';
import { TrendingDown, AlertCircle, History, Wallet } from 'lucide-react';
import { cn } from '@/utils/cn';
import ReceivedPaymentsPage from './ReceivedPaymentsPage';
import FleetPendingPaymentsPage from './FleetPendingPaymentsPage';
import FleetTransactionHistoryPage from './FleetTransactionHistoryPage';
import DriverAdvanceRequestsPage from './DriverAdvanceRequestsPage';
import { useQuery } from '@tanstack/react-query';
import { fuelApi } from '../../services/fuelApi';

type SubTabType = 'received' | 'pending' | 'history' | 'advances';

const FleetPaymentsManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('received');

  const { data: advanceStats } = useQuery({
    queryKey: ['fleet-advance-stats'],
    queryFn: () => fuelApi.getAdvanceStats(),
    refetchInterval: 30000,
  });

  const pendingAdvanceCount = advanceStats?.pendingCount ?? 0;

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
    {
      id: 'advances' as SubTabType,
      label: 'Driver Advances',
      icon: Wallet,
      description: 'Advance requests from drivers',
      badge: pendingAdvanceCount > 0 ? pendingAdvanceCount : undefined,
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
                  "flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 relative",
                  isActive
                    ? "bg-white text-blue-600 shadow-md border border-slate-200"
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                {(tab as any).badge ? (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                    {(tab as any).badge}
                  </span>
                ) : null}
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
        {activeSubTab === 'advances' && <DriverAdvanceRequestsPage />}
      </div>
    </div>
  );
};

export default FleetPaymentsManagement;
