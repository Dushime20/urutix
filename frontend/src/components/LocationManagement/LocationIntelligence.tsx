import React, { useState, useEffect } from 'react';
import {
  FaMapMarkerAlt,
  FaClock,
  FaTruck,
  FaShieldAlt,
  FaParking,
  FaIndustry,
  FaWarehouse,
  FaBuilding,
  FaInfoCircle,
  FaRoad,
  FaGasPump,
  FaBed,
  FaStore,
  FaHospital,
  FaUniversity,
  FaPlane,
  FaShip,
  FaBus,
  FaTrain
} from 'react-icons/fa';

interface LocationIntelligenceProps {
  locationData: {
    id: string;
    name: string;
    address: string;
    fullAddress: string;
    city: string;
    state: string;
    country: string;
    locationCategory: string;
    locationSubCategory: string;
    businessHours: {
      open: string;
      close: string;
      days: string[];
    };
    timezone: string;
    accessType: string;
    parkingAvailable: boolean;
    securityLevel: string;
    loadingDockCount: number;
    maxTruckHeight: number;
    maxTruckWeight: number;
    specialInstructions: string;
    distanceFromHighway: number;
    trafficPattern: string;
    bestAccessTime: string;
    restrictions: string[];
    fuelStationsNearby: number;
    restAreasNearby: number;
    administrativeAreas: {
      district: string;
      province: string;
      county: string;
      postalCode: string;
      administrativeArea: string;
      subDistrict?: string;
      ward?: string;
      constituency?: string;
    };
    nearbyPOIs: {
      landmarks: Array<{
        name: string;
        type: string;
        distance: number;
        coordinates: { latitude: number; longitude: number };
      }>;
      transportHubs: Array<{
        name: string;
        type: 'AIRPORT' | 'TRAIN_STATION' | 'BUS_TERMINAL' | 'PORT' | 'TRUCK_TERMINAL';
        distance: number;
        coordinates: { latitude: number; longitude: number };
      }>;
      commercialAreas: Array<{
        name: string;
        type: 'SHOPPING_CENTER' | 'MARKET' | 'INDUSTRIAL_PARK' | 'BUSINESS_DISTRICT';
        distance: number;
        coordinates: { latitude: number; longitude: number };
      }>;
      serviceFacilities: Array<{
        name: string;
        type: 'HOSPITAL' | 'POLICE_STATION' | 'FIRE_STATION' | 'BANK' | 'POST_OFFICE';
        distance: number;
        coordinates: { latitude: number; longitude: number };
      }>;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
}

const LocationIntelligence: React.FC<LocationIntelligenceProps> = ({ locationData }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'WAREHOUSE':
        return <FaWarehouse className="w-5 h-5 text-blue-500" />;
      case 'INDUSTRIAL':
      case 'INDUSTRIAL_ZONE':
        return <FaIndustry className="w-5 h-5 text-orange-500" />;
      case 'COMMERCIAL':
        return <FaBuilding className="w-5 h-5 text-green-500" />;
      case 'URBAN':
      case 'URBAN_AREA':
        return <FaBuilding className="w-5 h-5 text-purple-500" />;
      case 'RURAL':
      case 'RURAL_LOCATION':
        return <FaMapMarkerAlt className="w-5 h-5 text-green-600" />;
      case 'GENERAL_FACILITY':
        return <FaMapMarkerAlt className="w-5 h-5 text-gray-500" />;
      default:
        return <FaMapMarkerAlt className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'WAREHOUSE':
        return 'Warehouse Facility';
      case 'INDUSTRIAL':
      case 'INDUSTRIAL_ZONE':
        return 'Industrial Zone';
      case 'COMMERCIAL':
        return 'Commercial District';
      case 'URBAN':
      case 'URBAN_AREA':
        return 'Urban Area';
      case 'RURAL':
      case 'RURAL_LOCATION':
        return 'Rural Location';
      case 'GENERAL_FACILITY':
        return 'General Facility';
      default:
        return 'Cargo Facility';
    }
  };

  const getAccessTypeColor = (accessType: string) => {
    switch (accessType?.toUpperCase()) {
      case 'TRUCK_ACCESSIBLE':
        return 'bg-green-100 text-green-800';
      case 'INDUSTRIAL_TRUCK_ACCESS':
        return 'bg-orange-100 text-orange-800';
      case 'URBAN_TRUCK_ACCESS':
        return 'bg-purple-100 text-purple-800';
      case 'RURAL_TRUCK_ACCESS':
        return 'bg-green-100 text-green-800';
      case 'FORKLIFT_REQUIRED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CRANE_REQUIRED':
        return 'bg-red-100 text-red-800';
      case 'DOCKS_AVAILABLE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'PUBLIC':
      case 'PUBLIC_ACCESS':
        return 'bg-green-100 text-green-800';
      case 'RESTRICTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'SECURED':
      case 'INDUSTRIAL_SECURITY':
        return 'bg-orange-100 text-orange-800';
      case 'URBAN_SECURITY':
        return 'bg-purple-100 text-purple-800';
      case 'RURAL_SECURITY':
        return 'bg-green-100 text-green-800';
      case 'HIGH_SECURITY':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrafficPatternColor = (pattern: string) => {
    switch (pattern?.toUpperCase()) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPOIIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'AIRPORT':
        return <FaPlane className="w-4 h-4 text-blue-500" />;
      case 'TRAIN_STATION':
        return <FaTrain className="w-4 h-4 text-green-500" />;
      case 'BUS_TERMINAL':
        return <FaBus className="w-4 h-4 text-orange-500" />;
      case 'PORT':
        return <FaShip className="w-4 h-4 text-purple-500" />;
      case 'HOSPITAL':
        return <FaHospital className="w-4 h-4 text-red-500" />;
      case 'SHOPPING_CENTER':
        return <FaStore className="w-4 h-4 text-pink-500" />;
      case 'MARKET':
        return <FaStore className="w-4 h-4 text-yellow-500" />;
      default:
        return <FaMapMarkerAlt className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatBusinessHours = (businessHours: any) => {
    if (typeof businessHours === 'string') return businessHours;
    if (businessHours?.open && businessHours?.close) {
      return `${businessHours.open} - ${businessHours.close}`;
    }
    return 'Standard Business Hours';
  };

  const formatAddress = (locationData: any) => {
    const parts = [
      locationData.city,
      locationData.state,
      locationData.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header with Real Location Data */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {getCategoryIcon(locationData.locationCategory)}
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {locationData.name || `${getCategoryDisplayName(locationData.locationCategory)}`}
            </h3>
            <p className="text-sm text-gray-600 font-medium">
              {formatAddress(locationData)}
            </p>
            <p className="text-xs text-gray-500">
              {locationData.fullAddress || `${locationData.city}, ${locationData.state}, ${locationData.country}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="Toggle detailed information"
        >
          <FaInfoCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Location Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FaClock className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Operating Hours</span>
          </div>
          <p className="text-sm text-blue-900">{formatBusinessHours(locationData.businessHours)}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FaTruck className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-700">Vehicle Access</span>
          </div>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getAccessTypeColor(locationData.accessType)}`}>
            {locationData.accessType?.replace('_', ' ') || 'Standard Access'}
          </span>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FaShieldAlt className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">Security Level</span>
          </div>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getSecurityLevelColor(locationData.securityLevel)}`}>
            {locationData.securityLevel?.replace('_', ' ') || 'Standard Security'}
          </span>
        </div>
      </div>

      {/* Facility Capabilities */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Facility Capabilities</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <FaParking className={`w-6 h-6 ${locationData.parkingAvailable ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <p className="text-sm font-medium text-gray-700">Parking</p>
            <p className="text-xs text-gray-500">
              {locationData.parkingAvailable ? 'Available' : 'Not Available'}
            </p>
          </div>

          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <FaTruck className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">Loading Docks</p>
            <p className="text-xs text-gray-500">{locationData.loadingDockCount || 0}</p>
          </div>

          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <FaIndustry className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">Max Height</p>
            <p className="text-xs text-gray-500">{locationData.maxTruckHeight || 4.5}m</p>
          </div>

          <div className="text-center bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <FaWarehouse className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">Max Weight</p>
            <p className="text-xs text-gray-500">{locationData.maxTruckWeight || 20} tons</p>
          </div>
        </div>
      </div>

      {/* Route Planning */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Route Planning</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <FaRoad className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Highway Access</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Distance from Highway</span>
                <span className="text-sm font-bold text-blue-900">{locationData.distanceFromHighway || 2.0} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Traffic Pattern</span>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTrafficPatternColor(locationData.trafficPattern)}`}>
                  {locationData.trafficPattern || 'MEDIUM'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <FaClock className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-700">Optimal Access Times</span>
            </div>
            <p className="text-sm text-green-900">{locationData.bestAccessTime || '6AM-8AM, 4PM-6PM'}</p>
          </div>
        </div>
      </div>

      {/* Nearby Services */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Nearby Services</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FaGasPump className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-700">Fuel Stations</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900">{locationData.fuelStationsNearby || 2}</p>
            <p className="text-xs text-yellow-700">within 5km radius</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FaBed className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Rest Areas</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{locationData.restAreasNearby || 1}</p>
            <p className="text-xs text-blue-700">within 5km radius</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <FaStore className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">Commercial Areas</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{locationData.nearbyPOIs?.commercialAreas?.length || 0}</p>
            <p className="text-xs text-purple-700">nearby facilities</p>
          </div>
        </div>
      </div>

      {/* Points of Interest */}
      {locationData.nearbyPOIs && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Nearby Points of Interest</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transport Hubs */}
            {locationData.nearbyPOIs.transportHubs && locationData.nearbyPOIs.transportHubs.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-blue-700 mb-3">Transport Hubs</h5>
                <div className="space-y-2">
                  {locationData.nearbyPOIs.transportHubs.slice(0, 3).map((hub, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getPOIIcon(hub.type)}
                        <span className="text-sm text-blue-900">{hub.name}</span>
                      </div>
                      <span className="text-xs text-blue-600">{hub.distance}km</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Facilities */}
            {locationData.nearbyPOIs.serviceFacilities && locationData.nearbyPOIs.serviceFacilities.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="text-sm font-medium text-green-700 mb-3">Service Facilities</h5>
                <div className="space-y-2">
                  {locationData.nearbyPOIs.serviceFacilities.slice(0, 3).map((facility, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getPOIIcon(facility.type)}
                        <span className="text-sm text-green-900">{facility.name}</span>
                      </div>
                      <span className="text-xs text-green-600">{facility.distance}km</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Access Restrictions */}
      {locationData.restrictions && locationData.restrictions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Access Restrictions</h4>
          <div className="bg-yellow-50 rounded-lg p-4">
            <ul className="space-y-2">
              {locationData.restrictions.map((restriction, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <FaInfoCircle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-yellow-800">{restriction.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Special Instructions */}
      {locationData.specialInstructions && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Special Instructions</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">{locationData.specialInstructions}</p>
          </div>
        </div>
      )}

      {/* Expanded Information */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">Location Coordinates</h5>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Latitude:</span> {locationData.coordinates.latitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Longitude:</span> {locationData.coordinates.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">Administrative Details</h5>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">District:</span> {locationData.administrativeAreas?.district || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Province:</span> {locationData.administrativeAreas?.province || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Country:</span> {locationData.country || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Timezone:</span> {locationData.timezone || 'UTC'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationIntelligence; 