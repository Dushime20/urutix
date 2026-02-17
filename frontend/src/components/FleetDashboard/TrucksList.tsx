import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  MapPin,
  Edit3,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Grid,
  List,
  MoreVertical,
  Zap
} from 'lucide-react';
import { fleetApi } from '../../services/fleetApi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface TrucksListProps {
  refreshTrigger?: number;
}

export const TrucksList: React.FC<TrucksListProps> = ({ refreshTrigger }) => {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const loadData = useCallback(async () => {
    if (!user || !accessToken || authLoading) return;
    setLoading(true);
    try {
      const [trucksData] = await Promise.all([
        fleetApi.getTrucks({}),
        fleetApi.getDrivers({}).catch(() => []),
        fleetApi.fetchRoutes().catch(() => [])
      ]);
      setTrucks(trucksData || []);
    } catch (e: any) {
      toast.error('Data synchronization failed');
    } finally {
      setLoading(false);
    }
  }, [user, accessToken, authLoading]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'in_transit': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'maintenance': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = !search || truck.plateNumber?.toLowerCase().includes(search.toLowerCase()) || truck.make?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || truck.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <motion.div whileHover={{ y: -5 }} className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform"><Icon size={60} /></div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`size-10 ${color} rounded-xl flex items-center justify-center shadow-inner`}><Icon size={20} /></div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</span>
      </div>
      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
    </motion.div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Stats Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Assets" value={trucks.length} icon={Truck} color="bg-indigo-50 text-indigo-600" />
        <StatCard title="Available" value={trucks.filter(t => t.status === 'AVAILABLE').length} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
        <StatCard title="In Transit" value={trucks.filter(t => t.status === 'IN_TRANSIT').length} icon={Clock} color="bg-blue-50 text-blue-600" />
        <StatCard title="Maintenance" value={trucks.filter(t => t.status === 'MAINTENANCE').length} icon={AlertTriangle} color="bg-amber-50 text-amber-600" />
      </div>

      {/* Action Toolbar */}
      <div className="bg-white rounded-[32px] border border-slate-100 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-50 rounded-[20px] text-[11px] font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-[20px]">
            {['', 'AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-[20px]">
            <button onClick={() => setView('grid')} className={`p-2 rounded-[16px] transition-all ${view === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><Grid size={16} /></button>
            <button onClick={() => setView('list')} className={`p-2 rounded-[16px] transition-all ${view === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><List size={16} /></button>
          </div>
        </div>
      </div>

      {/* Grid Rendering */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTrucks.map(truck => (
            <motion.div
              layout
              key={truck.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="size-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                  <Truck size={24} />
                </div>
                <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(truck.status)}`}>
                  {truck.status}
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">{truck.plateNumber}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{truck.make} {truck.model} • {truck.year}</p>
              </div>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-slate-500">
                  <Zap size={14} className="text-indigo-400" />
                  <span className="text-xs font-medium">{truck.capacityWeight?.toLocaleString()} kg Payload</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <MapPin size={14} className="text-indigo-400" />
                  <span className="text-xs font-medium truncate">{truck.currentLocation?.address || 'Location Offline'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex-1 h-10 bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">Details</button>
                <button className="size-10 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl flex items-center justify-center transition-all"><MoreVertical size={16} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">Asset Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">Internal State</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">Current Vector</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTrucks.map(truck => (
                <tr key={truck.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="size-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors"><Truck size={20} /></div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{truck.plateNumber}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{truck.make} {truck.model}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(truck.status)}`}>
                      {truck.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin size={14} className="opacity-40" />
                      <span className="text-xs font-medium">{truck.currentLocation?.address || 'No Data'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit3 size={16} /></button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="size-12 bg-slate-100 rounded-full mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Asset Matrix...</p>
        </div>
      )}

      {!loading && filteredTrucks.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="size-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 mb-6"><Truck size={32} /></div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Zero Asset Pulse</h3>
          <p className="text-sm font-medium text-slate-400 mt-2">The system has not detected any assets matching your current query.</p>
        </div>
      )}
    </div>
  );
};