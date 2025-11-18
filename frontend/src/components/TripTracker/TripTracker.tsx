import { io, Socket } from 'socket.io-client';
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L, { Icon } from 'leaflet';
import { FaPhone, FaExclamationTriangle } from 'react-icons/fa';
import { TripTimeline, CommunicationPanel, DocumentManager, PerformanceMetrics } from './index';
import { getTripData, subscribeTripUpdates } from '../../services/tripApi';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon for Leaflet in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const driverIcon = new Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl: iconShadow,
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48],
  shadowSize: [41, 41],
});

export const TripTracker: React.FC<{ tripId: string }> = ({ tripId }) => {
  const [trip, setTrip] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [eta, setEta] = useState<{ value: string; confidence: number } | null>(null);
  const [offline, setOffline] = useState(false);
  const [driverOnline, setDriverOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  // Fetch initial trip data
  useEffect(() => {
    getTripData(tripId).then((data: { trip: any; route: any; driverLocation: any; eta: any }) => {
      setTrip(data.trip);
      setRoute(data.route);
      setDriverLocation(data.driverLocation);
      setEta(data.eta);
    });
  }, [tripId]);

  // Real-time updates via Socket.io WebSocket
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;
    const socket: Socket = io('http://localhost:3000/tracking', {
      auth: { token },
      transports: ['websocket'],
    });
    socket.emit('join:trip', { tripId });
    socket.on('trip:joined', (data: any) => {
      setTrip(data.trip);
      setDriverLocation(data.currentLocation);
      setEta(data.trip?.eta || null);
      setRoute(data.trip?.route || null);
      setDriverOnline(true);
    });
    socket.on('location:updated', (data: any) => {
      setDriverLocation(data.location);
      setEta(data.eta);
      setDriverOnline(true);
    });
    socket.on('driver:offline', () => {
      setDriverOnline(false);
    });
    socket.on('trip:status:updated', (data: any) => {
      setTrip((prev: any) => ({ ...prev, status: data.status }));
    });
    socket.on('error', (err: any) => {
      setError(typeof err === 'string' ? err : err?.message || 'WebSocket error');
      setDriverOnline(false);
    });
    return () => {
      socket.emit('leave:trip', { tripId });
      socket.disconnect();
    };
  }, [tripId]);

  // Offline capability
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Battery-efficient location tracking (mobile)
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        pos => setDriverLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        undefined,
        { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Helper to convert GeoJSON LineString to LatLng array for Polyline
  const getRouteLatLngs = () => {
    if (!route || !route.geometry) return [];
    if (route.geometry.type === 'LineString') {
      return route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
    }
    return [];
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {error && (
        <div className="bg-red-100 text-red-800 p-2 rounded mb-2 flex items-center gap-2" role="alert">
          <FaExclamationTriangle /> {error}
        </div>
      )}
      {offline && (
        <div className="bg-yellow-100 text-yellow-800 p-2 rounded mb-2 flex items-center gap-2" role="alert">
          <FaExclamationTriangle /> Offline mode: changes will sync when online.
        </div>
      )}
      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-4/5">
          <MapContainer
            center={driverLocation ? [driverLocation.latitude, driverLocation.longitude] : [0, 0]}
            zoom={driverLocation ? 10 : 2}
            style={{ width: '100%', height: '250px' }}
            scrollWheelZoom={true}
            ref={mapRef}
            aria-label="Trip route map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Route polyline */}
            {route && getRouteLatLngs().length > 0 && (
              <Polyline positions={getRouteLatLngs()} color="#0074D9" weight={4} />
            )}
            {/* Driver marker */}
            {driverLocation && (
              <Marker position={[driverLocation.latitude, driverLocation.longitude]} icon={driverIcon} />
            )}
          </MapContainer>
        </div>
        <div className="w-full sm:w-1/5 flex flex-col items-end mt-2 sm:mt-0">
          <span className={`px-3 py-1 rounded text-xs font-semibold ${driverOnline ? 'bg-green-100 text-green-800' : 'bg-gray-300 text-gray-600'}`}>{driverOnline ? 'Driver Online' : 'Driver Offline'}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <TripTimeline status={trip?.status} milestones={trip?.milestones} />
          <PerformanceMetrics metrics={trip?.metrics} />
        </div>
        <div>
          <CommunicationPanel tripId={tripId} driver={trip?.driver} />
          <DocumentManager tripId={tripId} documents={trip?.documents} />
          <div className="mt-4 p-2 bg-blue-50 rounded flex gap-2 items-center">
            <FaPhone className="text-blue-600" />
            <span>Emergency: <a href={`tel:${trip?.emergencyContact}`} className="underline">{trip?.emergencyContact}</a></span>
          </div>
        </div>
      </div>
      <div className="mt-4 p-2 bg-gray-50 rounded flex flex-col sm:flex-row items-center gap-2">
        <span className="font-semibold">ETA:</span> {eta?.value}
        {eta && (
          <span
            className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
              eta.confidence <= 5 ? 'bg-green-100 text-green-800' :
              eta.confidence <= 15 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}
          >
            Confidence: ±{eta.confidence} min
          </span>
        )}
      </div>
    </div>
  );
};
