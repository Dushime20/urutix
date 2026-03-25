import React, { useState, useEffect } from 'react';
import { Plus, Map as MapIcon, List, Clock, ChevronRight, Search } from 'lucide-react';
import { fleetApi, type OptimizedRoute } from '../services/fleetApi';
import toast from 'react-hot-toast';
import RouteBuilder from '../components/FleetDashboard/Routes/RouteBuilder';
import OptimizedRouteMap from '../components/FleetDashboard/Routes/OptimizedRouteMap';

const FleetRoutesPage: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [routes, setRoutes] = useState<OptimizedRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBuilder, setShowBuilder] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<OptimizedRoute | null>(null);

    useEffect(() => {
        loadRoutes();
    }, []);

    const loadRoutes = async () => {
        setLoading(true);
        try {
            const data = await fleetApi.getRoutes();
            setRoutes(data);
        } catch (error) {
            console.error('Failed to load routes', error);
            toast.error('Failed to load routes');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRoute = async (route: OptimizedRoute) => {
        try {
            await fleetApi.saveRoute(route);
            toast.success('Route saved successfully');
            setShowBuilder(false);
            loadRoutes();
        } catch (error) {
            toast.error('Failed to save route');
        }
    };

    return (
        <div className={isEmbedded ? "w-full" : "min-h-screen bg-slate-50 font-sans flex flex-col pt-12"}>
            {/* Route Builder Modal */}
            {showBuilder && (
                <RouteBuilder
                    onClose={() => setShowBuilder(false)}
                    onSave={handleSaveRoute}
                    onOptimize={(stops: any[]) => fleetApi.calculateRoute(stops[0], stops[stops.length - 1], stops.slice(1, -1))}
                />
            )}

            {/* Header */}
            {!isEmbedded && (
                <div className="bg-slate-900 text-white pt-20 pb-8 px-4 md:px-8 shadow-lg shrink-0">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-white mb-2">Routes</h1>
                                <p className="text-slate-400">Plan and manage routes</p>
                            </div>
                            <button
                                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                                onClick={() => setShowBuilder(true)}
                            >
                                <Plus className="w-5 h-5" />
                                Add Route
                            </button>
                        </div>

                        <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                            {/* Search */}
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <List className="w-4 h-4" /> List
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'map' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <MapIcon className="w-4 h-4" /> Map
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main className={isEmbedded ? "w-full py-0" : "flex-1 max-w-7xl mx-auto px-4 md:px-8 py-8 w-full"}>
                {viewMode === 'map' ? (
                    <div className="h-[calc(100vh-300px)] grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Map Sidebar List */}
                        <div className="md:col-span-1 overflow-y-auto space-y-4 pr-2">
                            {routes.map(route => (
                                <div
                                    key={route.id}
                                    onClick={() => setSelectedRoute(route)}
                                    className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all ${selectedRoute?.id === route.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-blue-300'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800 truncate">{route.name}</h3>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${route.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{route.status}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>{route.totalDistance} km</span>
                                        <span>{Math.round(route.totalDuration / 60)} hrs</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Map Area */}
                        <div className="md:col-span-2 h-full rounded-xl overflow-hidden shadow-lg border border-slate-200">
                            <OptimizedRouteMap route={selectedRoute || (routes.length > 0 ? routes[0] : null)} />
                        </div>
                    </div>
                ) : (
                    /* List View (Existing) */
                    loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {routes.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MapIcon className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Routes</h3>
                                    <p className="text-slate-600 mb-6">Start by creating your first optimized route.</p>
                                    <button className="text-blue-600 font-bold hover:underline" onClick={() => setShowBuilder(true)}>Add Route</button>
                                </div>
                            ) : (
                                routes.map(route => (
                                    <div key={route.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all group">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide 
                          ${route.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                            route.status === 'completed' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {route.status}
                                                    </span>
                                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{route.name}</h3>
                                                </div>
                                                <p className="text-sm text-slate-500 flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5" /> Created {new Date(route.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-6 text-sm">
                                                <div className="text-right">
                                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-0.5">Distance</p>
                                                    <p className="font-bold text-slate-900">{route.totalDistance} km</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-0.5">Time</p>
                                                    <p className="font-bold text-slate-900">{Math.round(route.totalDuration / 60)} hrs</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRoute(route);
                                                            setViewMode('map');
                                                        }}
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg transition-colors font-semibold text-xs flex items-center gap-1"
                                                    >
                                                        <MapIcon className="w-3 h-3" /> View Map
                                                    </button>
                                                    <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg transition-colors">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Route Visualizer (Simple Line) */}
                                        <div className="relative pt-6 pb-2 px-4 border-t border-slate-100">
                                            <div className="absolute top-0 left-0 w-full h-full flex items-center px-8" aria-hidden="true">
                                                <div className="w-full h-0.5 bg-slate-200 relative">
                                                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-3 bg-slate-900 rounded-full ring-4 ring-white"></div>
                                                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-3 h-3 bg-slate-900 rounded-full ring-4 ring-white"></div>
                                                </div>
                                            </div>
                                            <div className="relative flex justify-between text-sm font-medium text-slate-700">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="bg-white px-2 py-1 rounded border border-slate-200 relative z-10 shadow-sm">{route.origin.name}</span>
                                                </div>

                                                {route.stops.length > 0 && (
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full ring-4 ring-white mb-2"></div>
                                                        <span className="text-xs text-slate-500 bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-100 whitespace-nowrap">
                                                            {route.stops.length} stop{route.stops.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="bg-white px-2 py-1 rounded border border-slate-200 relative z-10 shadow-sm">{route.destination.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )
                )}
            </main>
        </div>
    );
};

export default FleetRoutesPage;
