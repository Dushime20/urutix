import React from 'react';
import { FaSearch, FaMapMarkerAlt } from 'react-icons/fa';
import { LayoutGrid, List } from 'lucide-react';
import { TranslatedText } from '../translated-text';
import type { FleetFilters as FleetFiltersType } from '../../types/fleet';

interface FleetFiltersProps {
  filters: FleetFiltersType;
  setFilters: (filters: FleetFiltersType) => void;
  search: string;
  setSearch: (search: string) => void;
  activeTab: 'trucks' | 'drivers' | 'analytics' | 'safety' | 'financial' | 'routes';
  viewMode?: 'grid' | 'list';
  setViewMode?: (mode: 'grid' | 'list') => void;
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
  activeTab,
  viewMode,
  setViewMode
}) => {
  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: FLEET_STATUS.AVAILABLE, label: 'Available' },
    { value: FLEET_STATUS.IN_TRANSIT, label: 'In Transit' },
    { value: FLEET_STATUS.MAINTENANCE, label: 'Maintenance' },
    { value: FLEET_STATUS.OUT_OF_SERVICE, label: 'Out of Service' }
  ];

  // Translate status labels (simplified - just return the label)
  const getTranslatedLabel = (label: string) => label;

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

  const showViewToggle = (activeTab === 'trucks' || activeTab === 'drivers') && viewMode && setViewMode;

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

        {/* View Toggle - Only show for trucks and drivers */}
        {showViewToggle && (
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded transition-all flex items-center gap-1.5 text-sm font-medium ${viewMode === 'grid' ? 'bg-white shadow text-[#345e85]' : 'text-gray-600 hover:text-gray-900'}`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded transition-all flex items-center gap-1.5 text-sm font-medium ${viewMode === 'list' ? 'bg-white shadow text-[#345e85]' : 'text-gray-600 hover:text-gray-900'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        )}
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