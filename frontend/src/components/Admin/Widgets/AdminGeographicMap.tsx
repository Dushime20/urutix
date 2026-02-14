import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface ActivityPoint {
    lat: number;
    lng: number;
    intensity: number; // 0 to 1
    label: string;
    value: string;
}

// Data points representing platform activity density
const points: ActivityPoint[] = [
    { lat: -1.2921, lng: 36.8219, intensity: 1.0, label: 'Nairobi Hub', value: '428 active trips' },
    { lat: -4.0435, lng: 39.6682, intensity: 0.8, label: 'Mombasa Port', value: '312 active trips' },
    { lat: 0.3476, lng: 32.5825, intensity: 0.6, label: 'Kampala Terminal', value: '185 active trips' },
    { lat: -1.9441, lng: 30.0619, intensity: 0.5, label: 'Kigali Logistics Center', value: '142 active trips' },
    { lat: -6.7924, lng: 39.2083, intensity: 0.7, label: 'Dar Es Salaam Port', value: '256 active trips' },
    { lat: -15.3875, lng: 28.3228, intensity: 0.3, label: 'Lusaka Node', value: '68 active trips' },
    { lat: -17.8252, lng: 31.0335, intensity: 0.4, label: 'Harare Terminal', value: '94 active trips' },
];

const AdminGeographicMap: React.FC = () => {
    const center: [number, number] = [-1.2921, 36.8219];

    return (
        <div className="w-full h-[400px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative group">
            <MapContainer
                center={center}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                />

                {points.map((point, idx) => (
                    <CircleMarker
                        key={idx}
                        center={[point.lat, point.lng]}
                        radius={8 + point.intensity * 12}
                        pathOptions={{
                            fillColor: point.intensity > 0.7 ? '#6366f1' : '#818cf8',
                            fillOpacity: 0.6,
                            color: 'white',
                            weight: 2,
                        }}
                    >
                        <Popup className="custom-popup">
                            <div className="p-1">
                                <h4 className="text-sm font-bold text-slate-800">{point.label}</h4>
                                <p className="text-xs text-indigo-600 font-medium mt-0.5">{point.value}</p>
                                <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-indigo-500 h-full rounded-full"
                                        style={{ width: `${point.intensity * 100}%` }}
                                    />
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-lg z-[1000] pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-0 md:opacity-100">
                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Activity Density</h5>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                        <span className="text-[10px] font-bold text-slate-700">High Intensity</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
                        <span className="text-[10px] font-bold text-slate-700">Moderate</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-200"></div>
                        <span className="text-[10px] font-bold text-slate-700">Low Activity</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminGeographicMap;
