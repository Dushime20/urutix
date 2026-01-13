import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { type OptimizedRoute } from '../../../services/fleetApi';
import 'leaflet/dist/leaflet.css';
import { divIcon } from 'leaflet';

// Fix for default marker icon (mock fix)
const icon = divIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color:#3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);'></div>",
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

interface OptimizedRouteMapProps {
    route: OptimizedRoute | null;
}

const OptimizedRouteMap: React.FC<OptimizedRouteMapProps> = ({ route }) => {
    const defaultCenter: [number, number] = [-1.2921, 36.8219]; // Nairobi

    if (!route) {
        return (
            <div className="w-full h-full bg-slate-100 rounded-xl overflow-hidden relative">
                <MapContainer center={defaultCenter} zoom={7} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                </MapContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-slate-500 font-medium text-sm">Select a route to view path</p>
                    </div>
                </div>
            </div>
        );
    }

    // Mock Route Path (Straight lines for now)
    const pathPositions: [number, number][] = [
        [route.origin.lat, route.origin.lng],
        ...route.stops.map(s => [s.lat, s.lng] as [number, number]),
        [route.destination.lat, route.destination.lng]
    ];

    return (
        <div className="w-full h-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <MapContainer center={[route.origin.lat, route.origin.lng]} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* Origin Marker */}
                <Marker position={[route.origin.lat, route.origin.lng]} icon={icon}>
                    <Popup>{route.origin.name} (Origin)</Popup>
                </Marker>

                {/* Stops Markers */}
                {route.stops.map((stop, i) => (
                    <Marker key={i} position={[stop.lat, stop.lng]} icon={icon}>
                        <Popup>{stop.name} (Stop #{i + 1})</Popup>
                    </Marker>
                ))}

                {/* Destination Marker */}
                <Marker position={[route.destination.lat, route.destination.lng]} icon={icon}>
                    <Popup>{route.destination.name} (Destination)</Popup>
                </Marker>

                {/* Route Path Polyline */}
                <Polyline
                    positions={pathPositions}
                    pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7, lineCap: 'round' }}
                />
            </MapContainer>
        </div>
    );
};

export default OptimizedRouteMap;
