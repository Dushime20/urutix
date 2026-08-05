import React, { useState, useCallback } from 'react';
import {
  ClipboardCheck,
  Truck,
  FileCheck,
  AlertCircle,
  Check,
} from 'lucide-react';
import { TranslatedText } from '../translated-text';

export interface VehicleChecklistItem {
  id: string;
  label: string;
  description: string;
  category: 'VEHICLE' | 'SAFETY' | 'DOCUMENTS' | 'CARGO';
  required: boolean;
}

export const VEHICLE_CHECKLIST_ITEMS: VehicleChecklistItem[] = [
  {
    id: '1',
    label: 'Vehicle Inspection',
    description: 'Checked tire pressure, oil levels, brakes, and lights.',
    category: 'VEHICLE',
    required: true,
  },
  {
    id: '2',
    label: 'Fuel Level',
    description: 'Fuel tank is sufficient for the planned journey.',
    category: 'VEHICLE',
    required: true,
  },
  {
    id: '3',
    label: 'Safety Equipment',
    description: 'Fire extinguisher, reflective vest, and warning triangle present.',
    category: 'SAFETY',
    required: true,
  },
  {
    id: '4',
    label: 'Documentation',
    description: 'License, insurance, and transit permits are valid and on hand.',
    category: 'DOCUMENTS',
    required: true,
  },
  {
    id: '5',
    label: 'Load Securement Readiness',
    description: 'Straps, chains, and securing equipment are available and serviceable.',
    category: 'CARGO',
    required: true,
  },
];

interface VehiclePreTripChecklistProps {
  checkedItems: Set<string>;
  onToggle: (id: string) => void;
  compact?: boolean;
}

export function useVehicleChecklist() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allRequiredChecked = VEHICLE_CHECKLIST_ITEMS.filter((i) => i.required).every((i) =>
    checkedItems.has(i.id),
  );

  const reset = useCallback(() => setCheckedItems(new Set()), []);

  return { checkedItems, toggle, allRequiredChecked, reset };
}

const categoryIcon = (category: string) => {
  switch (category) {
    case 'VEHICLE':
      return <Truck className="w-4 h-4" />;
    case 'SAFETY':
      return <AlertCircle className="w-4 h-4" />;
    case 'DOCUMENTS':
      return <FileCheck className="w-4 h-4" />;
    default:
      return <ClipboardCheck className="w-4 h-4" />;
  }
};

export const VehiclePreTripChecklist: React.FC<VehiclePreTripChecklistProps> = ({
  checkedItems,
  onToggle,
  compact = false,
}) => (
  <div className={compact ? 'space-y-3' : 'space-y-4'}>
    {!compact && (
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-tight leading-relaxed">
          <TranslatedText text="Complete all mandatory vehicle and safety checks before proceeding to cargo inspection." />
        </p>
      </div>
    )}
    {VEHICLE_CHECKLIST_ITEMS.map((item) => (
      <button
        key={item.id}
        type="button"
        onClick={() => onToggle(item.id)}
        className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all ${
          checkedItems.has(item.id)
            ? 'bg-blue-50/50 border-blue-200'
            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'
        }`}
      >
        <div
          className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
            checkedItems.has(item.id)
              ? 'bg-[#345E85] border-[#345E85]'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
          }`}
        >
          {checkedItems.has(item.id) && <Check className="w-4 h-4 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 px-1.5 rounded-md bg-slate-100 text-slate-500">
              {categoryIcon(item.category)}
            </span>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
              <TranslatedText text={item.label} />
              {item.required && <span className="text-rose-500 ml-1">*</span>}
            </h4>
          </div>
          <p className="text-xs font-medium text-slate-500 pl-8"><TranslatedText text={item.description} /></p>
        </div>
      </button>
    ))}
  </div>
);
