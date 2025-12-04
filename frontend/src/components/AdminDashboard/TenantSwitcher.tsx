import React, { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTenants } from '../../services/adminApi';

interface Tenant {
  id: string;
  name: string;
  status?: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  description?: string;
}

interface TenantSwitcherProps {
  onTenantChange?: (tenantId: string, tenant: Tenant | null) => void;
  showSearch?: boolean;
  showStatus?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const TenantSwitcher: React.FC<TenantSwitcherProps> = ({
  onTenantChange,
  showSearch = true,
  showStatus = true,
  className = '',
  placeholder = 'Select Tenant',
  disabled = false,
}) => {
  const [selected, setSelected] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const { data, isLoading, error, refetch } = useQuery({ 
    queryKey: ['tenants'], 
    queryFn: fetchTenants,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const tenants = useMemo(() => {
    if (!data?.tenants || !Array.isArray(data.tenants)) {
      return [];
    }
    
    return data.tenants
      .filter((t: any) => t && typeof t === 'object')
      .map((t: any) => ({
        id: t.id || String(t),
        name: t.name || t.displayName || t.companyName || String(t),
        status: t.status || 'active',
        createdAt: t.createdAt,
        description: t.description || t.companyDescription,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const filteredTenants = useMemo(() => {
    if (!searchTerm.trim()) return tenants;
    
    return tenants.filter(tenant =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tenants, searchTerm]);

  const selectedTenant = useMemo(() => {
    return tenants.find(t => t.id === selected) || null;
  }, [tenants, selected]);

  const handleTenantChange = useCallback((tenantId: string) => {
    setSelected(tenantId);
    setIsOpen(false);
    setSearchTerm('');
    
    const tenant = tenants.find(t => t.id === tenantId) || null;
    onTenantChange?.(tenantId, tenant);
  }, [tenants, onTenantChange]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '●';
      case 'inactive': return '○';
      case 'suspended': return '⚠';
      default: return '○';
    }
  };

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="font-semibold text-gray-700">Tenant:</span>
        <div className="flex items-center gap-2">
          <span className="text-red-600 text-sm">Failed to load tenants</span>
          <button
            onClick={handleRefresh}
            className="p-1 text-red-600 hover:text-red-800 transition-colors"
            title="Retry loading tenants"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-700">Tenant:</span>
        
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled || isLoading}
            className={`
              relative w-64 px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:border-gray-400 transition-colors
              ${selectedTenant ? 'text-gray-900' : 'text-gray-500'}
            `}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span>Loading tenants...</span>
              </div>
            ) : selectedTenant ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="truncate">{selectedTenant.name}</span>
                  {showStatus && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTenant.status || 'active')}`}>
                      <span className="mr-1">{getStatusIcon(selectedTenant.status || 'active')}</span>
                      {selectedTenant.status || 'active'}
                    </span>
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span>{placeholder}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              {/* Search Input */}
              {showSearch && (
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search tenants..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                    <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Tenant List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredTenants.length === 0 ? (
                  <div className="px-3 py-4 text-center text-gray-500">
                    {searchTerm ? 'No tenants found matching your search.' : 'No tenants available.'}
                  </div>
                ) : (
                  filteredTenants.map((tenant) => (
                    <button
                      key={tenant.id}
                      type="button"
                      onClick={() => handleTenantChange(tenant.id)}
                      className={`
                        w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                        ${selected === tenant.id ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{tenant.name}</span>
                            {showStatus && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tenant.status || 'active')}`}>
                                <span className="mr-1">{getStatusIcon(tenant.status || 'active')}</span>
                                {tenant.status || 'active'}
                              </span>
                            )}
                          </div>
                          {tenant.description && (
                            <p className="text-sm text-gray-500 truncate mt-1">{tenant.description}</p>
                          )}
                        </div>
                        {selected === tenant.id && (
                          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{filteredTenants.length} tenant{filteredTenants.length !== 1 ? 's' : ''}</span>
                  <button
                    onClick={handleRefresh}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TenantSwitcher;
