import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Thermometer, 
  Droplets, 
  Zap, 
  Activity, 
  ShieldCheck,
  TrendingUp,
  Info
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { TranslatedText } from '../translated-text';

interface CargoHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  cargo: any;
}

export const CargoHealthModal: React.FC<CargoHealthModalProps> = ({
  isOpen,
  onClose,
  cargo
}) => {
  if (!isOpen || !cargo) return null;

  const sensors = [
    {
      label: 'Temperature',
      value: '4.2°C',
      status: 'Optimal',
      icon: Thermometer,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      range: '2.0°C - 8.0°C',
      trend: 'stable'
    },
    {
      label: 'Humidity',
      value: '45%',
      status: 'Nominal',
      icon: Droplets,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      range: '40% - 60%',
      trend: 'nominal'
    },
    {
      label: 'Shock/G-Force',
      value: '0.12 G',
      status: 'Secure',
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      range: '< 1.5 G',
      trend: 'safe'
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#0F172A] p-10 text-white relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-3xl -mr-24 -mt-24 rounded-full" />
          
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <Activity size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]"><TranslatedText text="Telemetry Scan" /></p>
                <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-black rounded uppercase border border-emerald-500/30"><TranslatedText text="Live Link Enabled" /></div>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight"><TranslatedText text="Cargo Health Monitoring" /></h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-10 space-y-8 bg-slate-50/30">
          
          <div className="flex items-center justify-between px-2">
            <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><TranslatedText text="Asset Reference" /></p>
                 <h4 className="text-sm font-black text-[#0f172a] uppercase">{cargo.name}</h4>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><TranslatedText text="Last Update" /></p>
                <p className="text-sm font-black text-[#0f172a] uppercase"><TranslatedText text="2 Mins Ago" /></p>
            </div>
          </div>

          {/* Sensor Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sensors.map((sensor, idx) => (
              <div key={idx} className={cn("p-6 rounded-3xl border bg-white shadow-sm hover:shadow-xl transition-all", sensor.border)}>
                 <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-6", sensor.bg, sensor.color)}>
                    <sensor.icon size={20} />
                 </div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1"><TranslatedText text={sensor.label} /></p>
                 <h4 className="text-xl font-black text-[#0f172a] tracking-tight mb-2">{sensor.value}</h4>
                 <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", sensor.bg, sensor.color)}>
                        <TranslatedText text={sensor.status} />
                    </span>
                 </div>
                 <p className="text-[8px] font-bold text-slate-400 mt-4 uppercase tracking-tighter"><TranslatedText text="Limit:" /> {sensor.range}</p>
              </div>
            ))}
          </div>

          {/* Detailed Insight */}
          <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 text-emerald-100 group-hover:scale-110 transition-transform">
                <ShieldCheck size={120} />
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <TrendingUp size={16} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest"><TranslatedText text="Stability Analysis" /></span>
                </div>
                <h4 className="text-lg font-black text-emerald-900 uppercase tracking-tight mb-2"><TranslatedText text="Internal Payload Stable" /></h4>
                <p className="text-[11px] font-bold text-emerald-700/70 leading-relaxed max-w-md italic">
                    "<TranslatedText text={`Sensors indicate 100% containment integrity. Ambient vibration is within safety thresholds. No atmospheric drift detected since pickup in ${cargo.pickupLocation}.`} />"
                </p>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Info size={14} className="text-blue-500" />
                <TranslatedText text="Telemetry provided by Uruti-Sense IoT" />
            </div>
            <button 
                onClick={onClose}
                className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
            >
                <TranslatedText text="Dismiss" />
            </button>
        </div>
      </motion.div>
    </div>
  );
};
