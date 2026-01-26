import React, { useState, useEffect, useCallback } from 'react';
import {
  FaTruck,
  FaUser,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
  FaSearch,
  FaRoute,
  FaFileAlt,
  FaEye,
  FaSync,
  FaSortUp,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaTimes,
  FaInfoCircle,
  FaClock,
  FaUserPlus,
  FaUserMinus
} from 'react-icons/fa';
import { FiGrid, FiList } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui';
import type { Route } from '../../types/fleet';
import { fleetApi } from '../../services/fleetApi';
import { fetchAdminRoutes } from '../../services/adminApi';
import logoUrutiX from '../../assets/logo-urutix.svg';

// Debug the imported fleetApi
console.log('🔍 TrucksList - Imported fleetApi:', fleetApi);
console.log('🔍 TrucksList - fleetApi.fetchRoutes:', fleetApi.fetchRoutes);
console.log('🔍 TrucksList - fleetApi type:', typeof fleetApi);
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { EmptyState } from './EmptyState';
import TruckLocationModal from './TruckLocationModal';


interface TrucksListProps {
  onAddTruck?: () => void;
  refreshTrigger?: number; // Increment this to force a refresh
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface EditTruckFormProps {
  truck: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const EditTruckForm: React.FC<EditTruckFormProps> = ({ truck, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    plateNumber: truck?.plateNumber || '',
    make: truck?.make || '',
    model: truck?.model || '',
    year: truck?.year || new Date().getFullYear(),
    color: truck?.color || '',
    vin: truck?.vin || '',
    capacityWeight: truck?.capacityWeight || 0,
    capacityVolume: truck?.capacityVolume || 0,
    maxLength: truck?.maxLength ? String(truck.maxLength) : '',
    maxWidth: truck?.maxWidth ? String(truck.maxWidth) : '',
    maxHeight: truck?.maxHeight ? String(truck.maxHeight) : '',
    truckType: truck?.truckType || 'FLATBED',
    trailerType: truck?.trailerType || '',
    fuelType: truck?.fuelType || 'DIESEL',
    status: truck?.status || 'AVAILABLE',
    mileage: truck?.mileage || 0,
    fuelEfficiency: truck?.fuelEfficiency ? String(truck.fuelEfficiency) : '',
    registrationNumber: truck?.registrationNumber || '',
    registrationExpiry: truck?.registrationExpiry ? new Date(truck.registrationExpiry).toISOString().split('T')[0] : '',
    insurancePolicy: truck?.insurancePolicy || '',
    insuranceExpiry: truck?.insuranceExpiry ? new Date(truck.insuranceExpiry).toISOString().split('T')[0] : '',
    roadworthyCertExpiry: truck?.roadworthyCertExpiry ? new Date(truck.roadworthyCertExpiry).toISOString().split('T')[0] : '',
    hasRefrigeration: truck?.hasRefrigeration || false,
    hasLiftGate: truck?.hasLiftGate || false,
    hasGps: truck?.hasGps || truck?.hasGPS || false,
    hasHazmatPermit: truck?.hasHazmatPermit || false,
    isActive: truck?.isActive !== undefined ? truck.isActive : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
        type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="border-b border-gray-200 pb-2">Basic Information</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number *</label>
              <input
                type="text"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VIN *</label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={(e) => {
                  // Only allow alphanumeric characters (excluding I, O, Q as per VIN standards)
                  const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
                  // Limit to 17 characters
                  if (value.length <= 17) {
                    setFormData(prev => ({ ...prev, vin: value }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${formData.vin?.length === 17
                  ? 'border-green-500 bg-green-50'
                  : formData.vin?.length > 0
                    ? 'border-yellow-400'
                    : 'border-gray-300'
                  }`}
                required
                maxLength={17}
                placeholder="Enter 17-character VIN"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className={`text-xs ${formData.vin?.length === 17
                  ? 'text-green-600'
                  : formData.vin?.length > 0
                    ? 'text-yellow-600'
                    : 'text-gray-500'
                  }`}>
                  {formData.vin?.length || 0} / 17 characters
                </span>
                {formData.vin?.length === 17 && (
                  <span className="text-xs text-green-600 font-medium">✓ Valid VIN length</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={(e) => {
                  const { name, value } = e.target;
                  setFormData(prev => ({
                    ...prev,
                    [name]: value === '' ? '' : (isNaN(parseInt(value)) ? '' : parseInt(value))
                  }));
                }}
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${formData.year && typeof formData.year === 'number' && formData.year > new Date().getFullYear()
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300'
                  }`}
              />
              {formData.year && typeof formData.year === 'number' && formData.year > new Date().getFullYear() && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <span>⚠</span>
                  <span>Year cannot be in the future. Current year is {new Date().getFullYear()}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="AVAILABLE">Available</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">Active</label>
            </div>
          </div>
        </div>

        {/* Specifications */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Specifications</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity Weight (kg) *</label>
              <input
                type="number"
                name="capacityWeight"
                value={formData.capacityWeight}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity Volume (cu ft) *</label>
              <input
                type="number"
                name="capacityVolume"
                value={formData.capacityVolume}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Truck Type *</label>
              <select
                name="truckType"
                value={formData.truckType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="FLATBED">Flatbed</option>
                <option value="BOX_TRUCK">Box Truck</option>
                <option value="REFRIGERATED">Refrigerated</option>
                <option value="TANKER">Tanker</option>
                <option value="HEAVY_HAUL">Heavy Haul</option>
                <option value="VAN">Van</option>
                <option value="DUMP_TRUCK">Dump Truck</option>
                <option value="CRANE">Crane</option>
                <option value="SPECIALIZED">Specialized</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trailer Type</label>
              <input
                type="text"
                name="trailerType"
                value={formData.trailerType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type *</label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="DIESEL">Diesel</option>
                <option value="GASOLINE">Gasoline</option>
                <option value="ELECTRIC">Electric</option>
                <option value="HYBRID">Hybrid</option>
                <option value="CNG">CNG</option>
                <option value="LPG">LPG</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Efficiency (mpg)</label>
              <input
                type="number"
                name="fuelEfficiency"
                value={formData.fuelEfficiency}
                onChange={handleChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Dimensions (meters)</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Length</label>
              <input
                type="number"
                name="maxLength"
                value={formData.maxLength}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Width</label>
              <input
                type="number"
                name="maxWidth"
                value={formData.maxWidth}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Height</label>
              <input
                type="number"
                name="maxHeight"
                value={formData.maxHeight}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Compliance & Documents */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Compliance & Documents</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Expiry</label>
              <input
                type="date"
                name="registrationExpiry"
                value={formData.registrationExpiry}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Policy</label>
              <input
                type="text"
                name="insurancePolicy"
                value={formData.insurancePolicy}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry</label>
              <input
                type="date"
                name="insuranceExpiry"
                value={formData.insuranceExpiry}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roadworthy Cert Expiry</label>
              <input
                type="date"
                name="roadworthyCertExpiry"
                value={formData.roadworthyCertExpiry}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Capabilities</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="hasRefrigeration"
                checked={formData.hasRefrigeration}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">Has Refrigeration</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="hasLiftGate"
                checked={formData.hasLiftGate}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">Has Lift Gate</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="hasGps"
                checked={formData.hasGps}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">Has GPS</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="hasHazmatPermit"
                checked={formData.hasHazmatPermit}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">Has Hazmat Permit</label>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <FaEdit className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </form>
  );
};

export const TrucksList: React.FC<TrucksListProps> = ({ onAddTruck, refreshTrigger }) => {
  const { user, accessToken, isLoading: authLoading } = useAuth();

  console.log('🚀 TrucksList component rendering at:', new Date().toISOString());
  console.log('🚀 Component state:', { user: !!user, accessToken: !!accessToken, authLoading });
  const [trucks, setTrucks] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [selectedTruck, setSelectedTruck] = useState<any | null>(null);
  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const [showAssignRoute, setShowAssignRoute] = useState(false);
  const [showTruckDetails, setShowTruckDetails] = useState(false);
  const [showTruckRoutes, setShowTruckRoutes] = useState(false);
  const [showEditTruck, setShowEditTruck] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);




  // Load filtered data (trucks and drivers) - depends on search and filters
  const loadFilteredData = useCallback(async () => {
    if (!user || !accessToken) return;

    try {
      // Use the new getTrucks method with filters
      const truckFilters: { search?: string; status?: string } = {};
      if (search) truckFilters.search = search;
      if (statusFilter) truckFilters.status = statusFilter;

      console.log('🚛 Fetching filtered trucks with filters:', truckFilters);
      const trucksData = await fleetApi.getTrucks(truckFilters);
      console.log('✅ Filtered trucks data received:', trucksData);

      // Enrich trucks with assigned routes from route_trucks
      const trucksWithRoutes = await Promise.all(
        (trucksData || []).map(async (truck) => {
          try {
            const truckRouteObjs = await fleetApi.getTruckRoutes(truck.id);
            const assignedRoutes = (truckRouteObjs || []).filter((r: any) => r).map((r: any) => ({
              routeId: r.id,
              routeName: r?.name || 'Unknown Route',
              assignmentDate: new Date().toISOString(),
              status: r?.status || 'active',
            }));
            return { ...truck, assignedRoutes, assignedRouteDetails: truckRouteObjs };
          } catch (err) {
            return { ...truck, assignedRoutes: [], assignedRouteDetails: [] };
          }
        })
      );

      console.log('👥 Fetching filtered drivers...');
      const driversData = await fleetApi.getDrivers({ search });
      console.log('✅ Filtered drivers data received:', driversData);

      setTrucks(trucksWithRoutes || []);
      setDrivers(driversData || []);
      // Keep existing routes list; refresh fallback if we have none
      if (!routes || routes.length === 0) {
        try {
          // Only attempt fallback to admin routes if user has admin privileges
          const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN'].includes(user.role);
          if (isAdmin) {
            const adminRoutes = await fetchAdminRoutes({ tenantId: user.tenantId, status: 'active' });
            const mapped = (adminRoutes || []).map((r: any) => ({
              id: r.id,
              name: r.name,
              origin: r.origin,
              destination: r.destination,
              distance: Number(r.distance) || 0,
              estimatedDuration: Number(r.estimatedDuration || r.estimatedTime) || 0,
              status: r.status || 'active',
              assignedDrivers: Array.isArray(r.assignedDrivers) ? r.assignedDrivers : [],
              assignedTrucks: Array.isArray(r.assignedTrucks) ? r.assignedTrucks : [],
            }));
            setRoutes(mapped);
          }
        } catch (e) {
          console.warn('No fallback admin routes available');
        }
      }
    } catch (e: any) {
      console.error('❌ Error loading filtered data:', e);
    }
  }, [user, accessToken, search, statusFilter]);

  // Enrich trucks with route details from the routes list
  const enrichedTrucks = React.useMemo(() => {
    return (trucks || []).map(truck => {
      if (!truck) return null;

      const assignedRouteDetails = Array.isArray(truck.assignedRoutes)
        ? truck.assignedRoutes.map((ar: any) => {
          if (!ar) return null;
          // ar might be just an ID string or an object with routeId
          const routeId = typeof ar === 'string' ? ar : (ar.routeId || ar.id);
          if (!routeId) return null;

          const fullRoute = routes.find(r => r && r.id === routeId);
          return fullRoute ? { ...fullRoute, ...ar } : null; // Merge assignment details with full route
        }).filter(Boolean)
        : [];

      return {
        ...truck,
        assignedRouteDetails
      };
    }).filter(Boolean);
  }, [trucks, routes]);

  // Debug useEffect - runs on every render
  useEffect(() => {
    console.log('🔍 Debug useEffect - Component rendered at:', new Date().toISOString());
    console.log('🔍 Current state:', {
      user: !!user,
      accessToken: !!accessToken,
      authLoading,
      trucksCount: trucks.length,
      driversCount: drivers.length,
      routesCount: routes.length
    });
  });

  // Define loadData function using useCallback so it can be called from multiple places
  const loadData = useCallback(async () => {
    console.log('🚀 loadData function called - DEBUG VERSION');
    if (!user || !accessToken || authLoading) {
      console.log('⏳ Waiting for authentication...');
      return;
    }

    console.log('🚀 loadData function called at:', new Date().toISOString());
    console.log('Loading initial fleet data...');
    console.log('🔐 Auth Debug Info:');
    console.log('User:', user);
    console.log('Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'No token');
    console.log('Auth Loading:', authLoading);

    setLoading(true);
    setError(null);

    try {
      console.log('🚛 Fetching trucks...');
      const trucksData = await fleetApi.getTrucks({});
      console.log('✅ Trucks data received:', trucksData);
      setTrucks(trucksData || []);
    } catch (e: any) {
      console.error('❌ Error loading trucks:', e);
      console.error('❌ Error status:', e.response?.status);
      console.error('❌ Error data:', e.response?.data);
      console.error('❌ Error message:', e.response?.data?.message);

      if (e.response?.status === 403) {
        const errorMessage = e.response?.data?.message || 'Access denied. You may not have permission to view trucks.';
        console.error('🔒 403 Forbidden Error Details:');
        console.error('User Role:', user.role);
        console.error('User Tenant ID:', user.tenantId);
        console.error('User ID:', user.id);

        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return;
      } else if (e.response?.status === 401) {
        setError('Authentication required. Please log in again.');
        toast.error('Session expired. Please log in again.');
        setLoading(false);
        return;
      } else {
        setError('Failed to load trucks.');
        toast.error('Failed to load trucks.');
        setLoading(false);
        return;
      }
    }

    try {
      console.log('👥 Fetching drivers...');
      const driversData = await fleetApi.getDrivers({});
      console.log('✅ Drivers data received:', driversData);
      setDrivers(driversData || []);
    } catch (e: any) {
      console.error('❌ Error fetching drivers:', e);
      // Don't fail on driver error - just log it
      console.warn('Continuing without drivers data');
      setDrivers([]);
    }

    // Load routes separately - don't fail if routes fail
    try {
      console.log('🛣️ Fetching routes...');
      console.log('🛣️ About to call fleetApi.fetchRoutes()...');
      console.log('🛣️ Current time:', new Date().toISOString());
      console.log('🛣️ User context:', { userId: user.id, role: user.role, tenantId: user.tenantId });
      let routesData: Route[] = [];
      try {
        console.log('🛣️ EXECUTING fleetApi.fetchRoutes() NOW...');
        const response = await fleetApi.fetchRoutes();
        routesData = (response || []).map((r: any) => ({
          ...r,
          estimatedDuration: r.estimatedDuration || r.estimatedTime || 0
        }));
        console.log('✅ Routes data received:', routesData);
        console.log('✅ Routes data type:', typeof routesData);
        console.log('✅ Routes data length:', Array.isArray(routesData) ? routesData.length : 'Not an array');
        console.log('✅ Routes data structure:', JSON.stringify(routesData, null, 2));
        // Fallback to admin routes if empty AND user is admin
        if ((!routesData || routesData.length === 0)) {
          const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN'].includes(user.role);

          if (isAdmin) {
            console.log('⚠️ No routes from /fleet/routes. Falling back to /admin/routes with tenant filter...');
            const adminRoutes = await fetchAdminRoutes({ tenantId: user.tenantId, status: 'active' });
            routesData = (adminRoutes || []).map((r: any) => ({
              id: r.id,
              name: r.name,
              origin: r.origin,
              destination: r.destination,
              distance: Number(r.distance) || 0,
              estimatedDuration: Number(r.estimatedDuration || r.estimatedTime) || 0,
              status: r.status || 'active',
              assignedDrivers: Array.isArray(r.assignedDrivers) ? r.assignedDrivers : [],
              assignedTrucks: Array.isArray(r.assignedTrucks) ? r.assignedTrucks : [],
            }));
            console.log('✅ Fallback admin routes mapped:', routesData.length);
          } else {
            console.log('ℹ️ User is not admin, skipping admin routes fallback');
          }
        }
      } catch (routeError: any) {
        console.error('❌ Error fetching routes:', routeError);
        console.error('❌ Route error response:', routeError.response?.data);
        console.error('❌ Route error status:', routeError.response?.status);
        routesData = []; // Set empty array on error
      }

      setRoutes(routesData || []);
    } catch (e: any) {
      console.error('❌ Error in routes section:', e);
      // Don't fail the entire page if routes fail
      setRoutes([]);
    }

    setLoading(false);
  }, [user, accessToken, authLoading]);

  // Load initial data when auth is ready or refreshTrigger changes
  useEffect(() => {
    console.log('🔄 useEffect triggered at:', new Date().toISOString());
    console.log('🔄 Dependencies:', { authLoading, hasUser: !!user, hasToken: !!accessToken, refreshTrigger });

    if (authLoading) {
      console.log('🔄 Auth is still loading, waiting...');
      return;
    }

    if (!user || !accessToken) {
      console.log('❌ User not authenticated, redirecting to login...');
      setError('Please log in to access fleet data.');
      return;
    }

    console.log('✅ User authenticated, loading initial fleet data...');

    // Call the loadData function defined outside useEffect
    loadData();
  }, [loadData, refreshTrigger]); // Added refreshTrigger to dependencies

  // Load filtered data when search or filters change
  useEffect(() => {
    if (!user || !accessToken || authLoading) return;

    console.log('🔍 Search or filters changed, loading filtered data...');
    loadFilteredData();
  }, [loadFilteredData, user, accessToken, authLoading]);

  // Ensure modal loads all tenant routes freshly, then exclude already assigned
  useEffect(() => {
    const refreshForAssignModal = async () => {
      if (!showAssignRoute || !selectedTruck || !user) return;
      try {
        // Refresh tenant routes
        const rawRoutes = await fleetApi.fetchRoutes();
        let routesData: Route[] = (rawRoutes || []).map((r: any) => ({
          ...r,
          estimatedDuration: r.estimatedDuration || r.estimatedTime || 0
        }));
        if (!routesData || routesData.length === 0) {
          const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN'].includes(user.role);
          if (isAdmin) {
            const adminRoutes = await fetchAdminRoutes({ tenantId: user.tenantId, status: 'active' });
            routesData = (adminRoutes || []).map((r: any) => ({
              id: r.id,
              name: r.name,
              origin: r.origin,
              destination: r.destination,
              distance: Number(r.distance) || 0,
              estimatedDuration: Number(r.estimatedDuration || r.estimatedTime) || 0,
              status: r.status || 'active',
              assignedDrivers: Array.isArray(r.assignedDrivers) ? r.assignedDrivers : [],
              assignedTrucks: Array.isArray(r.assignedTrucks) ? r.assignedTrucks : [],
            }));
          }
        }
        setRoutes(routesData || []);

        // Refresh selected truck's assigned routes
        try {
          const truckRoutes = await fleetApi.getTruckRoutes(selectedTruck.id);
          const assignedRoutes = (truckRoutes || []).map((r: any) => ({
            routeId: r.id,
            routeName: r.name,
            assignmentDate: new Date().toISOString(),
            status: r.status || 'active',
          }));
          setTrucks(prev => prev.map(t => t.id === selectedTruck.id ? { ...t, assignedRoutes } : t));
        } catch (e) {
          console.warn('Failed to refresh selected truck routes for modal');
        }
      } catch (e) {
        console.warn('Failed to refresh routes for assign modal');
      }
    };
    refreshForAssignModal();
  }, [showAssignRoute, selectedTruck, user]);

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
      case 'in transit':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
      case 'out_of_service':
        return 'bg-red-100 text-red-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'active':
        return 'Available';
      case 'in_transit':
      case 'in transit':
        return 'In Transit';
      case 'maintenance':
        return 'Maintenance';
      case 'offline':
      case 'out_of_service':
        return 'Offline';
      case 'assigned':
        return 'Assigned';
      default:
        return status || 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'active':
        return <FaCheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_transit':
      case 'in transit':
        return <FaClock className="w-4 h-4 text-blue-600" />;
      case 'maintenance':
        return <FaExclamationTriangle className="w-4 h-4 text-yellow-600" />;
      case 'offline':
      case 'out_of_service':
        return <FaTimesCircle className="w-4 h-4 text-red-600" />;
      case 'assigned':
        return <FaUser className="w-4 h-4 text-purple-600" />;
      default:
        return <FaInfoCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Sorting function
  const sortTrucks = (trucks: any[]) => {
    return [...trucks].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested properties
      if (sortConfig.key === 'name') {
        aValue = a.name || a.plateNumber || '';
        bValue = b.name || b.plateNumber || '';
      }

      // Handle date sorting (createdAt)
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'dateAdded') {
        // Get createdAt from truck object (could be in different formats)
        const aDateValue = a.createdAt || a.created_at || aValue;
        const bDateValue = b.createdAt || b.created_at || bValue;

        // Convert to Date objects for proper comparison
        let aDate = 0;
        let bDate = 0;

        if (aDateValue) {
          const aParsed = new Date(aDateValue).getTime();
          aDate = isNaN(aParsed) ? 0 : aParsed;
        }

        if (bDateValue) {
          const bParsed = new Date(bDateValue).getTime();
          bDate = isNaN(bParsed) ? 0 : bParsed;
        }

        // If both are 0 (no date), keep original order
        if (aDate === 0 && bDate === 0) {
          return 0;
        }

        // If one has no date, put it at the end
        if (aDate === 0) {
          return 1; // a goes to end
        }
        if (bDate === 0) {
          return -1; // b goes to end
        }

        // Compare dates
        if (aDate < bDate) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aDate > bDate) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }

      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Filtering function
  const filterTrucks = (trucks: any[]) => {
    return trucks.filter(truck => {
      const matchesSearch = !search ||
        truck.name?.toLowerCase().includes(search.toLowerCase()) ||
        truck.plateNumber?.toLowerCase().includes(search.toLowerCase()) ||
        truck.make?.toLowerCase().includes(search.toLowerCase()) ||
        truck.model?.toLowerCase().includes(search.toLowerCase());

      // Normalize status for comparison - handle enum values (uppercase with underscores)
      let matchesStatus = true;
      if (statusFilter) {
        // Normalize both truck status and filter to uppercase for comparison
        const truckStatus = (truck.status || '').toUpperCase().trim();
        const filterStatus = statusFilter.toUpperCase().trim();

        // Direct comparison (both should be uppercase enum values)
        // Also handle variations like "IN TRANSIT" vs "IN_TRANSIT"
        matchesStatus = truckStatus === filterStatus ||
          truckStatus.replace(/_/g, ' ') === filterStatus.replace(/_/g, ' ');
      }

      return matchesSearch && matchesStatus;
    });
  };

  // Pagination
  const paginatedTrucks = () => {
    const filtered = filterTrucks(enrichedTrucks);
    const sorted = sortTrucks(filtered);
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(filterTrucks(enrichedTrucks).length / itemsPerPage);


  // Get available drivers (ACTIVE and not currently assigned to ANY truck)
  const availableDrivers = React.useMemo(() => {
    console.log('🔍 Filtering available drivers...');
    console.log('📊 Total drivers:', drivers.length);
    console.log('📊 Drivers data sample:', drivers.slice(0, 3).map(d => ({
      id: d.id,
      name: `${d.firstName} ${d.lastName}`,
      currentTruckId: d.currentTruckId,
      currentTruck: d.currentTruck,
      status: d.status
    })));

    const filtered = drivers.filter((driver: any) => {
      const status = String(driver.status || '').toUpperCase();
      const isActive = status === 'ACTIVE';

      // Check if driver has currentTruckId
      const hasCurrentTruckId = !!driver.currentTruckId;

      // Check if driver has currentTruck object
      const hasCurrentTruck = !!driver.currentTruck;

      // Check if driver is in any truck's assignedDrivers array
      const isInAssignedDrivers = trucks.some((truck: any) => {
        if (!Array.isArray(truck.assignedDrivers)) return false;
        return truck.assignedDrivers.some((d: any) => d.driverId === driver.id);
      });

      // Driver is available if:
      // 1. They are ACTIVE
      // 2. They don't have a currentTruckId
      // 3. They don't have a currentTruck object
      // 4. They are not in any truck's assignedDrivers array
      const isAvailable = isActive && !hasCurrentTruckId && !hasCurrentTruck && !isInAssignedDrivers;

      if (!isAvailable) {
        console.log(`🚫 Driver ${driver.firstName} ${driver.lastName} (${driver.id}) is NOT available:`, {
          isActive,
          hasCurrentTruckId,
          hasCurrentTruck,
          isInAssignedDrivers,
          currentTruckId: driver.currentTruckId,
          currentTruck: driver.currentTruck?.id,
        });
      }

      return isAvailable;
    });

    console.log('✅ Available drivers count:', filtered.length);
    console.log('✅ Available drivers:', filtered.map(d => `${d.firstName} ${d.lastName}`));

    return filtered;
  }, [drivers, trucks]);


  // Get available routes (not already assigned to the given truck)
  const getAvailableRoutes = (truckId: string) => {
    const truck = enrichedTrucks.find(t => t.id === truckId);
    const alreadyAssignedIds = new Set(
      Array.isArray(truck?.assignedRoutes) ? truck!.assignedRoutes.map((r: any) => r.routeId) : []
    );

    const available = routes.filter((route: any) => {
      const status = (route.status || 'active').toString().toLowerCase();
      const isActive = status === 'active';
      const notAssigned = !alreadyAssignedIds.has(route.id);
      return isActive && notAssigned;
    });

    return available;
  };

  const handleAssignDriver = async (truckId: string, driverId: string) => {
    try {
      setLoading(true);
      setError('');
      console.log(`Assigning driver ${driverId} to truck ${truckId}`);

      // Use the fleetApi assignment method
      await fleetApi.assignDriverToTruck(truckId, driverId);

      // Close the modal first
      setShowAssignDriver(false);
      setSelectedTruck(null);

      // Refresh data to get updated driver currentTruckId
      console.log('🔄 Refreshing data after driver assignment...');
      await loadData();

      console.log('✅ Driver assigned successfully');
      console.log('✅ Data refreshed');
      toast.success('Driver assigned successfully!');
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);

      // Provide more detailed error messages
      let errorMessage = 'Failed to assign driver to truck.';

      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const data = error.response.data;

        // Extract the actual error message from the response
        // NestJS error responses can have message in different places
        if (data?.message) {
          errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
        } else if (data?.error) {
          if (typeof data.error === 'string') {
            errorMessage = data.error;
          } else if (data.error?.message) {
            errorMessage = data.error.message;
          } else {
            errorMessage = JSON.stringify(data.error);
          }
        } else if (data) {
          // Try to extract any meaningful message from the response
          errorMessage = JSON.stringify(data);
        } else {
          switch (status) {
            case 400:
              errorMessage = 'Invalid request. Please check the driver and truck details.';
              break;
            case 401:
              errorMessage = 'Authentication required. Please log in again.';
              break;
            case 403:
              errorMessage = data?.message || 'Access denied. You may not have permission.';
              break;
            case 404:
              errorMessage = data?.message || 'Truck or driver not found.';
              break;
            case 409:
              errorMessage = data?.message || 'Driver is already assigned to this truck.';
              break;
            case 500:
              errorMessage = data?.message || data?.error || 'Server error. Please try again.';
              break;
            default:
              errorMessage = data?.message || `Server error (${status}). Please try again.`;
          }
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Other error
        errorMessage = error.message || 'An unexpected error occurred.';
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignDriver = async (truckId: string, driverId: string) => {
    try {
      setLoading(true);
      setError('');
      console.log(`Unassigning driver ${driverId} from truck ${truckId}`);

      // Use the fleetApi unassignment method
      await fleetApi.unassignDriverFromTruck(truckId, driverId);

      // Refresh data
      await loadData();

      console.log('Driver unassigned successfully');
      toast.success('Driver unassigned successfully!');
    } catch (error: any) {
      console.error('Error unassigning driver:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);

      // Provide more detailed error messages
      let errorMessage = 'Failed to unassign driver from truck.';

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (data?.message) {
          errorMessage = data.message;
        } else if (data?.error) {
          errorMessage = typeof data.error === 'string' ? data.error : data.error.message || errorMessage;
        } else {
          switch (status) {
            case 400:
              errorMessage = 'Invalid request. Please check the driver and truck details.';
              break;
            case 401:
              errorMessage = 'Authentication required. Please log in again.';
              break;
            case 404:
              errorMessage = data?.message || 'Truck, driver, or assignment not found.';
              break;
            case 500:
              errorMessage = data?.message || data?.error || 'Server error. Please try again.';
              break;
            default:
              errorMessage = data?.message || `Server error (${status}). Please try again.`;
          }
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred.';
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRoute = async (truckId: string, routeId: string) => {
    try {
      setLoading(true);
      setError('');
      console.log(`Assigning route ${routeId} to truck ${truckId}`);

      await fleetApi.assignRouteToTruck(truckId, routeId);

      // Refresh the trucks list
      await loadData();

      toast.success('Route assigned successfully!');
    } catch (error: any) {
      console.error('Route assignment error:', error);

      // Provide more detailed error messages
      let errorMessage = 'Failed to assign route to truck.';

      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            errorMessage = data.message || 'Invalid request. Please check the route and truck details.';
            break;
          case 403:
            errorMessage = data.message || 'Route is already assigned to this truck.';
            break;
          case 404:
            errorMessage = data.message || 'Truck or route not found.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please log in again.';
            break;
          default:
            errorMessage = data.message || `Server error (${status}). Please try again.`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Other error
        errorMessage = error.message || 'An unexpected error occurred.';
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignRoute = async (truckId: string, routeId: string) => {
    try {
      setLoading(true);
      setError('');
      console.log(`Unassigning route ${routeId} from truck ${truckId}`);

      await fleetApi.unassignRouteFromTruck(truckId, routeId);

      // Refresh the trucks list
      await loadData();

      toast.success('Route unassigned successfully!');
    } catch (error: any) {
      console.error('Route unassignment error:', error);

      // Provide more detailed error messages
      let errorMessage = 'Failed to unassign route from truck.';

      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            errorMessage = data.message || 'Invalid request. Please check the route and truck details.';
            break;
          case 404:
            errorMessage = data.message || 'Truck or route assignment not found.';
            break;
          case 401:
            errorMessage = 'Authentication required. Please log in again.';
            break;
          default:
            errorMessage = data.message || `Server error (${status}). Please try again.`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Other error
        errorMessage = error.message || 'An unexpected error occurred.';
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  console.log('Rendering TrucksList with:', { trucks: trucks.length, drivers: drivers.length, loading, error, filteredTrucks: filterTrucks(trucks).length });

  return (
    <div className="relative min-h-screen">
      {/* Background Logo */}
      <img
        src={logoUrutiX}
        alt="UrutiX Logo Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-5 z-0"
        style={{ objectPosition: 'center' }}
      />
      {/* Content */}
      <div className="relative z-10">
        {/* Statistics Cards */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          {trucks.length === 0 && !loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <FaInfoCircle className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium mb-1">Getting Started</p>
                  <p className="text-sm text-blue-800">
                    Start by adding your first truck. You can add truck details, upload documents (registration, insurance), schedule maintenance, and track everything in one place.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Trucks</p>
                  <p className="text-2xl font-bold text-gray-900">{trucks.length}</p>
                </div>
                <FaTruck className="w-8 h-8 text-[#345E85]" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-green-600">
                    {trucks.filter(t => t.status?.toLowerCase() === 'available').length}
                  </p>
                </div>
                <FaCheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Transit</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {trucks.filter(t => t.status?.toLowerCase() === 'in_transit' || t.status?.toLowerCase() === 'in transit').length}
                  </p>
                </div>
                <FaClock className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {trucks.filter(t => t.status?.toLowerCase() === 'maintenance').length}
                  </p>
                </div>
                <FaExclamationTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search by plate number, make, model..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 border border-gray-200 rounded-md p-0.5 bg-gray-50">
                <button
                  onClick={() => setStatusFilter('')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${statusFilter === ''
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('AVAILABLE')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${statusFilter === 'AVAILABLE'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Available
                </button>
                <button
                  onClick={() => setStatusFilter('IN_TRANSIT')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${statusFilter === 'IN_TRANSIT'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  In Transit
                </button>
                <button
                  onClick={() => setStatusFilter('MAINTENANCE')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${statusFilter === 'MAINTENANCE'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Maintenance
                </button>
              </div>
              {/* View Toggle */}
              <div className="flex items-center gap-1 border border-gray-200 rounded-md p-0.5 bg-gray-50">
                <button
                  onClick={() => setView('grid')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${view === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                  title="Grid View"
                >
                  <FiGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${view === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                  title="List View"
                >
                  <FiList className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Showing {paginatedTrucks().length} of {filterTrucks(enrichedTrucks).length} trucks
            {search && ` matching "${search}"`}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-');
                setSortConfig({ key, direction: direction as 'asc' | 'desc' });
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="status-asc">Status (A-Z)</option>
              <option value="status-desc">Status (Z-A)</option>
              <option value="year-desc">Year (Newest)</option>
              <option value="year-asc">Year (Oldest)</option>
              <option value="capacityWeight-desc">Capacity (High-Low)</option>
              <option value="capacityWeight-asc">Capacity (Low-High)</option>
              <option value="createdAt-desc">Date Added (Newest First)</option>
              <option value="createdAt-asc">Date Added (Oldest First)</option>
            </select>
            <span className="ml-4 text-xs text-gray-500">
              Routes assigned: {filterTrucks(trucks).reduce((sum, t) => sum + (Array.isArray(t.assignedRoutes) ? t.assignedRoutes.length : 0), 0)}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded flex items-center gap-2 mb-4" role="alert">
            <FaEdit /> {error}
          </div>
        )}

        {/* Trucks Grid/List */}
        {view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTrucks().map((truck) => (
              <div key={truck.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                {/* Truck Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FaTruck className="w-6 h-6 text-[#345E85]" />
                    <div>
                      <h3>{truck.name || truck.plateNumber}</h3>
                      <p className="text-sm text-gray-500">{truck.plateNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(truck.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(truck.status)}`}>
                      {getStatusText(truck.status)}
                    </span>
                  </div>
                </div>

                {/* Truck Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Make/Model:</span>
                    <span className="text-gray-900">{truck.make} {truck.model}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Year:</span>
                    <span className="text-gray-900">{truck.year}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Capacity:</span>
                    <span className="text-gray-900">{truck.capacityWeight?.toLocaleString()} kg</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                    {truck.currentLocation ? (
                      <span className="text-gray-900 truncate max-w-[150px]" title={truck.currentLocation.address}>
                        {truck.currentLocation.address}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">No location set</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTruck(truck);
                        setShowLocationModal(true);
                      }}
                      className="ml-auto text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Update
                    </button>
                  </div>
                  {truck.currentLocation && truck.currentLocation.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-900">{truck.currentLocation.address}</span>
                    </div>
                  )}
                </div>

                {/* Driver Assignment */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Driver Assignment</span>
                    <button
                      onClick={() => {
                        setSelectedTruck(truck);
                        setShowAssignDriver(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <FaUserPlus className="w-3 h-3" />
                      Assign Driver
                    </button>
                  </div>

                  {Array.isArray(truck.assignedDrivers) && truck.assignedDrivers.length > 0 ? (
                    <div className="space-y-2">
                      {truck.assignedDrivers.map((assignment: any, index: number) => (
                        <div key={assignment.id || `driver-${index}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FaUser className="w-4 h-4 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{assignment.driverName || 'Unknown Driver'}</p>
                              <p className="text-xs text-gray-500">
                                {assignment.status === 'active' ? 'Active' : assignment.status}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnassignDriver(truck.id, assignment.driverId)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            <FaUserMinus className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <FaUser className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">No drivers assigned</p>
                        <p className="text-xs text-gray-400">Click to assign</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Route Assignment */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Route Assignment</span>
                    <div className="flex items-center gap-3">
                      {Array.isArray(truck.assignedRouteDetails) && truck.assignedRouteDetails.length > 0 && (
                        <div className="relative group">
                          <button
                            onClick={() => {
                              setSelectedTruck(truck);
                              setShowTruckRoutes(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            View assigned routes
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTruck(truck);
                          setShowAssignRoute(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        <FaRoute className="w-3 h-3" />
                        {Array.isArray(truck.assignedRouteDetails) && truck.assignedRouteDetails.length > 0 ? 'Assign More' : 'Assign Route'}
                      </button>
                    </div>
                  </div>

                  {Array.isArray(truck.assignedRoutes) && truck.assignedRoutes.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
                      {truck.assignedRouteDetails?.map((r: any, index: number) => (
                        <span key={r.id || `route-${index}`} className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800" title={`${r.origin} → ${r.destination} • ${r.distance ?? 0} km • ${r.estimatedTime ?? r.estimatedDuration ?? 0} h`}>
                          {r.name}
                          <button
                            onClick={() => handleUnassignRoute(truck.id, r.id)}
                            className="ml-1 text-blue-600 hover:text-blue-800 text-xs"
                          >
                            <FaUserMinus className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <FaRoute className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">No routes assigned</p>
                        <p className="text-xs text-gray-400">Click to assign</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedTruck(truck);
                      setShowTruckDetails(true);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center gap-1"
                  >
                    <FaEye className="w-3 h-3" />
                    View
                  </button>
                  <a
                    href={`/dashboard/fleet/trucks/${truck.id}/records`}
                    className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center justify-center gap-1"
                  >
                    <FaFileAlt className="w-3 h-3" />
                    Records
                  </a>
                  <button
                    onClick={() => {
                      setEditingTruck(truck);
                      setShowEditTruck(true);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center gap-1"
                  >
                    <FaEdit className="w-3 h-3" />
                    Edit
                  </button>
                  <button className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center justify-center gap-1">
                    <FaTrash className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Drivers</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Routes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTrucks().map((truck) => (
                    <tr key={truck.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FaTruck className="w-5 h-5 text-[#345E85] mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{truck.name || truck.plateNumber}</div>
                            <div className="text-sm text-gray-500">{truck.plateNumber}</div>
                            <div className="text-xs text-gray-400">{truck.make} {truck.model} ({truck.year})</div>
                            {Array.isArray(truck.assignedRouteDetails) && truck.assignedRouteDetails.length > 0 && (
                              <div className="text-xs text-blue-700 mt-1">
                                Routes: {truck.assignedRouteDetails.length}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(truck.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(truck.status)}`}>
                            {getStatusText(truck.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {truck.currentLocation ? (
                            <div className="flex items-center text-sm text-gray-900">
                              <FaMapMarkerAlt className="w-3 h-3 text-gray-400 mr-1 shrink-0" />
                              <span className="truncate max-w-[150px]" title={truck.currentLocation.address}>
                                {truck.currentLocation.address}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">No location set</span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTruck(truck);
                              setShowLocationModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit Location"
                          >
                            <FaEdit className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {truck.assignedDrivers && truck.assignedDrivers.length > 0 ? (
                          <div className="space-y-1">
                            {truck.assignedDrivers.map((assignment: any, index: number) => (
                              <div key={assignment.id || `driver-${index}`} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <FaUser className="w-3 h-3 text-green-600 mr-1" />
                                  <span className="text-sm text-gray-900">{assignment.driverName}</span>
                                </div>
                                <button
                                  onClick={() => handleUnassignDriver(truck.id, assignment.driverId)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  <FaUserMinus className="w-2 h-2" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No drivers assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {Array.isArray(truck.assignedRouteDetails) && truck.assignedRouteDetails.length > 0 ? (
                          <div className="space-y-1">
                            {(truck.assignedRouteDetails as any[]).slice(0, 3).map((r: any, index: number) => (
                              <div key={r.id || `route-${index}`} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <FaRoute className="w-3 h-3 text-blue-600 mr-1" />
                                  <span className="text-sm text-gray-900" title={`${r.origin} → ${r.destination}`}>{r.name}</span>
                                </div>
                                <button
                                  onClick={() => handleUnassignRoute(truck.id, r.id)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  <FaUserMinus className="w-2 h-2" />
                                </button>
                              </div>
                            ))}
                            {truck.assignedRouteDetails.length > 3 && (
                              <button
                                onClick={() => { setSelectedTruck(truck); setShowTruckRoutes(true); }}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                +{truck.assignedRouteDetails.length - 3} more
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No routes assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="relative group">
                            <button
                              onClick={() => {
                                setSelectedTruck(truck);
                                setShowTruckDetails(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                            >
                              <FaEye className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              View Details
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                            </div>
                          </div>
                          <div className="relative group">
                            <button
                              onClick={() => {
                                setSelectedTruck(truck);
                                setShowAssignDriver(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                            >
                              <FaUserPlus className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              Assign Driver
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                            </div>
                          </div>
                          <div className="relative group">
                            <button
                              onClick={() => {
                                setSelectedTruck(truck);
                                setShowAssignRoute(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                            >
                              <FaRoute className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              Assign Route
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                            </div>
                          </div>
                          <div className="relative group">
                            <a
                              href={`/dashboard/fleet/trucks/${truck.id}/records`}
                              className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                            >
                              <FaFileAlt className="w-3 h-3" />
                            </a>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              View Records
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                            </div>
                          </div>
                          <div className="relative group">
                            <button
                              onClick={() => {
                                setEditingTruck(truck);
                                setShowEditTruck(true);
                              }}
                              className="text-gray-600 hover:text-gray-800 text-sm flex items-center gap-1"
                            >
                              <FaEdit className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              Edit
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <FaSortUp className="w-3 h-3 rotate-90" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                if (totalPages <= 5) {
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg ${currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                }

                // Show first page, last page, current page, and pages around current
                if (pageNum === 1 || pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg ${currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                }

                // Show ellipsis
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={`ellipsis-${pageNum}`} className="px-2 text-gray-500">...</span>;
                }

                return null;
              }).filter(Boolean)}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <FaSortUp className="w-3 h-3 -rotate-90" />
            </button>
          </div>
        )}


        {/* Assign Driver Modal */}
        {showAssignDriver && selectedTruck && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center modal-overlay">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3>Assign Driver to {selectedTruck?.name || selectedTruck?.plateNumber}</h3>
                  <button
                    onClick={() => {
                      setShowAssignDriver(false);
                      setSelectedTruck(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaEdit className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Select a driver to assign to this truck:</p>

                  {availableDrivers.length === 0 ? (
                    <div className="text-center py-4">
                      <FaUser className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No available drivers</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableDrivers.map((driver, index) => (
                        <button
                          key={driver.id || `available-driver-${index}`}
                          onClick={() => handleAssignDriver(selectedTruck?.id, driver.id)}
                          className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3"
                        >
                          <FaUser className="w-4 h-4 text-[#345E85]" />
                          <div>
                            <p className="font-medium text-gray-900">{driver?.firstName ? `${driver.firstName} ${driver.lastName || ''}`.trim() : (driver?.name || 'Unnamed')}</p>
                            <p className="text-sm text-gray-500">{driver?.licenseNumber} • {driver?.experience} years experience</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Route Modal */}
        {showAssignRoute && selectedTruck && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center modal-overlay">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3>Assign Route to {selectedTruck?.name || selectedTruck?.plateNumber}</h3>
                  <button
                    onClick={() => {
                      setShowAssignRoute(false);
                      setSelectedTruck(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Select a route to assign to this truck:</p>

                  {/* Debug information */}
                  <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
                    <p><strong>Debug Info:</strong></p>
                    <p>Total routes in system: {routes.length}</p>
                    <p>Available routes for this truck: {getAvailableRoutes(selectedTruck?.id).length}</p>
                    <p>Truck ID: {selectedTruck?.id}</p>
                  </div>

                  {getAvailableRoutes(selectedTruck?.id).length === 0 ? (
                    <div className="text-center py-4">
                      <FaRoute className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">No available routes</p>
                      {routes.length === 0 && (
                        <p className="text-xs text-gray-400 mt-2">No routes found in the system</p>
                      )}
                      {routes.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">Routes exist but none are available for this truck</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {getAvailableRoutes(selectedTruck?.id).map((route, index) => (
                        <button
                          key={route.id || `available-route-${index}`}
                          onClick={() => handleAssignRoute(selectedTruck?.id, route.id)}
                          className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-3"
                        >
                          <FaRoute className="w-4 h-4 text-[#345E85]" />
                          <div>
                            <p className="font-medium text-gray-900">{route?.name || 'Unknown Route'}</p>
                            <p className="text-sm text-gray-500">{route?.origin} to {route?.destination}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Truck Routes Drawer */}
        {showTruckRoutes && selectedTruck && (
          <div className="fixed inset-0 flex z-[12001]">
            <div className="flex-1 bg-black/40" onClick={() => { setShowTruckRoutes(false); setSelectedTruck(null); }} />
            <div className="w-full max-w-md bg-white h-full shadow-xl overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3>Routes for {selectedTruck?.name || selectedTruck?.plateNumber}</h3>
                  <button className="text-gray-400 hover:text-gray-600" onClick={() => { setShowTruckRoutes(false); setSelectedTruck(null); }}>
                    <FaTimesCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {Array.isArray(selectedTruck?.assignedRouteDetails) && selectedTruck?.assignedRouteDetails?.length > 0 ? (
                  selectedTruck?.assignedRouteDetails?.map((r: any) => (
                    <div key={r.id} className="border rounded-lg p-4 flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{r.name}</div>
                        <div className="text-sm text-gray-600">{r.origin} → {r.destination}</div>
                        <div className="text-xs text-gray-500 mt-1">{(r.distance ?? 0)} km • {(r.estimatedTime ?? r.estimatedDuration ?? 0)} h • {r.status || 'active'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUnassignRoute(selectedTruck?.id, r.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Unassign
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No routes assigned</div>
                )}
              </div>
              <div className="p-6 border-t">
                <button
                  onClick={() => { setShowTruckRoutes(false); setShowAssignRoute(true); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign Route
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Truck Details Modal */}
        <Dialog open={showTruckDetails && !!selectedTruck} onOpenChange={(open) => {
          if (!open) {
            setShowTruckDetails(false);
            setSelectedTruck(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="hidden">
              <DialogTitle>Truck Details</DialogTitle>
              <DialogDescription>Details for {selectedTruck?.name || selectedTruck?.plateNumber}</DialogDescription>
            </DialogHeader>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2>Truck Details</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="border-b border-gray-200 pb-2">Basic Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedTruck?.name || selectedTruck?.plateNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plate Number:</span>
                      <span className="font-medium">{selectedTruck?.plateNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Make/Model:</span>
                      <span className="font-medium">{selectedTruck?.make} {selectedTruck?.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium">{selectedTruck?.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTruck?.status)}`}>
                        {getStatusText(selectedTruck?.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Specifications</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity Weight:</span>
                      <span className="font-medium">{selectedTruck?.capacityWeight?.toLocaleString()} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity Volume:</span>
                      <span className="font-medium">{selectedTruck?.capacityVolume?.toLocaleString()} cu ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VIN:</span>
                      <span className="font-medium">{selectedTruck?.vin || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Truck Type:</span>
                      <span className="font-medium">{selectedTruck?.truckType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trailer Type:</span>
                      <span className="font-medium">{selectedTruck?.trailerType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Type:</span>
                      <span className="font-medium">{selectedTruck?.fuelType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Color:</span>
                      <span className="font-medium">{selectedTruck?.color || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mileage:</span>
                      <span className="font-medium">{selectedTruck?.mileage?.toLocaleString()} miles</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Efficiency:</span>
                      <span className="font-medium">{selectedTruck?.fuelEfficiency || 'N/A'} mpg</span>
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Dimensions</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Length:</span>
                      <span className="font-medium">{selectedTruck?.maxLength ? `${selectedTruck?.maxLength} m` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Width:</span>
                      <span className="font-medium">{selectedTruck?.maxWidth ? `${selectedTruck?.maxWidth} m` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Height:</span>
                      <span className="font-medium">{selectedTruck?.maxHeight ? `${selectedTruck?.maxHeight} m` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <h4 className="text-lg font-semibold text-gray-900">Current Location</h4>
                    <button
                      onClick={() => setShowLocationModal(true)}
                      className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-gray-100 transition-colors"
                      title="Edit Location"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {selectedTruck?.currentLocation ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium">{selectedTruck?.currentLocation?.address}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">City:</span>
                          <span className="font-medium">{selectedTruck?.currentLocation?.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">State:</span>
                          <span className="font-medium">{selectedTruck?.currentLocation?.state}</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-500">No location data available</span>
                    )}

                  </div>
                </div>

                {/* Assignments */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Current Assignments</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Drivers ({selectedTruck?.assignedDrivers?.length || 0})</h5>
                      {selectedTruck?.assignedDrivers && selectedTruck?.assignedDrivers?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedTruck?.assignedDrivers?.map((driver: any, index: number) => (
                            <div key={driver.id || `driver-${index}`} className="flex items-center justify-between p-2 bg-green-50 rounded">
                              <span className="text-sm font-medium">{driver.driverName}</span>
                              <span className="text-xs text-gray-500">{driver.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No drivers assigned</span>
                      )}
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Routes ({selectedTruck?.assignedRoutes?.length || 0})</h5>
                      {selectedTruck?.assignedRoutes && selectedTruck?.assignedRoutes?.length > 0 ? (
                        <div className="space-y-2">
                          {selectedTruck?.assignedRoutes?.map((route: any, index: number) => (
                            <div key={route.id || `route-${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                              <span className="text-sm font-medium">{route.routeName}</span>
                              <span className="text-xs text-gray-500">{route.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No routes assigned</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compliance & Documents */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Compliance & Documents</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registration Number:</span>
                      <span className="font-medium">{selectedTruck?.registrationNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registration Expiry:</span>
                      <span className="font-medium">{selectedTruck?.registrationExpiry ? new Date(selectedTruck?.registrationExpiry).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insurance Policy:</span>
                      <span className="font-medium">{selectedTruck?.insurancePolicy || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insurance Expiry:</span>
                      <span className="font-medium">{selectedTruck?.insuranceExpiry ? new Date(selectedTruck?.insuranceExpiry).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Roadworthy Cert Expiry:</span>
                      <span className="font-medium">{selectedTruck?.roadworthyCertExpiry ? new Date(selectedTruck?.roadworthyCertExpiry).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Capabilities & Safety */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Capabilities & Safety</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Refrigeration:</span><span className="font-medium">{selectedTruck?.hasRefrigeration || selectedTruck?.hasReefer ? 'Yes' : 'No'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Lift Gate:</span><span className="font-medium">{selectedTruck?.hasLiftGate ? 'Yes' : 'No'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Hazmat Permit:</span><span className="font-medium">{selectedTruck?.hasHazmatPermit ? 'Yes' : 'No'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">GPS:</span><span className="font-medium">{selectedTruck?.hasGps || selectedTruck?.hasGPS ? 'Yes' : 'No'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Tracking:</span><span className="font-medium">{selectedTruck?.hasTracking ? 'Yes' : 'No'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Telematics:</span><span className="font-medium">{selectedTruck?.hasTelematics ? 'Yes' : 'No'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">ELD:</span><span className="font-medium">{selectedTruck?.hasELD ? 'Yes' : 'No'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Dash Cam:</span><span className="font-medium">{selectedTruck?.hasDashCam ? 'Yes' : 'No'}</span></div>
                  </div>
                  <div className="text-xs text-gray-500">Equipment items: {Array.isArray(selectedTruck?.equipmentList) ? selectedTruck?.equipmentList?.length : 0}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowTruckDetails(false);
                    setSelectedTruck(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setEditingTruck(selectedTruck);
                    setShowTruckDetails(false);
                    setShowEditTruck(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaEdit className="w-4 h-4" />
                  Edit Truck
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Truck Modal */}
        {/* Edit Truck Modal */}
        <Dialog open={showEditTruck && !!editingTruck} onOpenChange={(open) => {
          if (!open) {
            setShowEditTruck(false);
            setEditingTruck(null);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="hidden">
              <DialogTitle>Edit Truck</DialogTitle>
              <DialogDescription>Edit Truck Details</DialogDescription>
            </DialogHeader>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Edit Truck</h3>
              </div>

              <EditTruckForm
                truck={editingTruck}
                onSave={async (updatedData) => {
                  try {
                    // Clean the data: remove empty strings, convert dates, handle undefined values
                    const cleanedData: any = {};

                    // Copy all non-empty values
                    Object.keys(updatedData).forEach(key => {
                      const value = updatedData[key];

                      // Handle date fields first - convert empty strings to undefined
                      if (['registrationExpiry', 'insuranceExpiry', 'roadworthyCertExpiry'].includes(key)) {
                        if (value === '' || !value) {
                          return; // Don't send empty dates
                        }
                        cleanedData[key] = value; // Keep as ISO string
                        return;
                      }

                      // Skip empty strings for optional fields
                      if (value === '' && ['color', 'trailerType', 'registrationNumber', 'insurancePolicy'].includes(key)) {
                        return; // Don't include empty optional fields
                      }

                      // Convert string numbers to actual numbers for numeric fields
                      if (['maxLength', 'maxWidth', 'maxHeight', 'fuelEfficiency'].includes(key)) {
                        if (value === '' || value === null || value === undefined) {
                          return; // Don't send empty numeric optional fields
                        }
                        const numValue = Number(value);
                        if (!isNaN(numValue)) {
                          cleanedData[key] = numValue;
                        }
                        return;
                      }

                      // Handle mileage - default to 0 if empty
                      if (key === 'mileage') {
                        if (value === '' || value === null || value === undefined) {
                          cleanedData[key] = 0;
                        } else {
                          cleanedData[key] = Number(value) || 0;
                        }
                        return;
                      }

                      // Don't send NaN values
                      if (typeof value === 'number' && isNaN(value)) {
                        return;
                      }

                      // Include all other valid values
                      cleanedData[key] = value;
                    });

                    console.log('Sending cleaned truck update data:', cleanedData);
                    await fleetApi.updateTruck(editingTruck.id, cleanedData);
                    toast.success('Truck updated successfully');
                    setShowEditTruck(false);
                    setEditingTruck(null);
                    loadData(); // Refresh the list
                  } catch (error: any) {
                    console.error('Error updating truck:', error);
                    console.error('Error response:', error.response?.data);
                    toast.error(error.response?.data?.message || error.message || 'Failed to update truck');
                  }
                }}
                onCancel={() => {
                  setShowEditTruck(false);
                  setEditingTruck(null);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Empty State */}
        {
          paginatedTrucks().length === 0 && !loading && (
            search || statusFilter ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <FaTruck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No trucks found</h3>
                  <p className="text-gray-500 mb-6">
                    No trucks match your current filters. Try adjusting your search criteria.
                  </p>
                  <button
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('');
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <EmptyState
                type="trucks"
                onAction={onAddTruck}
                actionLabel="Add Your First Truck"
                title="No Trucks Yet"
                description="Get started by adding your first truck to the fleet. You can add trucks, manage their details, track maintenance, and monitor their status all in one place."
              />
            )
          )
        }

        {/* Loading State */}
        {
          loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading trucks...</p>
            </div>
          )
        }

        {/* Error State */}
        {
          error && !loading && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <FaExclamationTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Something went wrong</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => loadData()}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg font-medium text-sm"
                  >
                    <FaSync className="w-4 h-4" />
                    Try Again
                  </button>
                  <button
                    onClick={() => setError(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )
        }
        {/* Truck Location Modal */}
        {showLocationModal && selectedTruck && (
          <TruckLocationModal
            isOpen={showLocationModal}
            onClose={() => {
              setShowLocationModal(false);
              // If we aren't showing details, clear the selection
              if (!showTruckDetails) {
                setSelectedTruck(null);
              }
            }}
            truck={selectedTruck}
            onLocationUpdated={async () => {
              await loadData(); // Refresh grid/list data
              setShowLocationModal(false);

              // If details view is open, refresh the selected truck data so user sees new location
              if (showTruckDetails) {
                try {
                  const updatedTruck = await fleetApi.getTruckById(selectedTruck.id);
                  if (updatedTruck) {
                    // Preserve the enriched fields if needed, or rely on what getTruckById returns
                    // The list view enriches with routes, so we might lose that if we just replacing with raw API result
                    // But for location update, raw API result is better than stale data.
                    // Let's re-enrich if possible or just merge.
                    setSelectedTruck((prev: any) => ({
                      ...prev,
                      ...updatedTruck,
                      currentLocation: updatedTruck.currentLocation // Ensure this is updated
                    }));
                  }
                } catch (e) {
                  console.error('Failed to refresh selected truck', e);
                }
              } else {
                setSelectedTruck(null);
              }
            }}
          />
        )}
      </div >
    </div >
  );
}; 