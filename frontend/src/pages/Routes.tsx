import React, { useEffect, useState } from 'react';
import { fleetApi } from '../services/fleetApi';
import type { Route } from '../services/fleetApi';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import {
  Plus,
  RefreshCcw,
  Navigation,
  Clock,
  Activity,
  Trash2,
  Edit3,
  Filter,
  X,
  TrendingUp,
  Shield,
  Loader2,
  Box,
  Map as MapIcon
} from 'lucide-react';
import { cn } from '@/utils/cn';
import MapLocationPicker from '@/components/FleetDashboard/MapLocationPicker';
import { CircularStatCard } from '@/components/EnliteUI/Cards/StatCard';

const RoutesPage: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded }) => {
  const { confirm, DialogComponent } = useConfirmDialog();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [mapPicker, setMapPicker] = useState<'origin' | 'destination' | null>(null);

  // Store exact coordinates for origin and destination
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState<Partial<Route>>({
    name: '',
    origin: '',
    destination: '',
    originLat: undefined,
    originLng: undefined,
    originAddress: undefined,
    destinationLat: undefined,
    destinationLng: undefined,
    destinationAddress: undefined,
    distance: 0,
    estimatedTime: 0,
    status: 'active',
    isActive: true,
    description: '',
  });

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fleetApi.fetchRoutes();
      setRoutes(data);
    } catch (e: any) {
      setError('Failed to load routes');
      console.error('RoutesPage: Error loading routes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setOriginCoords(null);
    setDestinationCoords(null);
    setFormData({
      name: '',
      origin: '',
      destination: '',
      originLat: undefined,
      originLng: undefined,
      originAddress: undefined,
      destinationLat: undefined,
      destinationLng: undefined,
      destinationAddress: undefined,
      distance: 0,
      estimatedTime: 0,
      status: 'active',
      isActive: true,
      description: '',
    });
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (route: Route) => {
    setEditing(route);
    setFormData({
      name: route.name,
      origin: route.origin,
      destination: route.destination,
      distance: route.distance,
      estimatedTime: route.estimatedTime,
      // Normalize status for the UI select (expects uppercase values)
      status: (route.status || '').toUpperCase() as any,
      isActive: route.isActive,
      description: route.description ?? '',
    });
    setShowForm(true);
  };

  const handleDelete = async (route: Route) => {
    const confirmed = await confirm({
      title: 'Delete Route',
      message: `Are you sure you want to delete route "${route.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await fleetApi.deleteRoute(route.id);
      setRoutes((prev) => prev.filter((r) => r.id !== route.id));
    } catch (e) {
      console.error('Delete route failed', e);
      setError('Failed to delete route');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Normalize payload to match backend enum expectations
      const normalizedStatus = (formData.status || 'ACTIVE').toString().toUpperCase();
      const payload = {
        ...formData,
        status:
          normalizedStatus === 'ACTIVE'
            ? 'active'
            : normalizedStatus === 'INACTIVE'
              ? 'inactive'
              : normalizedStatus === 'MAINTENANCE'
                ? 'maintenance'
                : 'inactive',
        // Ensure numeric fields are numbers
        distance: Number(formData.distance || 0),
        estimatedTime: Number(formData.estimatedTime || 0),
      } as Partial<Route>;

      if (editing) {
        const updated = await fleetApi.updateRoute(editing.id, payload);
        setRoutes((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
      } else {
        const created = await fleetApi.createRoute(payload);
        setRoutes((prev) => [created, ...prev]);
      }
      setShowForm(false);
      resetForm();
    } catch (e) {
      console.error('Save route failed', e);
      setError('Failed to save route');
    }
  };

  if (loading) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500", isEmbedded ? "py-10" : "h-64")}>
        <Loader2 className="animate-spin text-[#345E85]" size={32} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimizing Strategic Pathways...</p>
      </div>
    );
  }

  const activeRoutes = routes.filter(r => r.isActive).length;
  const totalCoverage = routes.reduce((acc, r) => acc + (r.distance || 0), 0);


  if (error) {
    return (
      <div className="space-y-6">
        {!isEmbedded && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2">Routes</h1>
                <p className="text-sm text-gray-600">Manage and monitor your routes</p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  function haversineKm(lat: number, lng: number, lat1: number, lng1: number): number | undefined {
    throw new Error('Function not implemented.');
  }

  return (
    <div className={cn("space-y-12 animate-in fade-in duration-700", isEmbedded ? "p-0" : "p-0")}>
      {/* Search & Stats Hub */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 place-items-center bg-slate-50/50 dark:bg-slate-900/50 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-inner">
        <CircularStatCard
          title="Optimal Paths"
          value={routes.length}
          icon={Navigation}
          colorClass="bg-blue-50 text-[#345E85]"
          secondaryColor="text-[#345E85]"
        />
        <CircularStatCard
          title="Active Dynamics"
          value={activeRoutes}
          icon={Activity}
          colorClass="bg-emerald-50 text-emerald-600"
          secondaryColor="text-emerald-600"
        />
        <CircularStatCard
          title="Network Scope"
          value={`${(totalCoverage / 1000).toFixed(1)}K KM`}
          icon={Box}
          colorClass="bg-amber-50 text-amber-600"
          secondaryColor="text-amber-600"
        />
        <CircularStatCard
          title="Path Reliability"
          value="98.2%"
          icon={Shield}
          colorClass="bg-purple-50 text-purple-600"
          secondaryColor="text-purple-600"
        />
      </div>

      {/* Control Hub */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-[#345E85] dark:text-blue-400 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm">
            <Filter size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black text-[#0f172a] dark:text-white uppercase tracking-widest">Network Architecture</h3>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Manage your logistics topology</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadRoutes}
            className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl hover:bg-white dark:hover:bg-slate-700 hover:text-[#345E85] dark:hover:text-blue-400 transition-all hover:shadow-md border border-transparent hover:border-slate-100 dark:hover:border-slate-700 active:scale-95"
          >
            <RefreshCcw size={18} />
          </button>
          <button
            onClick={openCreate}
            className="px-8 py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-900 transition-all shadow-lg shadow-blue-900/10 active:scale-95"
          >
            <Plus size={16} />
            Initialize Route
          </button>
        </div>
      </div>

      {/* Manifest Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Route Manifest</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Origin</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Destination</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Magnitude</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Temporal Path</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocol</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {routes.map((route) => (
                <tr key={route.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-[#345E85] dark:group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Box size={14} />
                      </div>
                      <span className="text-xs font-black text-[#0f172a] dark:text-white uppercase tracking-tight">{route.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{route.origin}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{route.destination}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={12} className="text-[#345E85] dark:text-blue-400" />
                      <span className="text-xs font-black text-[#0f172a] dark:text-white">{route.distance} KM</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-slate-400 dark:text-slate-500" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{route.estimatedTime} H</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      route.status?.toLowerCase() === 'active' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" :
                        route.status?.toLowerCase() === 'maintenance' ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" :
                          "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                    )}>
                      {route.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(route)}
                        className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-[#345E85] dark:hover:bg-blue-600 hover:text-white transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(route)}
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {routes.length === 0 && (
            <div className="p-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center">
                <Navigation size={32} className="text-slate-200 dark:text-slate-700" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Topology Void Detect</h4>
                <p className="text-xs font-bold text-slate-300 dark:text-slate-600 mt-1 uppercase">Initialize your first route manifestation</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
            <div className="p-10 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-[#345E85] dark:text-blue-400 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                  {editing ? <Edit3 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#0f172a] dark:text-white uppercase tracking-widest">
                    {editing ? 'Modify Pathway' : 'Initiate Pathway'}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Topology configuration portal</p>
                </div>
              </div>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                className="w-10 h-10 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-[#345E85] dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Route Name</label>
                  <input
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#0f172a] dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white dark:focus:bg-slate-700 focus:border-[#345E85] dark:focus:border-blue-500 transition-all"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="E.G. NORTHERN CORRIDOR A"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Protocol Status</label>
                  <select
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#0f172a] dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white dark:focus:bg-slate-700 focus:border-[#345E85] dark:focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    value={(formData.status as string) || 'ACTIVE'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="active">ACTIVE PROTOCOL</option>
                    <option value="inactive">HIBERNATED</option>
                    <option value="maintenance">UNDER CALIBRATION</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Origin Point</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#0f172a] dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white dark:focus:bg-slate-700 focus:border-[#345E85] dark:focus:border-blue-500 transition-all"
                      value={formData.origin || ''}
                      onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      placeholder="DEPARTURE NODE"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMapPicker('origin')}
                      title="Pick on map"
                      className="px-4 py-4 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-600 dark:text-emerald-400 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest flex-shrink-0"
                    >
                      <MapIcon size={16} />
                      <span className="hidden sm:inline">Map</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Destination</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#0f172a] dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white dark:focus:bg-slate-700 focus:border-[#345E85] dark:focus:border-blue-500 transition-all"
                      value={formData.destination || ''}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="ARRIVAL NODE"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMapPicker('destination')}
                      title="Pick on map"
                      className="px-4 py-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-2xl text-red-500 dark:text-red-400 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest flex-shrink-0"
                    >
                      <MapIcon size={16} />
                      <span className="hidden sm:inline">Map</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Distance Magnitude (KM)</label>
                  <input
                    type="number"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#0f172a] dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white dark:focus:bg-slate-700 focus:border-[#345E85] dark:focus:border-blue-500 transition-all"
                    value={formData.distance || 0}
                    onChange={(e) => setFormData({ ...formData, distance: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Temporal Expectancy (HRS)</label>
                  <input
                    type="number"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#0f172a] dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white dark:focus:bg-slate-700 focus:border-[#345E85] dark:focus:border-blue-500 transition-all"
                    value={formData.estimatedTime || 0}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Architecture Overview</label>
                <textarea
                  className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#0f172a] dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white dark:focus:bg-slate-700 focus:border-[#345E85] dark:focus:border-blue-500 transition-all resize-none"
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="STRATEGIC NOTES..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  Terminate
                </button>
                <button
                  type="submit"
                  className="flex-[2] px-8 py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                >
                  {editing ? 'Commit Modifications' : 'Finalize Initiation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {DialogComponent}

      {/* Map Location Pickers */}
      <MapLocationPicker
        isOpen={mapPicker === 'origin'}
        onClose={() => setMapPicker(null)}
        title="Select Origin Point"
        color="#10b981"
        initialValue={formData.origin || ''}
        onConfirm={(name, lat, lng) => {
          setFormData((prev) => {
            const newData: Partial<Route> = {
              ...prev,
              origin: name,
              originLat: lat,
              originLng: lng,
              originAddress: name,
            };
            if (destinationCoords) {
              newData.distance = haversineKm(lat, lng, destinationCoords.lat, destinationCoords.lng);
            }
            return newData;
          });
          setOriginCoords({ lat, lng });
          setMapPicker(null);
        }}
      />
      <MapLocationPicker
        isOpen={mapPicker === 'destination'}
        onClose={() => setMapPicker(null)}
        title="Select Destination"
        color="#ef4444"
        initialValue={formData.destination || ''}
        onConfirm={(name, lat, lng) => {
          setFormData((prev) => {
            const newData: Partial<Route> = {
              ...prev,
              destination: name,
              destinationLat: lat,
              destinationLng: lng,
              destinationAddress: name,
            };
            if (originCoords) {
              newData.distance = haversineKm(originCoords.lat, originCoords.lng, lat, lng);
            }
            return newData;
          });
          setDestinationCoords({ lat, lng });
          setMapPicker(null);
        }}
      />
    </div>
  );
};

export default RoutesPage;


