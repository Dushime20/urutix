import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Ship, 
  Truck, 
  Train, 
  Plane, 
  MapPin, 
  CheckCircle2, 
  ChevronRight, 
  Search,
  Maximize2,
  Anchor,
  Navigation,
  Activity,
  ArrowRight,
  Target,
  Zap,
  Box,
  Globe2,
  Hash,
  Database,
  Smartphone,
  Info
} from 'lucide-react';
import { multiModalApi } from '../../services/multiModalApi';

const MultiModalTracking: React.FC = () => {
  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'TRANSIT' | 'PLANNING' | 'COMPLETED'>('TRANSIT');

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const res = await multiModalApi.getAllShipments();
      setShipments(res.data || []);
      if (res.data?.length > 0 && !selectedShipment) {
        setSelectedShipment(res.data[0]);
      }
    } catch (error) {
       console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'SEA': return <Ship className="w-5 h-5 text-blue-500" />;
      case 'TRUCK': return <Truck className="w-5 h-5 text-emerald-500" />;
      case 'RAIL': return <Train className="w-5 h-5 text-indigo-500" />;
      case 'AIR': return <Plane className="w-5 h-5 text-sky-400" />;
      default: return <Box className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'IN_TRANSIT': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'COMPLETED': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'DELAYED': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  const completedLegsCount = selectedShipment?.legs?.filter((l: any) => l.status === 'COMPLETED').length || 0;
  const totalLegs = selectedShipment?.legs?.length || 0;
  const progressPercent = totalLegs > 0 ? (completedLegsCount / totalLegs) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header with Title and Global Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                 <Globe2 className="text-blue-600 w-10 h-10" /> Multi-Modal Global Tracking
              </h1>
              <p className="text-slate-500 font-medium italic">High-resolution chain-of-custody across Truck, Rail, Sea, and Air</p>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="px-6 py-4 bg-white border border-slate-100 rounded-[28px] shadow-sm flex items-center gap-4">
                 <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Activity className="text-blue-600 w-5 h-5" />
                 </div>
                 <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Active Network</span>
                    <span className="text-lg font-black text-slate-900">{shipments.filter(s => s.status === 'IN_TRANSIT').length} Shipments</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Dashboard Layout: Shipments Sidebar & Detailed View */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           
           {/* Sidebar: Shipment List */}
           <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
                 <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 w-4 h-4 transition-colors" />
                    <input 
                       type="text" 
                       placeholder="Search Container/Airway ID..." 
                       className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all text-sm font-bold placeholder:text-slate-300 text-slate-700 outline-none"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>

                 <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl">
                    {['TRANSIT', 'PLANNING', 'COMPLETED'].map((tab) => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === tab ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                         {tab}
                      </button>
                    ))}
                 </div>

                 <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? [1,2,3].map(i => <div key={i} className="h-24 bg-slate-50/50 rounded-2xl animate-pulse" />) : 
                     shipments.map((shipment) => (
                       <motion.div 
                        key={shipment.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setSelectedShipment(shipment)}
                        className={`p-5 rounded-[28px] border transition-all cursor-pointer relative overflow-hidden group ${selectedShipment?.id === shipment.id ? 'border-blue-600 bg-blue-50/30' : 'border-slate-50 hover:bg-slate-50 hover:border-slate-200'}`}
                       >
                          <div className="flex justify-between items-start mb-3">
                             <div>
                                <h4 className="font-black text-slate-800 text-xs tracking-tight">{shipment.shipmentNumber}</h4>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{shipment.load?.title || 'General Cargo'}</p>
                             </div>
                             {getModeIcon(shipment.legs[0]?.mode)}
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-black">
                             <span className={`px-2 py-0.5 rounded-lg border ${getStatusColor(shipment.status)}`}>{shipment.status}</span>
                             <span className="text-slate-500">{shipment.legs.length} LEGS</span>
                          </div>
                       </motion.div>
                     ))}
                 </div>
              </div>
           </div>

           {/* Main Body: Real-time Leg Visualization */}
           <div className="lg:col-span-3 space-y-8">
              {selectedShipment ? (
                 <>
                    {/* Top Row: Shipment Status & AI Strategy */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="md:col-span-2 bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform">
                             <Anchor className="w-64 h-64" />
                          </div>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                             <div>
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1.5">Master Tracking Session</span>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedShipment.shipmentNumber}</h2>
                             </div>
                             <div className="text-right">
                                <span className={`px-4 py-2 rounded-2xl border font-black text-xs tracking-widest ${getStatusColor(selectedShipment.status)}`}>
                                   {selectedShipment.status}
                                </span>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-2">
                                   <Zap className="text-blue-500 fill-blue-500 w-4 h-4" />
                                   <span className="text-[10px] font-black text-slate-400 uppercase">Neural Journey Progress</span>
                                </div>
                                <span className="text-2xl font-black text-slate-900 tracking-tighter">{Math.round(progressPercent)}%</span>
                             </div>
                             <div className="h-4 bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressPercent}%` }}
                                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                                />
                             </div>
                             <div className="flex justify-between text-[10px] font-black text-slate-400">
                                <div className="flex items-center gap-2">
                                   <MapPin className="text-emerald-500 w-3 h-3" /> DEP: MOMBASA PORT
                                </div>
                                <div className="flex items-center gap-2">
                                   <Target className="text-rose-500 w-3 h-3" /> DEST: KAMPALA HUB
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Interactive Mode Optimization Strategy */}
                       <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
                          <div className="absolute top-0 right-0 p-6 opacity-10">
                             <Zap className="w-24 h-24 text-blue-400" />
                          </div>
                          <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] block mb-6">AI Strategy Engine</span>
                          <h3 className="text-xl font-black mb-4">Mombasa Port Deviation</h3>
                          <p className="text-slate-400 text-xs font-medium leading-relaxed mb-8">
                             Port Congestion +48h. Our AI suggests switching <span className="text-white font-bold">Leg 3 to Rail</span> to bypass terminal delays.
                          </p>
                          <div className="space-y-3">
                             <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-[9px] font-black text-slate-400 tracking-widest">COST DELTA</span>
                                <span className="text-sm font-black text-emerald-400">-$150.00</span>
                             </div>
                             <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
                                <span className="text-[9px] font-black text-slate-400 tracking-widest">TIME IMPACT</span>
                                <span className="text-sm font-black text-blue-400">-12 HOURS</span>
                             </div>
                          </div>
                          <button 
                            onClick={async () => {
                               if (!selectedShipment) return;
                               try {
                                  const res = await multiModalApi.executeStrategy(selectedShipment.id);
                                  if (res.success) {
                                     // Refresh details
                                     const detailRes = await multiModalApi.getShipmentDetails(selectedShipment.id);
                                     setSelectedShipment(detailRes.data);
                                     alert('AI Dispatcher: Strategy implemented successfully. Journey re-routed.');
                                  }
                               } catch (error) {
                                  console.error('Error executing strategy:', error);
                               }
                            }}
                            className="w-full mt-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 text-xs"
                          >
                             <Zap className="w-3.5 h-3.5" /> Implement Strategy
                          </button>
                       </div>
                    </div>

                    {/* Chain of Custody Timeline (LEGS) */}
                    <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 space-y-10">
                       <h3 className="font-black text-slate-800 flex items-center gap-3 text-lg">
                          <Navigation className="text-blue-600" /> Chain-of-Custody Timeline
                       </h3>

                       <div className="relative flex flex-col gap-12 pl-12">
                          <div className="absolute left-5 top-0 bottom-0 w-1 bg-slate-50 rounded-full" />
                          
                          {selectedShipment.legs.map((leg: any, idx: number) => (
                             <motion.div 
                               initial={{ opacity: 0, x: 20 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: idx * 0.1 }}
                               key={leg.id} 
                               className="relative group"
                             >
                                {/* Marker */}
                                <div className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-lg transition-all ${
                                   leg.status === 'COMPLETED' ? 'bg-emerald-500' :
                                   leg.status === 'ACTIVE' ? 'bg-blue-600 scale-125' : 'bg-slate-200'
                                }`}>
                                   {leg.status === 'COMPLETED' ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : 
                                    leg.status === 'ACTIVE' ? <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> : null}
                                </div>

                                <div className={`p-8 rounded-[32px] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 ${
                                   leg.status === 'ACTIVE' ? 'bg-blue-50/50 border-blue-100 shadow-xl shadow-blue-500/5' : 'bg-white border-slate-50'
                                }`}>
                                   <div className="flex items-center gap-6">
                                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                                         leg.mode === 'SEA' ? 'bg-blue-100' : 
                                         leg.mode === 'TRUCK' ? 'bg-emerald-100' : 
                                         leg.mode === 'RAIL' ? 'bg-indigo-100' : 'bg-slate-100'
                                      }`}>
                                         {getModeIcon(leg.mode)}
                                      </div>
                                      <div>
                                         <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">{leg.mode} LEG</h4>
                                            <span className={`px-2 py-0.5 text-[8px] font-black rounded-lg border ${getStatusColor(leg.status)}`}>
                                               {leg.status}
                                            </span>
                                         </div>
                                         <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-tighter">
                                            <span>{leg.originHub}</span>
                                            <ArrowRight className="w-3 h-3" />
                                            <span className="text-slate-700">{leg.destinationHub}</span>
                                         </div>
                                      </div>
                                   </div>

                                   <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
                                      <div className="space-y-1">
                                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Carrier</p>
                                         <p className="text-xs font-black text-slate-800">{leg.carrierName || 'UNASSIGNED'}</p>
                                         <p className="text-[9px] font-medium text-slate-400 italic">Vessel: {leg.vesselName || 'N/A'}</p>
                                      </div>
                                      <div className="space-y-1">
                                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reference No</p>
                                         <p className="text-xs font-black text-slate-800 flex items-center gap-2">
                                            <Hash className="w-3 h-3 text-slate-300" /> {leg.trackingNumber || 'PENDING'}
                                         </p>
                                         <p className="text-[9px] font-medium text-slate-400">Voyage: {leg.voyageNumber || 'N/A'}</p>
                                      </div>
                                      <div className="hidden md:block space-y-1">
                                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ETA Update</p>
                                         <p className="text-xs font-black text-slate-800">{leg.scheduledArrival ? new Date(leg.scheduledArrival).toLocaleDateString() : 'TBD'}</p>
                                         <p className="text-[9px] font-black text-blue-600">LIVE SYNCED</p>
                                      </div>
                                   </div>

                                   <div className="flex items-center gap-3">
                                      <button className="p-3 bg-white border border-slate-100 hover:border-slate-300 rounded-2xl transition-all shadow-sm">
                                         <Maximize2 className="w-4 h-4 text-slate-600" />
                                      </button>
                                      <button className="flex items-center gap-2 bg-slate-900 border border-slate-900 hover:bg-black text-white px-5 py-3 rounded-2xl text-[10px] font-black transition-all">
                                         MANAGED FEED
                                      </button>
                                   </div>
                                </div>
                             </motion.div>
                          ))}
                       </div>
                    </div>

                    {/* Footer: Infrastructure Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                       <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                          <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                             <Database className="text-indigo-600 w-5 h-5" />
                          </div>
                          <div>
                             <span className="text-[10px] font-black text-slate-400 uppercase block">Ledger Integrity</span>
                             <span className="text-[10px] font-black text-indigo-600 uppercase">FULLY COMPLIANT</span>
                          </div>
                       </div>
                       <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                          <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
                             <Smartphone className="text-emerald-600 w-5 h-5" />
                          </div>
                          <div>
                             <span className="text-[10px] font-black text-slate-400 uppercase block">Field Telemetry</span>
                             <span className="text-[10px] font-black text-emerald-600 uppercase">OFFLINE RESILIENT</span>
                          </div>
                       </div>
                       <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                             <Info className="text-blue-600 w-5 h-5" />
                          </div>
                          <div>
                             <span className="text-[10px] font-black text-slate-400 uppercase block">Chain of Custody</span>
                             <span className="text-[10px] font-black text-blue-600 uppercase">MULTI-PARTY VERIFIED</span>
                          </div>
                       </div>
                       <div className="bg-slate-900 p-6 rounded-[32px] flex items-center justify-between text-white">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                                <Zap className="text-blue-400 w-5 h-5" />
                             </div>
                             <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase block">Autonomous Control</span>
                                <span className="text-[10px] font-black text-blue-400 uppercase">ACTIVE</span>
                             </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-600" />
                       </div>
                    </div>
                 </>
              ) : (
                 <div className="h-[80vh] bg-white border border-dashed border-slate-200 rounded-[50px] flex flex-col items-center justify-center text-center p-12">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <Globe2 className="w-12 h-12 text-slate-200" />
                   </div>
                   <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest mb-2">Synchronizing Global Freight Network</h2>
                   <p className="text-slate-400 font-medium italic mb-8 max-w-md">Selecting a master tracking session to begin high-fidelity visualization of multi-modal cargo movements.</p>
                   <button 
                     onClick={fetchShipments}
                     className="bg-slate-900 text-white font-black px-10 py-4 rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200"
                   >
                      REFRESH DEEP FEED
                   </button>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default MultiModalTracking;
