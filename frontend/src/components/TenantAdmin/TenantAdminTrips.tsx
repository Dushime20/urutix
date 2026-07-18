import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tripsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaRoute,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaSearch,
  FaFilter,
  FaEye,
  FaSync,
  FaMapMarkerAlt,
  FaUser,
  FaExclamationTriangle,
} from 'react-icons/fa';
import ActiveTrips from '../TenantDashboard/ActiveTrips';
import { StatCard } from '../EnliteUI/Cards/StatCard';
import { formatLocation } from '../../utils/formatLocation';

interface Trip {
  id: string;
  reference?: string;
  status: string;
  driverName?: string;
  truckNumber?: string;
  routeName?: string;
  origin?: string;
  destination?: string;
  cargoType?: string;
  cargoWeight?: number;
  distance?: number;
  estimatedDuration?: number;
  startTime?: string;
  endTime?: string;
  revenue?: number;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}

interface TripStats {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  scheduledTrips: number;
  totalRevenue: number;
  totalDistance: number;
}

const TenantAdminTrips: React.FC = () => {
  const { user } = useAuth();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'status' | 'revenue'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch trips
  const {
    data: tripsData,
    isLoading: tripsLoading,
    error: tripsError,
    refetch: refetchTrips,
  } = useQuery({
    queryKey: ['tenant-trips'],
    queryFn: async () => {
      try {
        const response = await tripsAPI.getAll({});
        const data = response?.data || response;
        if (data?.items && Array.isArray(data.items)) {
          return data.items;
        }
        if (data?.trips && Array.isArray(data.trips)) {
          return data.trips;
        }
        if (Array.isArray(data)) {
          return data;
        }
        return [];
      } catch (error: any) {
        console.error('Error fetching trips:', error);
        return [];
      }
    },
  });

  const trips: Trip[] = Array.isArray(tripsData) ? tripsData : [];

  // Calculate statistics
  const stats: TripStats = useMemo(() => {
    const totalTrips = trips.length;
    const activeTrips = trips.filter(
      (t) => t.status?.toLowerCase() === 'in_progress' || t.status?.toLowerCase() === 'active',
    ).length;
    const completedTrips = trips.filter(
      (t) => t.status?.toLowerCase() === 'completed' || t.status?.toLowerCase() === 'delivered',
    ).length;
    const scheduledTrips = trips.filter(
      (t) => t.status?.toLowerCase() === 'scheduled' || t.status?.toLowerCase() === 'pending',
    ).length;
    const totalRevenue = trips.reduce((sum, t) => {
      const revenue = typeof t.revenue === 'number' ? t.revenue : Number(t.revenue) || 0;
      return sum + revenue;
    }, 0);
    const totalDistance = trips.reduce((sum, t) => {
      const distance = typeof t.distance === 'number' ? t.distance : Number(t.distance) || 0;
      return sum + distance;
    }, 0);

    return {
      totalTrips,
      activeTrips,
      completedTrips,
      scheduledTrips,
      totalRevenue,
      totalDistance,
    };
  }, [trips]);

  // Filter and sort trips
  const filteredAndSortedTrips = useMemo(() => {
    const filtered = trips.filter((trip) => {
      const matchesSearch =
        !searchTerm ||
        trip.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.truckNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.routeName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || trip.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'revenue':
          aValue = typeof a.revenue === 'number' ? a.revenue : Number(a.revenue) || 0;
          bValue = typeof b.revenue === 'number' ? b.revenue : Number(b.revenue) || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [trips, searchTerm, statusFilter, sortBy, sortOrder]);

  const getStatusColor = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'delivered') return 'bg-green-100 text-green-800';
    if (s === 'in_progress' || s === 'active') return 'bg-blue-100 text-blue-800';
    if (s === 'scheduled' || s === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (s === 'cancelled') return 'bg-red-100 text-red-800';
    if (s === 'delayed') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'delivered') return <FaCheckCircle className="w-3 h-3" />;
    if (s === 'in_progress' || s === 'active') return <FaTruck className="w-3 h-3" />;
    if (s === 'scheduled' || s === 'pending') return <FaClock className="w-3 h-3" />;
    if (s === 'cancelled') return <FaExclamationTriangle className="w-3 h-3" />;
    return <FaRoute className="w-3 h-3" />;
  };

  if (tripsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 w-full max-w-full">
      {user?.tenantId && (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 mb-6">
          <ActiveTrips tenantId={user.tenantId} />
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaRoute className="text-blue-600" />
              Trip Management
            </h1>
            <p className="text-gray-600 text-sm mt-1">Monitor and manage trips in your tenant</p>
          </div>
          <button
            onClick={() => refetchTrips()}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
          >
            <FaSync className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard title="Total Trips"                     value={stats.totalTrips}                          icon={<FaRoute size={16} />}       color="primary"   variant="classic" />
          <StatCard title="Active"                          value={stats.activeTrips}                         icon={<FaTruck size={16} />}       color="info"      variant="classic" />
          <StatCard title="Completed"                       value={stats.completedTrips}                      icon={<FaCheckCircle size={16} />} color="success"   variant="classic" />
          <StatCard title="Scheduled"                       value={stats.scheduledTrips}                      icon={<FaClock size={16} />}       color="warning"   variant="classic" />
          <StatCard title="Revenue"                         value={`$${stats.totalRevenue.toFixed(0)}`}       icon={<FaDollarSign size={16} />}  color="purple"    variant="classic" />
          <StatCard title="Distance"                        value={`${stats.totalDistance.toFixed(0)} km`}    icon={<FaRoute size={16} />}       color="secondary" variant="classic" />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative">
            <FaSearch className="absolute left-2.5 top-2.5 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search trips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="delayed">Delayed</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="status">Sort by Status</option>
            <option value="revenue">Sort by Revenue</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <FaFilter className="w-3.5 h-3.5" />
            {sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {tripsError ? (
          <div className="p-6 text-center">
            <div className="text-red-600 mb-2 text-sm">Failed to load trips</div>
            <button
              onClick={() => refetchTrips()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Retry
            </button>
          </div>
        ) : filteredAndSortedTrips.length === 0 ? (
          <div className="p-12 text-center">
            <FaRoute className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No trips found</p>
            <p className="text-gray-500 text-sm">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No trips available'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Truck
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {trip.reference || trip.id.slice(0, 8)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {trip.routeName || (
                          <span className="flex items-center gap-1 text-xs">
                            <FaMapMarkerAlt className="w-3 h-3 text-green-500" />
                            {formatLocation(trip.origin, 'N/A')}
                            <span className="mx-1">→</span>
                            <FaMapMarkerAlt className="w-3 h-3 text-red-500" />
                            {formatLocation(trip.destination, 'N/A')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-700 flex items-center gap-1.5">
                        <FaUser className="w-3 h-3 text-gray-400" />
                        {trip.driverName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-700 flex items-center gap-1.5">
                        <FaTruck className="w-3 h-3 text-gray-400" />
                        {trip.truckNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          trip.status,
                        )}`}
                      >
                        {getStatusIcon(trip.status)}
                        {(trip.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {trip.revenue
                        ? `$${typeof trip.revenue === 'number' ? trip.revenue.toFixed(2) : Number(trip.revenue).toFixed(2)}`
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded transition-colors"
                        title="View Details"
                      >
                        <FaEye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantAdminTrips;

