import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Plus, FileText, 
  BarChart3, Activity, CreditCard,
  CheckCircle2, Clock, Box, DollarSign
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Suspense, lazy } from 'react';

// Lazy load the inner management component
const TruckOwnerFinancialManagement = lazy(() => import('./TruckOwnerFinancialManagement'));

type TabType = 'payments' | 'expenses' | 'loans';

export const FinancialManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('payments');

  const SummaryCard = ({ title, value, icon: Icon }: { title: string; value: string; icon: any }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex flex-col items-center group cursor-pointer"
    >
      <div className="relative size-36 lg:size-40 bg-white border-[6px] border-slate-50 rounded-full flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50">
        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
          <circle
            cx="50%"
            cy="50%"
            r="46%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="414"
            strokeDashoffset="300"
            className="text-blue-400 opacity-10 transition-all duration-1000 group-hover:opacity-30"
          />
        </svg>

        <div className="p-2 rounded-xl mb-1 bg-slate-50 text-blue-600 group-hover:bg-white group-hover:text-blue-600 transition-all duration-500 shadow-sm">
          <Icon size={14} />
        </div>
        <p className="text-xl lg:text-2xl font-black text-[#0f172a] tracking-tighter group-hover:scale-110 transition-transform duration-500 text-center leading-none">
          {value}
        </p>
      </div>
      <p className="mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-blue-600 group-hover:text-[#345E85] transition-colors text-center px-2">
        {title}
      </p>
    </motion.div>
  );

  return (
    <div className="space-y-12 pb-12">
      {/* Search and Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="flex flex-col">
          <h2 className="text-3xl font-black text-[#0f172a] tracking-tight uppercase">Unified Financial <span className="text-[#345E85]">Hub</span></h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time across-fleet liquidity management</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-[#345E85] transition-colors" />
            <input 
              type="text"
              placeholder="GLOBAL SEARCH..."
              className="bg-white border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all w-64 lg:w-80"
            />
          </div>
          <button className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Summary Matrix - NEW CIRCULAR DESIGN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8 bg-slate-50/30 rounded-[3rem] border border-slate-100/50 place-items-center">
        <SummaryCard 
          title="Revenue Pipeline" 
          value="$125,000" 
          icon={FileText} 
        />
        <SummaryCard 
          title="Burn Analytics" 
          value="$42,500" 
          icon={BarChart3} 
        />
        <SummaryCard 
          title="Health Index" 
          value="98.2%" 
          icon={Activity} 
        />
        <SummaryCard 
          title="Capital Reserve" 
          value="$82,500" 
          icon={CreditCard} 
        />
      </div>

      {/* Management Tabs */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-2 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2">
          {(['payments', 'expenses', 'loans'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                activeTab === tab 
                  ? "bg-[#345E85] text-white shadow-xl shadow-blue-900/10" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-8 p-6 lg:p-10 border-t border-slate-50">
          <Suspense fallback={<div className="flex items-center justify-center py-20 animate-pulse text-slate-300">Synchronizing...</div>}>
            {activeTab === 'payments' && <TruckOwnerFinancialManagement />}
            {activeTab !== 'payments' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                  <Activity className="w-10 h-10 text-slate-200 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tight mb-2">Interface Syncing</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">
                  We are currently optimizing the {activeTab} module for the new fleet architecture.
                </p>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default FinancialManagement;