import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { Clock, Shield } from 'lucide-react';
import { type Trip } from '../../services/tenantApi';

// Fix for Leaflet default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Truck Icon
const creationTruckIcon = (color: string = '#3b82f6') => L.divIcon({
    className: 'custom-truck-icon',
    html: `
    <div style="
      background-color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      items-center: center;
      justify-content: center;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      border: 2px solid ${color};
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 17h4V5H2v12h3m0 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0m11 0h3l3-3v3m0 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M10 5l4-3 4 3"/>
      </svg>
    </div>
  `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

interface TripMapProps {
    trips: Trip[];
    onSelectTrip?: (trip: Trip) => void;
    selectedTripId?: string | null;
}

const TripMap: React.FC<TripMapProps> = ({ trips, onSelectTrip, selectedTripId }) => {
    // Default center (e.g., Nairobi/East Africa area)
    const defaultCenter: [number, number] = [-1.2921, 36.8219];

    const activeTripsWithCoords = useMemo(() => {
        return trips.filter(trip =>
            trip.currentLocation || (trip.origin && typeof trip.origin === 'object')
        );
    }, [trips]);

    const getTripCoords = (trip: Trip): [number, number] | null => {
        if (trip.currentLocation && typeof trip.currentLocation === 'object') {
            const loc = trip.currentLocation as any;
            if (loc.coordinates && Array.isArray(loc.coordinates)) {
                return [loc.coordinates[1], loc.coordinates[0]]; // Leaflet uses [lat, lng]
            }
        }
        return null;
    };

    return (
        <div className="w-full h-[600px] rounded-[32px] overflow-hidden border border-slate-100 shadow-xl relative group">
            <MapContainer
                center={defaultCenter}
                zoom={6}
                style={{ height: '100%', width: '100%', background: '#f8fafc' }}
                zoomControl={false}
            >
                <ZoomControl position="bottomright" />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {activeTripsWithCoords.map((trip) => {
                    const coords = getTripCoords(trip);
                    if (!coords) return null;

                    const isSelected = selectedTripId === trip.id;

                    return (
                        <React.Fragment key={trip.id}>
                            <Marker
                                position={coords}
                                icon={creationTruckIcon(isSelected ? '#6366f1' : '#3b82f6')}
                                eventHandlers={{
                                    click: () => onSelectTrip?.(trip),
                                }}
                            >
                                <Popup className="custom-leaflet-popup">
                                    <div className="p-3 min-w-[200px]">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-400">#{trip.tripNumber}</span>
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold">
                                                ACTIVE
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 mb-1">{trip.truckNumber || 'Unknown Truck'}</h3>
                                        <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
                                            <Clock className="w-3 h-3" />
                                            ETA: {trip.estimatedArrival ? new Date(trip.estimatedArrival).toLocaleTimeString() : 'Calculating...'}
                                        </p>

                                        <button
                                            onClick={() => onSelectTrip?.(trip)}
                                            className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        </React.Fragment>
                    );
                })}
            </MapContainer>

            {/* Map Overlay Controls */}
            <div className="absolute top-6 left-6 z-[400] pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg pointer-events-auto"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fleet Status</p>
                            <p className="text-sm font-bold text-slate-800">{activeTripsWithCoords.length} Assets Online</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TripMap;
