import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FaTruck,
  FaUser,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaSearch,
  FaRoute,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaSortAmountDown,
  FaTimes
} from 'react-icons/fa';
import { FiGrid, FiList } from 'react-icons/fi';
import { tripsAPI } from '../services/api';
import logoUrutiX from '../assets/logo-urutix.svg';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';

interface Trip {
  id: string;
  tripNumber: string;
  loadId: string;
  truckId: string;
  driverId: string;
  status: string;
  plannedStartTime: string | Date;
  plannedEndTime: string | Date;
  actualStartTime?: string | Date;
  actualEndTime?: string | Date;
  agreedPrice: number;
  pickupLocation: string;
  deliveryLocation: string;
  driverName: string;
  truckPlate: string;
}

interface SortConfig {
  key: keyof Trip | 'date';
  direction: 'asc' | 'desc';
}

const TripManagement: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'planned' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const { data: tripsData, isLoading: loading, error } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripsAPI.getAll({ limit: 100 }),
    select: (response) => {
      // Map the API response to the component's Trip interface
      return response.data.data.map((trip: any) => ({
        id: trip.id,
        tripNumber: trip.tripNumber || 'N/A',
        loadId: trip.load?.reference || trip.loadId || 'N/A',
        truckId: trip.truckId,
        driverId: trip.driverId,
        status: trip.status,
        plannedStartTime: new Date(trip.plannedStartTime),
        plannedEndTime: new Date(trip.plannedEndTime),
        actualStartTime: trip.actualStartTime ? new Date(trip.actualStartTime) : undefined,
        actualEndTime: trip.actualEndTime ? new Date(trip.actualEndTime) : undefined,
        agreedPrice: Number(trip.agreedPrice) || 0,
        pickupLocation: trip.pickupLocation?.city || trip.load?.origin?.city || 'Unknown Origin',
        deliveryLocation: trip.deliveryLocation?.city || trip.load?.destination?.city || 'Unknown Destination',
        driverName: trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : 'Unassigned',
        truckPlate: trip.truck?.plateNumber || 'Unassigned'
      }));
    }
  });

  if (error) {
    toast.error('Failed to load trips');
  }

  const trips = tripsData || [];

  // Filter Logic
  const filteredTrips = trips.filter((trip: Trip) => {
    // Status Filter
    if (filter !== 'all' && trip.status.toLowerCase() !== filter) return false;

    // Search Filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        trip.tripNumber.toLowerCase().includes(searchLower) ||
        trip.driverName.toLowerCase().includes(searchLower) ||
        trip.truckPlate.toLowerCase().includes(searchLower) ||
        trip.pickupLocation.toLowerCase().includes(searchLower) ||
        trip.deliveryLocation.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Sort Logic
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    let aValue: any = a[sortConfig.key as keyof Trip];
    let bValue: any = b[sortConfig.key as keyof Trip];

    if (sortConfig.key === 'date') {
      aValue = new Date(a.plannedStartTime).getTime();
      bValue = new Date(b.plannedStartTime).getTime();
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Helper Functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'PLANNED': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'DELAYED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <FaCheckCircle className="text-green-500" />;
      case 'IN_PROGRESS': return <FaTruck className="text-blue-500" />;
      case 'PLANNED': return <FaClock className="text-yellow-500" />;
      case 'CANCELLED': return <FaExclamationTriangle className="text-red-500" />;
      case 'DELAYED': return <FaExclamationTriangle className="text-orange-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50 p-6">
      {/* Background Logo */}
      <img
        src={logoUrutiX}
        alt="UrutiX Logo Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-5 z-0"
        style={{ objectPosition: 'center' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trip Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage your fleet trips</p>
        </div>

        {/* Stats Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trips</p>
                <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
              </div>
              <FaRoute className="w-8 h-8 text-[#345E85]" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {trips.filter((t: Trip) => t.status === 'COMPLETED').length}
                </p>
              </div>
              <FaCheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {trips.filter((t: Trip) => t.status === 'IN_PROGRESS').length}
                </p>
              </div>
              <FaTruck className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Planned</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {trips.filter((t: Trip) => t.status === 'PLANNED').length}
                </p>
              </div>
              <FaClock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search trips by ID, driver, truck, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              {/* Status Pills */}
              <div className="flex items-center gap-1 border border-gray-200 rounded-md p-0.5 bg-gray-50">
                {(['all', 'planned', 'in_progress', 'completed'] as const).map((statusOption) => (
                  <button
                    key={statusOption}
                    onClick={() => setFilter(statusOption)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-all whitespace-nowrap ${filter === statusOption
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {statusOption === 'all'
                      ? 'All'
                      : statusOption.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                ))}
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
            Showing {sortedTrips.length} of {trips.length} trips
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:inline">Sort by:</span>
            <select
              value={sortConfig.key}
              onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value as keyof Trip | 'date' })}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="date">Date</option>
              <option value="agreedPrice">Price</option>
              <option value="status">Status</option>
            </select>
            <button
              onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
              className="p-1 text-gray-500 hover:text-gray-700"
              title={sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}
            >
              <FaSortAmountDown className={`transform ${sortConfig.direction === 'asc' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {sortedTrips.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FaRoute className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No trips found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            {/* GRID VIEW */}
            {view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedTrips.map((trip: Trip) => (
                  <div key={trip.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <FaRoute className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{trip.tripNumber}</h3>
                          <p className="text-xs text-gray-500">Ref: {trip.loadId}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                        {trip.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <FaMapMarkerAlt className="w-4 h-4 mt-0.5 text-gray-400" />
                        <div className="flex-1">
                          <p><span className="font-medium text-gray-900">From:</span> {trip.pickupLocation}</p>
                          <p><span className="font-medium text-gray-900">To:</span> {trip.deliveryLocation}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaTruck className="w-4 h-4 text-gray-400" />
                        <span>{trip.truckPlate}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaUser className="w-4 h-4 text-gray-400" />
                        <span>{trip.driverName}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                          <span>{formatDate(trip.plannedStartTime)}</span>
                        </div>
                        <div className="font-semibold text-gray-900">
                          ${trip.agreedPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setSelectedTrip(trip)}
                        className="w-full py-2 bg-gray-50 text-gray-700 font-medium rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors"
                      >
                        <FaEye className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW (Table) */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle / Driver</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedTrips.map((trip: Trip) => (
                        <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                <FaRoute className="w-4 h-4 text-primary-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{trip.tripNumber}</div>
                                <div className="text-xs text-gray-500">Ref: {trip.loadId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                              {trip.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                {trip.pickupLocation}
                              </div>
                              <div className="border-l border-gray-300 h-3 ml-0.5 my-0.5"></div>
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                {trip.deliveryLocation}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 flex items-center gap-2">
                              <FaTruck className="text-gray-400" /> {trip.truckPlate}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                              <FaUser className="text-gray-400" /> {trip.driverName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div>{formatDate(trip.plannedStartTime)}</div>
                            <div className="text-xs text-gray-500">to {formatDate(trip.plannedEndTime)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            ${trip.agreedPrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setSelectedTrip(trip)}
                              className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg"
                            >
                              <FaEye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Trip Details Modal */}
      <Dialog open={!!selectedTrip} onOpenChange={(open) => !open && setSelectedTrip(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaRoute className="text-primary-600" />
              Trip Details: {selectedTrip?.tripNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedTrip && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg flex items-center justify-between ${getStatusColor(selectedTrip.status).replace('text-', 'bg-').replace('100', '50')}`}>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedTrip.status)}
                  <span className="font-semibold">{selectedTrip.status.replace('_', ' ')}</span>
                </div>
                <div className="text-sm font-medium">
                  Load Ref: {selectedTrip.loadId}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Route Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Route Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">From</label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <FaMapMarkerAlt className="text-green-500" />
                        {selectedTrip.pickupLocation}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">To</label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <FaMapMarkerAlt className="text-red-500" />
                        {selectedTrip.deliveryLocation}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Schedule</label>
                      <div className="text-sm text-gray-900 mt-1">
                        <p>Start: {new Date(selectedTrip.plannedStartTime).toLocaleString()}</p>
                        <p>End: {new Date(selectedTrip.plannedEndTime).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2">Assignment Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Truck</label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <FaTruck className="text-gray-400" />
                        {selectedTrip.truckPlate}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Driver</label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <FaUser className="text-gray-400" />
                        {selectedTrip.driverName}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase font-medium">Price</label>
                      <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                        <FaMoneyBillWave className="text-green-600" />
                        ${selectedTrip.agreedPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Future Implementation) */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripManagement;
