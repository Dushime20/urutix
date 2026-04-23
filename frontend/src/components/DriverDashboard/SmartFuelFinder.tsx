import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  Droplets,
  DollarSign,
  Zap,
  Search,
  Loader2,
  AlertCircle,
  LocateFixed,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

interface Station {
  id: string;
  name: string;
  address: string | null;
  distanceKm: number;
  fuelType: string;
  brand: string | null;
  phone?: string | null;
  openingHours?: string | null;
  coordinates: { latitude: number; longitude: number };
  isNearest?: boolean;
}

interface SmartFuelFinderProps {
  /** Driver's last known location from the DB (currentLocation field on Driver entity) */
  driverLocation?: { latitude?: number; longitude?: number } | null;
}

export const SmartFuelFinder: React.FC<SmartFuelFinderProps> = ({ driverLocation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationSource, setLocationSource] = useState<'driver' | 'browser' | null>(null);

  const fetchStations = async (lat: number, lng: number, source: 'driver' | 'browser') => {
    setLoading(true);
    setError(null);
    setLocationSource(source);
    try {
      const res = await api.get('/locations/fuel-stations', {
        params: { lat, lng, radius: 10000 },
      });
      const raw: Station[] = res.data?.stations ?? [];
      if (raw.length > 0) raw[0].isNearest = true;
      setStations(raw);
    } catch {
      setError('Could not load nearby stations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestBrowserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchStations(pos.coords.latitude, pos.coords.longitude, 'browser'),
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationDenied(true);
          setError('Location access denied. Enable location permissions to find nearby stations.');
        } else {
          setError('Could not determine your location. Please try again.');
        }
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleRefresh = () => {
    // Always prefer driver's DB location first, fall back to browser
    const dbLat = driverLocation?.latitude;
    const dbLng = driverLocation?.longitude;
    if (dbLat && dbLng && !isNaN(dbLat) && !isNaN(dbLng)) {
      fetchStations(dbLat, dbLng, 'driver');
    } else {
      requestBrowserLocation();
    }
  };

  // On mount: use driver's stored location first, then browser geolocation
  useEffect(() => {
    const dbLat = driverLocation?.latitude;
    const dbLng = driverLocation?.longitude;
    if (dbLat && dbLng && !isNaN(dbLat) && !isNaN(dbLng)) {
      fetchStations(dbLat, dbLng, 'driver');
    } else {
      requestBrowserLocation();
    }
  }, [driverLocation?.latitude, driverLocation?.longitude]);

  const handleNavigate = (station: Station) => {
    const query = encodeURIComponent(
      station.name + (station.address ? ` ${station.address}` : ''),
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const filtered = stations.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.address ?? '').toLowerCase().includes(q) ||
      (s.brand ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
            <Droplets size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Nearby</p>
            <h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tight">Fuel Stations</h3>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-blue-50 text-[#345E85] rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-2 hover:bg-[#345E85] hover:text-white transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
          {loading ? 'Locating…' : 'Refresh'}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search stations or brands..."
          className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 size={32} className="animate-spin text-[#345E85]" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Finding nearby stations…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <AlertCircle size={32} className="text-amber-400" />
            <p className="text-sm font-bold text-slate-500">{error}</p>
            {locationDenied && (
              <p className="text-xs text-slate-400">
                Go to your browser settings and allow location access for this site.
              </p>
            )}
            <button
              onClick={handleRefresh}
              className="mt-2 px-6 py-2 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && stations.length > 0 && (
          <div className="text-center py-12 text-slate-400 text-sm font-medium">
            No stations match your search.
          </div>
        )}

        {!loading && !error && stations.length === 0 && !locationDenied && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <MapPin size={32} className="text-slate-200" />
            <p className="text-sm font-bold text-slate-400">No fuel stations found nearby</p>
            <p className="text-xs text-slate-300">Try increasing the search radius</p>
          </div>
        )}

        {!loading && filtered.map((station, i) => (
          <motion.div
            key={station.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 hover:border-blue-100 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-black text-[#0f172a] uppercase tracking-tight text-sm">{station.name}</h4>
                  {station.isNearest && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded">Nearest</span>
                  )}
                  {station.brand && station.brand !== station.name && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded">{station.brand}</span>
                  )}
                </div>
                {station.address && (
                  <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                    <MapPin size={10} />
                    {station.address}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className="flex items-center justify-end text-slate-500 mb-1">
                  <DollarSign size={12} />
                  <span className="text-sm font-black tracking-tighter text-slate-400">—</span>
                </div>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Price N/A</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Distance</span>
                  <span className="text-xs font-black text-[#0f172a] uppercase">{station.distanceKm} KM</span>
                </div>
                <div className="flex flex-col border-l border-slate-200 pl-4">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Type</span>
                  <span className="text-xs font-black text-blue-500 uppercase">{station.fuelType}</span>
                </div>
              </div>

              <button
                onClick={() => handleNavigate(station)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-[#0f172a] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:bg-[#345E85] group-hover:text-white group-hover:border-[#345E85] transition-all shadow-sm"
              >
                Navigate
                <Navigation size={12} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer note */}
      {!loading && stations.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#345E85] flex items-center justify-center text-white shrink-0">
            <Zap size={16} />
          </div>
          <p className="text-[10px] font-bold text-[#345E85]">
            {stations.length} station{stations.length !== 1 ? 's' : ''} found within 10 km
            {locationSource === 'driver' ? ' of your tracked position' : ' of your current location'}.
            Data from OpenStreetMap.
          </p>
        </div>
      )}
    </div>
  );
};
