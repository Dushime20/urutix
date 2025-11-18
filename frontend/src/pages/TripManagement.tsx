import React, { useState, useEffect } from 'react';
import { FaTruck, FaUser, FaMapMarkerAlt, FaClock, FaCheckCircle, FaExclamationTriangle, FaEye } from 'react-icons/fa';

interface Trip {
  id: string;
  tripNumber: string;
  loadId: string;
  truckId: string;
  driverId: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED';
  plannedStartTime: Date;
  plannedEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  agreedPrice: number;
  pickupLocation: string;
  deliveryLocation: string;
  driverName: string;
  truckPlate: string;
}

const TripManagement: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'planned' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    // Simulate fetching trips data
    setTimeout(() => {
      setTrips([
        {
          id: 'trip-1',
          tripNumber: 'TRIP-2024-001',
          loadId: 'load-123',
          truckId: 'truck-456',
          driverId: 'driver-789',
          status: 'IN_PROGRESS',
          plannedStartTime: new Date('2024-01-15T10:00:00'),
          plannedEndTime: new Date('2024-01-16T18:00:00'),
          actualStartTime: new Date('2024-01-15T10:30:00'),
          agreedPrice: 2500,
          pickupLocation: 'Los Angeles, CA',
          deliveryLocation: 'San Francisco, CA',
          driverName: 'John Smith',
          truckPlate: 'ABC-123'
        },
        {
          id: 'trip-2',
          tripNumber: 'TRIP-2024-002',
          loadId: 'load-124',
          truckId: 'truck-457',
          driverId: 'driver-790',
          status: 'PLANNED',
          plannedStartTime: new Date('2024-01-17T08:00:00'),
          plannedEndTime: new Date('2024-01-18T16:00:00'),
          agreedPrice: 3200,
          pickupLocation: 'Chicago, IL',
          deliveryLocation: 'Detroit, MI',
          driverName: 'Mike Johnson',
          truckPlate: 'XYZ-789'
        },
        {
          id: 'trip-3',
          tripNumber: 'TRIP-2024-003',
          loadId: 'load-125',
          truckId: 'truck-458',
          driverId: 'driver-791',
          status: 'COMPLETED',
          plannedStartTime: new Date('2024-01-10T09:00:00'),
          plannedEndTime: new Date('2024-01-11T17:00:00'),
          actualStartTime: new Date('2024-01-10T09:15:00'),
          actualEndTime: new Date('2024-01-11T16:45:00'),
          agreedPrice: 1800,
          pickupLocation: 'Miami, FL',
          deliveryLocation: 'Orlando, FL',
          driverName: 'Sarah Wilson',
          truckPlate: 'DEF-456'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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

  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true;
    return trip.status.toLowerCase().replace('_', '') === filter;
  });

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trip Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage your fleet trips</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaTruck className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Trips</p>
                <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trips.filter(t => t.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaTruck className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trips.filter(t => t.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaClock className="text-yellow-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Planned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trips.filter(t => t.status === 'PLANNED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'all' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Trips
              </button>
              <button
                onClick={() => setFilter('planned')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'planned' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Planned
              </button>
              <button
                onClick={() => setFilter('in_progress')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'in_progress' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'completed' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {/* Trips List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Trip Details</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredTrips.map((trip) => (
              <div key={trip.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(trip.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                        {trip.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{trip.tripNumber}</h3>
                      <p className="text-sm text-gray-600">
                        {trip.pickupLocation} → {trip.deliveryLocation}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">${trip.agreedPrice.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">
                      {trip.plannedStartTime.toLocaleDateString()} - {trip.plannedEndTime.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <FaTruck className="text-gray-400" />
                    <span className="text-gray-600">Truck: {trip.truckPlate}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaUser className="text-gray-400" />
                    <span className="text-gray-600">Driver: {trip.driverName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span className="text-gray-600">Load ID: {trip.loadId}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end space-x-2">
                  <button className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center space-x-1">
                    <FaEye className="text-xs" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredTrips.length === 0 && (
            <div className="px-6 py-8 text-center">
              <FaTruck className="text-gray-400 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
              <p className="text-gray-600">No trips match the current filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripManagement;
