import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Truck, 
  FileCheck, 
  AlertCircle,
  X,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  category: 'VEHICLE' | 'SAFETY' | 'DOCUMENTS' | 'CARGO';
  required: boolean;
}

interface TripChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tripId: string;
}

export const TripChecklist: React.FC<TripChecklistProps> = ({ isOpen, onClose, onConfirm, tripId }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const checklistItems: ChecklistItem[] = [
    {
      id: '1',
      label: 'Vehicle Inspection',
      description: 'Checked tire pressure, oil levels, and lights.',
      category: 'VEHICLE',
      required: true
    },
    {
      id: '2',
      label: 'Fuel Level',
      description: 'Fuel tank is at least 75% full for the journey.',
      category: 'VEHICLE',
      required: true
    },
    {
      id: '3',
      label: 'Safety Equipment',
      description: 'Fire extinguisher, reflective vest, and triangular sign present.',
      category: 'SAFETY',
      required: true
    },
    {
      id: '4',
      label: 'Documentation',
      description: 'License, insurance, and transit permits are valid and on hand.',
      category: 'DOCUMENTS',
      required: true
    },
    {
      id: '5',
      label: 'Cargo Security',
      description: 'Cargo is properly secured and documentation signed.',
      category: 'CARGO',
      required: true
    }
  ];

  const handleToggle = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const allRequiredChecked = checklistItems
    .filter(item => item.required)
    .every(item => checkedItems.has(item.id));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'VEHICLE': return <Truck className="w-4 h-4" />;
      case 'SAFETY': return <AlertCircle className="w-4 h-4" />;
      case 'DOCUMENTS': return <FileCheck className="w-4 h-4" />;
      case 'CARGO': return <ClipboardCheck className="w-4 h-4" />;
      default: return <ClipboardCheck className="w-4 h-4" />;
    }
  };

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
        {/* Header */}
        <div className="bg-[#345E85] p-8 text-white relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Pre-Trip Checklist</h3>
              <p className="text-blue-100/70 text-[10px] font-black uppercase tracking-widest">Verification for Trip #{tripId.slice(0, 8)}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight leading-relaxed">
              All mandatory safety and vehicle checks must be completed before you can start this journey. 
              False information may lead to disciplinary action.
            </p>
          </div>

          <div className="space-y-4">
            {checklistItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
                  checkedItems.has(item.id) 
                    ? 'bg-blue-50/50 border-blue-200' 
                    : 'bg-white border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  checkedItems.has(item.id)
                    ? 'bg-primary-600 border-primary-600'
                    : 'bg-white border-slate-200 group-hover:border-slate-400'
                }`}>
                  {checkedItems.has(item.id) && <Check className="w-4 h-4 text-white" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1 px-1.5 rounded-md bg-slate-100 text-slate-500">
                      {getCategoryIcon(item.category)}
                    </span>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                      {item.label}
                      {item.required && <span className="text-rose-500 ml-1">*</span>}
                    </h4>
                  </div>
                  <p className="text-xs font-medium text-slate-500 pl-8">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
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
            className="flex-[2] h-14 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95"
          >
            Confirm & Start Journey
          </button>
        </div>
      </motion.div>
    </div>
  );
};
