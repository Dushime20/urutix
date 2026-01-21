import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { X, MapPin, Navigation, Check, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { fleetApi } from '../../services/fleetApi';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

interface TruckLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  truck: {
    id: string;
    name: string;
    plateNumber?: string;
    currentLocation?: {
      address?: string;
      coordinates?: { coordinates: number[] };
    };
  } | null;
  onLocationUpdated?: () => void;
}

interface LocationCoords {
  lat: number;
  lng: number;
  address: string;
}

// Component to handle map click events
const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to recenter map when location changes
const MapRecenter: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 13);
    }
  }, [lat, lng, map]);
  return null;
};

const createMarkerIcon = (color: string) =>
  new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C10.48 2 6 6.48 6 12c0 7 10 18 10 18s10-11 10-18c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="${color}" stroke="white" stroke-width="1"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

const TruckLocationModal: React.FC<TruckLocationModalProps> = ({
  isOpen,
  onClose,
  truck,
  onLocationUpdated,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationCoords | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  // Get initial coordinates from truck if available
  const getInitialCoords = (): [number, number] => {
    // Check for standard GeoJSON format: { type: 'Point', coordinates: [lng, lat] }
    const loc = truck?.currentLocation as any;
    if (Array.isArray(loc?.coordinates) && loc.coordinates.length === 2) {
      const [lng, lat] = loc.coordinates;
      return [lat, lng];
    }
    // Handle potential nested structure just in case
    if (Array.isArray(loc?.coordinates?.coordinates) && loc.coordinates.coordinates.length === 2) {
      const [lng, lat] = loc.coordinates.coordinates;
      return [lat, lng];
    }
    // Default to Rwanda coordinates
    return [-1.9403, 29.8739];
  };

  const [mapCenter, setMapCenter] = useState<[number, number]>(getInitialCoords());

  useEffect(() => {
    if (isOpen && truck) {
      const coords = getInitialCoords();
      setMapCenter(coords);
      
      // If truck has existing location, pre-select it
      const loc = truck.currentLocation as any;
      let existingLat, existingLng;

      if (Array.isArray(loc?.coordinates) && loc.coordinates.length === 2) {
        [existingLng, existingLat] = loc.coordinates;
      } else if (Array.isArray(loc?.coordinates?.coordinates) && loc.coordinates.coordinates.length === 2) {
        [existingLng, existingLat] = loc.coordinates.coordinates;
      }

      if (existingLat && existingLng) {
        setSelectedLocation({
          lat: existingLat,
          lng: existingLng,
          address: truck.currentLocation?.address || `${existingLat.toFixed(4)}, ${existingLng.toFixed(4)}`,
        });
      } else {
        setSelectedLocation(null);
      }
    }
  }, [isOpen, truck]);

  const handleMapClick = async (lat: number, lng: number) => {
    setIsGeocodingLoading(true);
    try {
      // Reverse geocode to get address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      
      setSelectedLocation({ lat, lng, address });
      toast.success('Location selected!');
    } catch (error) {
      console.error('Geocoding error:', error);
      setSelectedLocation({
        lat,
        lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    setUseCurrentLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          await handleMapClick(latitude, longitude);
          setUseCurrentLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Unable to get your current location. Please enable location services.');
          setUseCurrentLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setUseCurrentLocation(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation || !truck) return;

    setIsLoading(true);
    try {
      await fleetApi.updateTruckLocation(truck.id, {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        address: selectedLocation.address,
      });
      toast.success('Truck location updated successfully!');
      onLocationUpdated?.();
      onClose();
    } catch (error: any) {
      console.error('Error saving location:', error);
      toast.error(error.response?.data?.message || 'Failed to update location');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-none flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Set Truck Location</h2>
              <p className="text-sm text-gray-600">
                {truck?.name} {truck?.plateNumber ? `(${truck.plateNumber})` : ''}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer relative z-50"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Instructions & Current Location Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Click on the map</span> to select the truck's current location, 
              or use your device's GPS.
            </p>
            <button
              onClick={handleUseCurrentLocation}
              disabled={useCurrentLocation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {useCurrentLocation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Use My Location
                </>
              )}
            </button>
          </div>

          {/* Map */}
          <div className="h-[400px] rounded-lg overflow-hidden border border-gray-300 shadow-sm shrink-0">
            <MapContainer
              center={mapCenter}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onMapClick={handleMapClick} />
              {selectedLocation && (
                <>
                  <Marker 
                    position={[selectedLocation.lat, selectedLocation.lng]} 
                    icon={createMarkerIcon('#2563EB')}
                  />
                  <MapRecenter lat={selectedLocation.lat} lng={selectedLocation.lng} />
                </>
              )}
            </MapContainer>
          </div>

          {/* Selected Location Display */}
          {selectedLocation && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Location Selected</p>
                  <p className="text-sm text-green-700 mt-1">
                    {isGeocodingLoading ? 'Getting address...' : selectedLocation.address}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveLocation}
            disabled={!selectedLocation || isLoading}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Location
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TruckLocationModal;
