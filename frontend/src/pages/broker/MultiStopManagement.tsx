import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState } from 'react';
import { brokerAPI, type MultiStopLoad, type CreateMultiStopLoadData } from '../../services/brokerApi';
import { Route, Plus, MapPin, Clock, Zap, Activity, X, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

const MultiStopManagement: React.FC = () => {
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [multiStop, setMultiStop] = useState<MultiStopLoad | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleGetMultiStop = async () => {
    if (!selectedLoadId) {
      toast.error('Reference ID Required');
      return;
    }

    setLoading(true);
    try {
      const response = await brokerAPI.getMultiStopLoad(selectedLoadId);
      setMultiStop(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setMultiStop(null);
        toast.info('No multi-stop configuration found.');
      } else {
        toast.error('Failed to fetch routing data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMultiStop = async (data: CreateMultiStopLoadData) => {
    try {
      await brokerAPI.createMultiStopLoad(data);
      toast.success('Route synchronized successfully');
      setShowCreateModal(false);
      handleGetMultiStop();
    } catch (err: any) {
      toast.error('Failed to optimize route');
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Routing Header */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100/60 dark:bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#345E85]/10 dark:bg-white/10 border border-[#345E85]/20 dark:border-white/20 flex items-center justify-center">
            <Route size={24} className="text-[#345E85] dark:text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1 text-slate-900 dark:text-white">Routing</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">Multi-Stop Optimization</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 mr-4">
           <button onClick={() => setShowCreateModal(true)} className="px-8 py-4 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
             <Plus size={14} /> Construct
           </button>
        </div>
      </div>

      {/* Control Terminal */}
      <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm space-y-8 group overflow-hidden relative dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col md:flex-row gap-6 items-end">
           <div className="flex-1 space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">Reference</label>
              <input type="text" placeholder="Scan Load Node..." value={selectedLoadId} onChange={e => setSelectedLoadId(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-bold uppercase text-slate-900 transition-all focus:bg-white focus:border-primary-600 outline-none dark:bg-slate-800/50 dark:text-white dark:border-slate-800" />
           </div>
           <button onClick={handleGetMultiStop} className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-sm font-bold uppercase flex items-center gap-3 hover:bg-primary-600 shadow-xl transition-all dark:bg-slate-950">
              <Navigation size={16} /> Fetch
           </button>
        </div>
      </div>

      {!multiStop ? (
        <div className="bg-white rounded-[4rem] p-32 text-center space-y-8 shadow-sm opacity-50 border border-slate-50 dark:bg-slate-900 dark:border-slate-800/50">
          <Route className="w-16 h-16 text-slate-100 mx-auto" />
          <p className="text-xs font-bold text-slate-300 uppercase tracking-[0.3em]">No routing field initialized for this node.</p>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Node List */}
            <div className="lg:col-span-8 space-y-8">
               <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm space-y-12 dark:bg-slate-900 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3 dark:text-white">
                    <div className="w-2 h-2 bg-slate-900 rounded-full dark:bg-slate-950"></div> Node Sequence ({multiStop.stops.length})
                  </h3>
                  <div className="space-y-10 pl-4">
                    {multiStop.stops.sort((a,b) => a.sequence - b.sequence).map((stop, idx) => (
                      <div key={stop.stopId} className="relative flex gap-8">
                         {idx < multiStop.stops.length - 1 && <div className="absolute left-[23px] top-[48px] w-px h-[calc(100%+20px)] bg-slate-100"></div>}
                         <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xl shrink-0 italic dark:bg-slate-950">{stop.sequence}</div>
                         <div className="flex-1 space-y-3 pt-1">
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <MapPin size={16} className="text-primary-600" />
                                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight italic dark:text-white">{stop.location.name}</h4>
                               </div>
                               <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase ${stop.type === 'PICKUP' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>{stop.type}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{stop.location.address}</p>
                            <div className="flex items-center gap-6 pt-2">
                               <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase"><Clock size={12} /> {new Date(stop.scheduledTime).toLocaleString()}</div>
                               <div className="text-xs font-bold text-slate-300 uppercase">Est: {stop.estimatedDuration} min</div>
                               <div className={`px-3 py-1 text-[8px] font-bold rounded-lg uppercase border ${stop.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{stop.status}</div>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* Trajectory Sidebar */}
            <div className="lg:col-span-4 space-y-8">
               {multiStop.optimizedRoute && (
                  <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl space-y-10 relative overflow-hidden group dark:bg-slate-950">
                     <div className="absolute top-0 right-0 p-12 opacity-5"><Activity size={120} /></div>
                     <h3 className="text-sm font-bold uppercase text-slate-500 italic dark:text-slate-400">Trajectory</h3>
                     <div className="space-y-8">
                        <div>
                           <p className="text-xs font-bold text-slate-500 uppercase mb-2 dark:text-slate-400">Total Field</p>
                           <p className="text-3xl font-bold text-white italic">{multiStop.optimizedRoute.totalDistance.toFixed(1)} <span className="text-sm text-primary-400 uppercase">KM</span></p>
                        </div>
                        <div className="pt-8 border-t border-white/5">
                           <p className="text-xs font-bold text-slate-500 uppercase mb-2 dark:text-slate-400">Total Interval</p>
                           <p className="text-3xl font-bold text-white italic">{Math.round(multiStop.optimizedRoute.totalTime / 60)} <span className="text-sm text-primary-400 uppercase">HRS</span></p>
                        </div>
                     </div>
                  </div>
               )}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-[4rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pb-24 lg:pb-8 animate-slide-up dark:bg-slate-900">
             <div className="p-16 bg-slate-900 text-white relative overflow-hidden dark:bg-slate-950">
                <h2 className="text-4xl font-bold uppercase italic leading-none">Construct <br /><span className="text-primary-600">Trajectory</span></h2>
                <div className="absolute top-0 right-0 p-12 opacity-5"><Zap size={120} /></div>
             </div>
             
             <form onSubmit={(e) => { e.preventDefault(); /* handle sequence logic */ }} className="p-16 space-y-10">
                <div className="space-y-10">
                   <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-900 uppercase dark:text-white">Node Registry</h3>
                      <button type="button" className="px-6 py-2 bg-slate-900 text-white text-xs font-bold uppercase rounded-xl dark:bg-slate-950">Add Node</button>
                   </div>
                   {/* Simplified for now as it's a sub-component simulation */}
                   <p className="text-sm font-bold text-slate-400 uppercase italic text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">Terminal Node Configuration Grid</p>
                </div>

                <div className="pt-8 flex gap-4">
                   <button type="button" onClick={() => setShowCreateModal(false)} className="px-10 py-5 bg-slate-50 text-sm font-bold uppercase text-slate-400 rounded-2xl dark:bg-slate-800/50">Abort</button>
                   <button type="submit" className="flex-1 py-5 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl">Synchronize</button>
                </div>
             </form>
          </div>
        </Dialog>
      )}
    </div>
  );
};

// Simplified Dialog
const Dialog = ({ children, open, onClose }: any) => open ? (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <div className="w-full max-w-2xl relative" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute -top-12 right-0 text-white hover:text-primary-400 transition-colors"><X size={32} /></button>
      {children}
    </div>
  </div>
) : null;

export default MultiStopManagement;
