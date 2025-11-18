import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaSearch, FaChartBar, FaPlus, FaFilter, FaWarehouse, FaIndustry, FaBuilding, FaGlobe } from 'react-icons/fa';
import LocationIntelligence from './LocationIntelligence';
import { 
  getLocationStatistics, 
  getLocationCategories, 
  getPopularLocations,
  searchLocations,
  LocationSearchCriteria,
  LocationStatistics
} from '../../services/locationApi';

const LocationDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<LocationStatistics | null>(null);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [popularLocations, setPopularLocations] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [searchCriteria, setSearchCriteria] = useState<LocationSearchCriteria>({});
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [stats, cats, popular] = await Promise.all([
        getLocationStatistics(),
        getLocationCategories(),
        getPopularLocations(5)
      ]);
      
      setStatistics(stats);
      setCategories(cats);
      setPopularLocations(popular);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (criteria: LocationSearchCriteria) => {
    try {
      setLoading(true);
      const results = await searchLocations(criteria);
      setSearchResults(results);
      setSearchCriteria(criteria);
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'WAREHOUSE':
        return <FaWarehouse className="w-4 h-4 text-blue-500" />;
      case 'INDUSTRIAL':
        return <FaIndustry className="w-4 h-4 text-orange-500" />;
      case 'COMMERCIAL':
        return <FaBuilding className="w-4 h-4 text-green-500" />;
      default:
        return <FaMapMarkerAlt className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Location Intelligence Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and analyze location data with enhanced intelligence</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <FaSearch className="w-4 h-4" />
              <span>Search Locations</span>
            </button>
            <button className="btn btn-primary flex items-center space-x-2">
              <FaPlus className="w-4 h-4" />
              <span>Add Location</span>
            </button>
          </div>
        </div>

        {/* Key Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Locations</p>
                  <p className="text-2xl font-bold text-blue-900">{statistics.totalLocations}</p>
                </div>
                <FaGlobe className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Operational</p>
                  <p className="text-2xl font-bold text-green-900">{statistics.operationalLocations}</p>
                  <p className="text-xs text-green-600">
                    {((statistics.operationalLocations / statistics.totalLocations) * 100).toFixed(1)}%
                  </p>
                </div>
                <FaMapMarkerAlt className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Top Category</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {statistics.categories[0]?.category || 'N/A'}
                  </p>
                  <p className="text-xs text-purple-600">
                    {statistics.categories[0]?.count || 0} locations
                  </p>
                </div>
                <FaChartBar className="w-8 h-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Top City</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {statistics.topCities[0]?.city || 'N/A'}
                  </p>
                  <p className="text-xs text-orange-600">
                    {statistics.topCities[0]?.count || 0} locations
                  </p>
                </div>
                <FaBuilding className="w-8 h-8 text-orange-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Panel */}
      {showSearch && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Location Search</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter city name"
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, locationCategory: e.target.value }))}
              >
                <option value="">All Categories</option>
                <option value="WAREHOUSE">Warehouse</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="RESIDENTIAL">Residential</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, accessType: e.target.value }))}
              >
                <option value="">All Access Types</option>
                <option value="TRUCK_ACCESSIBLE">Truck Accessible</option>
                <option value="FORKLIFT_REQUIRED">Forklift Required</option>
                <option value="CRANE_REQUIRED">Crane Required</option>
                <option value="DOCKS_AVAILABLE">Docks Available</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSearch(searchCriteria)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <FaSearch className="w-4 h-4" />
              <span>Search</span>
            </button>
            <button
              onClick={() => {
                setSearchCriteria({});
                setSearchResults([]);
              }}
              className="btn btn-secondary"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results ({searchResults.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((location) => (
              <div
                key={location.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedLocation(location)}
              >
                <div className="flex items-center space-x-3 mb-3">
                  {getCategoryIcon(location.locationCategory)}
                  <div>
                    <h4 className="font-medium text-gray-900">{location.name}</h4>
                    <p className="text-sm text-gray-600">{location.city}, {location.state}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Category</span>
                    <span className="text-xs font-medium text-gray-900">{location.locationCategory}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Access</span>
                    <span className="text-xs font-medium text-gray-900">{location.accessType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Docks</span>
                    <span className="text-xs font-medium text-gray-900">{location.loadingDockCount || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Categories</h3>
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(category.category)}
                  <span className="text-gray-700">{category.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(category.count / (statistics?.totalLocations || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{category.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Locations</h3>
          <div className="space-y-3">
            {popularLocations.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setSelectedLocation(location)}
              >
                <div className="flex items-center space-x-3">
                  {getCategoryIcon(location.locationCategory)}
                  <div>
                    <h4 className="font-medium text-gray-900">{location.name}</h4>
                    <p className="text-sm text-gray-600">{location.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{location.locationCategory}</p>
                  <p className="text-xs text-gray-500">{location.accessType}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Location Intelligence */}
      {selectedLocation && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Location Intelligence</h3>
            <button
              onClick={() => setSelectedLocation(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          </div>
          <LocationIntelligence locationData={selectedLocation} />
        </div>
      )}
    </div>
  );
};

export default LocationDashboard; 