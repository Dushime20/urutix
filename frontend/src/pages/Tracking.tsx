/**
 * Tracking.tsx — Shipment Journey Monitor
 * International standard: shows ALL trips (active + completed + planned)
 * with smart status filter tabs, live GPS socket for active trips,
 * and route playback for completed trips.
 *
 * Roles: Cargo Owner, Truck Owner, Broker, Cargo Receiver, Driver
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';
import {
  Truck, Wifi, WifiOff, Shield, Navigation, Activity, TrendingUp,
  Loader2, CheckCircle, X, MessageCircle, MessageSquare, User,
  Clock, Gauge, MapPin, Radio, History, Package, ExternalLink,
  Filter, Search, RefreshCw, Target, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import receiverService from '../services/receiverService';
import { brokerAPI } from '../services/brokerApi';
import api from '../services/api';
import { cn } from '@/utils/cn';
import { CircularStatCard } from '@/components/EnliteUI/Cards/StatCard';
import { getApiBaseUrl } from '../config/environment';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// ── Leaflet icon setup ───────────────────────────────────────────────────────
const truckIcon = new Icon({ iconUrl, iconRetinaUrl, shadowUrl: iconShadow, iconSize: [28, 42], iconAnchor: [14, 42], popupAnchor: [0, -42], shadowSize: [41, 41] });

// Labeled A / B pin with circle + letter — highly visible on any map tile
const makeLabelPin = (label: string, bg: string, text = '#fff') => new Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12.15 18 30 18 30S36 30.15 36 18C36 8.06 27.94 0 18 0z" fill="${bg}" stroke="white" stroke-width="2"/>
      <circle cx="18" cy="18" r="10" fill="white" opacity="0.25"/>
      <text x="18" y="23" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="900" fill="${text}">${label}</text>
    </svg>
  `)))}`,
  iconSize: [36, 48], iconAnchor: [18, 48], popupAnchor: [0, -50],
});

const startPin    = makeLabelPin('A', '#10b981');   // green  — pickup / start
const endPin      = makeLabelPin('B', '#ef4444');   // red    — delivery / end
const fleetPin    = makeLabelPin('●', '#345E85');   // blue   — other fleet truck

const makePin = fleetPin; // kept for backward compat

function MapPanner({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], map.getZoom(), { animate: true, duration: 1 }); }, [lat, lng, map]);
  return null;
}

// ── Types ────────────────────────────────────────────────────────────────────
type TripStatus = 'IN_TRANSIT' | 'PLANNED' | 'DELIVERED' | 'DELAYED' | 'CANCELLED';
type FilterTab  = 'all' | 'active' | 'completed' | 'planned';

interface LiveLocation { latitude: number; longitude: number; speed?: number; heading?: number; accuracy?: number; timestamp: string; }

interface Shipment {
  id: string; tripId?: string; cargoId: string; cargoTitle: string;
  status: TripStatus; rawStatus: string;
  pickupLocation: { name: string; address: string; latitude: number; longitude: number };
  deliveryLocation: { name: string; address: string; latitude: number; longitude: number };
  currentLocation: LiveLocation;
  routeHistory: [number, number][];
  driver: { name: string; phone: string };
  vehicle: { plateNumber: string; type: string };
  estimatedDelivery: string;
  actualPickup?: string; actualEnd?: string;
  progress: number;
  milestones?: { type: string; location: string; timestamp?: string; status: 'COMPLETED' | 'CURRENT' | 'PENDING' }[];
  driverOnline: boolean; lastSeenAt?: string; speed?: number;
}

// helpers
function etaCountdown(etaStr: string): string {
  const diff = new Date(etaStr).getTime() - Date.now();
  if (diff <= 0) return 'Arrived';
  const h = Math.floor(diff / 3_600_000), m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const STATUS_LABEL: Record<string, string> = { IN_TRANSIT: 'In Transit', PICKED_UP: 'Picked Up', DELIVERED: 'Delivered', DELAYED: 'Delayed', PLANNED: 'Planned', CANCELLED: 'Cancelled' };
const STATUS_STYLE: Record<string, string> = {
  IN_TRANSIT: 'bg-blue-50 text-blue-600 border-blue-100',
  PICKED_UP:  'bg-amber-50 text-amber-600 border-amber-100',
  DELIVERED:  'bg-emerald-50 text-emerald-600 border-emerald-100',
  DELAYED:    'bg-rose-50 text-rose-600 border-rose-100',
  PLANNED:    'bg-slate-50 text-slate-500 border-slate-100',
  CANCELLED:  'bg-slate-50 text-slate-400 border-slate-100',
};

function mapStatus(raw: string): TripStatus {
  switch (raw) {
    case 'IN_PROGRESS': return 'IN_TRANSIT';
    case 'COMPLETED':   return 'DELIVERED';
    case 'DELAYED':     return 'DELAYED';
    case 'CANCELLED':   return 'CANCELLED';
    default:            return 'PLANNED';
  }
}

// ── Component ────────────────────────────────────────────────────────────────
const Tracking: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allShipments, setAllShipments] = useState<Shipment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [liveFlash, setLiveFlash] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [showMessaging, setShowMessaging] = useState(false);
  const [messages, setMessages] = useState<{ id: string; sender: 'me' | 'driver'; text: string; ts: Date }[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [, tick] = useState(0);

  const socketRef    = useRef<Socket | null>(null);
  const joinedTripId = useRef<string | null>(null);

  // ETA countdown tick
  useEffect(() => { const t = setInterval(() => tick(n => n + 1), 30_000); return () => clearInterval(t); }, []);

  // ── buildShipment ──────────────────────────────────────────────────────────
  const buildShipment = useCallback((trip: any): Shipment => {
    const load   = trip.load ?? {};
    const truck  = trip.truck ?? {};
    const driver = trip.driver ?? {};

    // Locations come from load.locations[] (LoadLocation[]) or load.pickupLocation / deliveryLocation
    const locations: any[]  = load.locations ?? [];
    const pickupEntry        = locations.find((l: any) => l.type === 'PICKUP');
    const deliveryEntry      = locations.find((l: any) => l.type === 'DELIVERY');
    const pickupData         = pickupEntry?.locationData  ?? load.pickupLocation  ?? load.origin      ?? {};
    const deliveryData       = deliveryEntry?.locationData ?? load.deliveryLocation ?? load.destination ?? {};

    // Extract [lat, lng] from all possible coordinate shapes the backend returns
    const extractCoords = (loc: any): [number, number] | null => {
      if (!loc) return null;
      // { coordinates: { latitude, longitude } } — LoadLocation.locationData
      if (typeof loc.coordinates?.latitude === 'number')
        return [loc.coordinates.latitude, loc.coordinates.longitude];
      // { coordinates: { coordinates: [lng, lat] } } — PostGIS GeoJSON via Location entity
      if (Array.isArray(loc.coordinates?.coordinates) && loc.coordinates.coordinates.length === 2)
        return [loc.coordinates.coordinates[1], loc.coordinates.coordinates[0]];
      // { lat, lng } — Address interface
      if (typeof loc.lat === 'number') return [loc.lat, loc.lng];
      // { latitude, longitude } — flat
      if (typeof loc.latitude === 'number') return [loc.latitude, loc.longitude];
      return null;
    };

    const pCoords = extractCoords(pickupData);
    const dCoords = extractCoords(deliveryData);

    const pLat = pCoords?.[0] ?? null;
    const pLng = pCoords?.[1] ?? null;
    const dLat = dCoords?.[0] ?? null;
    const dLng = dCoords?.[1] ?? null;

    const rawStatus = trip.status ?? 'PLANNED';
    const status    = mapStatus(rawStatus);
    const progress  = status === 'DELIVERED' ? 100 : status === 'IN_TRANSIT' ? 50 : status === 'DELAYED' ? 35 : 0;

    const pickupName   = pickupData.name   ?? pickupData.city   ?? pickupData.address  ?? 'Pickup';
    const deliveryName = deliveryData.name ?? deliveryData.city ?? deliveryData.address ?? 'Delivery';
    const pickupAddr   = pickupData.address   ?? pickupData.city   ?? '';
    const deliveryAddr = deliveryData.address ?? deliveryData.city ?? '';

    return {
      id: trip.id, tripId: trip.id,
      cargoId: trip.tripNumber ?? trip.id.slice(0, 8).toUpperCase(),
      cargoTitle: load.title ?? load.cargoType ?? `Trip ${trip.tripNumber ?? trip.id.slice(0, 8)}`,
      status, rawStatus,
      pickupLocation:   { name: pickupName,   address: pickupAddr,   latitude: pLat!, longitude: pLng! },
      deliveryLocation: { name: deliveryName, address: deliveryAddr, latitude: dLat!, longitude: dLng! },
      currentLocation:  { latitude: pLat!, longitude: pLng!, timestamp: trip.updatedAt ?? new Date().toISOString() },
      routeHistory: [],
      driver:  { name: driver.firstName ? `${driver.firstName} ${driver.lastName ?? ''}`.trim() : 'Assigned Driver', phone: driver.phone ?? '' },
      vehicle: { plateNumber: truck.plateNumber ?? '—', type: truck.truckType ?? truck.model ?? 'Truck' },
      estimatedDelivery: trip.plannedEndTime ?? trip.estimatedEndTime ?? new Date().toISOString(),
      actualPickup: trip.actualStartTime,
      actualEnd:    trip.actualEndTime,
      progress,
      milestones: [
        { type: 'PICKUP',    location: pickupName,   timestamp: trip.actualStartTime, status: trip.actualStartTime ? 'COMPLETED' : 'PENDING' },
        { type: 'EN_ROUTE',  location: 'En Route',                                    status: rawStatus === 'IN_PROGRESS' ? 'CURRENT' : rawStatus === 'COMPLETED' ? 'COMPLETED' : 'PENDING' },
        { type: 'DELIVERED', location: deliveryName, timestamp: trip.actualEndTime,   status: trip.actualEndTime ? 'COMPLETED' : 'PENDING' },
      ],
      driverOnline: false,
    };
  }, []);

  // ── Fetch ALL trips ────────────────────────────────────────────────────────
  const fetchShipments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      let result: Shipment[] = [];

      if (user?.role === 'CARGO_RECEIVER') {
        const cargos = await receiverService.getMyCargos();
        result = cargos.map((c: any) => ({
          id: c.id, tripId: c.tripId,
          cargoId: c.id.slice(0, 8).toUpperCase(), cargoTitle: c.cargoType ?? 'Shipment',
          status: mapStatus(c.status), rawStatus: c.status,
          pickupLocation:  { name: 'Pickup', address: c.pickupLocation ?? '', latitude: -1.29, longitude: 36.82 },
          deliveryLocation:{ name: 'Delivery', address: c.deliveryLocation ?? '', latitude: -4.04, longitude: 39.67 },
          currentLocation: { latitude: -2.5, longitude: 38.0, timestamp: new Date().toISOString() },
          routeHistory: [],
          driver:  { name: c.assignedTruck?.driverName ?? 'Driver', phone: c.assignedTruck?.driverPhone ?? '' },
          vehicle: { plateNumber: c.assignedTruck?.plateNumber ?? '—', type: 'Truck' },
          estimatedDelivery: c.deliveryDate ?? new Date().toISOString(),
          progress: c.status === 'DELIVERED' ? 100 : 50, driverOnline: false,
        } as Shipment));

      } else if (user?.role === 'BROKER') {
        const res = await brokerAPI.getBrokerLoads(user.id);
        result = (res.data ?? []).map((l: any) => ({
          id: l.id, tripId: l.tripId,
          cargoId: l.id.slice(0, 8).toUpperCase(), cargoTitle: l.title ?? 'Load',
          status: mapStatus(l.status), rawStatus: l.status,
          pickupLocation:  { name: 'Pickup', address: l.pickupLocation ?? '', latitude: -1.29, longitude: 36.82 },
          deliveryLocation:{ name: 'Delivery', address: l.deliveryLocation ?? '', latitude: -4.04, longitude: 39.67 },
          currentLocation: { latitude: l.currentLocation?.latitude ?? -1.5, longitude: l.currentLocation?.longitude ?? 36.5, timestamp: new Date().toISOString() },
          routeHistory: [],
          driver:  { name: l.driverName ?? 'Driver', phone: l.driverPhone ?? '' },
          vehicle: { plateNumber: l.plateNumber ?? '—', type: l.vehicleType ?? 'Truck' },
          estimatedDelivery: l.deliveryDate ?? new Date().toISOString(),
          progress: l.status === 'COMPLETED' ? 100 : l.progress ?? 50, driverOnline: false,
        } as Shipment));

      } else {
        // Cargo Owner, Truck Owner, Driver — fetch ALL trips, no status filter
        const res  = await api.get('/trips', { params: { limit: 100, page: 1 } });
        const body = res.data;
        const trips: any[] = Array.isArray(body?.data?.trips) ? body.data.trips
          : Array.isArray(body?.trips) ? body.trips
          : Array.isArray(body?.data)  ? body.data : [];
        result = trips.map(buildShipment);
      }

      setAllShipments(result);
      // Auto-select first active trip, else first trip
      const firstActive = result.find(s => s.status === 'IN_TRANSIT' || s.status === 'DELAYED');
      setSelectedId(firstActive?.id ?? result[0]?.id ?? null);
    } catch { setAllShipments([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user, buildShipment]);

  useEffect(() => { fetchShipments(); }, [fetchShipments]);

  // ── Socket.io — connect once ───────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('jwtToken');
    if (!token) return;
    const socket = io(`${getApiBaseUrl().replace('/api', '')}/tracking`, {
      auth: { token }, transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 3000,
    });
    socket.on('connect',       () => setWsConnected(true));
    socket.on('disconnect',    () => setWsConnected(false));
    socket.on('connect_error', () => setWsConnected(false));

    socket.on('location:updated', (data: any) => {
      const loc: LiveLocation = { latitude: data.location?.latitude, longitude: data.location?.longitude, speed: data.location?.speed, heading: data.location?.heading, accuracy: data.location?.accuracy, timestamp: data.timestamp ?? new Date().toISOString() };
      if (!loc.latitude) return;
      setLiveFlash(true); setTimeout(() => setLiveFlash(false), 2000);
      setAllShipments(prev => prev.map(s =>
        s.tripId === data.tripId
          ? { ...s, currentLocation: loc, routeHistory: [...s.routeHistory, [loc.latitude, loc.longitude] as [number, number]], speed: loc.speed, driverOnline: true, lastSeenAt: loc.timestamp }
          : s
      ));
      if (data.eta?.eta) setAllShipments(prev => prev.map(s => s.tripId === data.tripId ? { ...s, estimatedDelivery: data.eta.eta } : s));
    });

    socket.on('trip:status:updated', (data: any) => {
      setAllShipments(prev => prev.map(s => s.tripId === data.tripId ? { ...s, status: mapStatus(data.status), rawStatus: data.status } : s));
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  // ── Join/leave trip room on selection change ───────────────────────────────
  const selected = allShipments.find(s => s.id === selectedId) ?? null;

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (joinedTripId.current && joinedTripId.current !== selected?.tripId) {
      socket.emit('leave:trip', { tripId: joinedTripId.current });
      joinedTripId.current = null;
    }
    if (selected?.tripId && selected.tripId !== joinedTripId.current) {
      socket.emit('join:trip', { tripId: selected.tripId });
      joinedTripId.current = selected.tripId;
      socket.once('trip:joined', (d: any) => {
        if (d.currentLocation?.latitude) {
          setAllShipments(prev => prev.map(s => s.tripId === selected.tripId ? { ...s, currentLocation: { ...d.currentLocation, timestamp: d.timestamp }, driverOnline: true } : s));
        }
      });
    }
  }, [selected?.tripId]);

  // ── Load GPS route history when a trip is selected ─────────────────────────
  useEffect(() => {
    if (!selected?.tripId) return;
    api.get(`/trips/${selected.tripId}/route`)
      .then(res => {
        const locs: any[] = res.data?.data?.locations ?? [];
        if (!locs.length) return;
        const history: [number, number][] = locs.map(l => [Number(l.latitude), Number(l.longitude)]);
        const last = locs[locs.length - 1];
        setAllShipments(prev => prev.map(s =>
          s.tripId === selected.tripId
            ? { ...s, routeHistory: history, currentLocation: { latitude: Number(last.latitude), longitude: Number(last.longitude), speed: last.speed, timestamp: last.timestamp ?? new Date().toISOString() }, driverOnline: true }
            : s
        ));
      }).catch(() => {});
  }, [selected?.tripId]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const TABS: { key: FilterTab; label: string; color: string }[] = [
    { key: 'all',       label: 'All',       color: 'bg-slate-900 text-white' },
    { key: 'active',    label: 'Active',    color: 'bg-blue-600 text-white' },
    { key: 'completed', label: 'Completed', color: 'bg-emerald-600 text-white' },
    { key: 'planned',   label: 'Planned',   color: 'bg-amber-500 text-white' },
  ];

  const filtered = allShipments.filter(s => {
    const matchTab =
      filterTab === 'all' ||
      (filterTab === 'active'    && (s.status === 'IN_TRANSIT' || s.status === 'DELAYED')) ||
      (filterTab === 'completed' && (s.status === 'DELIVERED'  || s.status === 'CANCELLED')) ||
      (filterTab === 'planned'   && s.status === 'PLANNED');
    const matchSearch = !search || s.cargoTitle.toLowerCase().includes(search.toLowerCase()) || s.cargoId.toLowerCase().includes(search.toLowerCase()) || s.driver.name.toLowerCase().includes(search.toLowerCase()) || s.vehicle.plateNumber.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const tabCount = (tab: FilterTab) => {
    if (tab === 'all')       return allShipments.length;
    if (tab === 'active')    return allShipments.filter(s => s.status === 'IN_TRANSIT' || s.status === 'DELAYED').length;
    if (tab === 'completed') return allShipments.filter(s => s.status === 'DELIVERED' || s.status === 'CANCELLED').length;
    if (tab === 'planned')   return allShipments.filter(s => s.status === 'PLANNED').length;
    return 0;
  };

  const totalActive    = allShipments.filter(s => s.status === 'IN_TRANSIT' || s.status === 'DELAYED').length;
  const totalCompleted = allShipments.filter(s => s.status === 'DELIVERED').length;
  const onTimeRate     = allShipments.length ? Math.round(allShipments.filter(s => s.status !== 'DELAYED' && s.status !== 'CANCELLED').length / allShipments.length * 100) : 100;

  const isActive = (s: Shipment) => s.status === 'IN_TRANSIT' || s.status === 'DELAYED';

  // get the right tracking path based on user role
  const getTripPath = (tripId: string) => {
    switch (user?.role) {
      case 'TRUCK_OWNER': return `/dashboard/fleet/tracking/trips/${tripId}`;
      case 'DRIVER':      return `/dashboard/driver/tracking/trips/${tripId}`;
      case 'BROKER':      return `/dashboard/broker/tracking/trips/${tripId}`;
      default:            return `/dashboard/tracking/trips/${tripId}`;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="animate-spin text-[#345E85]" size={32} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading journeys…</p>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-28 lg:pb-6">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] uppercase tracking-tight flex items-center gap-2">
            <Radio size={20} className={cn('flex-shrink-0', wsConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-400')} />
            Journey Monitor
          </h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {wsConnected ? 'GPS feed live · Real-time tracking active' : 'Connecting to GPS stream…'} · {allShipments.length} trips
          </p>
        </div>
        <button
          onClick={() => fetchShipments(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all self-start sm:self-auto"
        >
          <RefreshCw size={13} className={cn(refreshing && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* ── Summary stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 bg-slate-50/50 p-3 sm:p-5 rounded-2xl border border-slate-100">
        <CircularStatCard title="Active" value={totalActive} icon={Activity} colorClass="bg-blue-50 text-[#345E85]" secondaryColor="text-[#345E85]" />
        <CircularStatCard title="Completed" value={totalCompleted} icon={CheckCircle} colorClass="bg-emerald-50 text-emerald-600" secondaryColor="text-emerald-600" />
        <CircularStatCard title="On-time" value={`${onTimeRate}%`} icon={Shield} colorClass="bg-amber-50 text-amber-600" secondaryColor="text-amber-600" />
        <CircularStatCard title="All Trips" value={allShipments.length} icon={TrendingUp} colorClass="bg-purple-50 text-purple-600" secondaryColor="text-purple-600" />
      </div>

      {/* ── Status filter tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setFilterTab(tab.key); setSelectedId(null); }}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all',
              filterTab === tab.key
                ? `${tab.color} border-transparent shadow-sm`
                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
            )}
          >
            {tab.label}
            <span className={cn('px-1.5 py-0.5 rounded-full text-[9px] font-black', filterTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600')}>
              {tabCount(tab.key)}
            </span>
          </button>
        ))}

        {/* Search */}
        <div className="ml-auto flex-shrink-0 relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search trips…"
            className="pl-8 pr-3 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-semibold text-slate-600 w-36 sm:w-48 focus:outline-none focus:ring-2 focus:ring-[#345E85]/20 focus:border-[#345E85]"
          />
        </div>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left: trip list ──────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
            {filtered.length} {filterTab === 'all' ? 'Trips' : TABS.find(t => t.key === filterTab)?.label ?? 'Trips'}
          </p>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 gap-3 text-center">
              <Package size={28} className="text-slate-300" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No trips found</p>
              {search && <button onClick={() => setSearch('')} className="text-[9px] text-[#345E85] font-black uppercase tracking-widest underline">Clear search</button>}
            </div>
          ) : (
            <>
              {/* Mobile: horizontal scroll */}
              <div className="flex lg:hidden gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none snap-x snap-mandatory">
                {filtered.map(s => (
                  <button key={s.id} onClick={() => { setSelectedId(s.id); setShowMessaging(false); }}
                    className={cn('flex-shrink-0 w-60 snap-start text-left p-3.5 rounded-2xl border transition-all',
                      selectedId === s.id ? 'bg-[#345E85] border-[#345E85] shadow-lg' : 'bg-white border-slate-100 shadow-sm'
                    )}>
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <p className={cn('text-xs font-black truncate tracking-tight flex-1', selectedId === s.id ? 'text-white' : 'text-[#0f172a]')}>{s.cargoTitle}</p>
                      <span className={cn('px-2 py-0.5 rounded-md text-[8px] font-black uppercase border flex-shrink-0', selectedId === s.id ? 'bg-white/20 text-white border-transparent' : (STATUS_STYLE[s.status] ?? ''))}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </div>
                    <div className={cn('text-[9px] font-bold flex items-center gap-1 mb-2', selectedId === s.id ? 'text-blue-100' : 'text-slate-500')}>
                      <Truck size={9} />{s.vehicle.plateNumber}<span className="opacity-40">·</span><User size={9} /><span className="truncate">{s.driver.name}</span>
                    </div>
                    {isActive(s) && (
                      <div className="flex items-center gap-1">
                        <span className={cn('w-1.5 h-1.5 rounded-full', s.driverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300')} />
                        <span className={cn('text-[8px] font-black uppercase', selectedId === s.id ? 'text-blue-200' : 'text-slate-400')}>{s.driverOnline ? 'GPS Live' : 'Offline'}</span>
                        {s.speed ? <span className={cn('ml-auto text-[8px] font-black', selectedId === s.id ? 'text-blue-200' : 'text-slate-400')}>{s.speed} km/h</span> : null}
                      </div>
                    )}
                    {!isActive(s) && s.status === 'DELIVERED' && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle size={10} />
                        <span className="text-[8px] font-black uppercase">Delivered</span>
                        {s.actualEnd && <span className="ml-auto text-[8px] text-slate-400">{new Date(s.actualEnd).toLocaleDateString()}</span>}
                      </div>
                    )}
                    <div className={cn('w-full h-1 rounded-full overflow-hidden mt-2', selectedId === s.id ? 'bg-white/20' : 'bg-slate-100')}>
                      <div className={cn('h-full rounded-full', selectedId === s.id ? 'bg-white' : s.status === 'DELIVERED' ? 'bg-emerald-500' : 'bg-[#345E85]')} style={{ width: `${s.progress}%` }} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop: vertical list */}
              <div className="hidden lg:flex flex-col gap-2 max-h-[680px] overflow-y-auto pr-1">
                {filtered.map(s => (
                  <button key={s.id} onClick={() => { setSelectedId(s.id); setShowMessaging(false); }}
                    className={cn('w-full text-left p-4 rounded-2xl border transition-all group',
                      selectedId === s.id ? 'bg-[#345E85] border-[#345E85] shadow-md' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                    )}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm font-black truncate tracking-tight', selectedId === s.id ? 'text-white' : 'text-[#0f172a]')}>{s.cargoTitle}</p>
                        <p className={cn('text-[9px] font-black uppercase mt-0.5', selectedId === s.id ? 'text-blue-200' : 'text-slate-400')}>#{s.cargoId}</p>
                      </div>
                      <span className={cn('px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex-shrink-0', selectedId === s.id ? 'bg-white/20 text-white border-transparent' : (STATUS_STYLE[s.status] ?? ''))}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </div>
                    <div className={cn('flex items-center gap-1.5 text-[10px] font-bold mb-2', selectedId === s.id ? 'text-blue-100' : 'text-slate-500')}>
                      <Truck size={11} />{s.vehicle.plateNumber}
                      <span className="opacity-50">·</span>
                      <User size={11} /><span className="truncate">{s.driver.name}</span>
                    </div>
                    {/* Active trip: online badge + speed */}
                    {isActive(s) && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className={cn('w-2 h-2 rounded-full', s.driverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300')} />
                        <span className={cn('text-[9px] font-black uppercase', selectedId === s.id ? 'text-blue-200' : 'text-slate-400')}>{s.driverOnline ? 'GPS Live' : 'Offline'}</span>
                        {s.speed ? <span className={cn('ml-auto text-[9px] font-black', selectedId === s.id ? 'text-blue-200' : 'text-slate-400')}>{s.speed} km/h</span> : null}
                      </div>
                    )}
                    {/* Completed trip: delivery date + View Journey button */}
                    {s.status === 'DELIVERED' && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-1 text-emerald-600 text-[9px] font-black uppercase">
                          <CheckCircle size={11} />Delivered {s.actualEnd ? new Date(s.actualEnd).toLocaleDateString() : ''}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(getTripPath(s.id)); }}
                          className={cn('flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg transition-all', selectedId === s.id ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100')}
                        >
                          <History size={10} /> Journey <ChevronRight size={9} />
                        </button>
                      </div>
                    )}
                    {/* Planned trip */}
                    {s.status === 'PLANNED' && (
                      <div className="flex items-center gap-1 text-amber-600 text-[9px] font-black uppercase mb-2">
                        <Clock size={11} /> Scheduled · {s.estimatedDelivery ? new Date(s.estimatedDelivery).toLocaleDateString() : 'TBD'}
                      </div>
                    )}
                    {/* Progress bar */}
                    <div className={cn('w-full h-1.5 rounded-full overflow-hidden', selectedId === s.id ? 'bg-white/20' : 'bg-slate-100')}>
                      <div className={cn('h-full rounded-full transition-all', selectedId === s.id ? 'bg-white' : s.status === 'DELIVERED' ? 'bg-emerald-500' : s.status === 'DELAYED' ? 'bg-rose-400' : 'bg-[#345E85]')} style={{ width: `${s.progress}%` }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className={cn('text-[8px] font-black uppercase', selectedId === s.id ? 'text-blue-200' : 'text-slate-400')}>{s.pickupLocation.name} → {s.deliveryLocation.name}</span>
                      <span className={cn('text-[8px] font-black', selectedId === s.id ? 'text-white' : 'text-slate-500')}>{s.progress}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: map + detail ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Map */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-[#345E85] border border-slate-100">
                  <Navigation size={13} />
                </div>
                <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-[0.2em]">
                  {selected ? (isActive(selected) ? 'Live Map' : 'Journey Route') : 'Fleet Map'}
                </span>
                {selected && (
                  <span className="px-2 py-0.5 bg-blue-50 text-[#345E85] border border-blue-100 rounded-full text-[8px] font-black uppercase">
                    #{selected.cargoId}
                  </span>
                )}
                {liveFlash && isActive(selected!) && (
                  <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase animate-in fade-in">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />Updated
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selected?.driverOnline && (
                  <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase">
                    <Wifi size={11} className="animate-pulse" />Live
                  </span>
                )}
                {selected && (
                  <button
                    onClick={() => navigate(getTripPath(selected.id))}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-[#345E85] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#0f172a] transition-all"
                  >
                    <ExternalLink size={10} />
                    <span className="hidden sm:inline">Full View</span>
                  </button>
                )}
              </div>
            </div>

            <MapContainer
              center={selected ? [selected.currentLocation.latitude, selected.currentLocation.longitude] : [-1.29, 36.82]}
              zoom={selected ? (isActive(selected) ? 11 : 8) : 6}
              style={{ height: 'clamp(240px, 45vw, 420px)', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {selected && (
                <>
                  {/* Auto-pan only for active trips */}
                  {isActive(selected) && <MapPanner lat={selected.currentLocation.latitude} lng={selected.currentLocation.longitude} />}

                  {/* Route breadcrumbs */}
                  {selected.routeHistory.length > 1 && (
                    <Polyline
                      positions={selected.routeHistory}
                      color={selected.status === 'DELIVERED' ? '#10b981' : '#345E85'}
                      weight={4}
                      opacity={0.85}
                    />
                  )}

                  {/* Pickup pin — A (green) */}
                  {selected.pickupLocation.latitude != null && (
                    <Marker position={[selected.pickupLocation.latitude, selected.pickupLocation.longitude]} icon={startPin}>
                      <Popup>
                        <div className="text-xs space-y-0.5 min-w-[140px]">
                          <p className="font-black text-emerald-600 uppercase tracking-widest">🅐 Start / Pickup</p>
                          <p className="font-semibold text-slate-700">{selected.pickupLocation.name}</p>
                          {selected.pickupLocation.address && <p className="text-slate-500">{selected.pickupLocation.address}</p>}
                          {selected.actualPickup && <p className="text-slate-400 text-[10px]">Departed: {new Date(selected.actualPickup).toLocaleString()}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Delivery pin — B (red) */}
                  {selected.deliveryLocation.latitude != null && (
                    <Marker position={[selected.deliveryLocation.latitude, selected.deliveryLocation.longitude]} icon={endPin}>
                      <Popup>
                        <div className="text-xs space-y-0.5 min-w-[140px]">
                          <p className="font-black text-red-600 uppercase tracking-widest">🅑 End / Delivery</p>
                          <p className="font-semibold text-slate-700">{selected.deliveryLocation.name}</p>
                          {selected.deliveryLocation.address && <p className="text-slate-500">{selected.deliveryLocation.address}</p>}
                          {selected.actualEnd && <p className="text-slate-400 text-[10px]">Arrived: {new Date(selected.actualEnd).toLocaleString()}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Live truck — only show if driver has position */}
                  {(isActive(selected) || selected.routeHistory.length > 0) && (
                    <Marker position={[selected.currentLocation.latitude, selected.currentLocation.longitude]} icon={truckIcon}>
                      <Popup>
                        <div className="text-xs space-y-1 min-w-[130px]">
                          <p className="font-black text-[#345E85] uppercase">
                            {isActive(selected) ? 'Live Position' : 'Last Position'}
                          </p>
                          <p>{selected.vehicle.plateNumber} · {selected.driver.name}</p>
                          {selected.speed != null && <p>Speed: <strong>{selected.speed} km/h</strong></p>}
                          <p className="text-[10px] text-slate-400">
                            {new Date(selected.currentLocation.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </>
              )}

              {/* No selection — show all active trucks */}
              {!selected && allShipments.filter(isActive).map(s => (
                <Marker key={s.id} position={[s.currentLocation.latitude, s.currentLocation.longitude]} icon={fleetPin}>
                  <Popup>
                    <strong>{s.cargoTitle}</strong><br />
                    {s.driver.name} · {s.vehicle.plateNumber}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Map legend */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-slate-50 bg-white flex-wrap">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Legend:</span>
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
                <span className="inline-flex w-5 h-5 rounded-full bg-emerald-500 items-center justify-center text-white font-black text-[9px]">A</span>
                Pickup / Start
              </span>
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
                <span className="inline-flex w-5 h-5 rounded-full bg-red-500 items-center justify-center text-white font-black text-[9px]">B</span>
                Delivery / End
              </span>
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
                <span className="inline-flex w-4 h-4 rounded-sm bg-[#345E85] items-center justify-center">
                  <svg viewBox="0 0 10 10" width="10" height="10" fill="white"><rect x="1" y="3" width="8" height="5" rx="1"/><rect x="3" y="1" width="4" height="3" rx="0.5"/></svg>
                </span>
                Live Truck
              </span>
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
                <span className="inline-block w-6 h-1 rounded-full bg-[#345E85]" />
                Active Route
              </span>
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
                <span className="inline-block w-6 h-1 rounded-full bg-emerald-500" />
                Completed Route
              </span>
            </div>
          </div>

          {/* Detail panel — shown when a trip is selected */}
          {selected && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 space-y-4">

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    label: isActive(selected) ? 'ETA' : 'Delivered',
                    value: selected.status === 'DELIVERED'
                      ? (selected.actualEnd ? new Date(selected.actualEnd).toLocaleDateString() : 'Done')
                      : etaCountdown(selected.estimatedDelivery),
                    icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50',
                  },
                  {
                    label: 'Speed',
                    value: selected.speed != null ? `${selected.speed} km/h` : '—',
                    icon: Gauge, color: 'text-purple-600', bg: 'bg-purple-50',
                  },
                  {
                    label: 'Progress',
                    value: `${selected.progress}%`,
                    icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50',
                  },
                  {
                    label: 'GPS Points',
                    value: selected.routeHistory.length,
                    icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50',
                  },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', stat.bg, stat.color)}>
                      <stat.icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-sm font-black text-[#0f172a] truncate">{String(stat.value)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Route */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Pickup</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 truncate">{selected.pickupLocation.address || selected.pickupLocation.name}</p>
                  {selected.actualPickup && (
                    <p className="text-[9px] text-slate-400 mt-0.5">{new Date(selected.actualPickup).toLocaleString()}</p>
                  )}
                </div>
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                  <div className="flex items-center gap-1.5 text-red-500 mb-1">
                    <MapPin size={10} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Delivery</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 truncate">{selected.deliveryLocation.address || selected.deliveryLocation.name}</p>
                  {selected.status === 'DELIVERED' && selected.actualEnd
                    ? <p className="text-[9px] font-black text-emerald-600 mt-0.5">Completed: {new Date(selected.actualEnd).toLocaleString()}</p>
                    : <p className="text-[9px] text-slate-400 mt-0.5">ETA: {new Date(selected.estimatedDelivery).toLocaleString()}</p>
                  }
                </div>
              </div>

              {/* Milestones */}
              {selected.milestones?.length ? (
                <div className="relative pl-5 border-l-2 border-slate-100 space-y-3">
                  {selected.milestones.map((m, i) => (
                    <div key={i} className="relative flex items-start gap-3">
                      <div className={cn('absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex-shrink-0',
                        m.status === 'COMPLETED' ? 'bg-emerald-500' : m.status === 'CURRENT' ? 'bg-blue-500 animate-pulse' : 'bg-slate-200'
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-[10px] font-black uppercase tracking-widest', m.status === 'PENDING' ? 'text-slate-400' : 'text-[#0f172a]')}>{m.location}</p>
                        {m.timestamp && <p className="text-[9px] text-slate-400 mt-0.5">{new Date(m.timestamp).toLocaleString()}</p>}
                      </div>
                      <span className={cn('flex-shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border',
                        m.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        m.status === 'CURRENT'   ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' :
                        'bg-slate-50 text-slate-400 border-slate-100'
                      )}>{m.status}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Driver info + actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#0f172a] uppercase tracking-tight">{selected.driver.name}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest">{selected.vehicle.plateNumber} · {selected.vehicle.type}</p>
                  </div>
                  <span className={cn('ml-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border',
                    selected.driverOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                  )}>
                    {selected.driverOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Full tracker button */}
                  <button
                    onClick={() => navigate(getTripPath(selected.id))}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#345E85] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#0f172a] transition-all"
                  >
                    {selected.status === 'DELIVERED' ? <><History size={12} /> Route Playback</> : <><ExternalLink size={12} /> Full Tracker</>}
                  </button>

                  {/* Message button */}
                  {isActive(selected) && (
                    <button
                      onClick={() => setShowMessaging(!showMessaging)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      <MessageCircle size={12} /> Message
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Messaging panel */}
          {showMessaging && selected && isActive(selected) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-[#345E85]" />
                  <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">Chat · {selected.driver.name}</span>
                </div>
                <button onClick={() => setShowMessaging(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <div className="h-44 overflow-y-auto bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                    <MessageSquare size={18} className="text-slate-400" />
                    <p className="text-[9px] font-black text-slate-400 uppercase">No messages yet</p>
                  </div>
                ) : messages.map(m => (
                  <div key={m.id} className={cn('flex', m.sender === 'me' ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[75%] px-3 py-2 rounded-2xl text-xs font-medium', m.sender === 'me' ? 'bg-[#0f172a] text-white rounded-br-none' : 'bg-white border border-slate-100 text-[#0f172a] rounded-bl-none')}>
                      {m.text}
                      <p className="text-[8px] opacity-50 mt-0.5 font-black uppercase">{m.ts.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && msgInput.trim()) { setMessages(p => [...p, { id: Date.now().toString(), sender: 'me', text: msgInput.trim(), ts: new Date() }]); setMsgInput(''); } }}
                  placeholder="Type a message…"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#345E85]/20 focus:border-[#345E85]"
                />
                <button
                  onClick={() => { if (msgInput.trim()) { setMessages(p => [...p, { id: Date.now().toString(), sender: 'me', text: msgInput.trim(), ts: new Date() }]); setMsgInput(''); } }}
                  className="px-4 py-2.5 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0f172a] transition-all"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Empty state — no trip selected */}
          {!selected && (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100 gap-4 text-center">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Navigation size={24} className="text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Select a trip</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Click any shipment on the left to view details
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Tracking;
