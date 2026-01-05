import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { brokerAPI } from '../../services/brokerApi';
import { 
  Package, 
  Search, 
  MapPin, 
  DollarSign, 
  Calendar,
  Filter,
  ArrowRight,
  Loader2,
  Eye,
  Grid3x3,
  List,
  Map as MapIcon,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Bookmark,
  Clock,
  Weight,
  Truck,
  Zap,
  Star,
  AlertCircle
} from 'lucide-react';

interface Load {
  id: string;
  title: string;
  description?: string;
  loadValue: number;
  currencyCode: string;
  weight?: number;
  cargoType?: string;
  status: string;
  pickupLocation?: any;
  deliveryLocation?: any;
  pickupDate?: string;
  deliveryDate?: string;
  createdAt: string;
}

type ViewMode = 'list' | 'card' | 'map';
type SortBy = 'newest' | 'value-high' | 'value-low' | 'urgent' | 'recommended';

const CargoDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [sortBy, setSortBy] = useState<SortBy>('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'PUBLISHED',
    minValue: '',
    maxValue: '',
    cargoType: '',
    equipmentType: '',
    urgency: '',
    route: searchParams.get('route') || '',
  });

  useEffect(() => {
    loadAvailableLoads();
  }, [filters]);

  const loadAvailableLoads = async () => {
    try {
      setLoading(true);
      const params: any = {
        status: filters.status,
        page: 1,
        limit: 20,
      };

      if (filters.minValue) params.minLoadValue = filters.minValue;
      if (filters.maxValue) params.maxLoadValue = filters.maxValue;
      if (filters.cargoType) params.cargoType = filters.cargoType;
      if (searchTerm) params.search = searchTerm;

      const response = await brokerAPI.getAvailableLoads(params);
      // Handle different response structures
      const responseData = response.data || response || {};
      const loadsData = responseData.items || responseData || [];
      setLoads(Array.isArray(loadsData) ? loadsData : []);
    } catch (err: any) {
      console.error('Failed to load loads:', err);
      setLoads([]); // Ensure loads is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAvailableLoads();
  };

  const handleProposeMatch = (loadId: string) => {
    navigate(`/dashboard/broker/deals?loadId=${loadId}`);
  };

  const handleFindTransporters = (loadId: string) => {
    navigate(`/dashboard/broker/smart-matching?loadId=${loadId}`);
  };

  const getSortedLoads = () => {
    const sorted = [...loads];
    
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'value-high':
        sorted.sort((a, b) => b.loadValue - a.loadValue);
        break;
      case 'value-low':
        sorted.sort((a, b) => a.loadValue - b.loadValue);
        break;
      case 'urgent':
        sorted.sort((a, b) => {
          const dateA = a.pickupDate ? new Date(a.pickupDate).getTime() : Infinity;
          const dateB = b.pickupDate ? new Date(b.pickupDate).getTime() : Infinity;
          return dateA - dateB;
        });
        break;
      case 'recommended':
        // Smart sorting: high value + recent + good route
        sorted.sort((a, b) => {
          const scoreA = a.loadValue / 1000 + (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60);
          const scoreB = b.loadValue / 1000 + (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60);
          return scoreB - scoreA;
        });
        break;
    }
    
    return sorted;
  };

  const getRecommendedLoads = () => {
    // Return top 3 recommended loads
    return getSortedLoads().slice(0, 3);
  };

  const clearFilters = () => {
    setFilters({
      status: 'PUBLISHED',
      minValue: '',
      maxValue: '',
      cargoType: '',
      equipmentType: '',
      urgency: '',
      route: '',
    });
    setSearchTerm('');
  };

  const sortedLoads = getSortedLoads();
  const recommendedLoads = getRecommendedLoads();
  const hasActiveFilters = filters.minValue || filters.maxValue || filters.cargoType || filters.equipmentType || filters.urgency || filters.route || searchTerm;

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-orange-500 via-rose-600 to-violet-600 rounded-xl shadow-lg p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">🔍 Cargo Discovery</h1>
              <p className="text-orange-100 text-lg">
                Find profitable loads and connect them with reliable transporters
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <p className="text-sm text-orange-100 mb-1">Available Loads</p>
              <p className="text-4xl font-bold">{loads.length}</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      </div>

      {/* Smart Recommendations */}
      {!loading && recommendedLoads.length > 0 && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-violet-600 rounded-lg p-2">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">AI Recommended for You</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedLoads.map((load) => (
              <div
                key={load.id}
                className="bg-white rounded-lg p-4 border border-violet-200 hover:border-violet-400 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-violet-600" />
                  <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">{load.title}</h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    95%
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{load.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-violet-600">
                    {load.currencyCode} {load.loadValue.toLocaleString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFindTransporters(load.id);
                    }}
                    className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                  >
                    Match <Zap className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search, View Modes, and Sort */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title, location, cargo type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
              />
            </form>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-violet-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'card'
                  ? 'bg-white shadow-sm text-violet-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Card View"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'map'
                  ? 'bg-white shadow-sm text-violet-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Map View"
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white"
          >
            <option value="recommended">🌟 Recommended</option>
            <option value="newest">🆕 Newest First</option>
            <option value="value-high">💰 Highest Value</option>
            <option value="value-low">💵 Lowest Value</option>
            <option value="urgent">⚡ Most Urgent</option>
          </select>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              showFilters || hasActiveFilters
                ? 'bg-violet-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filters
            {hasActiveFilters && (
              <span className="bg-white text-violet-600 text-xs px-2 py-0.5 rounded-full font-bold">
                {[filters.minValue, filters.maxValue, filters.cargoType, filters.equipmentType, filters.urgency, filters.route, searchTerm].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Route Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Route
                </label>
                <input
                  type="text"
                  value={filters.route}
                  onChange={(e) => setFilters({ ...filters, route: e.target.value })}
                  placeholder="e.g., Nairobi-Mombasa"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              {/* Cargo Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 inline mr-1" />
                  Cargo Type
                </label>
                <select
                  value={filters.cargoType}
                  onChange={(e) => setFilters({ ...filters, cargoType: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="">All Types</option>
                  <option value="GENERAL">General Cargo</option>
                  <option value="FRAGILE">Fragile Items</option>
                  <option value="HAZARDOUS">Hazardous Materials</option>
                  <option value="REFRIGERATED">Refrigerated</option>
                  <option value="ELECTRONICS">Electronics</option>
                  <option value="FURNITURE">Furniture</option>
                </select>
              </div>

              {/* Equipment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Truck className="w-4 h-4 inline mr-1" />
                  Equipment Type
                </label>
                <select
                  value={filters.equipmentType}
                  onChange={(e) => setFilters({ ...filters, equipmentType: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="">Any Equipment</option>
                  <option value="DRY_VAN">Dry Van</option>
                  <option value="FLATBED">Flatbed</option>
                  <option value="REFRIGERATED">Refrigerated Truck</option>
                  <option value="CONTAINER">Container</option>
                  <option value="TANKER">Tanker</option>
                </select>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Urgency
                </label>
                <select
                  value={filters.urgency}
                  onChange={(e) => setFilters({ ...filters, urgency: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="">Any Time</option>
                  <option value="URGENT">🔴 Urgent (24-48hrs)</option>
                  <option value="SOON">🟡 Soon (3-7 days)</option>
                  <option value="FLEXIBLE">🟢 Flexible (7+ days)</option>
                </select>
              </div>

              {/* Min Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Min Value
                </label>
                <input
                  type="number"
                  value={filters.minValue}
                  onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
                  placeholder="$0"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              {/* Max Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Max Value
                </label>
                <input
                  type="number"
                  value={filters.maxValue}
                  onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
                  placeholder="$999,999"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              {/* Apply Button - spans remaining columns */}
              <div className="md:col-span-2 lg:col-span-2 flex items-end">
                <button
                  onClick={handleSearch}
                  className="w-full px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Filter className="w-5 h-5" />
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count & Map View Placeholder */}
      {!loading && loads.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{sortedLoads.length}</span> available loads
            {hasActiveFilters && <span className="text-violet-600"> (filtered)</span>}
          </p>
        </div>
      )}

      {/* Loads Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-violet-600 mb-4" />
          <p className="text-gray-600">Finding available cargo...</p>
        </div>
      ) : loads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No cargo found</h3>
          <p className="text-gray-600 mb-6">
            {hasActiveFilters 
              ? 'Try adjusting your filters to see more results'
              : 'No available loads at the moment. Check back soon!'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'map' ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <MapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Map view coming soon!</p>
          <p className="text-sm text-gray-500">We're working on an interactive map to visualize load locations.</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedLoads.map((load) => (
            <div
              key={load.id}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-violet-400 hover:shadow-xl transition-all overflow-hidden group"
            >
              {/* Card Header with gradient */}
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 text-white">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg line-clamp-2 flex-1">{load.title}</h3>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/30 rounded-lg p-1.5">
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-xs rounded-full">
                    {load.status}
                  </span>
                  {load.cargoType && (
                    <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-xs rounded-full">
                      {load.cargoType}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                {load.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{load.description}</p>
                )}

                {/* Route */}
                {load.pickupLocation && load.deliveryLocation && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 flex-1">
                        <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          {load.pickupLocation.name || 'Pickup'}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex items-center gap-1 flex-1 justify-end">
                        <MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          {load.deliveryLocation.name || 'Delivery'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Key Details */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-violet-100 rounded-lg p-2">
                      <DollarSign className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Load Value</p>
                      <p className="text-sm font-bold text-gray-900">
                        {load.currencyCode} {load.loadValue.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {load.weight && (
                    <div className="flex items-center gap-2">
                      <div className="bg-amber-100 rounded-lg p-2">
                        <Weight className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Weight</p>
                        <p className="text-sm font-bold text-gray-900">
                          {load.weight.toLocaleString()} kg
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {load.pickupDate && (
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-4 p-2 bg-amber-50 rounded-lg">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Pickup: {new Date(load.pickupDate).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleFindTransporters(load.id)}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 font-semibold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Match
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {sortedLoads.map((load) => (
            <div
              key={load.id}
              className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-violet-400 hover:shadow-lg transition-all p-5"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-3 flex-shrink-0">
                  <Package className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{load.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                          {load.status}
                        </span>
                        {load.cargoType && (
                          <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs rounded-full font-medium">
                            {load.cargoType}
                          </span>
                        )}
                        {load.pickupDate && (
                          <span className="flex items-center gap-1 text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            {new Date(load.pickupDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-500 mb-1">Load Value</p>
                      <p className="text-xl font-bold text-violet-600">
                        {load.currencyCode} {load.loadValue.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {load.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{load.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    {/* Route */}
                    {load.pickupLocation && load.deliveryLocation && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span className="font-medium text-gray-900">
                            {load.pickupLocation.name || 'Pickup'}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-rose-600" />
                          <span className="font-medium text-gray-900">
                            {load.deliveryLocation.name || 'Delivery'}
                          </span>
                        </div>
                        {load.weight && (
                          <>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Weight className="w-4 h-4" />
                              <span>{load.weight.toLocaleString()} kg</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)}
                        className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-all flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => handleFindTransporters(load.id)}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 font-semibold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Find Transporters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CargoDiscovery;

