import React from 'react';
import { motion } from 'framer-motion';
import { X, Flag } from 'lucide-react';
import { PostTripChecklist } from './PostTripChecklist';

interface PostTripChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: { odometer: string; location: string }) => void;
  truckId?: string;
  truckPlate?: string;
  driverId?: string;
  driverName?: string;
}

export const PostTripChecklistModal: React.FC<PostTripChecklistModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  truckId,
  truckPlate,
  driverId,
  driverName,
}) => {
  if (!isOpen) return null;

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
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Overlay (Close button and Title) */}
        <div className="absolute top-8 right-8 z-[210]">
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all hover:rotate-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content - Scrolling Checklist */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           <PostTripChecklist
              onComplete={onComplete}
              truckId={truckId}
              truckPlate={truckPlate}
              driverId={driverId}
              driverName={driverName}
            />
        </div>

        {/* Footer info/close hint */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4">
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <Flag size={14} className="text-orange-500" />
                 Complete your debrief to close this active mission securely
             </div>
        </div>
      </motion.div>
    </div>
  );
};
