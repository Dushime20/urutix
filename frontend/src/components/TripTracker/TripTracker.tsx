/**
 * TripTracker — full-page, stakeholder-facing live trip tracker.
 *
 * Used by: Cargo Owner, Truck Owner, Broker, Admin — anyone who
 * needs to watch a trip in real-time from the outside.
 *
 * Features:
 *  • Connects to the /tracking Socket.io namespace
 *  • Joins the trip room → receives live location:updated events
 *  • Draws route polyline from GET /trips/:id/route history
 *  • Animates truck marker to latest position
 *  • ETA countdown, speed, GPS accuracy stats
 *  • Trip status timeline
 *  • Driver online / offline badge with last-seen
 *  • Alerts panel (speeding, hard braking, etc.)
 *  • Emergency contact strip
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation, Activity, Clock, Gauge, Target, MapPin,
  Wifi, WifiOff, AlertTriangle, CheckCircle2, Radio,
  Package, User, Truck, Phone, RefreshCw, ChevronRight,
  Shield, Zap, TrendingUp,
} from 'lucide-react';
import api from '../../services/api';
import { getApiBaseUrl } from '../../config/environment';
import { cn } from '../../utils/cn';

// ── Leaflet icon fix ─────────────────────────────────────────────────────────
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const truckIcon = new L.Icon({ iconUrl, iconRetinaUrl, shadowUrl: iconShadow, iconSize: [32, 48], iconAnchor: [16, 48], popupAnchor: [0, -48], shadowSize: [41, 41] });

// Labeled A / B pins — clear on any map tile
const makeLabelPin = (label: string, bg: string) => new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12.15 18 30 18 30S36 30.15 36 18C36 8.06 27.94 0 18 0z" fill="${bg}" stroke="white" stroke-width="2"/>
      <circle cx="18" cy="18" r="10" fill="white" opacity="0.25"/>
      <text x="18" y="23" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="900" fill="white">${label}</text>
    </svg>
  `)))}`,
  iconSize: [36, 48], iconAnchor: [18, 48], popupAnchor: [0, -52],
});

const startPin = makeLabelPin('A', '#10b981'); // green — origin
const endPin   = makeLabelPin('B', '#ef4444'); // red   — destination

// Auto-pan when driver moves
function MapPanner({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], map.getZoom(), { animate: true, duration: 1.5 }); }, [lat, lng, map]);
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface LiveLocation { latitude: number; longitude: number; speed?: number; heading?: number; accuracy?: number; timestamp: string; }
interface TripAlert { id: string; type: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; title: string; message: string; createdAt: string; }
interface TripData {
  id: string; tripNumber: string; status: string;
  origin: { address: string; city: string; lat: number; lng: number };
  destination: { address: string; city: string; lat: number; lng: number };
  driver?: { name: string; phone?: string };
  vehicle?: { plateNumber: string; type?: string };
  estimatedArrival?: string;
  actualStart?: string;
  cargo?: { description: string; weight?: number; type?: string };
  emergencyContact?: string;
}

// Countdown from now to ETA
function etaCountdown(etaStr?: string): string {
  if (!etaStr) return '—';
  const diff = new Date(etaStr).getTime() - Date.now();
  if (diff <= 0) return 'Arrived';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Alert severity styling
const alertStyle: Record<string, string> = {
  CRITICAL: 'bg-rose-50 border-rose-100 text-rose-600',
  HIGH: 'bg-orange-50 border-orange-100 text-orange-600',
  MEDIUM: 'bg-amber-50 border-amber-100 text-amber-600',
  LOW: 'bg-slate-50 border-slate-100 text-slate-500',
};

// Trip status step ordering
const STATUS_STEPS = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'];

// ── Component ─────────────────────────────────────────────────────────────────
export const TripTracker: React.FC<{ tripId: string }> = ({ tripId }) => {
  const [trip, setTrip] = useState<TripData | null>(null);
  const [liveLocation, setLiveLocation] = useState<LiveLocation | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [alerts, setAlerts] = useState<TripAlert[]>([]);
  const [driverOnline, setDriverOnline] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveFlash, setLiveFlash] = useState(false);
  const [, tick] = useState(0); // ETA re-render
  const socketRef = useRef<Socket | null>(null);

  // ── ETA countdown tick ──────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // ── Fetch initial trip data ──────────────────────────────────────────────
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/trips/${tripId}`);
        const raw = res.data?.data ?? res.data;
        const load = raw.load ?? {};
        const truck = raw.truck ?? {};
        const driver = raw.driver ?? {};

        // Resolve locations from load.locations[] (LoadLocation[]) first, then fall back
        const locations: any[]  = load.locations ?? [];
        const pickupEntry        = locations.find((l: any) => l.type === 'PICKUP');
        const deliveryEntry      = locations.find((l: any) => l.type === 'DELIVERY');
        const pickup    = pickupEntry?.locationData  ?? raw.pickupLocation  ?? load.pickupLocation  ?? load.origin      ?? {};
        const delivery  = deliveryEntry?.locationData ?? raw.deliveryLocation ?? load.deliveryLocation ?? load.destination ?? {};

        // Resolve coordinates from all possible shapes the backend may return
        const resolveLatLng = (loc: any): { lat: number; lng: number } => {
          if (!loc) return { lat: 0, lng: 0 };
          // { coordinates: { latitude, longitude } }  — LoadLocation.locationData
          if (typeof loc.coordinates?.latitude === 'number')
            return { lat: loc.coordinates.latitude, lng: loc.coordinates.longitude };
          // { coordinates: { coordinates: [lng, lat] } }  — PostGIS via Location entity
          if (Array.isArray(loc.coordinates?.coordinates) && loc.coordinates.coordinates.length === 2)
            return { lat: loc.coordinates.coordinates[1], lng: loc.coordinates.coordinates[0] };
          // { lat, lng }  — Address interface
          if (typeof loc.lat === 'number') return { lat: loc.lat, lng: loc.lng };
          // { latitude, longitude }  — flat
          if (typeof loc.latitude === 'number') return { lat: loc.latitude, lng: loc.longitude };
          return { lat: 0, lng: 0 };
        };

        const pCoords = resolveLatLng(pickup);
        const dCoords = resolveLatLng(delivery);

        setTrip({
          id: raw.id,
          tripNumber: raw.tripNumber,
          status: raw.status,
          origin: {
            address: pickup.address ?? pickup.name ?? 'Pickup',
            city: pickup.city ?? '',
            lat: pCoords.lat,
            lng: pCoords.lng,
          },
          destination: {
            address: delivery.address ?? delivery.name ?? 'Delivery',
            city: delivery.city ?? '',
            lat: dCoords.lat,
            lng: dCoords.lng,
          },
          driver: {
            name: driver.firstName ? `${driver.firstName} ${driver.lastName ?? ''}`.trim() : 'Assigned Driver',
            phone: driver.phone ?? driver.phoneNumber,
          },
          vehicle: { plateNumber: truck.plateNumber ?? '—', type: truck.truckType ?? truck.model ?? 'Truck' },
          estimatedArrival: raw.estimatedArrival ?? raw.eta ?? raw.plannedEndTime,
          actualStart: raw.actualStartTime,
          cargo: { description: load.title ?? load.description ?? 'Cargo', weight: load.weight, type: load.cargoType },
          emergencyContact: raw.emergencyContact ?? driver.phone ?? '+254 700 000 000',
        });
      } catch (e: any) {
        setError(e?.response?.data?.message ?? 'Failed to load trip');
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [tripId]);

  // ── Fetch route history ─────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/trips/${tripId}/route`)
      .then(res => {
        const locs: any[] = res.data?.data?.locations ?? [];
        if (!locs.length) return;
        const history: [number, number][] = locs.map(l => [Number(l.latitude), Number(l.longitude)]);
        setRoutePath(history);
        const last = locs[locs.length - 1];
        setLiveLocation({ latitude: Number(last.latitude), longitude: Number(last.longitude), speed: last.speed, timestamp: last.timestamp ?? new Date().toISOString() });
        setDriverOnline(true);
      })
      .catch(() => {/* no history yet */});
  }, [tripId]);

  // ── Fetch recent alerts ─────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/tracking/trips/${tripId}/alerts`, { params: { limit: 10 } })
      .then(res => setAlerts(res.data?.data ?? []))
      .catch(() => {});
  }, [tripId]);

  // ── Socket.io /tracking namespace ───────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken') ?? localStorage.getItem('jwtToken');
    if (!token) return;

    const baseUrl = getApiBaseUrl().replace('/api', '');
    const socket = io(`${baseUrl}/tracking`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 3000,
    });

    socket.on('connect', () => { setWsConnected(true); socket.emit('join:trip', { tripId }); });
    socket.on('disconnect', () => { setWsConnected(false); setDriverOnline(false); });
    socket.on('connect_error', () => setWsConnected(false));

    socket.on('trip:joined', (data: any) => {
      if (data.currentLocation?.latitude) {
        const loc: LiveLocation = { ...data.currentLocation, timestamp: data.timestamp ?? new Date().toISOString() };
        setLiveLocation(loc);
        setDriverOnline(true);
      }
      if (data.trip?.status) setTrip(prev => prev ? { ...prev, status: data.trip.status } : prev);
    });

    socket.on('location:updated', (data: any) => {
      const loc: LiveLocation = {
        latitude: data.location?.latitude,
        longitude: data.location?.longitude,
        speed: data.location?.speed,
        heading: data.location?.heading,
        accuracy: data.location?.accuracy,
        timestamp: data.timestamp ?? new Date().toISOString(),
      };
      if (!loc.latitude) return;
      setLiveLocation(loc);
      setDriverOnline(true);
      setRoutePath(prev => {
        const last = prev[prev.length - 1];
        if (last && last[0] === loc.latitude && last[1] === loc.longitude) return prev;
        return [...prev, [loc.latitude, loc.longitude]];
      });
      setLiveFlash(true);
      setTimeout(() => setLiveFlash(false), 2000);
      if (data.eta?.eta) setTrip(prev => prev ? { ...prev, estimatedArrival: data.eta.eta } : prev);
    });

    socket.on('trip:status:updated', (data: any) => {
      setTrip(prev => prev ? { ...prev, status: data.status } : prev);
    });

    socket.on('alert:created', (data: any) => {
      if (data.alert) setAlerts(prev => [data.alert, ...prev].slice(0, 10));
    });

    socket.on('driver:offline', () => setDriverOnline(false));

    socketRef.current = socket;
    return () => { socket.emit('leave:trip', { tripId }); socket.disconnect(); socketRef.current = null; };
  }, [tripId]);

  // ── Derived state ───────────────────────────────────────────────────────
  const mapCenter: [number, number] = liveLocation
    ? [liveLocation.latitude, liveLocation.longitude]
    : trip ? [trip.origin.lat, trip.origin.lng] : [-1.29, 36.82];

  const stepIndex = STATUS_STEPS.indexOf(trip?.status ?? 'PLANNED');

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <RefreshCw size={32} className="text-[#345E85] animate-spin" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading trip data…</p>
    </div>
  );

  if (error) return (
    <div className="max-w-lg mx-auto p-10 bg-rose-50 border border-rose-100 rounded-2xl text-center space-y-4">
      <AlertTriangle size={40} className="text-rose-500 mx-auto" />
      <p className="text-sm font-black text-rose-700 uppercase">{error}</p>
    </div>
  );

  if (!trip) return null;

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-28 lg:pb-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-[#0f172a] rounded-2xl px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center text-white border border-white/10 flex-shrink-0">
            <Navigation size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">Live Trip Tracking</p>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">#{trip.tripNumber}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border',
            trip.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
            trip.status === 'COMPLETED'   ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
            trip.status === 'CANCELLED'   ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
            'bg-white/10 text-white border-white/10'
          )}>
            {trip.status.replace('_', ' ')}
          </span>
          <span className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border',
            wsConnected ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/10 text-slate-400 border-white/10'
          )}>
            {wsConnected ? <Radio size={11} className="animate-pulse" /> : <WifiOff size={11} />}
            {wsConnected ? 'Live' : 'Connecting…'}
          </span>
          <AnimatePresence>
            {liveFlash && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/30"
              >
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />Updated
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Quick stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: 'ETA', value: etaCountdown(trip.estimatedArrival), icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Speed', value: liveLocation?.speed != null ? `${liveLocation.speed} km/h` : '—', icon: Gauge, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'GPS Points', value: routePath.length, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Accuracy', value: liveLocation?.accuracy != null ? `±${Math.round(liveLocation.accuracy)}m` : '—', icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-sm">
            <div className={cn('w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0', s.bg, s.color)}>
              <s.icon size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-sm font-black text-[#0f172a]">{String(s.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid: Map first on mobile ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Map — full width on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-50">
            <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-[0.2em] flex items-center gap-2">
              <Navigation size={13} className="text-[#345E85]" /> Route Map
            </span>
            <span className={cn('flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest', driverOnline ? 'text-emerald-600' : 'text-slate-400')}>
              <span className={cn('w-2 h-2 rounded-full', driverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')} />
              {driverOnline ? 'Driver online' : 'Offline'}
              {liveLocation && <span className="ml-1 text-slate-400 hidden sm:inline">· {new Date(liveLocation.timestamp).toLocaleTimeString()}</span>}
            </span>
          </div>

          <MapContainer center={mapCenter} zoom={liveLocation ? 12 : 7} style={{ height: 'clamp(260px, 50vw, 460px)', width: '100%' }} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {liveLocation && <MapPanner lat={liveLocation.latitude} lng={liveLocation.longitude} />}

            {/* Breadcrumb route */}
            {routePath.length > 1 && <Polyline positions={routePath} color="#345E85" weight={4} opacity={0.85} dashArray={undefined} />}

            {/* Origin pin — A (green) */}
            <Marker position={[trip.origin.lat, trip.origin.lng]} icon={startPin}>
              <Popup>
                <div className="text-xs space-y-0.5 min-w-[140px]">
                  <p className="font-black text-emerald-600 uppercase tracking-widest">🅐 Start / Pickup</p>
                  <p className="font-semibold text-slate-700">{trip.origin.address}</p>
                  {trip.origin.city && <p className="text-slate-500">{trip.origin.city}</p>}
                  {trip.actualStart && <p className="text-slate-400 text-[10px]">Departed: {new Date(trip.actualStart).toLocaleString()}</p>}
                </div>
              </Popup>
            </Marker>

            {/* Destination pin — B (red) */}
            <Marker position={[trip.destination.lat, trip.destination.lng]} icon={endPin}>
              <Popup>
                <div className="text-xs space-y-0.5 min-w-[140px]">
                  <p className="font-black text-red-600 uppercase tracking-widest">🅑 End / Delivery</p>
                  <p className="font-semibold text-slate-700">{trip.destination.address}</p>
                  {trip.destination.city && <p className="text-slate-500">{trip.destination.city}</p>}
                  <p className="text-slate-400 text-[10px]">ETA: {etaCountdown(trip.estimatedArrival)}</p>
                </div>
              </Popup>
            </Marker>

            {/* Live truck */}
            {liveLocation && (
              <Marker position={[liveLocation.latitude, liveLocation.longitude]} icon={truckIcon}>
                <Popup>
                  <div className="text-xs space-y-1 min-w-[140px]">
                    <p className="font-black text-[#345E85] uppercase tracking-widest">Live Position</p>
                    <p className="text-slate-600">{trip.vehicle?.plateNumber} · {trip.driver?.name}</p>
                    {liveLocation.speed != null && <p className="text-slate-500">Speed: <strong>{liveLocation.speed} km/h</strong></p>}
                    {liveLocation.accuracy != null && <p className="text-slate-400 text-[10px]">Accuracy ±{Math.round(liveLocation.accuracy)}m</p>}
                    <p className="text-slate-400 text-[10px]">{new Date(liveLocation.timestamp).toLocaleTimeString()}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Map legend */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 px-4 py-2.5 border-t border-slate-50 bg-white">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Legend:</span>
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
              <span className="inline-flex w-5 h-5 rounded-full bg-emerald-500 items-center justify-center text-white font-black text-[9px] flex-shrink-0">A</span>
              Start / Pickup
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
              <span className="inline-flex w-5 h-5 rounded-full bg-red-500 items-center justify-center text-white font-black text-[9px] flex-shrink-0">B</span>
              End / Delivery
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
              <span className="w-4 h-4 rounded bg-[#345E85] flex-shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 10 10" width="10" height="10" fill="white">
                  <rect x="1" y="3" width="8" height="5" rx="1"/>
                  <rect x="3" y="1" width="4" height="3" rx="0.5"/>
                </svg>
              </span>
              Live Truck
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
              <span className="inline-block w-6 h-1 rounded-full bg-[#345E85]" />
              GPS Route
            </span>
          </div>
        </div>

        {/* Side panel — full width on mobile (below map), 1/3 on desktop */}
        <div className="space-y-3 sm:space-y-4">

          {/* Driver card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Driver & Vehicle</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-slate-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight truncate">{trip.driver?.name ?? '—'}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest">{trip.vehicle?.plateNumber} · {trip.vehicle?.type}</p>
              </div>
              <span className={cn(
                'ml-auto px-2.5 py-1 rounded-full text-[8px] font-black uppercase border flex-shrink-0',
                driverOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
              )}>
                {driverOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {trip.driver?.phone && (
              <a href={`tel:${trip.driver.phone}`}
                className="flex items-center gap-2 w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest transition-colors">
                <Phone size={13} className="text-[#345E85]" /> Call Driver
              </a>
            )}
          </div>

          {/* Route summary */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Route</p>
            <div className="relative pl-5 border-l-2 border-slate-100 space-y-4">
              <div>
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Origin</p>
                <p className="text-xs font-bold text-[#0f172a]">{trip.origin.address}</p>
                <p className="text-[9px] text-slate-400">{trip.origin.city}</p>
                {trip.actualStart && <p className="text-[9px] text-slate-400 mt-0.5">Started: {new Date(trip.actualStart).toLocaleString()}</p>}
              </div>
              <div>
                <div className="absolute -left-[5px] bottom-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-0.5">Destination</p>
                <p className="text-xs font-bold text-[#0f172a]">{trip.destination.address}</p>
                <p className="text-[9px] text-slate-400">{trip.destination.city}</p>
                <p className="text-[9px] font-black text-blue-600 mt-0.5">ETA: {etaCountdown(trip.estimatedArrival)}</p>
              </div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Timeline</p>
            <div className="space-y-2.5">
              {[
                { label: 'Planned', step: 0, icon: Package },
                { label: 'In Progress', step: 1, icon: Truck },
                { label: 'Completed', step: 2, icon: CheckCircle2 },
              ].map(({ label, step, icon: Icon }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
                    stepIndex > step ? 'bg-emerald-500 text-white' :
                    stepIndex === step ? 'bg-[#345E85] text-white' :
                    'bg-slate-100 text-slate-400'
                  )}>
                    <Icon size={14} />
                  </div>
                  <p className={cn('text-xs font-black uppercase tracking-widest', stepIndex >= step ? 'text-[#0f172a]' : 'text-slate-400')}>{label}</p>
                  {stepIndex === step && <span className="ml-auto w-2 h-2 rounded-full bg-[#345E85] animate-pulse" />}
                  {stepIndex > step && <CheckCircle2 size={14} className="ml-auto text-emerald-500" />}
                </div>
              ))}
            </div>
          </div>

          {/* Cargo info */}
          {trip.cargo && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-5 space-y-1.5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Cargo</p>
              <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight truncate">{trip.cargo.description}</p>
              <div className="flex items-center gap-3 flex-wrap">
                {trip.cargo.type && <span className="text-[10px] text-slate-500 uppercase">{trip.cargo.type}</span>}
                {trip.cargo.weight && <span className="text-[10px] text-slate-500">{trip.cargo.weight.toLocaleString()} kg</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Alerts ──────────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-[0.2em] flex items-center gap-2">
              <Shield size={13} className="text-amber-500" /> Driver Alerts
            </p>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase">{alerts.length}</span>
          </div>
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className={cn('flex items-start gap-2 sm:gap-3 p-3 rounded-xl border', alertStyle[a.severity] ?? alertStyle.LOW)}>
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest truncate">{a.title}</p>
                  <p className="text-[9px] mt-0.5 opacity-80 truncate">{a.message}</p>
                </div>
                <span className="ml-auto text-[8px] font-black uppercase tracking-widest flex-shrink-0 opacity-60 hidden sm:block">{new Date(a.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Emergency contact ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-rose-50 border border-rose-100 rounded-2xl">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Phone size={16} className="text-rose-600" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black text-rose-600 uppercase tracking-[0.2em]">Emergency Contact</p>
          <a href={`tel:${trip.emergencyContact}`} className="text-sm font-black text-[#0f172a] hover:text-rose-600 transition-colors truncate block">
            {trip.emergencyContact}
          </a>
        </div>
      </div>

    </div>
  );
};
