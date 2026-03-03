import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Truck,
  MapPin,
  Plus,
  Minus,
  RefreshCw,
  CheckCircle2,
  X,
  Activity,
  Layers,
  ArrowRight,
  Zap,
  ChevronRight,
  Search,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fleetApi } from '../../services/fleetApi';
import type { FleetItem, Route } from '../../services/fleetApi';
import { toast } from 'react-hot-toast';

interface RouteAssignmentManagerProps {
  className?: string;
}

interface TruckWithRoutes extends FleetItem {
  assignedRouteDetails?: Route[];
}

export const RouteAssignmentManager: React.FC<RouteAssignmentManagerProps> = ({ className = '' }) => {
  const [trucks, setTrucks] = useState<TruckWithRoutes[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState(false);

  // Load trucks and routes
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [trucksData, routesData] = await Promise.all([
        fleetApi.getTrucks(),
        fleetApi.fetchRoutes()
      ]);

      const trucksWithRoutes = await Promise.all(
        trucksData.map(async (truck) => {
          try {
            const truckRoutes = await fleetApi.getTruckRoutes(truck.id);
            return {
              ...truck,
              assignedRouteDetails: truckRoutes
            };
          } catch (error) {
            console.error(`Failed to load routes for truck ${truck.id}:`, error);
            return {
              ...truck,
              assignedRouteDetails: []
            };
          }
        })
      );

      setTrucks(trucksWithRoutes);
      setRoutes(routesData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load trucks and routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignRoute = async (truckId: string, routeId: string) => {
    try {
      await fleetApi.assignRouteToTruck(truckId, routeId);
      toast.success('Route assigned successfully!');
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error assigning route:', error);
      toast.error('Failed to assign route');
    }
  };

  const handleUnassignRoute = async (truckId: string, routeId: string) => {
    try {
      await fleetApi.unassignRouteFromTruck(truckId, routeId);
      toast.success('Route unassigned successfully!');
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error unassigning route:', error);
      toast.error('Failed to unassign route');
    }
  };

  const getUnassignedRoutes = (truckId: string) => {
    const truck = trucks.find(t => t.id === truckId);
    if (!truck) return routes;

    const assignedRouteIds = truck.assignedRouteDetails?.map(r => r.id) || [];
    return routes.filter(route => !assignedRouteIds.includes(route.id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'IN_TRANSIT':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'MAINTENANCE':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 animate-pulse p-8 ${className}`}>
        <div className="h-20 bg-slate-50 rounded-[32px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-50 rounded-[32px]" />)}
        </div>
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-48 bg-slate-50 rounded-[32px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 pb-12 ${className}`}>
      {/* Header Matrix */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="size-14 bg-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-600 shadow-inner">
            <Navigation size={28} />
          </div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-1">Logistics Matrix</h2>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Route Assignment Manager</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="h-12 w-12 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-[18px] transition-all flex items-center justify-center"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setAssignMode(!assignMode)}
            className={`h-12 px-6 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl ${assignMode
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-[#1A1C1E] text-white hover:bg-slate-800'
              }`}
          >
            {assignMode ? <X size={14} /> : <Plus size={14} />}
            {assignMode ? 'Exit Assignment' : 'Initiate Assignment'}
          </button>
        </div>
      </div>

      {/* Geospatial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-[32px] border border-slate-100 p-6 flex items-center gap-5">
          <div className="size-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Units</p>
            <p className="text-2xl font-black text-slate-900">{trucks.length}</p>
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-[32px] border border-slate-100 p-6 flex items-center gap-5">
          <div className="size-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <Navigation size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Corridors</p>
            <p className="text-2xl font-black text-slate-900">{routes.length}</p>
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="bg-white rounded-[32px] border border-slate-100 p-6 flex items-center gap-5">
          <div className="size-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Links</p>
            <p className="text-2xl font-black text-slate-900">
              {trucks.reduce((sum, truck) => sum + (truck.assignedRouteDetails?.length || 0), 0)}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Asset Matrix Feed */}
      <div className="space-y-6">
        {trucks.map((truck) => (
          <motion.div
            layout
            key={truck.id}
            className={`bg-white rounded-[40px] border transition-all duration-300 overflow-hidden ${selectedTruck === truck.id ? 'border-indigo-500 shadow-2xl ring-1 ring-indigo-500/10' : 'border-slate-100 shadow-sm'
              }`}
          >
            <div className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                  <div className="size-14 bg-slate-50 rounded-[22px] flex items-center justify-center text-slate-400">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                      {truck.plateNumber}
                      <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(truck.status)}`}>
                        {truck.status}
                      </span>
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {truck.make} {truck.model} • Hardware Ref: {truck.id.substring(0, 8)}
                    </p>
                  </div>
                </div>

                {assignMode && (
                  <button
                    onClick={() => setSelectedTruck(selectedTruck === truck.id ? null : truck.id)}
                    className={`h-11 px-6 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${selectedTruck === truck.id
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {selectedTruck === truck.id ? 'Close Assignment' : 'Assign Corridors'}
                  </button>
                )}
              </div>

              {/* Assigned Vectors */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Layers size={14} className="text-indigo-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Geospatial Vectors</h4>
                </div>
                {truck.assignedRouteDetails && truck.assignedRouteDetails.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {truck.assignedRouteDetails.map((route) => (
                      <div
                        key={route.id}
                        className="bg-indigo-50/50 border border-indigo-100/50 rounded-[20px] pl-4 pr-3 py-2.5 flex items-center gap-4 group"
                      >
                        <div>
                          <p className="text-[11px] font-black text-indigo-900 tracking-tight">{route.name}</p>
                          <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Vector Locked</p>
                        </div>
                        <button
                          onClick={() => handleUnassignRoute(truck.id, route.id)}
                          className="size-8 bg-white text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
                        >
                          <Minus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-[24px] p-6 text-center">
                    <p className="text-[11px] font-bold text-slate-400 lowercase tracking-widest mt-1 italic opacity-60">no active corridors linked to this unit</p>
                  </div>
                )}
              </div>

              {/* Dynamic Assignment Control */}
              <AnimatePresence>
                {assignMode && selectedTruck === truck.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-8 pt-8 border-t border-slate-50"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <Zap size={14} className="text-emerald-500" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Available Logistics Corridors</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getUnassignedRoutes(truck.id).map((route) => (
                        <button
                          key={route.id}
                          onClick={() => handleAssignRoute(truck.id, route.id)}
                          className="bg-white border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 p-5 rounded-[28px] text-left transition-all group flex items-start justify-between"
                        >
                          <div>
                            <p className="text-sm font-black text-slate-900 mb-1">{route.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              {route.origin} <ArrowRight size={10} /> {route.destination}
                            </p>
                          </div>
                          <div className="size-8 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                            <Plus size={14} />
                          </div>
                        </button>
                      ))}
                      {getUnassignedRoutes(truck.id).length === 0 && (
                        <div className="col-span-full py-10 text-center bg-slate-50 rounded-[32px]">
                          <p className="text-[11px] font-bold text-slate-400 italic">all compatible corridors have been synchronized</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      {trucks.length === 0 && (
        <div className="p-20 text-center flex flex-col items-center bg-white rounded-[40px] border border-slate-100">
          <div className="size-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200 mb-8">
            <Truck size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Zero Asset Pulse Detected</h3>
          <p className="text-sm font-medium text-slate-400 mt-2 max-w-xs">No trucks are currently registered in the logistical matrix. Synchronize your fleet to begin corridor assignment.</p>
        </div>
      )}
    </div>
  );
};

export default RouteAssignmentManager;
