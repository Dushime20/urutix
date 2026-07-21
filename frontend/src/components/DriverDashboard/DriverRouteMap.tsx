import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, ZoomControl } from 'react-leaflet';
import { Icon } from 'leaflet';
import { 
  Navigation, 
  Layers, 
  CloudRain, 
  Zap,
  Info,
  Maximize2,
  Clock,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RouteIntelligenceService } from '../../services/routeIntelligence';
import type { RouteInsight } from '../../services/routeIntelligence';
import { cn } from '../../utils/cn';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
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

interface DriverRouteMapProps {
  trip?: any;
}

export const DriverRouteMap: React.FC<DriverRouteMapProps> = ({ trip }) => {
  const { tSync: t } = useTranslation();
  const [insight, setInsight] = useState<RouteInsight | null>(null);
  const [activeLayer, setActiveLayer] = useState<'standard' | 'traffic' | 'weather'>('standard');
  const [showIntel, setShowIntel] = useState(true);
  const [liveLocation, setLiveLocation] = useState<[number, number] | null>(null);
  const [followGPS, setFollowGPS] = useState(true);
  const mapRef = useRef<any>(null);

  // Live GPS Tracking
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setLiveLocation(newPos);
          if (followGPS && mapRef.current) {
            mapRef.current.setView(newPos, mapRef.current.getZoom());
          }
        },
        (err) => console.error('GPS Error:', err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [followGPS]);

  useEffect(() => {
    if (trip?.origin?.city && trip?.destination?.city) {
      const routeInsight = RouteIntelligenceService.getRouteInsights(
        trip.origin.city, 
        trip.destination.city
      );
      setInsight(routeInsight);
    }
  }, [trip]);

  const center = liveLocation || trip?.currentLocation || trip?.origin?.coordinates || [0.3476, 32.5825];

  return (
    <div className="relative h-[650px] w-full bg-slate-100 rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl animate-in fade-in duration-700 group">
      
      {/* Live GPS Indicator */}
      <div className="absolute top-32 left-8 z-10">
         <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-100 shadow-lg">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              liveLocation ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-rose-500"
            )} />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              {liveLocation ? t('GPS Online') : t('Signal Lost')}
            </span>
         </div>
      </div>
      <MapContainer
        center={center}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        className="z-0"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={activeLayer === 'standard' 
            ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            : activeLayer === 'traffic'
            ? "https://{s}.tile.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          }
        />

        {/* Mock Traffic Layer (Visualized as Polylines with Offsets if real data available) */}
        {activeLayer === 'traffic' && (
           <Polyline 
             positions={[[0.3476, 32.5825], [0.3163, 32.5811]]} 
             color="#ef4444" 
             weight={8} 
             opacity={0.6}
           />
        )}

        {/* Origin/Destination Markers */}
        {trip?.origin?.coordinates && (
           <Marker position={trip.origin.coordinates} icon={driverIcon} />
        )}
        {trip?.destination?.coordinates && (
           <Marker position={trip.destination.coordinates} icon={driverIcon} />
        )}

        {/* Current Driver Location */}
        {trip?.currentLocation && (
           <Marker position={trip.currentLocation} icon={driverIcon} />
        )}

        {/* Live GPS Pulse Marker */}
        {liveLocation && (
           <Marker position={liveLocation} icon={driverIcon}>
              <div className="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-xl animate-ping" />
           </Marker>
        )}

        <ZoomControl position="bottomright" />
      </MapContainer>

      {/* Strategic Header Overlay */}
      <div className="absolute top-8 left-8 z-10 flex flex-col gap-4">
         <div className="flex bg-white/90 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-2xl shadow-slate-900/10">
            {([
               { id: 'standard', icon: Layers, label: t('Standard') },
               { id: 'traffic', icon: TrendingDown, label: t('Traffic') },
               { id: 'weather', icon: CloudRain, label: t('Weather') }
            ] as const).map((layer) => (
               <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={cn(
                     "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                     activeLayer === layer.id 
                        ? "bg-[#345E85] text-white shadow-lg" 
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  )}
               >
                  <layer.icon size={14} />
                  {layer.label}
               </button>
            ))}
         </div>

         {/* GPS Follow Toggle */}
         <button
            onClick={() => setFollowGPS(!followGPS)}
            className={cn(
               "w-fit px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 bg-white border border-slate-100 shadow-xl",
               followGPS ? "text-blue-600 border-blue-100" : "text-slate-400"
            )}
         >
            <Navigation size={14} className={cn(followGPS && "fill-blue-600")} />
            {followGPS ? t('Auto-Following') : t('Follow Me')}
         </button>
      </div>

      {/* Live Intelligence Widget */}
      <AnimatePresence>
         {showIntel && insight && (
            <motion.div 
               initial={{ opacity: 0, x: 40 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 40 }}
               className="absolute top-8 right-8 z-10 w-96 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden glassmorphism-effect"
            >
               <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100">
                           <Zap size={20} />
                        </div>
                        <div>
                           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1"><TranslatedText text="Route Analytics" /></h3>
                           <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight"><TranslatedText text="Prime Intelligence" /></p>
                        </div>
                     </div>
                     <button 
                        onClick={() => setShowIntel(false)}
                        className="p-2 text-slate-300 hover:text-slate-500 transition-colors"
                     >
                        <Maximize2 size={18} />
                     </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                           <Clock size={10} /> <TranslatedText text="Estimated Time" />
                        </p>
                        <p className="text-sm font-black text-[#0f172a] italic">{insight.estimatedTime} <TranslatedText text="Hours" /></p>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                           <Navigation size={10} /> <TranslatedText text="Distance" />
                        </p>
                        <p className="text-sm font-black text-[#0f172a] italic">{insight.distance} KM</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Traffic Intensity" /></span>
                           <span className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                              insight.trafficLevel === 'heavy' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                           )}>{insight.trafficLevel}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-blue-600 rounded-full" 
                              style={{ width: insight.trafficLevel === 'heavy' ? '90%' : insight.trafficLevel === 'moderate' ? '50%' : '15%' }} 
                           />
                        </div>
                     </div>

                     <div className="p-4 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                           <CloudRain size={48} />
                        </div>
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3"><TranslatedText text="Live Weather Stats" /></h4>
                        <div className="grid grid-cols-3 gap-4">
                           <div className="flex flex-col">
                              <span className="text-[8px] font-bold text-slate-400 uppercase"><TranslatedText text="Temp" /></span>
                              <span className="font-black text-xs">24°C</span>
                           </div>
                           <div className="flex flex-col border-x border-white/10 px-4">
                              <span className="text-[8px] font-bold text-slate-400 uppercase"><TranslatedText text="Wind" /></span>
                              <span className="font-black text-xs">12 km/h</span>
                           </div>
                           <div className="flex flex-col pl-4 text-right">
                              <span className="text-[8px] font-bold text-slate-400 uppercase"><TranslatedText text="Rain" /></span>
                              <span className="font-black text-xs">15%</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                           <Info size={14} />
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 italic max-w-[180px]">
                           {insight.weatherConditions}
                        </p>
                     </div>
                     <button className="flex items-center gap-1.5 text-[9px] font-black text-[#345E85] uppercase tracking-widest group">
                        <TranslatedText text="Full Intel" /> <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                     </button>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Mobile Interaction Controls */}
      <div className="absolute bottom-8 left-8 right-8 z-10 flex items-center justify-between md:hidden">
         <button 
            onClick={() => setShowIntel(!showIntel)}
            className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-[#345E85] shadow-2xl"
         >
            <Info size={24} />
         </button>
         <button className="h-14 px-8 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3">
            <Navigation size={18} fill="white" /> <TranslatedText text="Begin Navigation" />
         </button>
      </div>

      {!showIntel && (
         <button 
            onClick={() => setShowIntel(true)}
            className="absolute top-8 right-8 z-10 w-12 h-12 bg-white rounded-xl shadow-2xl flex items-center justify-center text-[#345E85] hover:bg-slate-50 transition-colors"
         >
            <Maximize2 size={18} />
         </button>
      )}
    </div>
  );
};
