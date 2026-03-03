import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Truck Icon (can be replaced with SVG or FontAwesome later)
const truckIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/759/759905.png', // Placeholder truck icon
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
});

interface Vehicle {
    id: string;
    name: string;
    position: [number, number];
    status: 'moving' | 'idle' | 'offline';
    speed?: number;
    driver?: string;
    eta?: string;
    destination?: string;
}

interface DispatchMapProps {
    vehicles: Vehicle[];
    selectedVehicleId?: string | null;
    onVehicleSelect: (id: string) => void;
}

const DispatchMap: React.FC<DispatchMapProps> = ({ vehicles, onVehicleSelect }) => {
    // Center map on US for now (or approximate fleet center)
    const center: [number, number] = [39.8283, -98.5795];

    return (
        <div className="h-full w-full relative z-0">
            <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {vehicles.map(vehicle => (
                    <Marker
                        key={vehicle.id}
                        position={vehicle.position}
                        icon={truckIcon} // In real app, rotate icon based on bearing
                        eventHandlers={{
                            click: () => onVehicleSelect(vehicle.id),
                        }}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <h3 className="font-bold text-slate-800">{vehicle.name}</h3>
                                <div className="text-sm text-slate-600 mt-1">
                                    <p><span className="font-medium">Driver:</span> {vehicle.driver || 'Unassigned'}</p>
                                    <p><span className="font-medium">Status:</span>
                                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs text-white ${vehicle.status === 'moving' ? 'bg-emerald-500' :
                                            vehicle.status === 'idle' ? 'bg-amber-500' : 'bg-slate-400'
                                            }`}>
                                            {vehicle.status.toUpperCase()}
                                        </span>
                                    </p>
                                    {vehicle.speed && <p><span className="font-medium">Speed:</span> {vehicle.speed} mph</p>}
                                    {vehicle.destination && (
                                        <div className="mt-2 text-xs border-t pt-2">
                                            Heading to <span className="font-medium text-blue-600">{vehicle.destination}</span>
                                            <br />
                                            ETA: {vehicle.eta}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default DispatchMap;
