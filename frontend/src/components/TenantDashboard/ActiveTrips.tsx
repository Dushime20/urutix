import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Truck, Box, Clock, Navigation, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tenantApi } from '../../services/tenantApi';
import type { Trip } from '../../services/tenantApi';
import TripMap from './TripMap';

interface ActiveTripsProps {
    tenantId: string;
}

const ActiveTrips: React.FC<ActiveTripsProps> = ({ tenantId }) => {
    const [viewMode, setViewMode] = React.useState<'list' | 'map'>('list');
    const [selectedTripId, setSelectedTripId] = React.useState<string | null>(null);

    const { data: trips = [], isLoading } = useQuery({
        queryKey: ['activeTrips', tenantId],
        queryFn: () => tenantApi.getActiveTrips(tenantId),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                    <p className="text-sm font-medium text-slate-500">Scanning satellite network...</p>
                </div>
            </div>
        );
    }

    // Removed early return for empty trips to allow map toggle

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Active Movements</h3>
                    <p className="text-xs text-slate-500 font-medium">Monitoring <span className="text-indigo-600">{trips.length} units</span> in transit</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'map'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <MapIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'list' ? (
                trips.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center p-12 bg-white rounded-[32px] border border-dashed border-slate-200"
                    >
                        <div className="p-4 bg-slate-50 rounded-full mb-6">
                            <Navigation className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No Active Movements</h3>
                        <p className="text-sm text-slate-500 text-center max-w-xs leading-relaxed">
                            All fleet nodes are currently idle or planned. Switch to Map View to see the fleet network.
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {trips.map((trip: Trip) => (
                                <motion.div
                                    key={trip.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group p-6"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                                <Truck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{trip.tripNumber}</p>
                                                <h4 className="text-sm font-bold text-slate-900">
                                                    {typeof trip.origin === 'string' ? trip.origin : (trip.origin?.name || 'Unknown')}
                                                    {' → '}
                                                    {typeof trip.destination === 'string' ? trip.destination : (trip.destination?.name || 'Unknown')}
                                                </h4>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedTripId(trip.id);
                                                setViewMode('map');
                                            }}
                                            className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
                                        >
                                            <MapIcon className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        <div className="relative pl-6 space-y-4">
                                            <div className="absolute left-1 top-1 bottom-1 w-0.5 bg-slate-100">
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500">Departure</span>
                                                <span className="text-xs font-black text-slate-900 uppercase">
                                                    {typeof trip.origin === 'string' ? trip.origin : (trip.origin?.name || 'N/A')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500">Destination</span>
                                                <span className="text-xs font-black text-slate-900 uppercase">
                                                    {typeof trip.destination === 'string' ? trip.destination : (trip.destination?.name || 'N/A')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600">On-Time Performance</span>
                                            </div>
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                EXCELLENT
                                            </span>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress Node</span>
                                                <span className="text-xs font-black text-indigo-600 tracking-tighter">64%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '64%' }}
                                                    className="h-full bg-indigo-600 rounded-full"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-slate-50 rounded-2xl">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Box className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cargo Type</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-900 truncate">General Commodities</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-2xl">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Next Stop</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-900 truncate">Voi Checkpoint</p>
                                            </div>
                                        </div>
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
