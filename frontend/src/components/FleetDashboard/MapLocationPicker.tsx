import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { X, MapPin, Search, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom pin icon
const pinIcon = (color: string) =>
  divIcon({
    className: '',
    html: `<div style="
      width:28px; height:28px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });

// Moves map view when position changes externally
function FlyTo({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 13, { duration: 0.8 });
  }, [position, map]);
  return null;
}

// Handles click-to-place marker
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (locationName: string, lat: number, lng: number) => void;
  title: string;           // "Select Origin" | "Select Destination"
  color: string;           // "#10b981" for origin, "#ef4444" for destination
  initialValue?: string;   // pre-fill search box
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  color,
  initialValue = '',
}) => {
  const defaultCenter: [number, number] = [-1.2921, 36.8219]; // Nairobi

  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number]>(defaultCenter);
  const [locationName, setLocationName] = useState(initialValue);
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMarkerPos(null);
      setLocationName(initialValue);
      setSearchQuery(initialValue);
      setSearchError('');
    }
  }, [isOpen, initialValue]);

  // Reverse-geocode a lat/lng to a human-readable name
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const name =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        data.display_name?.split(',')[0] ||
        `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setLocationName(name);
      setSearchQuery(name);
    } catch {
      setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setMarkerPos([lat, lng]);
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  // Forward-geocode a search query
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length === 0) {
        setSearchError('Location not found. Try a different name.');
        return;
      }
      const { lat, lon, display_name } = data[0];
      const pos: [number, number] = [parseFloat(lat), parseFloat(lon)];
      setMarkerPos(pos);
      setFlyTarget(pos);
      const shortName = display_name.split(',')[0];
      setLocationName(shortName);
      setSearchQuery(shortName);
    } catch {
      setSearchError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    if (!markerPos) return;
    // Store full address + exact coordinates so the backend has the precise location
    const fullLocation = `${locationName} (${markerPos[0].toFixed(6)}, ${markerPos[1].toFixed(6)})`;
    onConfirm(fullLocation, markerPos[0], markerPos[1]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '90vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color + '20' }}
              >
                <MapPin className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Click on the map or search
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-slate-300 dark:hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for a city or place..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </div>
            {searchError && (
              <p className="text-red-500 text-xs font-medium mt-1.5 px-1">{searchError}</p>
            )}
          </div>

          {/* Map */}
          <div className="flex-1 relative" style={{ minHeight: '360px' }}>
            <MapContainer
              center={defaultCenter}
              zoom={7}
              style={{ height: '100%', width: '100%', minHeight: '360px' }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />
              <ClickHandler onPick={handleMapClick} />
              <FlyTo position={flyTarget} />
              {markerPos && (
                <Marker position={markerPos} icon={pinIcon(color)} />
              )}
            </MapContainer>

            {/* Hint overlay */}
            {!markerPos && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" style={{ color }} />
                  Click anywhere on the map to place a pin
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
            {/* Selected location preview */}
            <div className="flex-1 min-w-0">
              {markerPos ? (
                <div className="flex items-start gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: color }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{locationName}</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {markerPos[0].toFixed(6)}, {markerPos[1].toFixed(6)}
                    </p>
                    <p className="text-[9px] text-gray-300 dark:text-gray-600 mt-0.5 truncate">
                      Saves as: {locationName} ({markerPos[0].toFixed(6)}, {markerPos[1].toFixed(6)})
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No location selected yet</p>
              )}
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!markerPos}
                className="px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest text-white transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                style={{
                  backgroundColor: markerPos ? color : '#9ca3af',
                  boxShadow: markerPos ? `0 4px 14px ${color}40` : 'none',
                }}
              >
                <Check className="w-4 h-4" />
                Confirm Location
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MapLocationPicker;
