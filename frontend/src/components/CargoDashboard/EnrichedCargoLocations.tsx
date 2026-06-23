import React, { useState } from 'react';
import { FaMapMarkerAlt, FaClock, FaTruck, FaWarehouse, FaIndustry, FaBuilding, FaShieldAlt, FaParking, FaRoad, FaExclamationTriangle } from 'react-icons/fa';
import LocationIntelligence from '../LocationManagement/LocationIntelligence';

interface EnrichedLocation {
  id: string;
  type: 'PICKUP' | 'DELIVERY' | 'STOP';
  sequence: number;
  locationData: {
    name: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    // Enhanced location intelligence
    city: string;
    state: string;
    country: string;
    locationCategory: string;
    locationSubCategory: string;
    businessHours: string;
    timezone: string;
    accessType: string;
    parkingAvailable: boolean;
    securityLevel: string;
    loadingDockCount: number;
    maxTruckHeight: number;
    maxTruckWeight: number;
    specialInstructions: string;
    // Route optimization
    distanceFromHighway: number;
    trafficPattern: string;
    bestAccessTime: string;
    restrictions: string[];
  };
  scheduledDate: Date;
  estimatedTime: number;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

interface EnrichedCargoLocationsProps {
  locations: EnrichedLocation[];
  onLocationClick?: (location: EnrichedLocation) => void;
}

const EnrichedCargoLocations: React.FC<EnrichedCargoLocationsProps> = ({
  locations,
  onLocationClick
}) => {
  const [selectedLocation, setSelectedLocation] = useState<EnrichedLocation | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const getLocationIcon = (type: string, category: string) => {
    if (type === 'PICKUP') {
      return <FaWarehouse className="w-5 h-5 text-green-500" />;
    } else if (type === 'DELIVERY') {
      return <FaBuilding className="w-5 h-5 text-blue-500" />;
    } else {
      return <FaIndustry className="w-5 h-5 text-orange-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'WAREHOUSE':
        return <FaWarehouse className="w-4 h-4 text-blue-500" />;
      case 'INDUSTRIAL':
        return <FaIndustry className="w-4 h-4 text-orange-500" />;
      case 'COMMERCIAL':
        return <FaBuilding className="w-4 h-4 text-green-500" />;
      default:
        return <FaMapMarkerAlt className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrafficColor = (pattern: string) => {
    switch (pattern) {
      case 'HIGH':
        return 'text-red-600 bg-red-100';
      case 'MODERATE':
        return 'text-yellow-600 bg-yellow-100';
      case 'LOW':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'HIGH_SECURITY':
        return 'text-red-600 bg-red-100';
      case 'SECURED':
        return 'text-orange-600 bg-orange-100';
      case 'PUBLIC':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleLocationClick = (location: EnrichedLocation) => {
    setSelectedLocation(location);
    setShowDetails(true);
    onLocationClick?.(location);
  };

  return (
    <div className="space-y-4">
      {/* Route Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Cargo Route with Location Intelligence</h3>
        
        {/* Route Timeline */}
        <div className="relative">
          {locations.map((location, index) => (
            <div key={location.id} className="flex items-start space-x-4 mb-6">
              {/* Route Connector */}
              {index > 0 && (
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300 transform -translate-x-1/2"></div>
              )}
              
              {/* Location Icon */}
              <div className="relative z-10 bg-white p-2 rounded-full border-2 border-gray-200">
                {getLocationIcon(location.type, location.locationData.locationCategory)}
              </div>

              {/* Location Details */}
              <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                   onClick={() => handleLocationClick(location)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">#{location.sequence}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      location.type === 'PICKUP' ? 'bg-green-100 text-green-800' :
                      location.type === 'DELIVERY' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {location.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(location.locationData.locationCategory)}
                    <span className="text-sm text-gray-600">{location.locationData.locationCategory}</span>
                  </div>
                </div>

                <h4 className="font-medium text-gray-900 mb-1">{location.locationData.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{location.locationData.address}</p>

                {/* Location Intelligence Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center space-x-2">
                    <FaClock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-600">{location.locationData.businessHours}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <FaTruck className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-600">{location.locationData.accessType}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <FaRoad className="w-3 h-3 text-gray-400" />
                    <span className={`text-xs px-1 py-0.5 rounded ${getTrafficColor(location.locationData.trafficPattern)}`}>
                      {location.locationData.trafficPattern} Traffic
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <FaShieldAlt className="w-3 h-3 text-gray-400" />
                    <span className={`text-xs px-1 py-0.5 rounded ${getSecurityColor(location.locationData.securityLevel)}`}>
                      {location.locationData.securityLevel}
                    </span>
                  </div>
                </div>

                {/* Constraints and Restrictions */}
                <div className="mt-3 space-y-2">
                  {location.locationData.maxTruckHeight < 4.5 && (
                    <div className="flex items-center space-x-2">
                      <FaExclamationTriangle className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-orange-600">
                        Max height: {location.locationData.maxTruckHeight}m
                      </span>
                    </div>
                  )}

                  {location.locationData.maxTruckWeight < 20 && (
                    <div className="flex items-center space-x-2">
                      <FaExclamationTriangle className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-orange-600">
                        Max weight: {location.locationData.maxTruckWeight} tons
                      </span>
                    </div>
                  )}

                  {location.locationData.restrictions.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <FaExclamationTriangle className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-600">
                        {location.locationData.restrictions.length} restriction(s)
                      </span>
                    </div>
                  )}
                </div>

                {/* Schedule Info */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Scheduled: {new Date(location.scheduledDate).toLocaleDateString()}</span>
                    <span>Est. Time: {location.estimatedTime} min</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Route Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Route Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <FaRoad className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-900">Total Distance</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {locations.length * 50} km
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <FaClock className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-900">Estimated Duration</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {locations.reduce((total, loc) => {
                switch (loc.locationData.trafficPattern) {
                  case 'HIGH': return total + 2;
                  case 'MODERATE': return total + 1.5;
                  case 'LOW': return total + 1;
                  default: return total + 1.5;
                }
              }, 0)} hours
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <FaExclamationTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-900">Total Restrictions</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {locations.reduce((total, loc) => total + loc.locationData.restrictions.length, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Location Details Modal */}
      {showDetails && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Location Intelligence</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
              <LocationIntelligence locationData={selectedLocation.locationData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrichedCargoLocations; 