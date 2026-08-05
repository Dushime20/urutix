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
      <div className="relative size-36 lg:size-40 bg-white dark:bg-gray-900 border-[6px] border-gray-50 dark:border-gray-800 rounded-full flex flex-col items-center justify-center transition-all duration-500 hover:border-gray-100 dark:hover:border-gray-700">
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
            className="text-blue-400 dark:text-blue-500 opacity-10 transition-all duration-1000 group-hover:opacity-30"
          />
        </svg>

        <div className="p-2 rounded-xl mb-1 bg-gray-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 group-hover:bg-white dark:group-hover:bg-gray-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-500">
          <Icon size={14} />
        </div>
        <p className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white tracking-tighter group-hover:scale-110 transition-transform duration-500 text-center leading-none">
          {value}
        </p>
      </div>
      <p className="mt-4 text-[8px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors text-center px-2">
        {title}
      </p>
    </motion.div>
  );

  return (
    <div className="space-y-12 pb-12">
      {/* Search and Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="flex flex-col">
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase transition-colors duration-200">Unified Financial <span className="text-blue-600 dark:text-blue-400">Hub</span></h2>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1 transition-colors duration-200">Real-time across-fleet liquidity management</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 w-4 h-4 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text"
              placeholder="GLOBAL SEARCH..."
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-[0.1em] text-gray-600 dark:text-gray-300 placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-950/20 focus:border-blue-200 dark:focus:border-blue-600 transition-all w-64 lg:w-80"
            />
          </div>
          <button className="bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-700 transition-all active:scale-95">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Summary Matrix - NEW CIRCULAR DESIGN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8 bg-gray-50/30 dark:bg-gray-800/30 rounded-lg border border-gray-100/50 dark:border-gray-700/50 place-items-center transition-colors duration-200">
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
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-2 overflow-hidden transition-colors duration-200">
        <div className="flex flex-wrap items-center gap-2">
          {(['payments', 'expenses', 'loans'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                activeTab === tab 
                  ? "bg-blue-600 dark:bg-blue-600 text-white" 
                  : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-8 p-6 lg:p-10 border-t border-gray-50 dark:border-gray-800 transition-colors duration-200">
          <Suspense fallback={<div className="flex items-center justify-center py-20 animate-pulse text-gray-300 dark:text-gray-600 transition-colors duration-200">Synchronizing...</div>}>
            {activeTab === 'payments' && <TruckOwnerFinancialManagement />}
            {activeTab !== 'payments' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6 transition-colors duration-200">
                  <Activity className="w-10 h-10 text-gray-200 dark:text-gray-700 animate-pulse transition-colors duration-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2 transition-colors duration-200">Interface Syncing</h3>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest max-w-xs mx-auto transition-colors duration-200">
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