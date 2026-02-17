import React from "react";
import { FaSearch, FaFilter } from "react-icons/fa";

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
  categories: Category[];
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
}) => {
  return (
    <div className="mb-3">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates by name or description..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Category Filter */}
      </div>

      {/* Category Buttons */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center gap-1.5">
          <FaFilter className="text-gray-500 w-3.5 h-3.5" />
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
            Filter by:
          </span>
        </div>
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex items-center px-4 py-2 rounded-xl border transition-all duration-200 whitespace-nowrap text-xs font-black uppercase tracking-wider ${isActive
                  ? "border-[#345E85] bg-[#345E85] text-white shadow-lg shadow-blue-900/10"
                  : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100"
                }`}
            >
              <Icon className="w-3.5 h-3.5 mr-2" />
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SearchAndFilter;
