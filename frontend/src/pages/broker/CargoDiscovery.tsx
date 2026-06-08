import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { brokerAPI } from '../../services/brokerApi';
import { 
  Package, 
  Search, 
  MapPin, 
  ArrowRight,
  Grid3x3,
  List,
  Map as MapIcon,
  SlidersHorizontal,
  Sparkles,
  Target,
  Bookmark,
  Clock,
  Zap,
  Eye,
  Activity,
  Shield,
  Filter,
  X
} from 'lucide-react';

interface Load {
  id: string;
  title: string;
  description?: string;
  loadValue: number;
  currencyCode: string;
  weight?: number;
  cargoType?: string;
  status: string;
  pickupLocation?: any;
  deliveryLocation?: any;
  pickupDate?: string;
  deliveryDate?: string;
  createdAt: string;
}

type ViewMode = 'list' | 'card' | 'map';
type SortBy = 'newest' | 'value-high' | 'value-low' | 'urgent' | 'recommended';

const CargoDiscovery: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [sortBy, setSortBy] = useState<SortBy>('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'PUBLISHED',
    minValue: '',
    maxValue: '',
    cargoType: '',
    equipmentType: '',
    urgency: '',
    route: searchParams.get('route') || '',
  });

  useEffect(() => {
    loadAvailableLoads();
  }, [filters]);

  const loadAvailableLoads = async () => {
    try {
      setLoading(true);
      const params: any = { status: filters.status, page: 1, limit: 20 };
      if (filters.minValue) params.minLoadValue = filters.minValue;
      if (filters.maxValue) params.maxLoadValue = filters.maxValue;
      if (filters.cargoType) params.cargoType = filters.cargoType;
      if (searchTerm) params.search = searchTerm;

      const response = await brokerAPI.getAvailableLoads(params);
      const responseData = response.data || response || {};
      const loadsData = responseData.items || responseData || [];
      setLoads(Array.isArray(loadsData) ? loadsData : []);
    } catch (err: any) {
      console.error('Failed to load loads:', err);
      setLoads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); loadAvailableLoads(); };
  const handleFindTransporters = (loadId: string) => navigate(`/dashboard/broker/smart-matching?loadId=${loadId}`);

  const getSortedLoads = () => {
    const sorted = [...loads];
    switch (sortBy) {
      case 'newest': sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case 'value-high': sorted.sort((a, b) => b.loadValue - a.loadValue); break;
      case 'value-low': sorted.sort((a, b) => a.loadValue - b.loadValue); break;
      case 'urgent': sorted.sort((a, b) => (a.pickupDate ? new Date(a.pickupDate).getTime() : Infinity) - (b.pickupDate ? new Date(b.pickupDate).getTime() : Infinity)); break;
      case 'recommended': sorted.sort((a, b) => (b.loadValue / 1000 + (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60)) - (a.loadValue / 1000 + (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60))); break;
    }
    return sorted;
  };

  const clearFilters = () => {
    setFilters({ status: 'PUBLISHED', minValue: '', maxValue: '', cargoType: '', equipmentType: '', urgency: '', route: '' });
    setSearchTerm('');
  };

  const sortedLoads = getSortedLoads();
  const recommendedLoads = sortedLoads.slice(0, 3);
  const hasActiveFilters = filters.minValue || filters.maxValue || filters.cargoType || filters.equipmentType || filters.urgency || filters.route || searchTerm;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Discovery Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <Search size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1">Discovery</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Global Inventory</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12 mr-4 text-right">
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-emerald-400">{loads.length}</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">Inventory</p>
           </div>
           <button onClick={() => navigate('/dashboard/broker/smart-matching')} className="px-8 py-4 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl shadow-primary-900/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
             <Zap size={14} /> Match
           </button>
        </div>
      </div>

      {/* Control Terminal */}
      <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm space-y-8 relative overflow-hidden group">
        <div className="flex flex-col lg:flex-row gap-8 items-end">
          <div className="flex-1 space-y-3">
            <label className="text-sm font-bold text-slate-400 uppercase ml-4">Identify Target</label>
            <div className="relative">
              <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Scan load title or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold uppercase text-slate-900 transition-all focus:bg-white focus:border-primary-600 outline-none"
                />
              </form>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center p-1 bg-slate-50 rounded-2xl border border-slate-100">
               {[
                 { mode: 'list', icon: List },
                 { mode: 'card', icon: Grid3x3 }
               ].map(({ mode, icon: Icon }) => (
                 <button key={mode} onClick={() => setViewMode(mode as any)} className={`p-4 rounded-xl transition-all ${viewMode === mode ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-900'}`}><Icon size={18} /></button>
               ))}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`px-10 py-5 rounded-2xl text-sm font-bold uppercase transition-all flex items-center gap-3 ${(showFilters || hasActiveFilters) ? 'bg-primary-600 text-white shadow-xl' : 'bg-slate-900 text-white'}`}>
              <Filter size={16} /> Parameters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-slide-up">
            <div className="space-y-2">
               <p className="text-sm font-bold text-slate-400 uppercase ml-2">Route</p>
               <input type="text" value={filters.route} onChange={e => setFilters({...filters, route: e.target.value})} placeholder="e.g. EU-20-80" className="w-full bg-slate-50/50 rounded-xl px-6 py-4 text-sm font-bold uppercase text-slate-900 outline-none focus:bg-white border border-transparent focus:border-slate-100 transition-all" />
            </div>
            <div className="space-y-2">
               <p className="text-sm font-bold text-slate-400 uppercase ml-2">Class</p>
               <select value={filters.cargoType} onChange={e => setFilters({...filters, cargoType: e.target.value})} className="w-full bg-slate-50/50 rounded-xl px-6 py-4 text-sm font-bold uppercase text-slate-900 outline-none focus:bg-white border border-transparent focus:border-slate-100 transition-all cursor-pointer">
                  <option value="">Any Class</option>
                  <option value="GENERAL">General</option>
                  <option value="FROZEN">Frozen</option>
               </select>
            </div>
            <div className="space-y-2">
               <p className="text-sm font-bold text-slate-400 uppercase ml-2">Floor Price</p>
               <input type="number" value={filters.minValue} onChange={e => setFilters({...filters, minValue: e.target.value})} placeholder="Min USD" className="w-full bg-slate-50/50 rounded-xl px-6 py-4 text-sm font-bold uppercase text-slate-900 outline-none focus:bg-white border border-transparent focus:border-slate-100 transition-all" />
            </div>
            <div className="flex items-end">
               <button onClick={clearFilters} className="w-full py-4 text-sm font-bold uppercase text-rose-500 hover:bg-rose-50 rounded-xl transition-all">Clear Selection</button>
            </div>
          </div>
        )}
      </div>

      {/* Suggested System */}
      {recommendedLoads.length > 0 && (
        <div className="space-y-8">
           <div className="flex items-center gap-3">
             <Sparkles className="text-primary-600" size={24} />
             <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase italic">Suggested</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {recommendedLoads.map((load) => (
                <div key={load.id} onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm cursor-pointer group hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl">
                   <div className="flex justify-between items-start mb-8">
                      <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"><Target size={20} /></div>
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase">Precision 98%</span>
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-8 leading-tight line-clamp-2 italic">{load.title}</h3>
                   <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary-600">${load.loadValue.toLocaleString()}</span>
                      <div className="p-3 bg-slate-50 rounded-xl text-slate-300 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm"><ArrowRight size={18} /></div>
                   </div>
                </div>
             ))}
           </div>
        </div>
      )}

      {/* Stream Field */}
      <div className="space-y-8">
        <div className="flex items-center justify-between px-4">
           <div className="flex items-center gap-3">
             <Activity className="text-slate-400" size={18} />
             <span className="text-sm font-bold text-slate-400 uppercase">Sync Results: {sortedLoads.length} Items</span>
           </div>
           <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-transparent border-none text-sm font-bold text-slate-900 uppercase outline-none cursor-pointer">
              <option value="recommended">Priority</option>
              <option value="newest">Recent</option>
              <option value="value-high">Value</option>
           </select>
        </div>

        {sortedLoads.length === 0 ? (
          <div className="bg-white rounded-[4rem] p-32 text-center space-y-8 shadow-sm opacity-50 border border-slate-50">
            <Package className="w-16 h-16 text-slate-100 mx-auto" />
            <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.3em]">No vector matches in current field.</p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedLoads.map((load) => (
              <div key={load.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                   <span className="px-4 py-1.5 bg-slate-50 text-xs font-bold text-slate-400 uppercase rounded-xl transition-all group-hover:bg-slate-900 group-hover:text-white">{load.status}</span>
                   <button className="text-slate-200 hover:text-primary-600 transition-colors"><Bookmark size={20} /></button>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-8 group-hover:text-primary-600 transition-all line-clamp-2 italic">{load.title}</h3>
                
                <div className="space-y-6 mb-8">
                  <div className="flex items-center gap-4">
                     <div className="w-1 h-12 bg-slate-50 rounded-full relative overflow-hidden"><div className="absolute top-0 w-full h-1/2 bg-emerald-500"></div></div>
                     <div className="space-y-3">
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-700"><MapPin size={14} className="text-emerald-500" /> {load.pickupLocation?.name || 'Locking Point...'}</div>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-700"><MapPin size={14} className="text-rose-500" /> {load.deliveryLocation?.name || 'Target Point...'}</div>
                     </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                   <div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Authorization</p>
                      <p className="text-2xl font-bold text-slate-900">${load.loadValue.toLocaleString()}</p>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)} className="px-6 py-4 bg-slate-50 text-sm font-bold uppercase text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all">Analyze</button>
                      <button onClick={(e) => { e.stopPropagation(); handleFindTransporters(load.id); }} className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-200 group-hover:scale-110 transition-all"><Zap size={18} /></button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
             <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-8 text-left text-xs font-bold text-slate-400 uppercase border-b border-slate-50">Cargo Unit</th>
                    <th className="px-10 py-8 text-left text-xs font-bold text-slate-400 uppercase border-b border-slate-50">Route</th>
                    <th className="px-10 py-8 text-center text-xs font-bold text-slate-400 uppercase border-b border-slate-50">Value</th>
                    <th className="px-10 py-8 text-right text-xs font-bold text-slate-400 uppercase border-b border-slate-50">Command</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sortedLoads.map((load) => (
                    <tr key={load.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)}>
                      <td className="px-10 py-10">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"><Package size={22} /></div>
                           <div>
                              <p className="text-sm font-bold text-slate-900 uppercase italic">{load.title}</p>
                              <p className="text-xs font-bold text-slate-400 uppercase mt-0.5">{load.cargoType || 'General'}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-10">
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                           <span>{load.pickupLocation?.name?.split(',')[0]}</span>
                           <ArrowRight size={14} className="text-slate-300" />
                           <span>{load.deliveryLocation?.name?.split(',')[0]}</span>
                        </div>
                      </td>
                      <td className="px-10 py-10 text-center">
                        <p className="text-xl font-bold text-primary-600">${load.loadValue.toLocaleString()}</p>
                      </td>
                      <td className="px-10 py-10">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                           <button className="p-4 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Eye size={16} /></button>
                           <button onClick={(e) => { e.stopPropagation(); handleFindTransporters(load.id); }} className="p-4 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-200 hover:scale-110 transition-all"><Zap size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CargoDiscovery;
