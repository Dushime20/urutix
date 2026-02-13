import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaTruck, FaUser, FaBuilding, FaCheckCircle, 
  FaExclamationTriangle, FaClock, FaMapMarkerAlt,
  FaSearch, FaEye, FaStar
} from 'react-icons/fa';
import { Doughnut } from 'react-chartjs-2';
import { fleetApi } from '../../services/fleetApi';
import type { TruckOwner, Truck } from '../../services/fleetApi';
import TruckOwnerDetailsDrawer from './TruckOwnerDetailsDrawer';
import TruckDetailsDrawer from './TruckDetailsDrawer';

interface FleetOverviewProps {
  tenantId: string;
}

const FleetOverview: React.FC<FleetOverviewProps> = ({ tenantId }) => {
  const [selectedView, setSelectedView] = useState<'owners' | 'trucks'>('owners');
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerDrawerOpen, setOwnerDrawerOpen] = useState(false);
  const [truckDrawerOpen, setTruckDrawerOpen] = useState(false);
  const [selectedOwnerForDrawer, setSelectedOwnerForDrawer] = useState<string | null>(null);
  const [selectedTruckForDrawer, setSelectedTruckForDrawer] = useState<string | null>(null);

  // Fetch fleet summary
  const { data: summaryData } = useQuery({
    queryKey: ['fleet-summary', tenantId],
    queryFn: () => fleetApi.getFleetSummary(tenantId),
    enabled: !!tenantId,
  });

  // Fetch truck owners
  const { data: ownersData, isLoading: ownersLoading } = useQuery({
    queryKey: ['truck-owners', tenantId, searchTerm, statusFilter],
    queryFn: () => fleetApi.getTruckOwners(tenantId, {
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page: 1,
      limit: 50,
    }),
    enabled: !!tenantId && selectedView === 'owners',
  });

  // Fetch trucks (filtered by owner if selected)
  const { data: trucksData, isLoading: trucksLoading } = useQuery({
    queryKey: ['trucks', tenantId, selectedOwnerId, searchTerm, statusFilter],
    queryFn: () => fleetApi.getTrucks(tenantId, {
      ownerId: selectedOwnerId || undefined,
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page: 1,
      limit: 50,
    }),
    enabled: !!tenantId && selectedView === 'trucks',
  });

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'AVAILABLE':
        return 'text-green-600 bg-green-100';
      case 'IN_TRANSIT':
        return 'text-blue-600 bg-blue-100';
      case 'MAINTENANCE':
        return 'text-yellow-600 bg-yellow-100';
      case 'INACTIVE':
      case 'OUT_OF_SERVICE':
        return 'text-red-600 bg-red-100';
      case 'SUSPENDED':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'AVAILABLE':
        return <FaCheckCircle className="w-4 h-4" />;
      case 'MAINTENANCE':
        return <FaClock className="w-4 h-4" />;
      case 'INACTIVE':
      case 'OUT_OF_SERVICE':
      case 'SUSPENDED':
        return <FaExclamationTriangle className="w-4 h-4" />;
      default:
        return <FaClock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const statusChartData = summaryData ? {
    labels: ['Active', 'Maintenance', 'Inactive'],
    datasets: [
      {
        data: [summaryData.activeTrucks, summaryData.maintenanceTrucks, summaryData.inactiveTrucks],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 12 } }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FaBuilding className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Truck Owners</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryData?.totalTruckOwners || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {summaryData?.activeTruckOwners || 0} active
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 rounded-lg">
              <FaTruck className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Trucks</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryData?.totalTrucks || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {summaryData?.activeTrucks || 0} active
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <FaCheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Trucks</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryData?.activeTrucks || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summaryData?.totalTrucks ? 
                  Math.round((summaryData.activeTrucks / summaryData.totalTrucks) * 100) : 0}% utilization
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-50 rounded-lg">
              <FaUser className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Drivers</p>
              <p className="text-2xl font-bold text-gray-900">
                {summaryData?.totalDrivers || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {summaryData?.activeDrivers || 0} active
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution Chart */}
      {statusChartData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fleet Status Distribution</h3>
          <div className="h-64">
            <Doughnut data={statusChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => {
                setSelectedView('owners');
                setSelectedOwnerId(null);
              }}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                selectedView === 'owners'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaBuilding className="inline-block w-4 h-4 mr-2" />
              Truck Owners
            </button>
            <button
              onClick={() => setSelectedView('trucks')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                selectedView === 'trucks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaTruck className="inline-block w-4 h-4 mr-2" />
              All Trucks
            </button>
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${selectedView === 'owners' ? 'truck owners' : 'trucks'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {selectedView === 'owners' ? (
            // Truck Owners View
            <div className="overflow-x-auto">
              {ownersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trucks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trips
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ownersData?.data.map((owner) => (
                      <tr key={owner.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{owner.name}</div>
                            {owner.companyName && (
                              <div className="text-sm text-gray-500">{owner.companyName}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{owner.email}</div>
                          {owner.phone && (
                            <div className="text-sm text-gray-500">{owner.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {owner.totalTrucks} total
                          </div>
                          <div className="text-sm text-green-600">
                            {owner.activeTrucks} active
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {owner.totalTrips}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(owner.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FaStar className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm text-gray-900">{owner.averageRating.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(owner.status)}`}>
                            {getStatusIcon(owner.status)}
                            <span className="ml-1.5 capitalize">{owner.status.toLowerCase()}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedOwnerForDrawer(owner.id);
                              setOwnerDrawerOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="View details"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            // Trucks View
            <div>
              {selectedOwnerId && (
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing trucks for selected owner
                  </div>
                  <button
                    onClick={() => setSelectedOwnerId(null)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Show all trucks
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
                {trucksLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Truck
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Owner
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Driver
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Performance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trucksData?.data.map((truck) => (
                        <tr key={truck.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {truck.plateNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {truck.make} {truck.model} ({truck.year})
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{truck.owner.name}</div>
                            {truck.owner.companyName && (
                              <div className="text-sm text-gray-500">{truck.owner.companyName}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {truck.driver ? truck.driver.name : 'Unassigned'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{truck.location}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(truck.status)}`}>
                              {getStatusIcon(truck.status)}
                              <span className="ml-1.5 capitalize">{truck.status.toLowerCase().replace('_', ' ')}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {truck.totalTrips} trips
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(truck.totalRevenue)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedTruckForDrawer(truck.id);
                                setTruckDrawerOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View details"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      {selectedOwnerForDrawer && (
        <TruckOwnerDetailsDrawer
          ownerId={selectedOwnerForDrawer}
          tenantId={tenantId}
          isOpen={ownerDrawerOpen}
          onClose={() => {
            setOwnerDrawerOpen(false);
            setSelectedOwnerForDrawer(null);
          }}
          onViewTruck={(truckId) => {
            setOwnerDrawerOpen(false);
            setSelectedTruckForDrawer(truckId);
            setTruckDrawerOpen(true);
          }}
        />
      )}

      {selectedTruckForDrawer && (
        <TruckDetailsDrawer
          truckId={selectedTruckForDrawer}
          tenantId={tenantId}
          isOpen={truckDrawerOpen}
          onClose={() => {
            setTruckDrawerOpen(false);
            setSelectedTruckForDrawer(null);
          }}
        />
      )}
    </div>
  );
};

export default FleetOverview;
