import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Camera,
  MapPin,
  User,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface CargoInspectionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: any;
}

export const CargoInspectionReportModal: React.FC<CargoInspectionReportModalProps> = ({
  isOpen,
  onClose,
  inspection
}) => {
  if (!inspection) return null;

  const result = inspection.originalResult;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shadow-inner">
                  <Package size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Cargo Loading Report</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Report ID: {inspection.id}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status Card */}
                <div className="lg:col-span-1 space-y-6">
                  <div className={`p-6 rounded-3xl border ${
                    inspection.status === 'passed' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      {inspection.status === 'passed' ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
                      <span className="text-xs font-black uppercase tracking-widest">{inspection.status}</span>
                    </div>
                    <p className="text-2xl font-black tracking-tight mb-1">
                      {inspection.status === 'passed' ? 'Clear for Loading' : 'Inspection Failed'}
                    </p>
                    <p className="text-xs font-medium opacity-80">
                      Verified on {format(new Date(inspection.inspectionDate), 'MMM dd, HH:mm')}
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Info size={12} /> Personnel & Asset
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User size={14} className="text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Inspector</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{inspection.inspector}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin size={14} className="text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Registration</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{inspection.truckPlate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Results Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                      <FileText size={18} className="text-blue-500" />
                      Inspector Remarks
                    </h3>
                    <div className="p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm italic text-slate-600 dark:text-slate-400">
                      "{result?.notes || 'No specific remarks provided.'}"
                    </div>
                  </div>

                  {/* Issues Section */}
                  {result?.issues?.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                        <AlertTriangle size={18} className="text-rose-500" />
                        Identified Issues
                      </h3>
                      <div className="space-y-3">
                        {result.issues.map((issue: any, i: number) => (
                          <div key={i} className="p-4 bg-rose-50/30 dark:bg-rose-900/10 border border-rose-100/50 dark:border-rose-900/30 rounded-2xl flex items-start gap-3">
                            <div className="mt-1 w-2 h-2 rounded-full bg-rose-500" />
                            <div>
                               <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{issue.description}</p>
                               <div className="flex items-center gap-4 mt-2">
                                  <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-full">
                                    {issue.severity}
                                  </span>
                                  <span className="text-[9px] font-black uppercase text-slate-400">
                                    Location: {issue.location}
                                  </span>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photos Section */}
                  {result?.photos?.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                        <Camera size={18} className="text-blue-500" />
                        Visual Evidence
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {result.photos.map((photo: string, i: number) => (
                          <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm hover:ring-4 hover:ring-blue-100 transition-all cursor-zoom-in group">
                            <img src={photo} alt={`Evidence ${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {result?.recommendations?.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                        <CheckCircle size={18} className="text-emerald-500" />
                        Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-primary-500">
                    <ShieldCheck size={20} />
                 </div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Inspection verified & digitally signed
                 </p>
              </div>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-[#0f172a] dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-900/20 dark:shadow-none"
              >
                Close Report
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
