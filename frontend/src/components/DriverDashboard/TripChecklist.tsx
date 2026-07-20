import React from 'react';
import { ClipboardCheck, X } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  VehiclePreTripChecklist,
  useVehicleChecklist,
} from './VehiclePreTripChecklist';

interface TripChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tripId: string;
}

export const TripChecklist: React.FC<TripChecklistProps> = ({ isOpen, onClose, onConfirm, tripId }) => {
  const { checkedItems, toggle, allRequiredChecked } = useVehicleChecklist();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden"
      >
        <div className="bg-[#345E85] p-8 text-white relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Pre-Trip Checklist</h3>
              <p className="text-blue-100/70 text-[10px] font-black uppercase tracking-widest">
                Verification for Trip #{tripId.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <VehiclePreTripChecklist checkedItems={checkedItems} onToggle={toggle} />
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!allRequiredChecked}
            className="flex-[2] h-14 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            Confirm & Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
};
