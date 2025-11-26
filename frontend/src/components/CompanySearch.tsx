import React, { useState, useEffect, useRef, useMemo } from "react";
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
  const [allTenants, setAllTenants] = useState<Tenant[]>([]); // Store all tenants
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const hasLoadedAllTenants = useRef(false); // Track if we've loaded all tenants

  // Debug: Log state changes
  useEffect(() => {
    console.log("🔍 CompanySearch State Update:");
    console.log("  - allTenants.length:", allTenants.length);
    console.log("  - results.length:", results.length);
    console.log("  - isOpen:", isOpen);
    console.log("  - isLoading:", isLoading);
    console.log("  - searchTerm:", searchTerm);
    console.log("  - hasLoadedAllTenants:", hasLoadedAllTenants.current);
  }, [allTenants, results, isOpen, isLoading, searchTerm]);

  // Load all tenants when component mounts or when input is focused
  const loadAllTenants = async () => {
    if (hasLoadedAllTenants.current) {
      console.log("⏭️ Tenants already loaded, skipping...");
      return; // Don't reload if already loaded
    }
    
    try {
      setIsLoading(true);
      console.log("🔍 Loading all tenants...");
      console.log("📡 Making API call to /tenants/search with empty query");
      
      const response = await tenantAPI.searchTenants({}); // Empty query to get all
      
      console.log("📦 Full API Response:", response);
      console.log("📦 Response.data:", response.data);
      console.log("📦 Response.data.success:", response.data?.success);
      console.log("📦 Response.data.data:", response.data?.data);
      console.log("📦 Response.data.data.results:", response.data?.data?.results);
      console.log("📦 Response.data.data.results length:", response.data?.data?.results?.length);

      // Try multiple response structures
      let tenants: Tenant[] = [];
      
      if (response.data?.success && response.data?.data?.results) {
        tenants = response.data.data.results;
        console.log("✅ Found tenants in response.data.data.results:", tenants.length);
      } else if (response.data?.data?.results) {
        tenants = response.data.data.results;
        console.log("✅ Found tenants in response.data.data.results (no success flag):", tenants.length);
      } else if (response.data?.results) {
        tenants = response.data.results;
        console.log("✅ Found tenants in response.data.results:", tenants.length);
      } else if (Array.isArray(response.data)) {
        tenants = response.data;
        console.log("✅ Found tenants as direct array:", tenants.length);
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        tenants = response.data.data;
        console.log("✅ Found tenants in response.data.data (array):", tenants.length);
      } else {
        console.warn("⚠️ No tenants found in any expected location");
        console.warn("⚠️ Response structure:", JSON.stringify(response, null, 2));
      }

      if (tenants.length > 0) {
        // Filter to only show ACTIVE tenants (safety check - backend should already filter)
        // Backend filters by: status = 'ACTIVE' AND isActive = true
        // Frontend double-checks to ensure all displayed tenants are ACTIVE
        // Handle case-insensitive matching in case of data inconsistencies
        // Include tenants with ACTIVE status even if isActive flag is false (for backward compatibility)
        const activeTenants = tenants.filter((tenant) => {
          // Check status is ACTIVE (case-insensitive to handle 'ACTIVE', 'active', 'Active')
          const statusUpper = (tenant.status || '').toUpperCase();
          const isActiveStatus = statusUpper === 'ACTIVE';
          // If status is ACTIVE, include it even if isActive is false (some tenants may have been manually updated)
          // This ensures all ACTIVE tenants appear in the signup dropdown
          if (isActiveStatus) {
            return true; // Include all ACTIVE tenants regardless of isActive flag
          }
          return false;
        });
        
        console.log("✅ Total tenants fetched from API:", tenants.length);
        console.log("✅ Active tenants after filtering:", activeTenants.length);
        console.log("✅ Tenant statuses (all fetched):", tenants.map(t => ({ 
          name: t.name, 
          status: t.status, 
          isActive: t.isActive 
        })));
        console.log("✅ Tenant statuses (active only):", activeTenants.map(t => ({ 
          name: t.name, 
          status: t.status, 
          isActive: t.isActive 
        })));
        
        if (activeTenants.length === 0 && tenants.length > 0) {
          console.warn("⚠️ WARNING: Backend returned tenants but none are ACTIVE!");
          console.warn("⚠️ This should not happen - backend should filter for ACTIVE tenants only");
          console.warn("⚠️ All tenant statuses:", tenants.map(t => ({ 
            name: t.name, 
            status: t.status, 
            isActive: t.isActive 
          })));
        }
        
        setAllTenants(activeTenants);
        hasLoadedAllTenants.current = true;
        setIsOpen(true); // Open dropdown when tenants are loaded
      } else {
        console.warn("⚠️ No tenants in array, length is 0");
        console.warn("⚠️ Response structure was:", JSON.stringify(response, null, 2));
        setAllTenants([]);
      }
    } catch (error: any) {
      console.error("❌ Error loading all tenants:", error);
      console.error("❌ Error message:", error?.message);
      console.error("❌ Error response:", error?.response);
      console.error("❌ Error response data:", error?.response?.data);
      console.error("❌ Error response status:", error?.response?.status);
      setAllTenants([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tenants based on search term
  const filteredTenants = useMemo(() => {
    console.log("🔍 Filtering tenants. allTenants.length:", allTenants.length, "searchTerm:", searchTerm);
    
    if (!searchTerm.trim()) {
      console.log("✅ No search term, returning all tenants:", allTenants.length);
      return allTenants; // Show all if no search term
    }
    const searchLower = searchTerm.toLowerCase();
    const filtered = allTenants.filter(
      (tenant) =>
        tenant.name?.toLowerCase().includes(searchLower) ||
        tenant.city?.toLowerCase().includes(searchLower) ||
        tenant.country?.toLowerCase().includes(searchLower)
    );
    console.log("✅ Filtered tenants:", filtered.length);
    return filtered;
  }, [allTenants, searchTerm]);

  // Update results when filtered tenants change
  useEffect(() => {
    console.log("🔄 Updating results. filteredTenants.length:", filteredTenants.length, "isOpen:", isOpen);
    setResults(filteredTenants);
    if (filteredTenants.length > 0) {
      setIsOpen(true);
      console.log("✅ Opening dropdown with", filteredTenants.length, "tenants");
    }
  }, [filteredTenants, isOpen]);

  // Debounced search - also search when input is focused with 1+ characters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 1) {
        // Results are already filtered by filteredTenants, no need to call API
        setIsOpen(true);
      } else {
        // Show all tenants when search is cleared
        setResults(allTenants);
        setIsOpen(true);
      }
    }, 100); // Reduced debounce for better UX

    return () => clearTimeout(timeoutId);
  }, [searchTerm, allTenants]);

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

  // This function is no longer needed since we filter client-side
  // Keeping for backward compatibility but it's not used
  const performSearch = async (query: string) => {
    // Results are now filtered client-side from allTenants
    // This function is kept for compatibility but filtering happens in filteredTenants
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
          onFocus={async () => {
            console.log("👆 Input focused, hasLoadedAllTenants:", hasLoadedAllTenants.current);
            console.log("👆 allTenants.length:", allTenants.length);
            // Load all tenants if not already loaded
            if (!hasLoadedAllTenants.current) {
              console.log("👆 Loading tenants on focus...");
              await loadAllTenants();
            } else {
              console.log("👆 Tenants already loaded, showing dropdown");
            }
            // Show dropdown with all tenants or filtered results
            if (allTenants.length > 0 || results.length > 0) {
              setIsOpen(true);
              console.log("👆 Opening dropdown with", allTenants.length, "tenants");
            }
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
        allTenants.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
            <div className="text-center text-gray-500">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No companies available</p>
              <p className="text-xs mt-1">Please contact support if you need to add a company</p>
              <p className="text-xs mt-1 text-red-500">
                Debug: allTenants={allTenants.length}, results={results.length}, isLoading={isLoading.toString()}
              </p>
            </div>
          </div>
        )}
      
      {/* No search results message */}
      {isOpen &&
        !isLoading &&
        results.length === 0 &&
        allTenants.length > 0 &&
        searchTerm.trim().length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
            <div className="text-center text-gray-500">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No companies found matching "{searchTerm}"</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          </div>
        )}
    </div>
  );
};

export default CompanySearch;
