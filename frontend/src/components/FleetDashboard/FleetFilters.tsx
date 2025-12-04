import React from 'react';
import { FaSearch, FaFilter, FaMapMarkerAlt } from 'react-icons/fa';
import type { FleetFilters as FleetFiltersType } from '../../types/fleet';

interface FleetFiltersProps {
  filters: FleetFiltersType;
  setFilters: (filters: FleetFiltersType) => void;
  search: string;
  setSearch: (search: string) => void;
  activeTab: 'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'routes';
}

// Local status constants to match backend enum values
const FLEET_STATUS = {
  AVAILABLE: 'AVAILABLE',
  IN_TRANSIT: 'IN_TRANSIT',
  MAINTENANCE: 'MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE'
} as const;

const FleetFiltersComp: React.FC<FleetFiltersProps> = ({
  filters,
  setFilters,
  search,
  setSearch,
  activeTab
}) => {
  // Debug logging
  console.log('FleetFilters component rendering');
  
  const { tSync } = useTranslation();
  
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: FLEET_STATUS.AVAILABLE, label: 'Available' },
    { value: FLEET_STATUS.IN_TRANSIT, label: 'In Transit' },
    { value: FLEET_STATUS.MAINTENANCE, label: 'Maintenance' },
    { value: FLEET_STATUS.OUT_OF_SERVICE, label: 'Out of Service' }
  ];
  
  // Translate status labels
  const getTranslatedLabel = (label: string) => tSync(label);

  const handleStatusChange = (status: string) => {
    setFilters({
      ...filters,
      status: status ? (status as FleetFiltersType['status']) : undefined
    });
  };

  const handleLocationChange = (location: string) => {
    setFilters({
      ...filters,
      location: location || undefined
    });
  };

  const clearFilters = () => {
    setFilters({});
    setSearch('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={activeTab === 'trucks' ? 'Search trucks...' : activeTab === 'drivers' ? 'Search drivers...' : `Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="lg:w-48">
          <select
            value={filters.status || ''}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {getTranslatedLabel(option.label)}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div className="lg:w-48">
          <div className="relative">
            <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter by location..."
              value={filters.location || ''}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={clearFilters}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
        >
          <FaFilter className="w-4 h-4" />
          <TranslatedText text="Clear Filters" />
        </button>
      </div>

      {/* Active Filters Display */}
      {(filters.status || filters.location || search) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {search && (
            <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm flex items-center gap-1">
              <TranslatedText text="Search" />: {search}
              <button
                onClick={() => setSearch('')}
                className="ml-1 hover:text-primary-600"
              >
                ×
              </button>
            </span>
          )}
          {filters.status && (
            <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm flex items-center gap-1">
              <TranslatedText text="Status" />: {filters.status}
              <button
                onClick={() => handleStatusChange('')}
                className="ml-1 hover:text-primary-600"
              >
                ×
              </button>
            </span>
          )}
          {filters.location && (
            <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm flex items-center gap-1">
              <TranslatedText text="Location" />: {filters.location}
              <button
                onClick={() => handleLocationChange('')}
                className="ml-1 hover:text-primary-600"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const FleetFilters = React.memo(FleetFiltersComp);