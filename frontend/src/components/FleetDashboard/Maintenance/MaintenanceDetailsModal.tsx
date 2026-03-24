import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Wrench, 
  Truck, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  FileText,
  Activity
} from 'lucide-react';
import { cn } from '../../../utils/cn';

interface MaintenanceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
}

export const MaintenanceDetailsModal: React.FC<MaintenanceDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  record 
}) => {
  if (!isOpen || !record) return null;

  const isFault = record.status === 'FAULT_REPORT';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        {/* Header Banner */}
        <div className={cn(
          "h-32 p-8 relative overflow-hidden",
          isFault ? "bg-rose-500" : "bg-[#0f172a]"
        )}>
           <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
              {isFault ? <AlertTriangle size={160} className="text-white" /> : <Wrench size={160} className="text-white" />}
           </div>
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                 <div className="size-8 bg-white/20 rounded-xl flex items-center justify-center text-white border border-white/30 backdrop-blur-md">
                    {isFault ? <AlertTriangle size={14} /> : <Wrench size={14} />}
                 </div>
                 <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">
                    {isFault ? "Fault Report Audit" : "Service Record Details"}
                 </span>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight truncate">
                {record.taskName}
              </h2>
           </div>
        </div>

        {/* Content Matrix */}
        <div className="p-10">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                 <div className="flex gap-5">
                    <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                       <Truck size={22} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Vehicle Identity</p>
                       <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{record.plateNumber}</p>
                       <p className="text-[10px] font-bold text-slate-400 mt-0.5">{record.truck?.make || 'Fleet'} {record.truck?.model || 'Unit'}</p>
                    </div>
                 </div>

                 <div className="flex gap-5">
                    <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                       <Calendar size={22} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Logistics Date</p>
                       <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">
                        {new Date(record.serviceDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                       </p>
                    </div>
                 </div>

                 <div className="flex gap-5">
                    <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                       <User size={22} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Assignee / Technician</p>
                       <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{record.technician || 'Pending Assignment'}</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-8">
                 <div className="flex gap-5">
                    <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                       <Activity size={22} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Record Status</p>
                       <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          record.status === 'completed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          record.status === 'in-progress' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                          isFault ? "bg-rose-50 text-rose-600 border border-rose-100" :
                          "bg-slate-50 text-slate-600 border border-slate-100"
                        )}>
                          {record.status}
                       </span>
                    </div>
                 </div>

                 <div className="flex gap-5">
                    <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                       <Clock size={22} />
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Service Interval</p>
                       <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{record.nextServiceIn || 'N/A'}</p>
                    </div>
                 </div>

                 <div className="flex gap-5">
                    <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                       <FileText size={22} />
                    </div>
                    <div className="flex-1">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Operational Notes</p>
                       <p className="text-xs font-bold text-slate-500 leading-relaxed italic">
                         "{record.notes || 'No technical notes recorded for this mission.'}"
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="mt-12 flex gap-4">
              <button 
                onClick={onClose}
                className="px-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Close Audit
              </button>
              <button 
                className={cn(
                  "flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-[0.98]",
                  isFault ? "bg-rose-500 shadow-rose-200" : "bg-[#0f172a] shadow-slate-200"
                )}
              >
                Manage Record Lifecycle
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
};
