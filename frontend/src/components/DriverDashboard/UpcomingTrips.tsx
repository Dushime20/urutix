import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Package, 
  Truck, 
  User,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock as ClockIcon
} from 'lucide-react';

interface Trip {
  id: string;
  tripNumber: string;
  status: 'SCHEDULED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  origin: {
    address: string;
    city: string;
    state: string;
    coordinates: [number, number];
  };
  destination: {
    address: string;
    city: string;
    state: string;
    coordinates: [number, number];
  };
  scheduledDeparture: string;
  estimatedArrival: string;
  distance: number;
  estimatedDuration: number;
  cargo: {
    description: string;
    weight: number;
    type: string;
    specialInstructions?: string;
  };
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  earnings: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes?: string;
}

interface UpcomingTripsProps {
  trips?: Trip[];
  loading?: boolean;
}

export const UpcomingTrips: React.FC<UpcomingTripsProps> = ({ trips, loading }) => {
  const [showAll, setShowAll] = useState(false);

  // Mock data for demonstration
  const mockTrips: Trip[] = [
    {
      id: '1',
      tripNumber: 'TRIP-2024-002',
      status: 'SCHEDULED',
      origin: {
        address: '123 Main St',
        city: 'Chicago',
        state: 'IL',
        coordinates: [41.8781, -87.6298]
      },
      destination: {
        address: '456 Oak Ave',
        city: 'Detroit',
        state: 'MI',
        coordinates: [42.3314, -83.0458]
      },
      scheduledDeparture: '2024-01-26T08:00:00Z',
      estimatedArrival: '2024-01-26T16:00:00Z',
      distance: 450,
      estimatedDuration: 480,
      cargo: {
        description: 'Electronics and appliances',
        weight: 2500,
        type: 'General Freight'
      },
      customer: {
        name: 'TechCorp Industries',
        phone: '+1-555-0123',
        email: 'dispatch@techcorp.com'
      },
      earnings: 850,
      priority: 'HIGH',
      notes: 'Handle with care - fragile items'
    },
    {
      id: '2',
      tripNumber: 'TRIP-2024-003',
      status: 'ASSIGNED',
      origin: {
        address: '789 Pine St',
        city: 'Detroit',
        state: 'MI',
        coordinates: [42.3314, -83.0458]
      },
      destination: {
        address: '321 Elm St',
        city: 'Cleveland',
        state: 'OH',
        coordinates: [41.4993, -81.6944]
      },
      scheduledDeparture: '2024-01-27T06:00:00Z',
      estimatedArrival: '2024-01-27T12:00:00Z',
      distance: 320,
      estimatedDuration: 360,
      cargo: {
        description: 'Automotive parts',
        weight: 1800,
        type: 'Automotive'
      },
      customer: {
        name: 'AutoParts Plus',
        phone: '+1-555-0456',
        email: 'shipping@autoparts.com'
      },
      earnings: 650,
      priority: 'MEDIUM'
    },
    {
      id: '3',
      tripNumber: 'TRIP-2024-004',
      status: 'SCHEDULED',
      origin: {
        address: '654 Maple Dr',
        city: 'Cleveland',
        state: 'OH',
        coordinates: [41.4993, -81.6944]
      },
      destination: {
        address: '987 Cedar Ln',
        city: 'Pittsburgh',
        state: 'PA',
        coordinates: [40.4406, -79.9959]
      },
      scheduledDeparture: '2024-01-28T07:00:00Z',
      estimatedArrival: '2024-01-28T11:00:00Z',
      distance: 180,
      estimatedDuration: 240,
      cargo: {
        description: 'Medical supplies',
        weight: 800,
        type: 'Medical'
      },
      customer: {
        name: 'MedSupply Co',
        phone: '+1-555-0789',
        email: 'logistics@medsupply.com'
      },
      earnings: 450,
      priority: 'URGENT',
      notes: 'Time-sensitive medical supplies - priority handling required'
    }
  ];

  const currentTrips = trips || mockTrips;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <CheckCircle className="w-4 h-4" />;
      case 'MEDIUM':
        return <ClockIcon className="w-4 h-4" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4" />;
      case 'URGENT':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDistance = (distance: number) => {
    return `${distance} km`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getDaysUntilTrip = (departureDate: string) => {
    const today = new Date();
    const departure = new Date(departureDate);
    const diffTime = departure.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayedTrips = showAll ? currentTrips : currentTrips.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-lg shadow"
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Upcoming Trips
          </h3>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showAll ? 'Show Less' : `Show All (${currentTrips.length})`}
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        <AnimatePresence mode="popLayout">
          {displayedTrips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ backgroundColor: '#f9fafb' }}
              className="p-6 transition-colors"
            >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Trip Header */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                      {trip.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(trip.priority)} flex items-center space-x-1`}>
                      {getPriorityIcon(trip.priority)}
                      <span>{trip.priority}</span>
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">#{trip.tripNumber}</span>
                </div>

                {/* Route Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                  {/* Origin */}
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Origin</h4>
                      <p className="text-gray-700">{trip.origin.address}</p>
                      <p className="text-gray-500 text-sm">{trip.origin.city}, {trip.origin.state}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Departure: {formatDateTime(trip.scheduledDeparture)}
                      </p>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Destination</h4>
                      <p className="text-gray-700">{trip.destination.address}</p>
                      <p className="text-gray-500 text-sm">{trip.destination.city}, {trip.destination.state}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        ETA: {formatDateTime(trip.estimatedArrival)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{formatDistance(trip.distance)}</div>
                    <div className="text-xs text-gray-500">Distance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{formatDuration(trip.estimatedDuration)}</div>
                    <div className="text-xs text-gray-500">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{formatCurrency(trip.earnings)}</div>
                    <div className="text-xs text-gray-500">Earnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{trip.cargo.weight} kg</div>
                    <div className="text-xs text-gray-500">Cargo Weight</div>
                  </div>
                </div>

                {/* Cargo and Customer */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <h5 className="font-medium text-gray-900">Cargo Details</h5>
                    </div>
                    <p className="text-sm text-gray-700">{trip.cargo.description}</p>
                    <p className="text-xs text-gray-500">{trip.cargo.type}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <h5 className="font-medium text-gray-900">Customer</h5>
                    </div>
                    <p className="text-sm text-gray-700">{trip.customer.name}</p>
                    <p className="text-xs text-gray-500">{trip.customer.phone}</p>
                  </div>
                </div>

                {/* Notes and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {trip.notes && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 pl-3 py-2 mb-3">
                        <p className="text-sm text-yellow-800">{trip.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>
                        {getDaysUntilTrip(trip.scheduledDeparture) === 0 
                          ? 'Today' 
                          : getDaysUntilTrip(trip.scheduledDeparture) === 1 
                            ? 'Tomorrow' 
                            : `In ${getDaysUntilTrip(trip.scheduledDeparture)} days`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                    >
                      View Details
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>

      {currentTrips.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 text-center"
        >
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No upcoming trips scheduled</p>
          <p className="text-sm text-gray-400">Check back later for new assignments</p>
        </motion.div>
      )}
    </motion.div>
  );
};
