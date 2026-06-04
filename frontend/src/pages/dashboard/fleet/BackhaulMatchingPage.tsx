/**
 * Backhaul Matching — TRUCK_OWNER role
 * Route: /dashboard/fleet/backhaul
 * Layout: DashboardLayout (FleetOwnerLayout)
 */
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Search, Package, MapPin, Calendar, Truck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { carrierMarketplaceApi } from '../../../services/featuresApi';
import { TranslatedText } from '../../../components/translated-text';

const BackhaulMatchingPage: React.FC = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const searchMutation = useMutation({
    mutationFn: () => carrierMarketplaceApi.findBackhaul({
      returnOriginCity: origin,
      returnDestinationCity: destination,
      availableDate: date,
    }),
    onSuccess: (data: any) => {
      setResults(Array.isArray(data) ? data : []);
      if (!data?.length) toast('No backhaul loads found for this route', { icon: '📦' });
    },
    onError: () => toast.error('Search failed'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          <TranslatedText text="Backhaul Matching" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          <TranslatedText text="Find loads along your return route. Maximise truck utilisation and reduce empty miles." />
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
        <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-5">
          <TranslatedText text="Enter Your Return Route" />
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              <TranslatedText text="Return From (City)" /> *
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                placeholder="e.g. Mombasa"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              <TranslatedText text="Return To (City)" /> *
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="e.g. Nairobi"
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              <TranslatedText text="Available Date" /> *
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => searchMutation.mutate()}
          disabled={!origin || !destination || !date || searchMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black text-sm transition-all disabled:opacity-50"
        >
          <Search size={16} />
          {searchMutation.isPending ? <TranslatedText text="Searching..." /> : <TranslatedText text="Find Backhaul Loads" />}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
            {results.length} <TranslatedText text="Backhaul Loads Found" />
          </h2>
          {results.map((load: any) => (
            <div key={load.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Package size={16} className="text-primary-500" />
                    <h3 className="font-black text-slate-900 dark:text-white text-sm">{load.title || 'Untitled Load'}</h3>
                    {load.urgencyLevel === 'CRITICAL' && (
                      <span className="text-[10px] font-black px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">🚨 RESCUE BOND</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin size={12} />
                    <span>{load.locations?.[0]?.locationData?.name ?? 'Origin'}</span>
                    <ArrowRight size={12} />
                    <span>{load.locations?.[load.locations.length - 1]?.locationData?.name ?? 'Destination'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-primary-600 dark:text-primary-400">
                    {load.currencyCode} {Number(load.offeredPrice).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{load.weight} kg</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                    load.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>{load.status}</span>
                  <span>{load.cargoType}</span>
                </div>
                <button className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black transition-all">
                  <TranslatedText text="Bid on Load" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchMutation.isSuccess && results.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Truck size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            <TranslatedText text="No backhaul loads found for this route and date." />
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            <TranslatedText text="Try a different date or nearby city." />
          </p>
        </div>
      )}
    </div>
  );
};

export default BackhaulMatchingPage;
