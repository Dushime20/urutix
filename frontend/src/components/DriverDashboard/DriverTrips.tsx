import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsAPI } from '../../services/api';
import { driverApi } from '../../services/driverApi';
import type { Trip } from '../../services/driverApi';
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
  FaBox,
  FaUser,
  FaTimes,
  FaPlay,
  FaPause,
  FaStop,
  FaCalendarAlt,
} from 'react-icons/fa';

interface DriverTripsProps {
  driverId: string;
}

interface TripStats {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  scheduledTrips: number;
  totalRevenue: number;
  totalDistance: number;
}

const DriverTrips: React.FC<DriverTripsProps> = ({ driverId }) => {
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'startTime' | 'distance' | 'revenue'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch current trip
  const { data: currentTrip, isLoading: currentTripLoading } = useQuery({
    queryKey: ['driver-current-trip', driverId],
    queryFn: () => driverApi.getCurrentTrip(driverId),
    enabled: !!driverId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch upcoming trips
  const { data: upcomingTrips, isLoading: upcomingLoading } = useQuery({
    queryKey: ['driver-upcoming-trips', driverId],
    queryFn: () => driverApi.getUpcomingTrips(driverId),
    enabled: !!driverId,
  });

  // Fetch trip history
  const { data: tripHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['driver-trip-history', driverId, 'all'],
    queryFn: () => driverApi.getTripHistory(driverId, 'all'),
    enabled: !!driverId,
  });

  // Combine all trips
  const allTrips: Trip[] = useMemo(() => {
    const trips: Trip[] = [];
    if (currentTrip) trips.push(currentTrip);
    if (upcomingTrips) trips.push(...upcomingTrips);
    if (tripHistory) trips.push(...tripHistory);
    // Remove duplicates by ID
    const uniqueTrips = trips.filter((trip, index, self) =>
      index === self.findIndex((t) => t.id === trip.id)
    );
    return uniqueTrips;
  }, [currentTrip, upcomingTrips, tripHistory]);

  // Trip actions mutations
  const startTripMutation = useMutation({
    mutationFn: (tripId: string) => driverApi.startTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip', driverId] });
      queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips', driverId] });
    },
  });

  const pauseTripMutation = useMutation({
    mutationFn: (tripId: string) => driverApi.pauseTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip', driverId] });
    },
  });

  const resumeTripMutation = useMutation({
    mutationFn: (tripId: string) => driverApi.resumeTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip', driverId] });
    },
  });

  const completeTripMutation = useMutation({
    mutationFn: (tripId: string) => driverApi.completeTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip', driverId] });
      queryClient.invalidateQueries({ queryKey: ['driver-trip-history', driverId] });
    },
  });

  // Calculate statistics
  const stats: TripStats = useMemo(() => {
    const totalTrips = allTrips.length;
    const activeTrips = allTrips.filter(
      (t) => t.status?.toLowerCase() === 'in_progress' || t.status?.toLowerCase() === 'active',
    ).length;
    const completedTrips = allTrips.filter(
      (t) => t.status?.toLowerCase() === 'completed' || t.status?.toLowerCase() === 'delivered',
    ).length;
    const scheduledTrips = allTrips.filter(
      (t) => t.status?.toLowerCase() === 'scheduled' || t.status?.toLowerCase() === 'planned',
    ).length;
    const totalRevenue = allTrips.reduce((sum, t) => sum + Number(t.earnings || 0), 0);
    const totalDistance = allTrips.reduce((sum, t) => sum + Number(t.distance || 0), 0);

    return {
      totalTrips,
      activeTrips,
      completedTrips,
      scheduledTrips,
      totalRevenue,
      totalDistance,
    };
  }, [allTrips]);

  // Filter and sort trips
  const filteredAndSortedTrips = useMemo(() => {
    let filtered = allTrips.filter((trip) => {
      const matchesSearch =
        !searchTerm ||
        trip.tripNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.origin?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destination?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.cargo?.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || trip.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    // Sort trips
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'startTime':
          aValue = a.scheduledDeparture ? new Date(a.scheduledDeparture).getTime() : 0;
          bValue = b.scheduledDeparture ? new Date(b.scheduledDeparture).getTime() : 0;
          break;
        case 'distance':
          aValue = Number(a.distance || 0);
          bValue = Number(b.distance || 0);
          break;
        case 'revenue':
          aValue = Number(a.earnings || 0);
          bValue = Number(b.earnings || 0);
          break;
        case 'createdAt':
        default:
          aValue = a.scheduledDeparture ? new Date(a.scheduledDeparture).getTime() : 0;
          bValue = b.scheduledDeparture ? new Date(b.scheduledDeparture).getTime() : 0;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [allTrips, searchTerm, statusFilter, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed' || statusLower === 'delivered') {
      return 'bg-green-100 text-green-800';
    }
    if (statusLower === 'in_progress' || statusLower === 'active') {
      return 'bg-blue-100 text-blue-800';
    }
    if (statusLower === 'scheduled' || statusLower === 'planned') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (statusLower === 'cancelled' || statusLower === 'cancelled') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTripAction = (tripId: string, action: 'start' | 'pause' | 'resume' | 'complete') => {
    switch (action) {
      case 'start':
        startTripMutation.mutate(tripId);
        break;
      case 'pause':
        pauseTripMutation.mutate(tripId);
        break;
      case 'resume':
        resumeTripMutation.mutate(tripId);
        break;
      case 'complete':
        completeTripMutation.mutate(tripId);
        break;
    }
  };

  const isLoading = currentTripLoading || upcomingLoading || historyLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Trips</h2>
          <p className="text-sm text-gray-600 mt-1">Manage and track your trips</p>
        </div>
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['driver-current-trip', driverId] });
            queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips', driverId] });
            queryClient.invalidateQueries({ queryKey: ['driver-trip-history', driverId] });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FaSync className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTrips}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaRoute className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Trips</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeTrips}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedTrips}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.scheduledTrips}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaClock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaDollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Distance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalDistance.toFixed(0)} km
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FaMapMarkerAlt className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Current Trip Banner */}
      {currentTrip && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FaTruck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Current Trip: {currentTrip.tripNumber}</p>
                <p className="text-sm text-gray-600">
                  {currentTrip.origin?.address} → {currentTrip.destination?.address}
                </p>
                {currentTrip.progress !== undefined && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${currentTrip.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{currentTrip.progress}% Complete</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentTrip.status?.toLowerCase() === 'in_progress' && (
                <>
                  <button
                    onClick={() => handleTripAction(currentTrip.id, 'pause')}
                    className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                  >
                    <FaPause className="w-3 h-3" />
                    Pause
                  </button>
                  <button
                    onClick={() => handleTripAction(currentTrip.id, 'complete')}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <FaStop className="w-3 h-3" />
                    Complete
                  </button>
                </>
              )}
              {currentTrip.status?.toLowerCase() === 'paused' && (
                <button
                  onClick={() => handleTripAction(currentTrip.id, 'resume')}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaPlay className="w-3 h-3" />
                  Resume
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by trip number, origin, destination, cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="startTime">Sort by Start Time</option>
              <option value="distance">Sort by Distance</option>
              <option value="revenue">Sort by Revenue</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading trips...</span>
          </div>
        ) : filteredAndSortedTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FaRoute className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">No trips found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'You don\'t have any trips yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trip Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{trip.tripNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <FaMapMarkerAlt className="w-3 h-3 text-green-500" />
                          <span className="truncate max-w-xs">{trip.origin?.address || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <FaMapMarkerAlt className="w-3 h-3 text-red-500" />
                          <span className="truncate max-w-xs">{trip.destination?.address || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <FaBox className="w-3 h-3 text-gray-400" />
                          <span>{trip.cargo?.type || trip.cargo?.description || 'N/A'}</span>
                        </div>
                        {trip.cargo?.weight && (
                          <div className="text-xs text-gray-500 mt-1">
                            {trip.cargo.weight} kg
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {trip.distance ? `${trip.distance.toFixed(0)} km` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          trip.status || '',
                        )}`}
                      >
                        {trip.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(trip.scheduledDeparture)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {trip.earnings ? formatCurrency(trip.earnings) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedTrip(trip);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        {trip.status?.toLowerCase() === 'scheduled' && (
                          <button
                            onClick={() => handleTripAction(trip.id, 'start')}
                            className="text-green-600 hover:text-green-900"
                            title="Start Trip"
                          >
                            <FaPlay className="w-4 h-4" />
                          </button>
                        )}
                        {trip.status?.toLowerCase() === 'in_progress' && (
                          <button
                            onClick={() => handleTripAction(trip.id, 'pause')}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Pause Trip"
                          >
                            <FaPause className="w-4 h-4" />
                          </button>
                        )}
                        {trip.status?.toLowerCase() === 'paused' && (
                          <button
                            onClick={() => handleTripAction(trip.id, 'resume')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Resume Trip"
                          >
                            <FaPlay className="w-4 h-4" />
                          </button>
                        )}
                        {(trip.status?.toLowerCase() === 'in_progress' ||
                          trip.status?.toLowerCase() === 'paused') && (
                          <button
                            onClick={() => handleTripAction(trip.id, 'complete')}
                            className="text-green-600 hover:text-green-900"
                            title="Complete Trip"
                          >
                            <FaCheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trip Details Modal */}
      {showDetailsModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Trip Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTrip(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Trip Number</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedTrip.tripNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusColor(
                      selectedTrip.status || '',
                    )}`}
                  >
                    {selectedTrip.status || 'Unknown'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Route</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <FaMapMarkerAlt className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Origin</p>
                      <p className="text-sm text-gray-600">{selectedTrip.origin?.address || 'N/A'}</p>
                      <p className="text-xs text-gray-500">
                        {selectedTrip.origin?.city}, {selectedTrip.origin?.state}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FaMapMarkerAlt className="w-4 h-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Destination</p>
                      <p className="text-sm text-gray-600">
                        {selectedTrip.destination?.address || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedTrip.destination?.city}, {selectedTrip.destination?.state}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Distance</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedTrip.distance ? `${selectedTrip.distance.toFixed(0)} km` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estimated Duration</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedTrip.estimatedDuration
                      ? `${Math.round(selectedTrip.estimatedDuration / 60)} hours`
                      : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedTrip.cargo && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Cargo Information</p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <FaBox className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedTrip.cargo.type || selectedTrip.cargo.description || 'N/A'}
                        </p>
                        {selectedTrip.cargo.weight && (
                          <p className="text-xs text-gray-500">Weight: {selectedTrip.cargo.weight} kg</p>
                        )}
                      </div>
                    </div>
                    {selectedTrip.cargo.specialInstructions && (
                      <p className="text-xs text-gray-600 mt-2">
                        <span className="font-medium">Special Instructions:</span>{' '}
                        {selectedTrip.cargo.specialInstructions}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedTrip.customer && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Customer Information</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <FaUser className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedTrip.customer.name}</p>
                        <p className="text-xs text-gray-500">{selectedTrip.customer.phone}</p>
                        {selectedTrip.customer.email && (
                          <p className="text-xs text-gray-500">{selectedTrip.customer.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTrip.truck && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Truck Information</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <FaTruck className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedTrip.truck.plateNumber}
                        </p>
                        <p className="text-xs text-gray-500">{selectedTrip.truck.model}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Scheduled Departure</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(selectedTrip.scheduledDeparture)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estimated Arrival</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {formatDate(selectedTrip.estimatedArrival)}
                  </p>
                </div>
                {selectedTrip.actualDeparture && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Actual Departure</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(selectedTrip.actualDeparture)}
                    </p>
                  </div>
                )}
                {selectedTrip.actualArrival && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Actual Arrival</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(selectedTrip.actualArrival)}
                    </p>
                  </div>
                )}
              </div>

              {selectedTrip.progress !== undefined && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Progress</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${selectedTrip.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{selectedTrip.progress}% Complete</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-500">Earnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {selectedTrip.earnings ? formatCurrency(selectedTrip.earnings) : 'N/A'}
                </p>
              </div>

              {selectedTrip.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-sm text-gray-900 mt-1">{selectedTrip.notes}</p>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTrip(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedTrip.status?.toLowerCase() === 'scheduled' && (
                <button
                  onClick={() => {
                    handleTripAction(selectedTrip.id, 'start');
                    setShowDetailsModal(false);
                    setSelectedTrip(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Trip
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverTrips;

