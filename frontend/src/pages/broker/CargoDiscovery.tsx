import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Eye
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

const CargoDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'PUBLISHED',
    minValue: '',
    maxValue: '',
    cargoType: '',
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Cargo Discovery</h1>
        <p className="text-gray-600 mt-1">
          Browse available cargo postings and find matching opportunities
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search cargo by title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Value
              </label>
              <input
                type="number"
                value={filters.minValue}
                onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
                placeholder="Min"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Value
              </label>
              <input
                type="number"
                value={filters.maxValue}
                onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
                placeholder="Max"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo Type
              </label>
              <select
                value={filters.cargoType}
                onChange={(e) => setFilters({ ...filters, cargoType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                <option value="GENERAL">General</option>
                <option value="FRAGILE">Fragile</option>
                <option value="HAZARDOUS">Hazardous</option>
                <option value="REFRIGERATED">Refrigerated</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Loads List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : loads.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No available cargo found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {loads.map((load) => (
            <div
              key={load.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <Package className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{load.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      load.status === 'PUBLISHED' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {load.status}
                    </span>
                  </div>

                  {load.description && (
                    <p className="text-sm text-gray-600 mb-4">{load.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-medium text-gray-900">
                        {load.currencyCode} {load.loadValue.toLocaleString()}
                      </span>
                    </div>
                    {load.weight && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Package className="w-4 h-4" />
                        <span>{load.weight.toLocaleString()} kg</span>
                      </div>
                    )}
                    {load.cargoType && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {load.cargoType}
                        </span>
                      </div>
                    )}
                  </div>

                  {load.pickupLocation && load.deliveryLocation && (
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span>{load.pickupLocation.name || 'Pickup Location'}</span>
                      </div>
                      <ArrowRight className="w-4 h-4" />
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-red-600" />
                        <span>{load.deliveryLocation.name || 'Delivery Location'}</span>
                      </div>
                    </div>
                  )}

                  {load.pickupDate && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Pickup: {new Date(load.pickupDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  <button
                    onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                  <button
                    onClick={() => handleProposeMatch(load.id)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2 text-sm"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Propose Match</span>
                  </button>
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

