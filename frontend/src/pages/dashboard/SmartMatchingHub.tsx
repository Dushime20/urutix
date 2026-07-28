import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Target, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import CargoSmartMatching from './CargoSmartMatching';
import AcceptedMatches from './AcceptedMatches';

type HubTab = 'smart-matching' | 'accepted-matches';

const SmartMatchingHub: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo<HubTab>(() => {
    if (location.pathname.includes('/accepted-matches')) return 'accepted-matches';
    const qp = new URLSearchParams(location.search).get('tab');
    if (qp === 'accepted-matches') return 'accepted-matches';
    return 'smart-matching';
  }, [location.pathname, location.search]);

  const switchTab = (tab: HubTab) => {
    navigate(tab === 'smart-matching' ? '/dashboard/smart-matching' : '/dashboard/accepted-matches');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => switchTab('smart-matching')}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2',
              activeTab === 'smart-matching'
                ? 'bg-[#345E85] text-white'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            )}
          >
            <Target className="w-4 h-4" />
            Smart Matching
          </button>
          <button
            onClick={() => switchTab('accepted-matches')}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2',
              activeTab === 'accepted-matches'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            Accepted Matches
          </button>
        </div>
      </div>

      {activeTab === 'smart-matching' ? <CargoSmartMatching /> : <AcceptedMatches />}
    </div>
  );
};

export default SmartMatchingHub;
