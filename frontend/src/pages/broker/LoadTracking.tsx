import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io, Socket } from 'socket.io-client';
import { brokerAPI } from '../../services/brokerApi';
import api from '../../services/api';
import { getApiBaseUrl } from '../../config/environment';
import { 
  MapPin, 
  Package, 
  Truck, 
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Navigation,
  Activity,
  Zap,
  Shield,
  Radio,
  WifiOff,
  Gauge,
  Target,
} from 'lucide-react';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const truckIcon = new L.Icon({ iconUrl, iconRetinaUrl, shadowUrl: iconShadow, iconSize: [28, 42], iconAnchor: [14, 42], popupAnchor: [0, -42], shadowSize: [41, 41] });
const pinIcon = (color: string) => new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32"><path d="M12 0C7.58 0 4 3.58 4 8c0 7 8 20 8 20s8-13 8-20c0-4.42-3.58-8-8-8zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="${color}" stroke="white" stroke-width="1"/></svg>`)}`,
  iconSize: [24, 32], iconAnchor: [12, 32], popupAnchor: [0, -32],
});

function MapPanner({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], map.getZoom(), { animate: true, duration: 1.2 }); }, [lat, lng, map]);
  return null;
}

interface TrackingEvent {
  id: string;
  type: string;
  status: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: string;
  description?: string;
}

interface LoadTracking {
  loadId: string;
  loadTitle: string;
  currentStatus: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  progress: number;
  estimatedArrival?: string;
  events: TrackingEvent[];
  tripId?: string;
}

const LoadTracking: React.FC = () => {
  const { loadId } = useParams<{ loadId: string }>();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState<LoadTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number; speed?: number; ts: string } | null>(null);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [driverOnline, setDriverOnline] = useState(false);
  const [liveFlash, setLiveFlash] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (loadId) {
      loadTrackingData();
      const interval = setInterval(loadTrackingData, 30000);
      return () => clearInterval(interval);
    }
  }, [loadId]);

  // ── Connect socket when we have a tripId ─────────────────────────────────
  useEffect(() => {
    if (!tracking?.tripId) return;
    const token = localStorage.getItem('accessToken') ?? localStorage.getItem('jwtToken');
    if (!token) return;

    const baseUrl = getApiBaseUrl().replace('/api', '');
    const socket = io(`${baseUrl}/tracking`, { auth: { token }, transports: ['websocket', 'polling'], reconnection: true });

    socket.on('connect', () => { setWsConnected(true); socket.emit('join:trip', { tripId: tracking.tripId }); });
    socket.on('disconnect', () => { setWsConnected(false); setDriverOnline(false); });

    socket.on('trip:joined', (d: any) => {
      if (d.currentLocation?.latitude) {
        setLiveLocation({ lat: d.currentLocation.latitude, lng: d.currentLocation.longitude, ts: d.timestamp ?? new Date().toISOString() });
        setDriverOnline(true);
      }
    });

    socket.on('location:updated', (d: any) => {
      const lat = d.location?.latitude, lng = d.location?.longitude;
      if (!lat) return;
      setLiveLocation({ lat, lng, speed: d.location?.speed, ts: d.timestamp ?? new Date().toISOString() });
      setDriverOnline(true);
      setLiveFlash(true); setTimeout(() => setLiveFlash(false), 2000);
      setRoutePath(prev => {
        const last = prev[prev.length - 1];
        if (last && last[0] === lat && last[1] === lng) return prev;
        return [...prev, [lat, lng]];
      });
      if (d.eta?.eta) setTracking(prev => prev ? { ...prev, estimatedArrival: d.eta.eta } : prev);
    });

    socketRef.current = socket;
    return () => { socket.emit('leave:trip', { tripId: tracking.tripId }); socket.disconnect(); socketRef.current = null; };
  }, [tracking?.tripId]);

  // ── Fetch route history when we have a tripId ────────────────────────────
  useEffect(() => {
    if (!tracking?.tripId) return;
    api.get(`/trips/${tracking.tripId}/route`)
      .then(res => {
        const locs: any[] = res.data?.data?.locations ?? [];
        if (!locs.length) return;
        setRoutePath(locs.map((l: any) => [Number(l.latitude), Number(l.longitude)]));
        const last = locs[locs.length - 1];
        setLiveLocation({ lat: Number(last.latitude), lng: Number(last.longitude), speed: last.speed, ts: last.timestamp ?? new Date().toISOString() });
        setDriverOnline(true);
      })
      .catch(() => {});
  }, [tracking?.tripId]);

  const loadTrackingData = async () => {
    if (!loadId) return;

    try {
      setLoading(true);
      setError(null);
      
      const loadResponse = await brokerAPI.getLoad(loadId);
      const load = loadResponse.data;

      const trackingResponse = await fetch(`/api/loads/${loadId}/tracking`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (trackingResponse.ok) {
        const trackingData = await trackingResponse.json();
        setTracking({
          loadId,
          loadTitle: load.title || 'Load',
          currentStatus: trackingData.status || load.status,
          currentLocation: trackingData.currentLocation,
          progress: trackingData.progress || 0,
          estimatedArrival: trackingData.estimatedArrival,
          events: trackingData.events || [],
          tripId: trackingData.tripId,
        });
      } else {
        setTracking({
          loadId,
          loadTitle: load.title || 'Load',
          currentStatus: load.status,
          progress: 0,
          events: [],
        });
      }
    } catch (err: any) {
      console.error('Failed to load tracking:', err);
      setError(err.response?.data?.message || 'Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusPrimeStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'DELIVERED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'IN_PROGRESS':
      case 'IN_TRANSIT': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !tracking) {
    return (
      <div className="max-w-[800px] mx-auto p-12 bg-rose-50 border border-rose-100 rounded-[2.5rem] text-center space-y-6">
        <AlertCircle size={48} className="text-rose-600 mx-auto" />
        <h3 className="text-xl font-bold text-rose-900 uppercase">Tracking Interrupted</h3>
        <p className="text-xs font-bold text-rose-700 uppercase leading-relaxed">{error || 'No vector data available for this reference.'}</p>
        <button onClick={() => navigate('/dashboard/broker/loads')} className="px-10 py-4 bg-rose-600 text-white rounded-2xl text-sm font-bold uppercase">Return to Pipeline</button>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Tracking Header */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100/60 dark:bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <button onClick={() => navigate('/dashboard/broker/loads')} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all backdrop-blur-xl">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1 text-slate-900 dark:text-white">Tracking</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Vector Analysis</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12 mr-4">
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-emerald-400">{tracking.progress}%</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Progress</p>
           </div>
           <span className={`px-5 py-2 rounded-xl text-xs font-bold uppercase border shadow-sm ${getStatusPrimeStyle(tracking.currentStatus)}`}>
             {tracking.currentStatus}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Left panel: Live map + Vector point */}
        <div className="lg:col-span-1 space-y-8">
          {/* ── Live Map ───────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-50 dark:border-slate-800">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Navigation size={12} className="text-[#345E85]" /> Live Position
              </span>
              <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${driverOnline ? 'text-emerald-500' : 'text-slate-400'}`}>
                <span className={`w-2 h-2 rounded-full ${driverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                {wsConnected ? (driverOnline ? 'Live' : 'Waiting…') : <><WifiOff size={10} /> Offline</>}
                {liveFlash && <span className="ml-1 text-emerald-500">Updated</span>}
              </span>
            </div>
            <MapContainer
              center={liveLocation ? [liveLocation.lat, liveLocation.lng] : [-1.29, 36.82]}
              zoom={liveLocation ? 12 : 6}
              style={{ height: '280px', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {liveLocation && <MapPanner lat={liveLocation.lat} lng={liveLocation.lng} />}
              {routePath.length > 1 && <Polyline positions={routePath} color="#345E85" weight={4} opacity={0.85} />}
              {liveLocation && (
                <Marker position={[liveLocation.lat, liveLocation.lng]} icon={truckIcon}>
                  <Popup>
                    <strong>Live Position</strong><br />
                    {liveLocation.speed != null && <>Speed: {liveLocation.speed} km/h<br /></>}
                    {new Date(liveLocation.ts).toLocaleTimeString()}
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Vector coords */}
          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-6 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
              <div className="w-2 h-2 bg-[#345E85] rounded-full" /> GPS Coordinates
            </h3>
            {liveLocation ? (
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Latitude</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{liveLocation.lat.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Longitude</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{liveLocation.lng.toFixed(6)}</p>
                  </div>
                </div>
                {liveLocation.speed != null && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-2xl border border-purple-100">
                    <Gauge size={16} className="text-purple-600" />
                    <div>
                      <p className="text-[9px] font-black text-purple-400 uppercase">Speed</p>
                      <p className="text-sm font-bold text-purple-700">{liveLocation.speed} km/h</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <Clock size={14} className="text-slate-400" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Last update: {new Date(liveLocation.ts).toLocaleTimeString()}</p>
                </div>
                {tracking?.tripId && (
                  <button
                    onClick={() => navigate(`/dashboard/tracking/trips/${tracking.tripId}`)}
                    className="w-full py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0f172a] transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation size={14} /> Full Trip Tracker
                  </button>
                )}
              </div>
            ) : (
              <div className="p-10 text-center bg-slate-50 rounded-[2rem] opacity-50 space-y-3 dark:bg-slate-800/50">
                <Zap className="w-10 h-10 text-slate-200 mx-auto" />
                <p className="text-[10px] font-bold text-slate-300 uppercase">Awaiting coordinate lock</p>
              </div>
            )}
          </div>

          {/* ETA card */}
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden dark:bg-slate-950">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Clock size={100} /></div>
            <p className="text-[9px] font-black text-slate-500 uppercase mb-3">ETA Projection</p>
            <h3 className="text-3xl font-bold text-white mb-6 italic">
              {tracking?.estimatedArrival
                ? new Date(tracking.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'STABLE'}
            </h3>
            <div className="pt-5 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase">Date</p>
                <p className="text-[10px] font-bold text-[#345E85]">
                  {tracking?.estimatedArrival ? new Date(tracking.estimatedArrival).toLocaleDateString() : 'Pending'}
                </p>
              </div>
              <Activity size={22} className="text-[#345E85] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Event Ledger */}
        <div className="lg:col-span-2 space-y-12">
           <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden group dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center justify-between mb-12">
                 <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Event Ledger
                 </h3>
                 <span className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-400 uppercase border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">{tracking.events.length} LOGS</span>
              </div>

              {tracking.events.length === 0 ? (
                <div className="py-32 text-center space-y-6 opacity-30">
                  <Package className="w-16 h-16 text-slate-200 mx-auto" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">No vector events logged in current cycle.</p>
                </div>
              ) : (
                <div className="space-y-12 pl-4">
                  {tracking.events.map((event, index) => (
                    <div key={event.id || index} className="relative flex gap-8">
                       {index < tracking.events.length - 1 && (
                         <div className="absolute left-[23px] top-[48px] w-px h-[calc(100%+24px)] bg-slate-100"></div>
                       )}
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xl ${index === 0 ? 'bg-primary-600 text-white' : 'bg-white border border-slate-100 text-slate-300'} dark:border-slate-800`}>
                         {index === 0 ? <CheckCircle2 size={24} /> : <Package size={20} />}
                       </div>
                       <div className="flex-1 space-y-3 pt-1">
                         <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight dark:text-white">{event.type || event.status}</h4>
                            <p className="text-sm font-bold text-slate-300 uppercase">{new Date(event.timestamp).toLocaleString()}</p>
                         </div>
                         {event.description && <p className="text-xs font-bold text-slate-400 uppercase tracking-tight leading-relaxed">{event.description}</p>}
                         {event.location && (
                           <div className="flex items-center gap-3 text-xs font-bold text-primary-500 uppercase bg-primary-50 w-fit px-4 py-2 rounded-xl">
                              <MapPin size={12} />
                              <span>{event.location.address || 'Coordinate Logged'}</span>
                           </div>
                         )}
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </div>

           <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden group dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-slate-900 uppercase dark:text-white">Stream Progress</h3>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{tracking.progress}%</span>
              </div>
              <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                 <div className="h-full bg-primary-600 transition-all duration-1000" style={{ width: `${tracking.progress}%` }}></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoadTracking;
