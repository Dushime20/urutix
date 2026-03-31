import React, { useState } from 'react';
import { X, MapPin, Truck, Clock, RotateCcw, Save, Loader2, Plus } from 'lucide-react';
import { type RouteLocation, type OptimizedRoute } from '../../../services/fleetApi';
import toast from 'react-hot-toast';

interface RouteBuilderProps {
    onClose: () => void;
    onSave: (route: OptimizedRoute) => void;
    onOptimize: (stops: RouteLocation[]) => Promise<OptimizedRoute>;
}

interface StopInput {
    id: string;
    name: string;
    type: RouteLocation['type'];
}

const RouteBuilder: React.FC<RouteBuilderProps> = ({ onClose, onSave, onOptimize }) => {
    const [origin, setOrigin] = useState<StopInput>({ id: 'org-1', name: '', type: 'origin' });
    const [destination, setDestination] = useState<StopInput>({ id: 'dest-1', name: '', type: 'destination' });
    const [stops, setStops] = useState<StopInput[]>([]);
    const [loading, setLoading] = useState(false);
    const [optimizedData, setOptimizedData] = useState<OptimizedRoute | null>(null);

    const addStop = () => {
        setStops([...stops, { id: `stop-${Date.now()}`, name: '', type: 'cargostop' }]);
    };

    const removeStop = (id: string) => {
        setStops(stops.filter(s => s.id !== id));
    };

    const updateStop = (id: string, name: string) => {
        setStops(stops.map(s => s.id === id ? { ...s, name } : s));
    };

    const handleOptimize = async () => {
        if (!origin.name || !destination.name) {
            toast.error('Origin and Destination are required');
            return;
        }
        setLoading(true);
        try {
            // Mock converting inputs to RouteLocations with geocoding simulation
            const routeStops: RouteLocation[] = [
                { ...origin, lat: -1.29, lng: 36.82 }, // Defaulting coords for mock
                ...stops.map(s => ({ ...s, lat: -2.0, lng: 37.0 })),
                { ...destination, lat: -4.04, lng: 39.66 }
            ];

            const optimized = await onOptimize(routeStops);
            setOptimizedData(optimized);
            toast.success('Route optimized!');
        } catch (error) {
            toast.error('Failed to optimize route');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (optimizedData) {
            onSave(optimizedData);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-end">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Plan New Route</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Define path and optimize logistics</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Origin */}
                    <div className="group">
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercas mb-1.5 flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Origin
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Start Location (e.g. Nairobi ICD)"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white transition-all"
                                value={origin.name}
                                onChange={e => setOrigin({ ...origin, name: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Stops */}
                    <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-4">
                        {stops.map((stop, index) => (
                            <div key={stop.id} className="relative group animate-in slide-in-from-left duration-200 fade-in">
                                <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-white dark:ring-slate-900"></div>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                                        <input
                                            type="text"
                                            placeholder={`Stop #${index + 1}`}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white text-sm"
                                            value={stop.name}
                                            onChange={e => updateStop(stop.id, e.target.value)}
                                        />
                                    </div>
                                    <button onClick={() => removeStop(stop.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={addStop}
                            className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 w-fit p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Stop
                        </button>
                    </div>

                    {/* Destination */}
                    <div className="group">
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercas mb-1.5 flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div> Destination
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-red-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="End Location (e.g. Mombasa Port)"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none dark:text-white transition-all"
                                value={destination.name}
                                onChange={e => setDestination({ ...destination, name: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Optimized Results */}
                    {optimizedData && (
                        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800 animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                    <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Optimized Route</h3>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                                        <span className="flex items-center gap-1"><RotateCcw className="w-4 h-4" /> {optimizedData.totalDistance} km</span>
                                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {Math.round(optimizedData.totalDuration / 60)} hrs</span>
                                    </div>
                                    <div className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/40 px-2 py-0.5 rounded w-fit">
                                        Est. Cost: KES {optimizedData.totalCost.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    {!optimizedData ? (
                        <button
                            onClick={handleOptimize}
                            disabled={loading}
                            className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-slate-900/20 dark:shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                            Calculate & Optimize
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setOptimizedData(null)}
                                className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 py-3 rounded-lg font-bold transition-all"
                            >
                                Modify
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save Route
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default RouteBuilder;
