import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { brokerAPI } from '../../services/brokerApi';
import { 
  MapPin, 
  Package, 
  Truck, 
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Navigation,
  Activity,
  Zap,
  Shield,
  ArrowRight
} from 'lucide-react';

interface TrackingEvent {
  id: string;
  type: string;
  status: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: string;
  description?: string;
}

interface LoadTracking {
  loadId: string;
  loadTitle: string;
  currentStatus: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  progress: number;
  estimatedArrival?: string;
  events: TrackingEvent[];
  tripId?: string;
}

const LoadTracking: React.FC = () => {
  const { loadId } = useParams<{ loadId: string }>();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState<LoadTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loadId) {
      loadTracking();
      const interval = setInterval(loadTracking, 30000);
      return () => clearInterval(interval);
    }
  }, [loadId]);

  const loadTracking = async () => {
    if (!loadId) return;

    try {
      setLoading(true);
      setError(null);
      
      const loadResponse = await brokerAPI.getLoad(loadId);
      const load = loadResponse.data;

      const trackingResponse = await fetch(`/api/loads/${loadId}/tracking`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (trackingResponse.ok) {
        const trackingData = await trackingResponse.json();
        setTracking({
          loadId,
          loadTitle: load.title || 'Load',
          currentStatus: trackingData.status || load.status,
          currentLocation: trackingData.currentLocation,
          progress: trackingData.progress || 0,
          estimatedArrival: trackingData.estimatedArrival,
          events: trackingData.events || [],
          tripId: trackingData.tripId,
        });
      } else {
        setTracking({
          loadId,
          loadTitle: load.title || 'Load',
          currentStatus: load.status,
          progress: 0,
          events: [],
        });
      }
    } catch (err: any) {
      console.error('Failed to load tracking:', err);
      setError(err.response?.data?.message || 'Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusPrimeStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'DELIVERED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'IN_PROGRESS':
      case 'IN_TRANSIT': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 border-t-4 border-primary-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Vector Data...</p>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="max-w-[800px] mx-auto p-12 bg-rose-50 border border-rose-100 rounded-[2.5rem] text-center space-y-6">
        <AlertCircle size={48} className="text-rose-600 mx-auto" />
        <h3 className="text-xl font-black text-rose-900 uppercase tracking-tighter">Tracking Interrupted</h3>
        <p className="text-xs font-bold text-rose-700 uppercase tracking-widest leading-relaxed">{error || 'No vector data available for this reference.'}</p>
        <button onClick={() => navigate('/dashboard/broker/loads')} className="px-10 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Return to Pipeline</button>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 animate-fade-in pb-24 font-manrope">
      {/* Ultra-Compact Tracking Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <button onClick={() => navigate('/dashboard/broker/loads')} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all backdrop-blur-xl">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none mb-1">Tracking</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Vector Analysis</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12 mr-4">
           <div className="text-center hidden md:block">
             <p className="text-xl font-black tracking-tighter leading-none text-emerald-400">{tracking.progress}%</p>
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Progress</p>
           </div>
           <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${getStatusPrimeStyle(tracking.currentStatus)}`}>
             {tracking.currentStatus}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        {/* Vector Point Analysis */}
        <div className="lg:col-span-1 space-y-10">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-10">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <div className="w-2 h-2 bg-primary-600 rounded-full"></div> Vector Point
            </h3>
            {tracking.currentLocation ? (
              <div className="space-y-6">
                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-6">
                   <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0"><MapPin size={20} /></div>
                   <p className="text-xs font-black uppercase text-slate-900 leading-tight">{tracking.currentLocation.address || 'Geo-Coordinates Locked'}</p>
                </div>
                <div className="px-8 flex justify-between">
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lateral</p>
                      <p className="text-sm font-black text-slate-900">{tracking.currentLocation.latitude.toFixed(6)}</p>
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Longitudinal</p>
                      <p className="text-sm font-black text-slate-900">{tracking.currentLocation.longitude.toFixed(6)}</p>
                   </div>
                </div>
                {tracking.tripId && (
                  <button onClick={() => window.open(`/dashboard/tracking/trips/${tracking.tripId}`)} className="w-full py-5 bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3">
                    <Navigation size={16} /> Open Map Terminal
                  </button>
                )}
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-50 rounded-[2rem] opacity-50 space-y-4">
                 <Zap className="w-10 h-10 text-slate-200 mx-auto" />
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Waiting for coordinate lock.</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5"><Clock size={120} /></div>
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">ETA Projection</p>
             <h3 className="text-4xl font-black text-white tracking-tighter mb-8 italic">
               {tracking.estimatedArrival ? new Date(tracking.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'STABLE'}
             </h3>
             <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Date Projection</p>
                   <p className="text-xs font-bold text-primary-400">{tracking.estimatedArrival ? new Date(tracking.estimatedArrival).toLocaleDateString() : 'Awaiting Calculation'}</p>
                </div>
                <Activity size={24} className="text-primary-500 animate-pulse" />
             </div>
          </div>
        </div>

        {/* Event Ledger */}
        <div className="lg:col-span-2 space-y-12">
           <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-12">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> Event Ledger
                 </h3>
                 <span className="px-4 py-2 bg-slate-50 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">{tracking.events.length} LOGS</span>
              </div>

              {tracking.events.length === 0 ? (
                <div className="py-32 text-center space-y-6 opacity-30">
                  <Package className="w-16 h-16 text-slate-200 mx-auto" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">No vector events logged in current cycle.</p>
                </div>
              ) : (
                <div className="space-y-12 pl-4">
                  {tracking.events.map((event, index) => (
                    <div key={event.id || index} className="relative flex gap-8">
                       {index < tracking.events.length - 1 && (
                         <div className="absolute left-[23px] top-[48px] w-px h-[calc(100%+24px)] bg-slate-100"></div>
                       )}
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xl ${index === 0 ? 'bg-primary-600 text-white' : 'bg-white border border-slate-100 text-slate-300'}`}>
                         {index === 0 ? <CheckCircle2 size={24} /> : <Package size={20} />}
                       </div>
                       <div className="flex-1 space-y-3 pt-1">
                         <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{event.type || event.status}</h4>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(event.timestamp).toLocaleString()}</p>
                         </div>
                         {event.description && <p className="text-xs font-bold text-slate-400 uppercase tracking-tight leading-relaxed">{event.description}</p>}
                         {event.location && (
                           <div className="flex items-center gap-3 text-[9px] font-black text-primary-500 uppercase tracking-widest bg-primary-50 w-fit px-4 py-2 rounded-xl">
                              <MapPin size={12} />
                              <span>{event.location.address || 'Coordinate Logged'}</span>
                           </div>
                         )}
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </div>

           <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Stream Progress</h3>
                <span className="text-xl font-black text-slate-900 tracking-tighter">{tracking.progress}%</span>
              </div>
              <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                 <div className="h-full bg-primary-600 transition-all duration-1000" style={{ width: `${tracking.progress}%` }}></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoadTracking;
