import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import { X, Truck, User, Phone, MapPin, Clock, AlertTriangle, MessageSquare } from 'lucide-react';
import { trackingWebSocket } from '@/services/websocket';
import 'leaflet/dist/leaflet.css';

interface Cargo {
    id: string;
    title: string;
    status: string;
    pickupLocation?: {
        name: string;
        address?: string;
        coordinates?: { latitude: number; longitude: number };
    };
    deliveryLocation?: {
        name: string;
        address?: string;
        coordinates?: { latitude: number; longitude: number };
    };
}

interface CargoTrackingModalProps {
    cargo: Cargo;
    isOpen: boolean;
    onClose: () => void;
}

// Custom Icons
const createCustomIcon = (color: string) => new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
    </svg>
  `)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
});

export const CargoTrackingModal: React.FC<CargoTrackingModalProps> = ({
    cargo,
    isOpen,
    onClose,
}) => {
    const [loading, setLoading] = useState(true);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [eta, setEta] = useState<string | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // Mock driver data (since it's not in Cargo type yet)
    const driver = {
        name: 'John Kamau',
        phone: '+254700123456',
        vehicle: 'KCA 123A (Flatbed)',
        rating: 4.8
    };

    useEffect(() => {
        if (isOpen) {
            setLoading(true);

            // Simulate fetching current location (should replace with API call)
            setTimeout(() => {
                if (cargo.pickupLocation?.coordinates && cargo.deliveryLocation?.coordinates) {
                    // Pick a point between pickup and delivery for demo
                    const lat = (cargo.pickupLocation.coordinates.latitude + cargo.deliveryLocation.coordinates.latitude) / 2;
                    const lng = (cargo.pickupLocation.coordinates.longitude + cargo.deliveryLocation.coordinates.longitude) / 2;
                    setCurrentLocation({ lat, lng });
                } else {
                    // Default to Nairobi if no coords
                    setCurrentLocation({ lat: -1.2921, lng: 36.8219 });
                }
                setEta(new Date(Date.now() + 86400000).toISOString()); // +24h
                setLoading(false);
            }, 1000); // reduced delay for better UX
        }
    }, [isOpen, cargo]);

    // WebSocket Connection
    useEffect(() => {
        if (isOpen && trackingWebSocket.isEnabled()) {
            trackingWebSocket.connect().then(() => {
                setWsConnected(true);
                trackingWebSocket.subscribe(cargo.id, (update) => {
                    if (update.type === 'LOCATION_UPDATE' && update.data.currentLocation) {
                        setCurrentLocation({
                            lat: update.data.currentLocation.latitude,
                            lng: update.data.currentLocation.longitude
                        });
                        setLastUpdate(new Date());
                    }
                });
            }).catch(err => console.log('WS Connection failed', err));

            return () => {
                trackingWebSocket.disconnect();
            };
        }
    }, [isOpen, cargo.id]);

    if (!isOpen) return null;

    const pickupCoords = cargo.pickupLocation?.coordinates ? [cargo.pickupLocation.coordinates.latitude, cargo.pickupLocation.coordinates.longitude] as [number, number] : null;
    const deliveryCoords = cargo.deliveryLocation?.coordinates ? [cargo.deliveryLocation.coordinates.latitude, cargo.deliveryLocation.coordinates.longitude] as [number, number] : null;
    const currentCoords = currentLocation ? [currentLocation.lat, currentLocation.lng] as [number, number] : null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <MapPin className="text-blue-600" />
                            Live Tracking
                            {wsConnected && (
                                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    Live
                                </span>
                            )}
                        </h2>
                        <p className="text-sm text-gray-500">Cargo ID: #{cargo.id.slice(0, 8)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Map Section */}
                    <div className="flex-1 bg-gray-100 relative min-h-[300px] md:min-h-0">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <MapContainer
                                center={currentCoords || [-1.2921, 36.8219]}
                                zoom={7}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />

                                {pickupCoords && (
                                    <Marker position={pickupCoords} icon={createCustomIcon('#10B981')}>
                                        <Popup>Pickup: {cargo.pickupLocation?.name}</Popup>
                                    </Marker>
                                )}

                                {deliveryCoords && (
                                    <Marker position={deliveryCoords} icon={createCustomIcon('#EF4444')}>
                                        <Popup>Delivery: {cargo.deliveryLocation?.name}</Popup>
                                    </Marker>
                                )}

                                {currentCoords && (
                                    <Marker position={currentCoords} icon={createCustomIcon('#3B82F6')}>
                                        <Popup>
                                            <div className="p-1">
                                                <p className="font-bold mb-1">Current Location</p>
                                                <p className="text-xs text-gray-500">Updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Just now'}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}

                                {pickupCoords && currentCoords && (
                                    <Polyline positions={[pickupCoords, currentCoords]} color="#3B82F6" dashArray="5, 10" />
                                )}
                                {currentCoords && deliveryCoords && (
                                    <Polyline positions={[currentCoords, deliveryCoords]} color="#9CA3AF" dashArray="5, 10" />
                                )}

                            </MapContainer>
                        )}
                    </div>

                    {/* Details Sidebar */}
                    <div className="w-full md:w-80 bg-white border-l border-gray-200 overflow-y-auto">
                        <div className="p-4 space-y-6">
                            {/* Status Card */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Truck className="text-blue-600 w-5 h-5" />
                                    <span className="font-semibold text-blue-900">In Transit</span>
                                </div>
                                <div className="text-sm text-blue-800">
                                    <p className="mb-1">Estimated Arrival:</p>
                                    <p className="font-bold text-lg">{eta ? new Date(eta).toLocaleDateString() + ' ' + new Date(eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Calculating...'}</p>
                                </div>
                            </div>

                            {/* Locations */}
                            <div className="space-y-4">
                                <div className="relative pl-6 border-l-2 border-gray-200">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Pickup</h4>
                                    <p className="font-medium text-gray-900">{cargo.pickupLocation?.name || 'N/A'}</p>
                                    <p className="text-xs text-gray-500 truncate">{cargo.pickupLocation?.address}</p>
                                </div>
                                <div className="relative pl-6 border-l-2 border-gray-200">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Delivery</h4>
                                    <p className="font-medium text-gray-900">{cargo.deliveryLocation?.name || 'N/A'}</p>
                                    <p className="text-xs text-gray-500 truncate">{cargo.deliveryLocation?.address}</p>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Driver Info */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" /> Driver Details
                                </h3>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <User className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{driver.name}</p>
                                        <p className="text-xs text-gray-500">{driver.vehicle}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                                        <Phone className="w-4 h-4" /> Call
                                    </button>
                                    <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700">
                                        <MessageSquare className="w-4 h-4" /> Message
                                    </button>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Updates */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent Updates</h3>
                                <div className="space-y-3">
                                    <div className="flex gap-3">
                                        <div className="mt-1"><Clock className="w-4 h-4 text-gray-400" /></div>
                                        <div>
                                            <p className="text-sm text-gray-600">Truck departed from pickup location</p>
                                            <p className="text-xs text-gray-400">2 hours ago</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="mt-1"><AlertTriangle className="w-4 h-4 text-yellow-500" /></div>
                                        <div>
                                            <p className="text-sm text-gray-600">Traffic delay reported on Route A109</p>
                                            <p className="text-xs text-gray-400">30 mins ago</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
