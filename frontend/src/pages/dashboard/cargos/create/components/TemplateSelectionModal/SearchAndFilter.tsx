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
            <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search templates by name or description..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md"
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
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex items-center px-2.5 py-1 rounded-lg border transition-all duration-200 whitespace-nowrap text-xs font-medium ${
                selectedCategory === category.id
                  ? "border-teal-500 bg-teal-500 text-white shadow-md transform scale-105"
                  : "border-gray-200 bg-white text-gray-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
              }`}
            >
              <Icon className="w-3 h-3 mr-1.5" />
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SearchAndFilter;
