/**
 * Map-View Load Browsing — TRUCK_OWNER role
 * Route: /dashboard/fleet/load-map
 * Layout: DashboardLayout (FleetOwnerLayout)
 */
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Package, ArrowRight, Sliders, Navigation } from 'lucide-react';
import { mapViewApi } from '../../../services/featuresApi';
import { TranslatedText } from '../../../components/translated-text';
import ModernLoader from '../../../components/common/ModernLoader';

const TRUCK_TYPES = ['FLATBED', 'BOX_TRUCK', 'TANKER', 'REFRIGERATED', 'CONTAINER', 'HEAVY_HAUL', 'TIPPER'];

const LoadMapPage: React.FC = () => {
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radius, setRadius] = useState(100);
  const [truckType, setTruckType] = useState('');
  const [locationError, setLocationError] = useState('');
  const [selectedLoad, setSelectedLoad] = useState<any>(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); },
        () => { setLocationError('Location access denied. Using default coordinates.'); setLat(-1.2921); setLng(36.8219); }
      );
    } else {
      setLat(-1.2921); setLng(36.8219); // Default: Nairobi
    }
  }, []);

  const { data: loads = [], isLoading, refetch } = useQuery({
    queryKey: ['loads-map', lat, lng, radius, truckType],
    queryFn: () => mapViewApi.getLoads(lat!, lng!, radius, truckType || undefined),
    enabled: lat !== null && lng !== null,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          <TranslatedText text="Load Map" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          <TranslatedText text="Browse available loads near your location. Adjust radius to find more opportunities." />
        </p>
      </div>

      {locationError && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
          <Navigation size={14} /> {locationError}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Sliders size={14} className="text-slate-400" />
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            <TranslatedText text="Filters" />
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
            <TranslatedText text="Radius" />:
          </label>
          <input
            type="range"
            min={10}
            max={500}
            step={10}
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            className="w-28 accent-primary-600"
          />
          <span className="text-xs font-black text-primary-600 dark:text-primary-400 w-16">{radius} km</span>
        </div>

        <select
          value={truckType}
          onChange={e => setTruckType(e.target.value)}
          className="px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500"
        >
          <option value=""><TranslatedText text="All Truck Types" /></option>
          {TRUCK_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>

        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black transition-all"
        >
          <TranslatedText text="Search" />
        </button>

        <span className="ml-auto text-xs font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl">
          {(loads as any[]).length} <TranslatedText text="loads found" />
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Placeholder */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden" style={{ minHeight: 400 }}>
          <div className="relative w-full h-full min-h-[400px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {lat === null ? (
              <ModernLoader isLoading text="Getting_Location" />
            ) : (
              <div className="text-center space-y-3">
                <MapPin size={40} className="mx-auto text-primary-500" />
                <p className="text-sm font-black text-slate-600 dark:text-slate-400">
                  <TranslatedText text="Map View" />
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  <TranslatedText text="Interactive map requires Mapbox/Leaflet integration." />
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-xs mx-auto">
                  {(loads as any[]).slice(0, 6).map((load: any) => (
                    <button
                      key={load.id}
                      onClick={() => setSelectedLoad(load)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-[10px] font-black transition-all"
                    >
                      <MapPin size={10} />
                      {load.locations?.[0]?.locationData?.name?.slice(0, 12) ?? 'Load'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Load List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {isLoading ? (
            <ModernLoader isLoading type="table" rows={5} columns={2} />
          ) : (loads as any[]).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center">
              <Package size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                <TranslatedText text="No loads found in this area." />
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                <TranslatedText text="Try increasing the radius." />
              </p>
            </div>
          ) : (
            (loads as any[]).map((load: any) => (
              <div
                key={load.id}
                onClick={() => setSelectedLoad(load)}
                className={`bg-white dark:bg-slate-900 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${selectedLoad?.id === load.id ? 'border-primary-400 dark:border-primary-600 ring-2 ring-primary-200 dark:ring-primary-900' : 'border-slate-100 dark:border-slate-800'}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-black text-slate-900 dark:text-white text-xs leading-tight flex-1 mr-2">
                      {load.title || 'Untitled Load'}
                    </h3>
                    {load.urgencyLevel === 'CRITICAL' && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full flex-shrink-0">🚨</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mb-3">
                    <MapPin size={10} />
                    <span className="truncate">{load.locations?.[0]?.locationData?.name ?? '—'}</span>
                    <ArrowRight size={10} className="flex-shrink-0" />
                    <span className="truncate">{load.locations?.[load.locations.length - 1]?.locationData?.name ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-primary-600 dark:text-primary-400">
                      {load.currencyCode} {Number(load.offeredPrice).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{load.weight} kg</span>
                  </div>
                </div>
                {selectedLoad?.id === load.id && (
                  <div className="px-4 pb-4">
                    <button className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black transition-all">
                      <TranslatedText text="Bid on This Load" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadMapPage;
