import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Loader2,
  Search,
  X,
  Check,
  TrendingUp,
  Clock,
  DollarSign,
  Route as RouteIcon,
  AlertCircle,
  Sparkles,
  Target
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

interface RouteOptimization {
  originalDistance: number;
  optimizedDistance: number;
  savings: number;
  fuelSavings: number;
  timeSavings: number;
  waypoints: Location[];
}

interface NearbyFacility {
  id: string;
  type: 'gas_station' | 'rest_area' | 'warehouse' | 'repair_shop';
  name: string;
  location: Location;
  distance: number;
  rating?: number;
}

interface AdvancedGeoLocationProps {
  initialLocation?: Location;
  onLocationSelected: (location: Location) => void;
  mode?: 'select' | 'route' | 'nearby';
}

export const AdvancedGeoLocation: React.FC<AdvancedGeoLocationProps> = ({
  initialLocation,
  onLocationSelected,
  mode = 'select'
}) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(initialLocation || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Location[]>([]);
  const [routeOptimization, setRouteOptimization] = useState<RouteOptimization | null>(null);
  const [nearbyFacilities, setNearbyFacilities] = useState<NearbyFacility[]>([]);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (initialLocation) {
      setMapCenter([initialLocation.lat, initialLocation.lng]);
    }
  }, [initialLocation]);

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        try {
          // Reverse geocode to get address
          const address = await reverseGeocode(location.lat, location.lng);
          location.address = address;
        } catch (err) {
          console.error('Error reverse geocoding:', err);
        }

        setCurrentLocation(location);
        setMapCenter([location.lat, location.lng]);
        setIsGettingLocation(false);
      },
      (err) => {
        setError('Unable to get your location. Please check permissions.');
        setIsGettingLocation(false);
        console.error('Geolocation error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.display_name || `${lat}, ${lng}`;
    } catch (err) {
      return `${lat}, ${lng}`;
    }
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      
      const results: Location[] = data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        address: item.display_name,
        name: item.name
      }));

      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search location');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  const selectLocation = (location: Location) => {
    setCurrentLocation(location);
    setMapCenter([location.lat, location.lng]);
    setSearchResults([]);
    setSearchQuery('');
    onLocationSelected(location);
  };

  const optimizeRoute = () => {
    if (selectedRoute.length < 2) return;

    // Calculate original distance
    let originalDistance = 0;
    for (let i = 0; i < selectedRoute.length - 1; i++) {
      originalDistance += calculateDistance(selectedRoute[i], selectedRoute[i + 1]);
    }

    // Simulate route optimization (in real app, use routing API)
    const optimized = nearestNeighbor([...selectedRoute]);
    
    let optimizedDistance = 0;
    for (let i = 0; i < optimized.length - 1; i++) {
      optimizedDistance += calculateDistance(optimized[i], optimized[i + 1]);
    }

    const savings = originalDistance - optimizedDistance;
    const savingsPercent = (savings / originalDistance) * 100;

    setRouteOptimization({
      originalDistance,
      optimizedDistance,
      savings: savingsPercent,
      fuelSavings: savings * 0.15, // Estimate: $0.15/km
      timeSavings: savings / 80, // Estimate: 80 km/h average
      waypoints: optimized
    });
  };

  const nearestNeighbor = (locations: Location[]): Location[] => {
    if (locations.length <= 2) return locations;

    const result: Location[] = [locations[0]];
    const remaining = locations.slice(1);

    while (remaining.length > 0) {
      const last = result[result.length - 1];
      let nearestIndex = 0;
      let nearestDistance = calculateDistance(last, remaining[0]);

      for (let i = 1; i < remaining.length; i++) {
        const distance = calculateDistance(last, remaining[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      result.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    return result;
  };

  const calculateDistance = (loc1: Location, loc2: Location): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const findNearbyFacilities = () => {
    if (!currentLocation) return;

    // Simulate finding nearby facilities
    const facilities: NearbyFacility[] = [
      {
        id: '1',
        type: 'gas_station',
        name: 'Shell Gas Station',
        location: {
          lat: currentLocation.lat + 0.01,
          lng: currentLocation.lng + 0.01
        },
        distance: 1.2,
        rating: 4.5
      },
      {
        id: '2',
        type: 'rest_area',
        name: 'Highway Rest Stop',
        location: {
          lat: currentLocation.lat - 0.02,
          lng: currentLocation.lng + 0.015
        },
        distance: 2.5,
        rating: 4.2
      },
      {
        id: '3',
        type: 'warehouse',
        name: 'Distribution Center',
        location: {
          lat: currentLocation.lat + 0.015,
          lng: currentLocation.lng - 0.02
        },
        distance: 3.1
      },
      {
        id: '4',
        type: 'repair_shop',
        name: 'Truck Repair Services',
        location: {
          lat: currentLocation.lat - 0.01,
          lng: currentLocation.lng - 0.01
        },
        distance: 1.8,
        rating: 4.7
      }
    ];

    setNearbyFacilities(facilities);
  };

  const getFacilityIcon = (type: string) => {
    const icons = {
      gas_station: '⛽',
      rest_area: '🅿️',
      warehouse: '🏭',
      repair_shop: '🔧'
    };
    return icons[type as keyof typeof icons] || '📍';
  };

  const getFacilityColor = (type: string) => {
    const colors = {
      gas_station: 'text-blue-600 bg-blue-100',
      rest_area: 'text-emerald-600 bg-emerald-100',
      warehouse: 'text-violet-600 bg-violet-100',
      repair_shop: 'text-amber-600 bg-amber-100'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-violet-100 rounded-lg p-2">
            <MapPin className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Advanced Geolocation</h3>
            <p className="text-sm text-gray-600">
              {mode === 'select' ? 'Select a location' :
               mode === 'route' ? 'Plan and optimize route' :
               'Find nearby facilities'}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search for address or location..."
            className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-2 border-2 border-gray-200 rounded-xl max-h-48 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => selectLocation(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <MapPin className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{result.name || 'Location'}</p>
                  <p className="text-sm text-gray-600 truncate">{result.address}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            My Location
          </button>

          {mode === 'nearby' && currentLocation && (
            <button
              onClick={findNearbyFacilities}
              className="flex-1 px-4 py-2 border-2 border-violet-600 text-violet-600 rounded-lg hover:bg-violet-50 font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              Find Nearby
            </button>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {currentLocation && (
            <>
              <Marker position={[currentLocation.lat, currentLocation.lng]}>
                <Popup>
                  <div className="p-2">
                    <p className="font-bold">{currentLocation.name || 'Selected Location'}</p>
                    {currentLocation.address && (
                      <p className="text-sm text-gray-600">{currentLocation.address}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
              <Circle
                center={[currentLocation.lat, currentLocation.lng]}
                radius={500}
                pathOptions={{ color: '#8B5CF6', fillColor: '#8B5CF6', fillOpacity: 0.1 }}
              />
            </>
          )}

          {nearbyFacilities.map((facility) => (
            <Marker
              key={facility.id}
              position={[facility.location.lat, facility.location.lng]}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-bold">{getFacilityIcon(facility.type)} {facility.name}</p>
                  <p className="text-sm text-gray-600">{facility.distance} km away</p>
                  {facility.rating && (
                    <p className="text-sm text-amber-600">⭐ {facility.rating}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {routeOptimization && (
            <Polyline
              positions={routeOptimization.waypoints.map(w => [w.lat, w.lng])}
              pathOptions={{ color: '#8B5CF6', weight: 4 }}
            />
          )}
        </MapContainer>
      </div>

      {/* Nearby Facilities Panel */}
      {nearbyFacilities.length > 0 && (
        <div className="p-4 border-t border-gray-200 max-h-64 overflow-y-auto">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            Nearby Facilities ({nearbyFacilities.length})
          </h4>
          <div className="space-y-2">
            {nearbyFacilities.map((facility) => (
              <div key={facility.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getFacilityColor(facility.type)}`}>
                    <span className="text-xl">{getFacilityIcon(facility.type)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{facility.name}</p>
                    <p className="text-sm text-gray-600">{facility.distance} km away</p>
                  </div>
                </div>
                {facility.rating && (
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600">⭐ {facility.rating}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Route Optimization Results */}
      {routeOptimization && (
        <div className="p-4 border-t border-gray-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-emerald-600" />
            Route Optimization Results
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 text-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Distance Saved</p>
              <p className="text-lg font-bold text-gray-900">{routeOptimization.savings.toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <DollarSign className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Fuel Savings</p>
              <p className="text-lg font-bold text-gray-900">${routeOptimization.fuelSavings.toFixed(0)}</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <Clock className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Time Saved</p>
              <p className="text-lg font-bold text-gray-900">{routeOptimization.timeSavings.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedGeoLocation;

