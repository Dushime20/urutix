import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { brokerAPI } from '../../services/brokerApi';
import { 
  MapPin, 
  Package, 
  Truck, 
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Navigation
} from 'lucide-react';

interface TrackingEvent {
  id: string;
  type: string;
  status: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: string;
  description?: string;
}

interface LoadTracking {
  loadId: string;
  loadTitle: string;
  currentStatus: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  progress: number;
  estimatedArrival?: string;
  events: TrackingEvent[];
  tripId?: string;
}

const LoadTracking: React.FC = () => {
  const { loadId } = useParams<{ loadId: string }>();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState<LoadTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loadId) {
      loadTracking();
      // Refresh tracking every 30 seconds
      const interval = setInterval(loadTracking, 30000);
      return () => clearInterval(interval);
    }
  }, [loadId]);

  const loadTracking = async () => {
    if (!loadId) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get load details
      const loadResponse = await brokerAPI.getLoad(loadId);
      const load = loadResponse.data;

      // Get tracking information
      const trackingResponse = await fetch(`/api/loads/${loadId}/tracking`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (trackingResponse.ok) {
        const trackingData = await trackingResponse.json();
        setTracking({
          loadId,
          loadTitle: load.title || 'Load',
          currentStatus: trackingData.status || load.status,
          currentLocation: trackingData.currentLocation,
          progress: trackingData.progress || 0,
          estimatedArrival: trackingData.estimatedArrival,
          events: trackingData.events || [],
          tripId: trackingData.tripId,
        });
      } else {
        // Fallback to basic load info
        setTracking({
          loadId,
          loadTitle: load.title || 'Load',
          currentStatus: load.status,
          progress: 0,
          events: [],
        });
      }
    } catch (err: any) {
      console.error('Failed to load tracking:', err);
      setError(err.response?.data?.message || 'Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No tracking information available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard/broker/loads')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tracking.loadTitle}</h1>
              <p className="text-gray-600 mt-1">Load ID: {tracking.loadId.substring(0, 8)}...</p>
            </div>
          </div>
          <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(tracking.currentStatus)}`}>
            {tracking.currentStatus}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
          <span className="text-sm font-medium text-gray-700">{tracking.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${tracking.progress}%` }}
          />
        </div>
        {tracking.estimatedArrival && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              Estimated Arrival: {new Date(tracking.estimatedArrival).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Current Location */}
      {tracking.currentLocation && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Location</h2>
          <div className="space-y-2">
            {tracking.currentLocation.address && (
              <div className="flex items-center space-x-2 text-gray-700">
                <MapPin className="w-5 h-5 text-primary-600" />
                <span>{tracking.currentLocation.address}</span>
              </div>
            )}
            <div className="text-sm text-gray-600">
              Coordinates: {tracking.currentLocation.latitude.toFixed(6)}, {tracking.currentLocation.longitude.toFixed(6)}
            </div>
            {tracking.tripId && (
              <a
                href={`/dashboard/tracking/trips/${tracking.tripId}`}
                className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm mt-2"
              >
                <Navigation className="w-4 h-4" />
                <span>View on Map</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Tracking Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tracking Timeline</h2>
        {tracking.events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No tracking events yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tracking.events.map((event, index) => (
              <div key={event.id || index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-primary-600' : 'bg-gray-300'
                  }`}>
                    {index === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <Package className="w-5 h-5 text-white" />
                    )}
                  </div>
                  {index < tracking.events.length - 1 && (
                    <div className="w-0.5 h-12 bg-gray-300 mx-auto mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{event.type || event.status}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  )}
                  {event.location && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {event.location.address || 
                          `${event.location.latitude.toFixed(4)}, ${event.location.longitude.toFixed(4)}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadTracking;

