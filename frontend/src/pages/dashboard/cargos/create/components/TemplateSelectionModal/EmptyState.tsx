import React from "react";
import { FaSearch, FaFilter } from "react-icons/fa";

interface EmptyStateProps {
  searchTerm: string;
  selectedCategory: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ searchTerm, selectedCategory }) => {
  return (
    <div className="text-center py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="mb-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <FaSearch className="text-gray-400 w-6 h-6" />
            </div>
            <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
              <FaFilter className="text-teal-500 w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h3 className="text-sm font-medium text-gray-900 mb-1.5">
          No templates found
        </h3>
        
        <p className="text-gray-500 text-xs mb-4 leading-relaxed">
          {searchTerm 
            ? `We couldn't find any templates matching "${searchTerm}"`
            : `No templates available for the "${selectedCategory}" category`
          }
        </p>

        {/* Suggestions */}
        <div className="bg-teal-50 rounded-lg p-2.5 border border-teal-100">
          <h4 className="font-medium text-teal-900 mb-1.5 text-xs">Try these suggestions:</h4>
          <ul className="text-xs text-teal-800 space-y-1 text-left">
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-teal-400 rounded-full"></span>
              Check your spelling and try different keywords
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-teal-400 rounded-full"></span>
              Select "All Templates" to see everything available
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-teal-400 rounded-full"></span>
              Try broader search terms
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
