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
  Settings,
  Edit3,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fleetApi } from '../../services/fleetApi';
import type { FleetItem, Route } from '../../services/fleetApi';
import { toast } from 'react-hot-toast';
import { RouteFormModal } from './RouteFormModal';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

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
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const { DialogComponent, confirm } = useConfirmDialog();

  // Load trucks and routes
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 RouteAssignmentManager: Loading trucks and routes...');

      console.log('🔄 RouteAssignmentManager: Starting API calls...');
      
      let trucksData, routesData;
      
      try {
        console.log('🚛 RouteAssignmentManager: Fetching trucks...');
        trucksData = await fleetApi.getTrucks();
        console.log('✅ RouteAssignmentManager: Trucks fetched:', trucksData);
      } catch (error) {
        console.error('❌ RouteAssignmentManager: Trucks fetch failed:', error);
        console.error('❌ RouteAssignmentManager: Trucks error response:', error.response?.data);
        console.warn('⚠️ RouteAssignmentManager: Continuing without trucks data');
        trucksData = []; // Continue with empty trucks array
      }
      
      try {
        console.log('🛣️ RouteAssignmentManager: Fetching routes...');
        routesData = await fleetApi.fetchRoutes();
        console.log('✅ RouteAssignmentManager: Routes fetched:', routesData);
      } catch (error) {
        console.error('❌ RouteAssignmentManager: Routes fetch failed:', error);
        console.error('❌ RouteAssignmentManager: Routes error response:', error.response?.data);
        console.warn('⚠️ RouteAssignmentManager: Continuing without routes data');
        routesData = []; // Continue with empty routes array
      }

      console.log('📊 RouteAssignmentManager: Raw API responses:', {
        trucksResponse: trucksData,
        routesResponse: routesData,
        trucksType: typeof trucksData,
        routesType: typeof routesData,
        trucksIsArray: Array.isArray(trucksData),
        routesIsArray: Array.isArray(routesData)
      });

      console.log('📊 RouteAssignmentManager: Data loaded:', {
        trucksCount: trucksData.length,
        routesCount: routesData.length,
        trucks: trucksData,
        routes: routesData
      });

      console.log('🔄 RouteAssignmentManager: Processing truck routes...');
      
      let trucksWithRoutes;
      try {
        trucksWithRoutes = await Promise.all(
          trucksData.map(async (truck, index) => {
            try {
              console.log(`🚛 RouteAssignmentManager: Loading routes for truck ${index + 1}/${trucksData.length} (${truck.id})`);
              const truckRoutes = await fleetApi.getTruckRoutes(truck.id);
              console.log(`✅ RouteAssignmentManager: Truck ${truck.id} routes:`, truckRoutes);
              return {
                ...truck,
                assignedRouteDetails: truckRoutes
              };
            } catch (error) {
              console.error(`❌ RouteAssignmentManager: Failed to load routes for truck ${truck.id}:`, error);
              return {
                ...truck,
                assignedRouteDetails: []
              };
            }
          })
        );
      } catch (error) {
        console.error('❌ RouteAssignmentManager: Promise.all failed for truck routes:', error);
        // Fallback: just use trucks without route details
        trucksWithRoutes = trucksData.map(truck => ({
          ...truck,
          assignedRouteDetails: []
        }));
      }

      console.log('🔄 RouteAssignmentManager: Setting state...');
      console.log('📊 RouteAssignmentManager: Final data to set:', {
        trucksWithRoutes,
        routesData
      });

      setTrucks(trucksWithRoutes);
      setRoutes(routesData);
      
      console.log('✅ RouteAssignmentManager: State set successfully');
      console.log('✅ RouteAssignmentManager: Final state should be:', {
        trucksCount: trucksWithRoutes.length,
        routesCount: routesData.length
      });
    } catch (error) {
      console.error('❌ RouteAssignmentManager: Error loading data:', error);
      console.error('❌ RouteAssignmentManager: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(`Failed to load trucks and routes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Debug: Log when routes state changes
  useEffect(() => {
    console.log('🔍 RouteAssignmentManager: Routes state changed:', {
      length: routes.length,
      routes: routes
    });
  }, [routes]);

  // Debug: Log when trucks state changes
  useEffect(() => {
    console.log('🔍 RouteAssignmentManager: Trucks state changed:', {
      length: trucks.length,
      trucks: trucks
    });
  }, [trucks]);

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

  const handleCreateRoute = () => {
    console.log('🎯 RouteAssignmentManager: Create route button clicked');
    setEditingRoute(null);
    setFormMode('create');
    setShowRouteForm(true);
    console.log('📝 RouteAssignmentManager: Route form opened in create mode');
  };

  const handleEditRoute = (route: Route) => {
    console.log('✏️ RouteAssignmentManager: Edit route clicked:', route);
    setEditingRoute(route);
    setFormMode('edit');
    setShowRouteForm(true);
    console.log('📝 RouteAssignmentManager: Route form opened in edit mode');
  };

  const handleDeleteRoute = async (route: Route) => {
    console.log('🗑️ handleDeleteRoute called with route:', route);
    console.log('🗑️ Route ID:', route.id);
    console.log('🗑️ Route name:', route.name);
    
    try {
      const confirmed = await confirm({
        title: 'Delete Route',
        message: `Are you sure you want to delete the route "${route.name}"?\n\nRoute Details:\n• Origin: ${route.origin}\n• Destination: ${route.destination}\n• Distance: ${route.distance} km\n\nThis action cannot be undone and will remove all assignments.`,
        confirmText: 'Delete Route',
        cancelText: 'Cancel',
        variant: 'danger'
      });

      console.log('🗑️ User confirmation result:', confirmed);

      if (confirmed) {
        console.log('✅ User confirmed deletion, proceeding...');
        const loadingToast = toast.loading('Deleting route...');
        
        try {
          console.log('🌐 Calling fleetApi.deleteRoute with ID:', route.id);
          await fleetApi.deleteRoute(route.id);
          toast.dismiss(loadingToast);
          toast.success(`Route "${route.name}" deleted successfully!`);
          console.log('🎉 Route deleted successfully, reloading data...');
          await loadData();
        } catch (error: any) {
          console.error('❌ Error deleting route:', error);
          toast.dismiss(loadingToast);
          
          // Enhanced error handling
          let errorMessage = 'Failed to delete route';
          if (error.response?.status === 404) {
            errorMessage = 'Route not found or already deleted';
          } else if (error.response?.status === 403) {
            errorMessage = 'You do not have permission to delete this route';
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }
          
          toast.error(errorMessage);
        }
      } else {
        console.log('❌ User cancelled deletion');
      }
    } catch (error) {
      console.error('❌ Error in handleDeleteRoute:', error);
      toast.error('An error occurred while trying to delete the route');
    }
  };

  const handleFormSuccess = () => {
    console.log('🎉 RouteAssignmentManager: Form success callback triggered');
    console.log('🔄 RouteAssignmentManager: Reloading data after form success...');
    loadData();
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
    <div className={`space-y-8 p-6 ${className}`}>
      {/* Header Matrix */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-5">
          <div className="size-14 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Navigation size={28} />
          </div>
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Logistics Matrix</h2>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Route Management</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="h-12 w-12 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all flex items-center justify-center border border-gray-200 dark:border-gray-700"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleCreateRoute}
            className="h-12 px-6 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <Plus size={14} />
            Create Route
          </button>
          <button
            onClick={() => setAssignMode(!assignMode)}
            className={`h-12 px-6 rounded-lg text-xs font-medium uppercase tracking-wider transition-all flex items-center gap-2 ${assignMode
                ? 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700'
                : 'bg-gray-700 dark:bg-gray-600 text-white hover:bg-gray-800 dark:hover:bg-gray-700'
              }`}
          >
            {assignMode ? <X size={14} /> : <Settings size={14} />}
            {assignMode ? 'Exit Assignment' : 'Assign Mode'}
          </button>
        </div>
      </div>

      {/* Geospatial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4 transition-colors">
          <div className="size-10 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Active Units</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{trucks.length}</p>
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4 transition-colors">
          <div className="size-10 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Navigation size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Routes</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{routes.length}</p>
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4 transition-colors">
          <div className="size-10 bg-green-50 dark:bg-green-950/20 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Active Links</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {trucks.reduce((sum, truck) => sum + (truck.assignedRouteDetails?.length || 0), 0)}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Routes Management Section */}
      {!assignMode && (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Navigation size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">All Routes</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {routes.length} Total Corridors
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {routes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes.map((route) => (
                  <motion.div
                    key={route.id}
                    whileHover={{ y: -2 }}
                    className="bg-slate-50/50 border border-slate-100 rounded-[20px] p-5 group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-base font-black text-slate-900 tracking-tight mb-1">
                          {route.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          <MapPin size={9} />
                          {route.origin} → {route.destination}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 relative z-10">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔧 Edit button clicked for route:', route.name);
                            handleEditRoute(route);
                          }}
                          className="size-7 bg-white text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm hover:shadow-md relative z-20"
                          title={`Edit route "${route.name}"`}
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🗑️ Delete button clicked for route:', route.name);
                            handleDeleteRoute(route);
                          }}
                          className="size-7 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm hover:shadow-md relative z-20"
                          title={`Delete route "${route.name}"`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Distance</span>
                        <span className="text-sm font-black text-slate-900">{route.distance} km</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                        <span className="text-sm font-black text-slate-900">{route.estimatedTime}h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                        <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                          route.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : route.status === 'maintenance'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}>
                          {route.status}
                        </span>
                      </div>
                      {route.routeType && (
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Type</span>
                          <span className="text-sm font-black text-slate-900 capitalize">{route.routeType}</span>
                        </div>
                      )}
                    </div>

                    {route.description && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 line-clamp-2">{route.description}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="size-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-200 mb-6 mx-auto">
                  <Navigation size={32} />
                </div>
                <h4 className="text-lg font-black text-slate-900 tracking-tight mb-2">No Routes Created</h4>
                <p className="text-sm font-medium text-slate-400 mb-6">Create your first route to start managing logistics corridors.</p>
                <button
                  onClick={handleCreateRoute}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 mx-auto shadow-lg"
                >
                  <Plus size={14} />
                  Create First Route
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Asset Matrix Feed - Only show if trucks are available */}
      {trucks.length > 0 && (
        <div className="space-y-4">
        {trucks.map((truck) => (
          <motion.div
            layout
            key={truck.id}
            className={`bg-white rounded-[32px] border transition-all duration-300 overflow-hidden ${selectedTruck === truck.id ? 'border-indigo-500 shadow-lg ring-1 ring-indigo-500/10' : 'border-slate-100 shadow-sm'
              }`}
          >
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="size-12 bg-slate-50 rounded-[18px] flex items-center justify-center text-slate-400">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-3">
                      {truck.plateNumber}
                      <span className={`px-2 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest ${getStatusColor(truck.status)}`}>
                        {truck.status}
                      </span>
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {truck.make} {truck.model} • ID: {truck.id.substring(0, 8)}
                    </p>
                  </div>
                </div>

                {assignMode && (
                  <button
                    onClick={() => setSelectedTruck(selectedTruck === truck.id ? null : truck.id)}
                    className={`h-10 px-5 rounded-[16px] text-[9px] font-black uppercase tracking-widest transition-all ${selectedTruck === truck.id
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    {selectedTruck === truck.id ? 'Close Assignment' : 'Assign Routes'}
                  </button>
                )}
              </div>

              {/* Assigned Vectors */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Layers size={12} className="text-indigo-400" />
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Assigned Routes</h4>
                </div>
                {truck.assignedRouteDetails && truck.assignedRouteDetails.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {truck.assignedRouteDetails.map((route) => (
                      <div
                        key={route.id}
                        className="bg-indigo-50/50 border border-indigo-100/50 rounded-[16px] pl-3 pr-2 py-2 flex items-center gap-3 group"
                      >
                        <div>
                          <p className="text-[10px] font-black text-indigo-900 tracking-tight">{route.name}</p>
                          <p className="text-[7px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Active</p>
                        </div>
                        <button
                          onClick={() => handleUnassignRoute(truck.id, route.id)}
                          className="size-6 bg-white text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg flex items-center justify-center transition-all shadow-sm"
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-[20px] p-4 text-center">
                    <p className="text-[10px] font-bold text-slate-400 lowercase tracking-widest italic opacity-60">no routes assigned</p>
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
                    className="mt-6 pt-6 border-t border-slate-50"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Zap size={12} className="text-emerald-500" />
                      <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Available Routes</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getUnassignedRoutes(truck.id).map((route) => (
                        <button
                          key={route.id}
                          onClick={() => handleAssignRoute(truck.id, route.id)}
                          className="bg-white border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 p-4 rounded-[20px] text-left transition-all group flex items-start justify-between"
                        >
                          <div>
                            <p className="text-sm font-black text-slate-900 mb-1">{route.name}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              {route.origin} <ArrowRight size={8} /> {route.destination}
                            </p>
                          </div>
                          <div className="size-6 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                            <Plus size={12} />
                          </div>
                        </button>
                      ))}
                      {getUnassignedRoutes(truck.id).length === 0 && (
                        <div className="col-span-full py-8 text-center bg-slate-50 rounded-[24px]">
                          <p className="text-[10px] font-bold text-slate-400 italic">all routes assigned</p>
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
      )}

      {trucks.length === 0 && (
        <div className="p-16 text-center flex flex-col items-center bg-white rounded-[32px] border border-slate-100">
          <div className="size-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-200 mb-6">
            <Truck size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">No Trucks Available</h3>
          <p className="text-sm font-medium text-slate-400 mt-2 max-w-xs">Add trucks to your fleet to start managing routes and assignments.</p>
        </div>
      )}

      {/* Route Form Modal */}
      <RouteFormModal
        isOpen={showRouteForm}
        onClose={() => setShowRouteForm(false)}
        onSuccess={handleFormSuccess}
        editingRoute={editingRoute}
        mode={formMode}
      />

      {/* Confirmation Dialog */}
      {DialogComponent}
    </div>
  );
};

export default RouteAssignmentManager;
