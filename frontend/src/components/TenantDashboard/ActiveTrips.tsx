import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Truck, Box, Navigation, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tenantApi } from '../../services/tenantApi';
import type { Trip } from '../../services/tenantApi';
import TripMap from './TripMap';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface ActiveTripsProps {
    tenantId: string;
    onTrackTrip?: (activity: any) => void;
}

const ActiveTrips: React.FC<ActiveTripsProps> = ({ tenantId, onTrackTrip }) => {
    const { tSync } = useTranslation();
    const [viewMode, setViewMode] = React.useState<'list' | 'map'>('list');
    const [selectedTripId, setSelectedTripId] = React.useState<string | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<string>('all');

    const { data: trips = [], isLoading } = useQuery({
        queryKey: ['activeTrips', tenantId],
        queryFn: () => tenantApi.getActiveTrips(tenantId),
    });

    const filteredTrips = React.useMemo(() => {
        return trips.filter(trip => {
            const matchesSearch = trip.tripNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (typeof trip.origin === 'string' ? trip.origin : (trip.origin?.name || '')).toLowerCase().includes(searchQuery.toLowerCase()) ||
                (typeof trip.destination === 'string' ? trip.destination : (trip.destination?.name || '')).toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [trips, searchQuery, statusFilter]);

    const handleTrackMovement = (trip: Trip) => {
        if (onTrackTrip) {
            onTrackTrip({
                action: `${tSync('Movement Tracking')}: ${trip.tripNumber}`,
                description: `${trip.tripNumber} ${tSync('in transit from')} ${typeof trip.origin === 'string' ? trip.origin : (trip.origin?.name || tSync('Unknown'))} ${tSync('to')} ${typeof trip.destination === 'string' ? trip.destination : (trip.destination?.name || tSync('Unknown'))}`,
                type: 'shipment',
                status: trip.status === 'DELAYED' ? 'warning' : 'success',
                timestamp: 'Live Feed',
                metadata: { tripId: trip.id }
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-primary-50 dark:border-primary-900/20 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin mb-6" />
                    <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] italic"><TranslatedText text="Synchronizing Satellite Network" />...</p>
                </div>
            </div>
        );
    }

    // Removed early return for empty trips to allow map toggle

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight italic"><TranslatedText text="Active Trips" /></h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic"><TranslatedText text="Monitoring" /> <span className="text-primary-600 dark:text-primary-400 font-black">{trips.length} <TranslatedText text="units" /></span> <TranslatedText text="live" /></p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative group w-full sm:w-64">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Navigation className="w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within:text-primary-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder={tSync("Search movements...")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all w-full shadow-sm"
                        />
                    </div>

                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="py-2.5 px-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 shadow-sm"
                    >
                        <option value="all">{tSync('Global Fleet')}</option>
                        <option value="IN_PROGRESS">{tSync('In Transit')}</option>
                        <option value="DELAYED">{tSync('Delayed')}</option>
                        <option value="PLANNED">{tSync('Planned')}</option>
                    </select>

                    <div className="flex bg-white dark:bg-slate-900 p-1 rounded-[18px] border border-slate-100 dark:border-slate-800 shadow-sm shrink-0">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'list'
                                ? 'bg-primary-600 text-white shadow-lg'
                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest"><TranslatedText text="Grid" /></span>
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${viewMode === 'map'
                                ? 'bg-primary-600 text-white shadow-lg'
                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            <MapIcon className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest"><TranslatedText text="Network" /></span>
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'list' ? (
                filteredTrips.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center p-20 bg-white dark:bg-slate-900 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800 shadow-inner"
                    >
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 rotate-12">
                            <Navigation className="w-10 h-10 text-slate-300 dark:text-slate-600 -rotate-12" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase"><TranslatedText text="No active trips found" /></h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center max-w-sm leading-relaxed font-medium italic">
                            <TranslatedText text="Adjust your filters or search terms to see more results" />.
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredTrips.map((trip: Trip) => (
                                <motion.div
                                    key={trip.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden group"
                                >
                                    <div className="p-8">
                                        <div className="flex justify-between items-start mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-[24px] text-white shadow-lg shadow-primary-200 group-hover:scale-110 transition-transform duration-500">
                                                    <Truck className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{trip.tripNumber}</p>
                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                            trip.status === 'DELAYED' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800' :
                                                            trip.status === 'IN_PROGRESS' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800' :
                                                            'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                                                        }`}>
                                                            {trip.status === 'IN_PROGRESS' ? tSync('In Transit') : tSync(trip.status)}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-base font-black text-slate-800 dark:text-white tracking-tight line-clamp-1 italic">
                                                        {typeof trip.origin === 'string' ? trip.origin : (trip.origin?.name || tSync('Point A'))}
                                                        {' → '}
                                                        {typeof trip.destination === 'string' ? trip.destination : (trip.destination?.name || tSync('Point B'))}
                                                    </h4>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6 relative mb-8">
                                            <div className="absolute left-[13px] top-1.5 bottom-1.5 w-0.5 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                            
                                            <div className="flex gap-4 relative">
                                                <div className="w-7 h-7 bg-emerald-500 rounded-full border-[6px] border-white dark:border-slate-900 shadow-sm shrink-0 z-10" />
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5 italic"><TranslatedText text="Departure Hub" /></p>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{typeof trip.origin === 'string' ? trip.origin : (trip.origin?.name || tSync('Main Terminal'))}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 relative">
                                                <div className="w-7 h-7 bg-primary-600 rounded-full border-[6px] border-white dark:border-slate-900 shadow-sm shrink-0 z-10" />
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5 italic"><TranslatedText text="Destination" /></p>
                                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{typeof trip.destination === 'string' ? trip.destination : (trip.destination?.name || tSync('Logistics Center'))}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-50 dark:border-slate-800">
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-colors">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Box className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5 italic"><TranslatedText text="Asset" /></span>
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{trip.truckNumber || 'Asset-74X'}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[24px] border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-colors">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5 italic"><TranslatedText text="Location" /></span>
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate"><TranslatedText text="Voi Checkpoint" /></p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-950/20 border-t border-white dark:border-slate-800 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 tracking-tighter uppercase"><TranslatedText text="TRANSIT" /> 64%</span>
                                            </div>
                                            <div className="h-1.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary-600 dark:bg-primary-500 w-[64%]" />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleTrackMovement(trip)}
                                            className="px-6 py-3 bg-white dark:bg-slate-800 hover:bg-primary-600 dark:hover:bg-primary-500 text-primary-600 dark:text-primary-400 hover:text-white dark:hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-700"
                                        >
                                            <TranslatedText text="Track Live" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )

            ) : (
                <TripMap
                    trips={trips}
                    selectedTripId={selectedTripId}
                    onSelectTrip={(trip) => setSelectedTripId(trip.id)}
                />
            )}
        </div>
    );
};

export default ActiveTrips;
