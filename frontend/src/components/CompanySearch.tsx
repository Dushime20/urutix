import React, { useState, useEffect, useRef } from "react";
import { Search, Building2, MapPin, Globe, X } from "lucide-react";
import { tenantAPI } from "../services/api";
import type { Tenant } from "../types/tenant";

interface CompanySearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (tenant: Tenant) => void;
  error?: string;
  placeholder?: string;
}

const CompanySearch: React.FC<CompanySearchProps> = ({
  value,
  onChange,
  onSelect,
  error,
  placeholder = "Search for your company...",
}) => {
  const [searchTerm, setSearchTerm] = useState(value);
  const [results, setResults] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        performSearch(searchTerm);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = async (query: string) => {
    try {
      setIsLoading(true);
      const response = await tenantAPI.searchTenants({ q: query });

      if (response.data.success) {
        setResults(response.data.data.results);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error searching tenants:", error);
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);

    if (!newValue) {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSelectTenant = (tenant: Tenant) => {
    setSearchTerm(tenant.name);
    onChange(tenant.name);
    onSelect(tenant);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    onChange("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 ${
            error ? "border-red-500" : ""
          }`}
          placeholder={placeholder}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* Error message */}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* Dropdown results */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {results.map((tenant) => (
            <button
              key={tenant.id}
              type="button"
              onClick={() => handleSelectTenant(tenant)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-center space-x-3"
            >
              <div className="flex-shrink-0">
                {tenant.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt={tenant.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {tenant.name}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {tenant.city && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{tenant.city}</span>
                    </div>
                  )}
                  {tenant.country && (
                    <div className="flex items-center space-x-1">
                      <Globe className="h-3 w-3" />
                      <span>{tenant.country}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen &&
        !isLoading &&
        results.length === 0 &&
        searchTerm.trim().length >= 2 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
            <div className="text-center text-gray-500">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No companies found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          </div>
        )}
    </div>
  );
};

export default CompanySearch;
