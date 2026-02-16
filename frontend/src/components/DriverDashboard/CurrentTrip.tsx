import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  Package, 
  Truck, 
  Navigation, 
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Square,
  User
} from 'lucide-react';

interface Trip {
  id: string;
  tripNumber: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
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
  cargo: {
    description: string;
    weight: number;
    type: string;
    specialInstructions?: string;
  };
  estimatedDeparture: string;
  estimatedArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  distance: number;
  estimatedDuration: number;
  currentLocation?: [number, number];
  progress: number;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  truck: {
    id: string;
    plateNumber: string;
    model: string;
  };
  earnings: number;
  notes?: string;
}

interface CurrentTripProps {
  trip: Trip;
}

export const CurrentTrip: React.FC<CurrentTripProps> = ({ trip }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Play className="w-4 h-4" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <AlertTriangle className="w-4 h-4" />;
      case 'ON_HOLD':
        return <Pause className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
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

  const handleStartTrip = () => {
    // API call to start trip
    console.log('Starting trip:', trip.id);
  };

  const handlePauseTrip = () => {
    setIsPaused(!isPaused);
    // API call to pause/resume trip
    console.log('Trip paused/resumed:', trip.id);
  };

  const handleCompleteTrip = () => {
    // API call to complete trip
    console.log('Completing trip:', trip.id);
  };

  const handleContactCustomer = () => {
    setShowCustomerInfo(!showCustomerInfo);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-lg shadow-lg overflow-hidden"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Current Trip</h2>
              <p className="text-blue-100 text-sm">#{trip.tripNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
              <span className="flex items-center space-x-1">
                {getStatusIcon(trip.status)}
                <span>{trip.status.replace('_', ' ')}</span>
              </span>
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-6"
      >
        {/* Trip Progress */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Trip Progress</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-gray-500"
            >
              {trip.progress}%
            </motion.span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${trip.progress}%` }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="bg-blue-600 h-3 rounded-full"
            ></motion.div>
          </div>
        </motion.div>

        {/* Route Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Origin */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Origin</h3>
                <p className="text-gray-700">{trip.origin.address}</p>
                <p className="text-gray-500 text-sm">{trip.origin.city}, {trip.origin.state}</p>
                <p className="text-gray-400 text-xs mt-1">
                  Departure: {formatTime(trip.estimatedDeparture)}
                </p>
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Destination</h3>
                <p className="text-gray-700">{trip.destination.address}</p>
                <p className="text-gray-500 text-sm">{trip.destination.city}, {trip.destination.state}</p>
                <p className="text-gray-400 text-xs mt-1">
                  ETA: {formatTime(trip.estimatedArrival)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{trip.distance} km</div>
            <div className="text-sm text-gray-500">Distance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatDuration(trip.estimatedDuration)}</div>
            <div className="text-sm text-gray-500">Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">${trip.earnings}</div>
            <div className="text-sm text-gray-500">Earnings</div>
          </div>
        </div>

        {/* Cargo Information */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Cargo Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-medium text-gray-900">{trip.cargo.description}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Weight</p>
              <p className="font-medium text-gray-900">{trip.cargo.weight} kg</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium text-gray-900">{trip.cargo.type}</p>
            </div>
            {trip.cargo.specialInstructions && (
              <div>
                <p className="text-sm text-gray-600">Special Instructions</p>
                <p className="font-medium text-gray-900">{trip.cargo.specialInstructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Customer Information</h3>
            </div>
            <button
              onClick={handleContactCustomer}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showCustomerInfo ? 'Hide' : 'Show'} Contact Info
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium text-gray-900">{trip.customer.name}</p>
            </div>
            {showCustomerInfo && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{trip.customer.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{trip.customer.email}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartTrip}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Start Trip</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePauseTrip}
              className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                isPaused 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCompleteTrip}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Trip</span>
            </motion.button>
          </div>

          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <Navigation className="w-4 h-4" />
              <span>Navigate</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <Phone className="w-4 h-4" />
              <span>Call</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Notes */}
        <AnimatePresence>
          {trip.notes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400"
            >
              <h4 className="font-medium text-yellow-800 mb-2">Trip Notes</h4>
              <p className="text-yellow-700 text-sm">{trip.notes}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
