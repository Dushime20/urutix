import React from 'react';
import { 
  Rocket, 
  Clock, 
  MapPin, 
  Activity, 
  ShieldCheck,
  Zap,
  ArrowRight,
  Focus,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface TacticalMissionOverlayProps {
  currentTrip: any;
  onFocusMission?: () => void;
  onQuickAction?: (action: string) => void;
}

export const TacticalMissionOverlay: React.FC<TacticalMissionOverlayProps> = ({ 
  currentTrip,
  onFocusMission,
  onQuickAction 
}) => {
  if (!currentTrip) return null;

  const metrics = [
    { 
      label: 'ETA', 
      value: '14:45', 
      icon: Clock, 
      color: 'text-blue-500',
      description: 'Scheduled arrival'
    },
    { 
      label: 'Remaining', 
      value: `${currentTrip.distance || 0} KM`, 
      icon: MapPin, 
      color: 'text-emerald-500',
      description: 'Distance to Target'
    },
    { 
      label: 'Cargo Health', 
      value: 'OPTIMAL', 
      icon: Activity, 
      color: 'text-amber-500',
      description: 'Sensors nominal'
    }
  ];

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-[60] p-3 lg:p-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-blue-900/40 overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 gap-6">
            
            {/* Mission Identifier */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative shrink-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Rocket size={20} className="animate-pulse" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 h-3 w-3 sm:h-4 sm:w-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Active Mission</p>
                  <span className="h-1 w-1 rounded-full bg-blue-400/30" />
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{currentTrip.tripNumber}</p>
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight truncate max-w-[200px]">
                  {currentTrip.origin?.city} <ArrowRight size={14} className="inline mx-2 text-white/20" /> {currentTrip.destination?.city}
                </h3>
              </div>
            </div>

            {/* Tactical Metrics Grid */}
            <div className="flex items-center justify-center flex-1 w-full md:w-auto overflow-x-auto no-scrollbar py-2">
              <div className="flex items-center gap-12">
                {metrics.map((metric, i) => (
                  <div key={i} className="flex items-center gap-4 min-w-max">
                    <div className={cn("h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center", metric.color)}>
                      <metric.icon size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">{metric.label}</p>
                      <p className="text-sm font-black text-white tracking-tight">{metric.value}</p>
                    </div>
                    {i < metrics.length - 1 && (
                      <div className="w-px h-8 bg-white/5 mx-2 hidden md:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button 
                onClick={() => onQuickAction?.('report')}
                className="h-12 w-12 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 transition-all active:scale-95 group"
                title="Report Incident / Fault"
              >
                <AlertTriangle size={20} className="group-hover:scale-110 transition-transform" />
              </button>

              <button 
                onClick={onFocusMission}
                className="flex-1 md:flex-none h-12 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                <Focus size={16} />
                Focus
              </button>
              
              <button 
                onClick={() => onQuickAction?.('refuel')}
                className="h-12 w-12 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 transition-all active:scale-95 group"
                title="Quick Refuel"
              >
                <Zap size={20} className="group-hover:scale-110 transition-transform" />
              </button>
              
              <button 
                onClick={() => onQuickAction?.('complete')}
                className="h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <ShieldCheck size={18} />
                Complete
              </button>
            </div>

          </div>
          
          {/* Progress Indicator */}
          <div className="h-0.5 w-full bg-white/5">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: '65%' }}
               className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-emerald-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
             />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
