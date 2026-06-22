/**
 * ActiveTripTracker
 * -----------------
 * Driver-facing component shown when a trip is IN_PROGRESS.
 * - Displays a live Leaflet map with the driver's current position
 *   and the travelled route as a polyline.
 * - Automatically starts GPS broadcasting via useGpsTracking.
 * - Shows trip metadata: ETA, speed, distance, accuracy.
 * - "End Trip" button completes the trip and stops tracking.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import {
  Navigation,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  MapPin,
  Gauge,
  Target,
  Battery,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useGpsTracking } from '../../hooks/useGpsTracking';
import { driverApi } from '../../services/driverApi';
import { cn } from '../../utils/cn';

// ── Fix Leaflet default icon in Vite/webpack builds ─────────────────────
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const truckIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl: iconShadow,
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48],
  shadowSize: [41, 41],
});

// Labeled A / B pins — consistent with the rest of the tracking system
const makeLabelPin = (label: string, bg: string) => new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 48" width="36" height="48">
      <path d="M18 0C8.06 0 0 8.06 0 18c0 12.15 18 30 18 30S36 30.15 36 18C36 8.06 27.94 0 18 0z" fill="${bg}" stroke="white" stroke-width="2"/>
      <circle cx="18" cy="18" r="10" fill="white" opacity="0.25"/>
      <text x="18" y="23" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="900" fill="white">${label}</text>
    </svg>
  `)}`,
  iconSize: [36, 48], iconAnchor: [18, 48], popupAnchor: [0, -52],
});

const startPin = makeLabelPin('A', '#10b981'); // green — origin/pickup
const endPin   = makeLabelPin('B', '#ef4444'); // red   — destination/delivery

// Auto-pan the map when the driver moves
function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true, duration: 1 });
  }, [lat, lng, map]);
  return null;
}

// ── Types ────────────────────────────────────────────────────────────────
export interface ActiveTripInfo {
  id: string;
  tripNumber: string;
  status: string;
  origin: { address: string; city: string; coordinates?: [number, number] };
  destination: { address: string; city: string; coordinates?: [number, number] };
  estimatedArrival?: string;
  agreedPrice?: number;
  cargo?: { description: string; weight: number; type: string };
}

interface ActiveTripTrackerProps {
  trip: ActiveTripInfo;
  driverId: string;
  onTripEnded?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────
export const ActiveTripTracker: React.FC<ActiveTripTrackerProps> = ({
  trip,
  driverId,
  onTripEnded,
}) => {
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [ending, setEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds since mount
  const startTimeRef = useRef(Date.now());

  const { isTracking, currentPosition, error, accuracy } = useGpsTracking({
    tripId: trip.id,
    driverId,
    enabled: trip.status === 'IN_PROGRESS' || trip.status === 'in_progress',
    intervalMs: 20_000,
  });

  // Build route polyline from successive positions
  useEffect(() => {
    if (!currentPosition) return;
    setRoutePath((prev) => {
      const newPoint: [number, number] = [
        currentPosition.latitude,
        currentPosition.longitude,
      ];
      // Avoid duplicate consecutive points
      const last = prev[prev.length - 1];
      if (last && last[0] === newPoint[0] && last[1] === newPoint[1]) {
        return prev;
      }
      return [...prev, newPoint];
    });
  }, [currentPosition]);

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleEndTrip = async () => {
    if (!window.confirm('End this trip? This action cannot be undone.')) return;
    setEnding(true);
    try {
      await driverApi.completeTrip(trip.id);
      toast.success('Trip completed successfully!', { icon: '🏁' });
      onTripEnded?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to end trip');
    } finally {
      setEnding(false);
    }
  };

  const hasPosition = currentPosition !== null;
  const defaultCenter: [number, number] = hasPosition
    ? [currentPosition!.latitude, currentPosition!.longitude]
    : trip.destination.coordinates
    ? [trip.destination.coordinates[0], trip.destination.coordinates[1]]
    : [0, 0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 sm:space-y-4"
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-black text-[#0f172a] uppercase tracking-tight leading-none">
              Live Tracking
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Trip #{trip.tripNumber}
            </p>
          </div>
          {/* Live badge */}
          <span
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex-shrink-0',
              isTracking
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-amber-50 text-amber-600 border-amber-100',
            )}
          >
            {isTracking ? (
              <Wifi className="w-3 h-3 animate-pulse" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">{isTracking ? 'Broadcasting GPS' : 'Acquiring…'}</span>
            <span className="sm:hidden">{isTracking ? 'Live' : 'GPS…'}</span>
          </span>
        </div>

        <button
          onClick={handleEndTrip}
          disabled={ending}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-60 shadow-md w-full sm:w-auto"
        >
          {ending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          End Trip
        </button>
      </div>

      {/* ── GPS error banner ─────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error} — location updates paused.
        </div>
      )}

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          {
            label: 'Elapsed',
            value: formatElapsed(elapsed),
            icon: Clock,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Speed',
            value: currentPosition?.speed != null
              ? `${currentPosition.speed} km/h`
              : '—',
            icon: Gauge,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
          {
            label: 'Points',
            value: routePath.length,
            icon: Activity,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Accuracy',
            value: accuracy != null ? `±${Math.round(accuracy)}m` : '—',
            icon: Target,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-2 shadow-sm"
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                stat.bg,
                stat.color,
              )}
            >
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-sm font-black text-[#0f172a] truncate">{String(stat.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Map ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <MapContainer
          center={defaultCenter}
          zoom={hasPosition ? 14 : 4}
          style={{ height: 'clamp(220px, 50vw, 400px)', width: '100%' }}
          scrollWheelZoom
          aria-label="Active trip map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Auto-pan when position changes */}
          {hasPosition && (
            <MapUpdater
              lat={currentPosition!.latitude}
              lng={currentPosition!.longitude}
            />
          )}

          {/* Travelled route */}
          {routePath.length > 1 && (
            <Polyline
              positions={routePath}
              color="#345E85"
              weight={4}
              opacity={0.85}
            />
          )}

          {/* Driver marker — live position */}
          {hasPosition && (
            <Marker
              position={[currentPosition!.latitude, currentPosition!.longitude]}
              icon={truckIcon}
            >
              <Popup>
                <div className="text-xs space-y-0.5 min-w-[130px]">
                  <p className="font-black text-[#345E85] uppercase">Your Position</p>
                  {currentPosition!.speed != null && <p>Speed: <strong>{currentPosition!.speed} km/h</strong></p>}
                  <p className="text-slate-400 text-[10px]">{currentPosition!.latitude.toFixed(5)}, {currentPosition!.longitude.toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Origin pin — A (green) */}
          {trip.origin.coordinates && trip.origin.coordinates[0] !== 0 && (
            <Marker
              position={[trip.origin.coordinates[0], trip.origin.coordinates[1]]}
              icon={startPin}
            >
              <Popup>
                <div className="text-xs space-y-0.5 min-w-[140px]">
                  <p className="font-black text-emerald-600 uppercase tracking-widest">🅐 Start / Pickup</p>
                  <p className="font-semibold text-slate-700">{trip.origin.address}</p>
                  {trip.origin.city && <p className="text-slate-500">{trip.origin.city}</p>}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination pin — B (red) */}
          {trip.destination.coordinates && trip.destination.coordinates[0] !== 0 && (
            <Marker
              position={[trip.destination.coordinates[0], trip.destination.coordinates[1]]}
              icon={endPin}
            >
              <Popup>
                <div className="text-xs space-y-0.5 min-w-[140px]">
                  <p className="font-black text-red-600 uppercase tracking-widest">🅑 End / Delivery</p>
                  <p className="font-semibold text-slate-700">{trip.destination.address}</p>
                  {trip.destination.city && <p className="text-slate-500">{trip.destination.city}</p>}
                  {trip.estimatedArrival && <p className="text-slate-400 text-[10px]">ETA: {new Date(trip.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Map legend */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 px-3 py-2 border-t border-slate-50 bg-white">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Legend:</span>
          <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
            <span className="inline-flex w-5 h-5 rounded-full bg-emerald-500 items-center justify-center text-white font-black text-[9px] flex-shrink-0">A</span>
            Start
          </span>
          <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
            <span className="inline-flex w-5 h-5 rounded-full bg-red-500 items-center justify-center text-white font-black text-[9px] flex-shrink-0">B</span>
            Destination
          </span>
          <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600">
            <span className="inline-block w-5 h-1 rounded-full bg-[#345E85]" /> Your Route
          </span>
          <span className={cn('ml-auto flex items-center gap-1.5 text-[9px] font-black uppercase', isTracking ? 'text-emerald-600' : 'text-slate-400')}>
            <span className={cn('w-2 h-2 rounded-full', isTracking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')} />
            {isTracking ? 'Broadcasting GPS' : 'GPS acquiring…'}
          </span>
        </div>
      </div>

      {/* ── Route summary ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 text-[#345E85] mb-1">
            <div className="w-2 h-2 rounded-full bg-[#345E85]" />
            <span className="text-[9px] font-black uppercase tracking-widest">Origin</span>
          </div>
          <p className="text-xs font-bold text-slate-700 truncate">{trip.origin.address}</p>
          <p className="text-[10px] text-slate-500">{trip.origin.city}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <MapPin className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Destination</span>
          </div>
          <p className="text-xs font-bold text-slate-700 truncate">{trip.destination.address}</p>
          <p className="text-[10px] text-slate-500">{trip.destination.city}</p>
          {trip.estimatedArrival && (
            <p className="text-[9px] font-black text-emerald-600 mt-1">
              ETA:{' '}
              {new Date(trip.estimatedArrival).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ActiveTripTracker;
