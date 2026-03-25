import React from "react";
import { FaSearch, FaFilter } from "react-icons/fa";
import { cn } from "@/utils/cn";

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categories: (Category & { count: number })[];
  selectedUrgency: string;
  onUrgencyChange: (urgency: string) => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedUrgency,
  onUrgencyChange,
}) => {
  return (
    <div className="mb-6 space-y-4">
      {/* Prime Search Bar - Ultra Compact & Modern */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <FaSearch className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="SCAN_PROTOCOL: ASSET_NAME OR DESCRIPTOR..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full pl-11 pr-5 py-3.5 text-xs font-black bg-slate-50/50 border border-slate-100 rounded-2xl",
            "focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200",
            "transition-all duration-300 placeholder:text-slate-300 placeholder:font-black uppercase tracking-widest"
          )}
        />
      </div>

      {/* Categories Layer - Direct Access Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl w-max">
          <FaFilter className="w-2.5 h-2.5 text-blue-400" />
          <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">SCOPE_SELECTION</span>
        </div>

        {/* Visibility Optimized Grid */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:flex sm:flex-wrap items-center gap-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={cn(
                    "flex flex-1 sm:flex-none items-center justify-between sm:justify-start px-3 py-3 sm:px-4 sm:py-2.5 rounded-2xl border transition-all duration-300 active:scale-95 group min-w-0",
                    isActive
                      ? "border-[#345E85] bg-[#345E85] text-white shadow-xl shadow-blue-900/20"
                      : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                  )}
                >
                  <div className="flex items-center truncate mr-2">
                    <Icon className={cn("w-3.5 h-3.5 mr-2 shrink-0", isActive ? "text-white" : "text-slate-400")} />
                    <span className="text-[9px] font-black uppercase tracking-widest truncate">
                      {category.name}
                    </span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded-lg shrink-0",
                    isActive ? "bg-white/20" : "bg-slate-50 border border-slate-100"
                  )}>
                    {category.count}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Urgency Filter Row - Drive Priority */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 border border-blue-500 rounded-xl w-max">
          <span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">DRIVE_PRIORITY</span>
        </div>
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2">
          {['ALL', 'CRITICAL', 'HIGH', 'NORMAL', 'LOW'].map((urgency) => (
             <button
               key={urgency}
               onClick={() => onUrgencyChange(urgency)}
               className={cn(
                 "px-3 py-3 sm:px-5 sm:py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 text-center flex-1",
                 selectedUrgency === urgency
                   ? "bg-[#345E85] border-[#345E85] text-white shadow-xl shadow-blue-900/10"
                   : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
               )}
             >
               {urgency}
             </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilter;
