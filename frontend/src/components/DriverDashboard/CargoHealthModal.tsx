import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Package,
  Box,
  Weight,
  Ruler,
  Snowflake,
  AlertOctagon,
  Info,
  Truck,
  ClipboardList,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { TranslatedText } from '../translated-text';

interface CargoHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  cargo: {
    name?: string;
    description?: string;
    pickupLocation?: string;
    weight?: number;
    type?: string;
    volume?: number;
    loadType?: string;
    equipmentType?: string;
    packagingType?: string;
    numberOfPieces?: number;
    numberOfPallets?: number;
    length?: number;
    width?: number;
    height?: number;
    isFragile?: boolean;
    isHazardous?: boolean;
    requiresRefrigeration?: boolean;
    requiresHumidityControl?: boolean;
    requiresForklift?: boolean;
    requiresCrane?: boolean;
    requiresLoadingDock?: boolean;
    isStackable?: boolean;
    temperatureMin?: number | null;
    temperatureMax?: number | null;
    requiresTemperatureMonitoring?: boolean;
    hazmatClass?: string;
    hazmatNumber?: string;
    specialInstructions?: string;
    loadingInstructions?: string;
    unloadingInstructions?: string;
    urgencyLevel?: string;
    isTimeCritical?: boolean;
  };
}

export const CargoHealthModal: React.FC<CargoHealthModalProps> = ({
  isOpen,
  onClose,
  cargo,
}) => {
  if (!isOpen || !cargo) return null;

  const title = cargo.name || cargo.description || 'Cargo';
  const handlingFlags = [
    cargo.isFragile && 'Fragile',
    cargo.isHazardous && 'Hazardous',
    cargo.requiresRefrigeration && 'Refrigerated',
    cargo.requiresHumidityControl && 'Humidity control',
    cargo.requiresForklift && 'Forklift required',
    cargo.requiresCrane && 'Crane required',
    cargo.requiresLoadingDock && 'Loading dock',
    cargo.isStackable && 'Stackable',
    cargo.isTimeCritical && 'Time critical',
  ].filter(Boolean) as string[];

  const dimensions =
    cargo.length || cargo.width || cargo.height
      ? [cargo.length, cargo.width, cargo.height]
          .map((v) => (v != null ? `${v}` : '—'))
          .join(' × ') + ' m'
      : null;

  const specs = [
    { label: 'Type', value: cargo.type || '—', icon: Box },
    {
      label: 'Weight',
      value: cargo.weight != null ? `${Number(cargo.weight).toLocaleString()} kg` : '—',
      icon: Weight,
    },
    {
      label: 'Pieces',
      value: cargo.numberOfPieces ? `${cargo.numberOfPieces}` : '—',
      icon: Package,
    },
    {
      label: 'Pallets',
      value: cargo.numberOfPallets ? `${cargo.numberOfPallets}` : '—',
      icon: Package,
    },
    {
      label: 'Dimensions',
      value: dimensions || '—',
      icon: Ruler,
    },
    {
      label: 'Volume',
      value: cargo.volume != null ? `${cargo.volume} m³` : '—',
      icon: Box,
    },
    {
      label: 'Packaging',
      value: cargo.packagingType || '—',
      icon: Package,
    },
    {
      label: 'Equipment',
      value: cargo.equipmentType ? cargo.equipmentType.replace(/_/g, ' ') : '—',
      icon: Truck,
    },
    {
      label: 'Load Type',
      value: cargo.loadType || '—',
      icon: Truck,
    },
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
        className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-[#0F172A] p-10 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-4 relative z-10 pr-14">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
              <Package size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">
                  <TranslatedText text="Load Manifest" />
                </p>
                {cargo.urgencyLevel && (
                  <div className="px-2 py-0.5 bg-white/10 text-white/80 text-[8px] font-black rounded uppercase border border-white/20">
                    {cargo.urgencyLevel}
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight line-clamp-2">{title}</h3>
              {cargo.pickupLocation && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  <TranslatedText text="Pickup" />: {cargo.pickupLocation}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6 bg-slate-50/30 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <spec.icon size={14} className="text-[#2b5271]" />
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    <TranslatedText text={spec.label} />
                  </p>
                </div>
                <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight break-words">
                  {spec.value}
                </p>
              </div>
            ))}
          </div>

          {(cargo.requiresRefrigeration ||
            cargo.temperatureMin != null ||
            cargo.temperatureMax != null ||
            cargo.requiresTemperatureMonitoring) && (
            <div className="p-5 rounded-2xl border border-sky-100 bg-sky-50 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
                <Snowflake size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black text-sky-700 uppercase tracking-widest mb-1">
                  <TranslatedText text="Temperature Requirements" />
                </p>
                <p className="text-sm font-black text-sky-900">
                  {cargo.temperatureMin != null || cargo.temperatureMax != null
                    ? `${cargo.temperatureMin ?? '—'}°C – ${cargo.temperatureMax ?? '—'}°C`
                    : 'Refrigeration required'}
                </p>
                {cargo.requiresTemperatureMonitoring && (
                  <p className="text-[10px] font-bold text-sky-600 mt-1 uppercase tracking-widest">
                    <TranslatedText text="Active temperature monitoring required" />
                  </p>
                )}
              </div>
            </div>
          )}

          {(cargo.isHazardous || cargo.hazmatClass || cargo.hazmatNumber) && (
            <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <AlertOctagon size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black text-rose-700 uppercase tracking-widest mb-1">
                  <TranslatedText text="Hazardous Materials" />
                </p>
                <p className="text-sm font-black text-rose-900">
                  {[
                    cargo.hazmatClass && `Class ${cargo.hazmatClass}`,
                    cargo.hazmatNumber && `UN ${cargo.hazmatNumber}`,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Hazmat cargo — follow safety protocol'}
                </p>
              </div>
            </div>
          )}

          {handlingFlags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert size={14} className="text-slate-400" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <TranslatedText text="Handling Flags" />
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {handlingFlags.map((flag) => (
                  <span
                    key={flag}
                    className={cn(
                      'px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl border',
                      flag === 'Hazardous' || flag === 'Fragile'
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : flag === 'Refrigerated' || flag === 'Humidity control'
                          ? 'bg-sky-50 text-sky-700 border-sky-100'
                          : 'bg-white text-slate-600 border-slate-200'
                    )}
                  >
                    <TranslatedText text={flag} />
                  </span>
                ))}
              </div>
            </div>
          )}

          {(cargo.specialInstructions ||
            cargo.loadingInstructions ||
            cargo.unloadingInstructions) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList size={14} className="text-slate-400" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <TranslatedText text="Instructions" />
                </p>
              </div>
              {cargo.specialInstructions && (
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                  <p className="text-[8px] font-black text-orange-600 uppercase tracking-widest mb-1">
                    <TranslatedText text="Special Handling" />
                  </p>
                  <p className="text-xs font-medium text-orange-900 leading-relaxed">
                    {cargo.specialInstructions}
                  </p>
                </div>
              )}
              {cargo.loadingInstructions && (
                <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    <TranslatedText text="Loading" />
                  </p>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">
                    {cargo.loadingInstructions}
                  </p>
                </div>
              )}
              {cargo.unloadingInstructions && (
                <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    <TranslatedText text="Unloading" />
                  </p>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">
                    {cargo.unloadingInstructions}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Info size={14} className="text-[#2b5271]" />
            <TranslatedText text="From load assignment" />
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
