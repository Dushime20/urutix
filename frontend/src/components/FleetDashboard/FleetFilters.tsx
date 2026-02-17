import React from 'react';
import { Search, LayoutGrid, List, X } from 'lucide-react';
import { TranslatedText } from '../translated-text';
import { motion, AnimatePresence } from 'framer-motion';

interface FleetFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  activeTab: 'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'routes' | 'matches';
  viewMode?: 'grid' | 'list';
  setViewMode?: (mode: 'grid' | 'list') => void;
}

const FleetFiltersComp: React.FC<FleetFiltersProps> = ({
  search,
  setSearch,
  activeTab,
  viewMode,
  setViewMode
}) => {
  const showViewToggle = (activeTab === 'trucks' || activeTab === 'drivers') && viewMode && setViewMode;

  return (
    <div className="bg-white rounded-[40px] border border-slate-100 p-2 shadow-sm mb-8 flex flex-col md:flex-row gap-2">
      {/* Search Input Vector */}
      <div className="flex-1 relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 size-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
        <input
          type="text"
          placeholder={activeTab === 'trucks' ? 'Search assets...' : activeTab === 'drivers' ? 'Search personnel...' : `Search ${activeTab} records...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-50 rounded-[32px] text-[11px] font-black uppercase tracking-widest text-slate-900 focus:bg-white focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 size-8 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-300 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* View Matrix Toggle */}
      {showViewToggle && (
        <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-[32px]">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-6 py-3 rounded-[28px] transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${viewMode === 'grid'
                ? 'bg-white shadow-xl shadow-slate-200 text-indigo-600'
                : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <LayoutGrid size={14} />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-6 py-3 rounded-[28px] transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${viewMode === 'list'
                ? 'bg-white shadow-xl shadow-slate-200 text-indigo-600'
                : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            <List size={14} />
            <span>List</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const FleetFilters = React.memo(FleetFiltersComp);