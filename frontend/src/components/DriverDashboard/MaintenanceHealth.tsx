import React from 'react';
import { 
  Zap, 
  Settings, 
  Droplet, 
  Activity, 
  Truck,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

interface HealthMetric {
  id: string;
  label: string;
  percentage: number;
  status: 'good' | 'warning' | 'critical';
  icon: React.ElementType;
}

export const MaintenanceHealth: React.FC = () => {
  const metrics: HealthMetric[] = [
    { id: '1', label: 'Engine Health', percentage: 92, status: 'good', icon: Activity },
    { id: '2', label: 'Fluid Levels', percentage: 65, status: 'warning', icon: Droplet },
    { id: '3', label: 'Tire Condition', percentage: 88, status: 'good', icon: Truck },
    { id: '4', label: 'Brake Integrity', percentage: 95, status: 'good', icon: Settings },
  ];

  return (
    <div className="bg-[#345E85] rounded-[2rem] p-6 border border-white/5 shadow-xl shadow-[#345E85]/20 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-24 -mt-24" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-white/10 shadow-sm">
              <Zap size={18} fill="currentColor" />
           </div>
           <div>
              <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Vehicle AI</p>
              <h3 className="text-base font-black text-white uppercase tracking-tight">Truck Health</h3>
           </div>
        </div>
        <div className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10">
            System: Optimal
        </div>
      </div>

      <div className="flex-1 space-y-3.5 relative z-10">
        {metrics.map((metric) => (
          <div key={metric.id} className="space-y-1.5 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <metric.icon size={12} className={metric.status === 'warning' ? 'text-amber-400' : 'text-emerald-400/80'} />
                <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">{metric.label}</span>
              </div>
              <span className={`text-[9px] font-black ${metric.status === 'warning' ? 'text-amber-400' : 'text-white'}`}>
                {metric.percentage}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.percentage}%` }}
                    className={`h-full rounded-full transition-all ${
                        metric.status === 'warning' ? 'bg-amber-500' :
                        metric.status === 'critical' ? 'bg-rose-500' :
                        'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                    }`}
                />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-white/10 border border-white/10 rounded-2xl flex items-center gap-3 group hover:bg-white/15 transition-all cursor-pointer">
         <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/20 group-hover:scale-105 transition-transform shrink-0">
            <Calendar size={18} />
         </div>
         <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Recommended</p>
            <h4 className="text-white font-black text-xs uppercase tracking-tight truncate">Service in 250 KM</h4>
            <p className="text-[8px] font-bold text-white/40 italic mt-0.5 leading-none">Next: Level A Protocols</p>
         </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 opacity-40">
        <CheckCircle2 size={10} className="text-emerald-500" />
        <p className="text-[8px] font-black text-white uppercase tracking-[0.2em] leading-none">Diagnostic Verified</p>
      </div>
    </div>
  );
};
