import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Filter, Search, Eye, Edit, Trash2, Truck, User, MapPin } from 'lucide-react';
import { fleetApi } from '../services/fleetApi';

const Fleet = () => {
  const [activeTab, setActiveTab] = useState<'trucks' | 'drivers'>('trucks');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: trucks, isLoading: trucksLoading } = useQuery({
    queryKey: ['trucks', searchTerm, statusFilter],
    queryFn: () => fleetAPI.getTrucks({ 
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined 
    }),
  });

  const { data: drivers, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers', searchTerm],
    queryFn: () => fleetAPI.getDrivers({ search: searchTerm }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-success-100 text-success-800';
              case 'IN_TRANSIT':
        return 'bg-primary-100 text-primary-800';
      case 'maintenance':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-600 mt-2">Manage your trucks and drivers</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add {activeTab === 'trucks' ? 'Truck' : 'Driver'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('trucks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trucks'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Trucks
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'drivers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Drivers
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            {activeTab === 'trucks' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            )}
            <button className="btn btn-outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>

          {activeTab === 'trucks' ? (
            <div className="divide-y divide-gray-200">
              {trucksLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading trucks...</p>
                </div>
              ) : trucks?.length > 0 ? (
                trucks.map((truck: any) => (
                <div key={truck.id} className="py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {truck.licensePlate}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(truck.status)}`}>
                          {truck.status}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4" />
                          <span>{truck.make} {truck.model}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{truck.currentLocation || 'Unknown location'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{truck.currentDriver?.name || 'No driver assigned'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
              ) : (
                <div className="p-6 text-center">
                  <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No trucks found</p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {driversLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading drivers...</p>
                </div>
              ) : drivers?.length > 0 ? (
                drivers.map((driver: any) => (
                <div key={driver.id} className="py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {driver.firstName} {driver.lastName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                          {driver.status}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{driver.licenseNumber}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4" />
                          <span>{driver.currentTruck?.licensePlate || 'No truck assigned'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{driver.currentLocation || 'Unknown location'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
              ) : (
                <div className="p-6 text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No drivers found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Fleet; 