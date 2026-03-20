import React from 'react';
import { 
  X, 
  Thermometer, 
  Droplets, 
  Activity, 
  ShieldCheck, 
  AlertTriangle,
  History,
  TrendingUp,
  Zap,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CargoHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  cargoType: string;
}

export const CargoHealthModal: React.FC<CargoHealthModalProps> = ({ 
  isOpen, 
  onClose, 
  cargoType 
}) => {
  // Generate mock sensor data
  const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const temperatureData = Array.from({ length: 24 }, () => 4 + Math.random() * 2); // Target 5°C
  const humidityData = Array.from({ length: 24 }, () => 60 + Math.random() * 10); // Target 65%

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        padding: 12,
        cornerRadius: 12,
        titleFont: { size: 13, weight: 'bold' as const },
        bodyFont: { size: 12 },
      }
    },
    scales: {
      y: {
        grid: { color: '#F1F5F9', drawBorder: false },
        ticks: { font: { size: 10 }, color: '#94A3B8' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#94A3B8', maxRotation: 0 }
      }
    }
  };

  const tempData = {
    labels,
    datasets: [{
      label: 'Temperature (°C)',
      data: temperatureData,
      borderColor: '#345E85',
      backgroundColor: 'rgba(52, 94, 133, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 3,
    }]
  };

  const humData = {
    labels,
    datasets: [{
      label: 'Humidity (%)',
      data: humidityData,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 3,
    }]
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-md"
        />
        
        <motion.div 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/20"
        >

          {/* Header - Tactical Dark */}
          <div className="bg-[#0F172A] p-6 sm:p-10 text-white relative">

             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
             
             <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center border border-white/10 text-emerald-400">
                      <Activity size={32} />
                   </div>
                   <div>
                      <div className="flex items-center gap-3 mb-1">
                         <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Live Telemetry</span>
                         <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <h2 className="text-3xl font-black uppercase tracking-tight">Cargo Health Intelligence</h2>
                      <p className="text-blue-100/50 text-xs font-medium uppercase tracking-widest mt-1">Classification: {cargoType}</p>
                   </div>
                </div>
                
                <button 
                  onClick={onClose}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/10 shadow-lg"
                >
                  <X size={18} />
                </button>

             </div>
          </div>

          <div className="p-10">
             {/* Alert Banner */}
             <div className="mb-10 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                      <ShieldCheck size={24} />
                   </div>
                   <div>
                      <p className="text-sm font-black text-[#0F172A] uppercase tracking-tight">Environmental Integrity Verified</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5 italic">Sensors showing optimal stabilization</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Sample</p>
                   <p className="text-lg font-black text-[#0F172A] tracking-tighter">SEC: 2.4 MS AGO</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Temperature Sensor Mapping */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                         <Thermometer size={18} className="text-[#345E85]" />
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Temp Profile (°C)</h3>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase">Target: 5.0°</span>
                         <TrendingUp size={14} className="text-emerald-500" />
                      </div>
                   </div>
                   <div className="h-48 bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 shadow-inner">
                      <Line data={tempData} options={chartOptions} />
                   </div>
                </div>

                {/* Humidity Sensor Mapping */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                         <Droplets size={18} className="text-emerald-500" />
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Humidity Matrix (%)</h3>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase">Avg: 68.2%</span>
                         <Zap size={14} className="text-[#345E85]" />
                      </div>
                   </div>
                   <div className="h-48 bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 shadow-inner">
                      <Line data={humData} options={chartOptions} />
                   </div>
                </div>
             </div>

             {/* Sensor Logs Table */}
             <div className="mt-12">
                <div className="flex items-center gap-4 mb-6 px-2">
                   <History size={16} className="text-slate-400" />
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Anomalous Event History</h3>
                </div>
                
                <div className="space-y-3">
                   {[
                      { time: '14:22', event: 'Sensor Calibration', severity: 'low', detail: 'Automated adjustment of node 4' },
                      { time: '11:05', event: 'Temperature Spike', severity: 'medium', detail: 'Temporary increase during door opening (+1.2°)' },
                   ].map((log, idx) => (
                      <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 flex items-center justify-between group hover:bg-white hover:shadow-lg hover:border-[#345E85]/20 transition-all cursor-default">
                         <div className="flex items-center gap-6">
                            <span className="text-[10px] font-black text-slate-400 font-mono italic">{log.time}</span>
                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${log.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                               {log.severity}
                            </div>
                            <span className="text-xs font-black text-[#0F172A] uppercase tracking-tight">{log.event}</span>
                         </div>
                         <div className="flex items-center gap-4">
                            <p className="text-[9px] font-bold text-slate-400 italic">{log.detail}</p>
                            <Info size={14} className="text-slate-300 group-hover:text-[#345E85]" />
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Disclaimer */}
             <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 text-rose-400">
                   <AlertTriangle size={14} />
                   <span className="text-[8px] font-black uppercase tracking-widest">Protocol: immediate reporting of deviations &gt; 5%</span>
                </div>
                <button className="px-6 py-2 bg-[#0F172A] text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:bg-slate-800 transition-all">
                   Export Telemetry PDF
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
