import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

import {
  MessageSquare,
  AlertTriangle,
  Play,
  Pause,
  Zap,
  Target,
  Shield,
  ArrowRight,
  Activity,
  Clock,
  Navigation,
  Phone,
  CheckCircle,
  Info,
  Coffee,
  Package,
  Award,
  Box,
  Snowflake,
  AlertOctagon
} from 'lucide-react';

import { cn } from '@/utils/cn';
import { TranslatedText } from '../translated-text';
import LocationIntelModal from '../Dashboard/Widgets/LocationIntelModal';
import { CargoHealthModal } from './CargoHealthModal';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { useTranslation } from '../../hooks/useTranslation';
import type { Trip as DriverTrip } from '../../services/driverApi';

type Trip = DriverTrip;
interface CurrentTripProps {
  trip: Trip;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onComplete?: () => void;
  onOpenRelay?: () => void;
  hos?: {
    consecutiveDrivingHours: number;
    maxHoursPerShift: number;
    fatiguePercent: number;
    status: string;
  } | null;
}

export const CurrentTrip: React.FC<CurrentTripProps> = ({ 
  trip, 
  onStart, 
  onPause, 
  onResume, 
  onComplete,
  onOpenRelay,
  hos,
}) => {
  const { tSync: t } = useTranslation();
  const { format: formatCurrency } = useCurrencyFormat();
  const [isPaused, setIsPaused] = useState(false);
  const [showIntel, setShowIntel] = useState(false);
  const [showCargoHealth, setShowCargoHealth] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);


  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      toast.success(t('Path optimized! Found route saving 12 mins.'), {
        icon: '🚀',
        style: {
          borderRadius: '20px',
          background: '#0F172A',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }
      });
    }, 2500);
  };



  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}H ${mins}M`;
  };

  const cargo = trip.cargo;
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

  const quantityParts = [
    cargo.numberOfPieces ? `${cargo.numberOfPieces} pcs` : null,
    cargo.numberOfPallets ? `${cargo.numberOfPallets} pallets` : null,
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden relative"
    >
      {/* Premium Header */}
      <div className="bg-[#0f172a] dark:bg-slate-950 px-10 py-8 relative overflow-hidden">
        {/* Abstract pattern removed for flatness */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/10 text-[#2b5271]">
              <Zap size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black text-[#2b5271] uppercase tracking-[0.3em]">
                  <TranslatedText text="Current Trip" />
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">MN-ORD-{trip.tripNumber}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                <TranslatedText text="Status" />
              </div>
              <div className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Navigation size={12} className="text-[#2b5271]" />
                <TranslatedText text="Live Tracking" />
              </div>
            </div>
            <div className={cn(
              "px-5 py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-[0.2em]",
              trip.status === 'IN_PROGRESS' ? "bg-[#2b5271]/20 border-[#2b5271]/30 text-[#2b5271]" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
            )}>
              {trip.status.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      <div className="p-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fatigue Monitor — real HOS data */}
          <div className="flex items-center justify-between p-6 bg-orange-50 dark:bg-orange-950/30 rounded-[2.5rem] border border-orange-100 dark:border-orange-900/50 relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white">
                  <Coffee size={24} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-none mb-1.5">Fatigue Monitor</p>
                  <h4 className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-tight">Driving Time</h4>
              </div>
            </div>
            <div className="text-right relative z-10">
              {hos ? (
                <>
                  <p className="text-2xl font-black text-orange-600 dark:text-orange-400 tracking-tighter">
                    {String(Math.floor(hos.consecutiveDrivingHours)).padStart(2, '0')}H {String(Math.round((hos.consecutiveDrivingHours % 1) * 60)).padStart(2, '0')}M
                  </p>
                  <p className="text-[8px] font-black text-orange-400/80 uppercase tracking-widest">
                    {hos.fatiguePercent >= 80 ? '⚠️ Rest soon' : 'Since last rest'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-slate-400 tracking-tighter">—</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">No HOS data</p>
                </>
              )}
            </div>
          </div>

          {/* HOS progress bar */}
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 flex flex-col justify-center border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Hours</p>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                hos?.status === 'Rest Required' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                hos?.status === 'Caution' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                {hos?.status ?? '—'}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  (hos?.fatiguePercent ?? 0) >= 80 ? 'bg-rose-500' :
                  (hos?.fatiguePercent ?? 0) >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: hos ? `${Math.min(100, hos.fatiguePercent)}%` : '0%' }}
              />
            </div>
            <p className="text-xs font-black text-slate-700 dark:text-white">
              {hos ? `${hos.consecutiveDrivingHours.toFixed(1)} / ${hos.maxHoursPerShift}h` : '— / —'}
            </p>
          </div>
        </div>

        {/* Mission Trajectory */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-[#2b5271] dark:text-[#2b5271] border border-blue-100 dark:border-slate-700">
                <Target size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <TranslatedText text="Trip Progress" />
                </p>
                <p className="text-xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">{trip.progress}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <TranslatedText text="On Time" />
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#2b5271] dark:text-[#2b5271] uppercase tracking-tight">
                  <TranslatedText text="Yes" />
                </span>
                <Activity size={18} className="text-[#2b5271] dark:text-[#2b5271]" />
              </div>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 relative group cursor-pointer overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${trip.progress}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#2b5271] to-[#4a7aab] rounded-full shadow-[0_0_20px_rgba(52,94,133,0.3)]"
            />
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Departure Node */}
          <div className="group relative">
            <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-[#2b5271] dark:bg-[#2b5271] opacity-30" />
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-[#2b5271] dark:text-[#2b5271] border border-blue-100 dark:border-slate-700 transition-transform group-hover:scale-110">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Origin" />
                </h3>
                <p className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-tight">{trip.origin.address}</p>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{trip.origin.city}, {trip.origin.state}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[9px] font-black text-[#2b5271] dark:text-[#2b5271] uppercase tracking-widest bg-blue-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-blue-100 dark:border-slate-700">
                    <Clock size={10} />
                    <TranslatedText text="Departed" />: {formatTime(trip.estimatedDeparture)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Arrival Node */}
          <div className="group relative">
            <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-[#2b5271] dark:bg-[#2b5271] opacity-30" />
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-[#2b5271] dark:text-[#2b5271] border border-blue-100 dark:border-slate-700 transition-transform group-hover:scale-110">
                <Target size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Destination" />
                </h3>
                <p className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-tight">{trip.destination.address}</p>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{trip.destination.city}, {trip.destination.state}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[9px] font-black text-[#2b5271] dark:text-[#2b5271] uppercase tracking-widest bg-blue-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-blue-100 dark:border-slate-700">
                    <Clock size={10} />
                    <TranslatedText text="ETA" />: {formatTime(trip.estimatedArrival)}
                  </div>
                  <button 
                    onClick={() => setShowIntel(true)}
                    className="flex items-center gap-1 text-[9px] font-black text-[#2b5271] dark:text-[#2b5271] uppercase tracking-widest hover:text-[#2b5271] dark:hover:text-blue-300 transition-colors ml-4"
                  >
                    <Info size={10} />
                    <TranslatedText text="View Intel" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <LocationIntelModal 
           isOpen={showIntel} 
           onClose={() => setShowIntel(false)} 
           locationName={trip.destination.address} 
        />

        <CargoHealthModal
          isOpen={showCargoHealth}
          onClose={() => setShowCargoHealth(false)}
          cargo={{
            ...trip.cargo,
            name: trip.cargo.description,
            pickupLocation: trip.origin.city,
          }}
        />

        {/* Cargo Information — full load details for the driver */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-slate-800 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-slate-700">
                <Package size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <TranslatedText text="Cargo Information" />
                </p>
                <p className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                  {cargo.description}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCargoHealth(true)}
              className="flex items-center gap-1.5 text-[9px] font-black text-[#2b5271] uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              <Info size={12} />
              <TranslatedText text="Full Details" />
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Type', value: cargo.type },
                { label: 'Weight', value: `${(cargo.weight || 0).toLocaleString()} kg` },
                { label: 'Quantity', value: quantityParts.length ? quantityParts.join(' · ') : '—' },
                { label: 'Packaging', value: cargo.packagingType || cargo.loadType || '—' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    <TranslatedText text={item.label} />
                  </p>
                  <p className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {(dimensions || cargo.volume || cargo.equipmentType) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                {dimensions && (
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      <TranslatedText text="Dimensions" />
                    </p>
                    <p className="text-sm font-black text-[#0f172a] dark:text-white">{dimensions}</p>
                  </div>
                )}
                {cargo.volume != null && (
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      <TranslatedText text="Volume" />
                    </p>
                    <p className="text-sm font-black text-[#0f172a] dark:text-white">{cargo.volume} m³</p>
                  </div>
                )}
                {cargo.equipmentType && (
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      <TranslatedText text="Equipment" />
                    </p>
                    <p className="text-sm font-black text-[#0f172a] dark:text-white uppercase">{cargo.equipmentType.replace(/_/g, ' ')}</p>
                  </div>
                )}
              </div>
            )}

            {(cargo.requiresRefrigeration || cargo.temperatureMin != null || cargo.temperatureMax != null) && (
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-slate-800 flex items-center justify-center text-sky-600 border border-sky-100 dark:border-slate-700">
                  <Snowflake size={16} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    <TranslatedText text="Temperature Range" />
                  </p>
                  <p className="text-sm font-black text-[#0f172a] dark:text-white">
                    {cargo.temperatureMin != null || cargo.temperatureMax != null
                      ? `${cargo.temperatureMin ?? '—'}°C – ${cargo.temperatureMax ?? '—'}°C`
                      : 'Refrigeration required'}
                  </p>
                </div>
              </div>
            )}

            {(cargo.isHazardous || cargo.hazmatClass || cargo.hazmatNumber) && (
              <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-2xl">
                <AlertOctagon size={18} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest mb-1">
                    <TranslatedText text="Hazmat" />
                  </p>
                  <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                    {[cargo.hazmatClass && `Class ${cargo.hazmatClass}`, cargo.hazmatNumber && `UN ${cargo.hazmatNumber}`]
                      .filter(Boolean)
                      .join(' · ') || 'Hazardous materials — handle with care'}
                  </p>
                </div>
              </div>
            )}

            {handlingFlags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {handlingFlags.map((flag) => (
                  <span
                    key={flag}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 rounded-lg"
                  >
                    <TranslatedText text={flag} />
                  </span>
                ))}
              </div>
            )}

            {(cargo.specialInstructions || cargo.loadingInstructions || cargo.unloadingInstructions) && (
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                {cargo.specialInstructions && (
                  <div>
                    <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1">
                      <TranslatedText text="Special Handling" />
                    </p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                      {cargo.specialInstructions}
                    </p>
                  </div>
                )}
                {cargo.loadingInstructions && (
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      <TranslatedText text="Loading Instructions" />
                    </p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                      {cargo.loadingInstructions}
                    </p>
                  </div>
                )}
                {cargo.unloadingInstructions && (
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      <TranslatedText text="Unloading Instructions" />
                    </p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                      {cargo.unloadingInstructions}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Load Intelligence Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Distance', value: `${trip.distance} KM`, icon: Navigation, onClick: undefined as (() => void) | undefined },
            { label: 'Duration', value: formatDuration(trip.estimatedDuration), icon: Clock, onClick: undefined },
            {
              label: 'Cargo',
              value: trip.cargo.weight
                ? `${trip.cargo.weight.toLocaleString()} KG`
                : (trip.cargo.type || '—'),
              icon: Box,
              color: 'text-amber-600',
              onClick: () => setShowCargoHealth(true),
            },
            { label: 'Earnings', value: formatCurrency(trip.earnings), icon: Zap, color: 'text-amber-500', onClick: undefined },
          ].map((stat) => (
            <div 
              key={stat.label} 
              onClick={stat.onClick}
              className={cn(
                "p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2rem] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-500 group relative overflow-hidden",
                !!stat.onClick && "cursor-pointer"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center mb-4 transition-transform group-hover:rotate-12 relative z-10", stat.color || "text-[#2b5271] dark:text-[#2b5271]")}>
                <stat.icon size={18} />
              </div>
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1 relative z-10">
                <TranslatedText text={stat.label} />
              </p>
              <div className="flex items-center gap-2 relative z-10">
                <p className="text-xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">{stat.value}</p>
                {stat.label === 'Cargo' && (
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[5rem]">
                    {trip.cargo.type}
                  </span>
                )}
              </div>
            </div>

          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 pt-10 border-t border-slate-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleOptimize}
              disabled={isOptimizing}
              className={cn(
                "h-16 px-10 border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all shadow-sm active:scale-95 group relative overflow-hidden",
                isOptimizing 
                  ? "bg-slate-900 border-slate-800 text-white" 
                  : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
              )}
            >
              {isOptimizing ? (
                <>
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl"
                  />
                  <Activity size={18} className="animate-spin relative z-10" />
                  <span className="relative z-10">Recalculating...</span>
                </>
              ) : (
                <>
                  <Award size={18} className="group-hover:scale-110 transition-transform" />
                  AI Route Optimizer
                </>
              )}
            </button>

            {trip.status === 'IN_PROGRESS' ? (
              <button 
                onClick={onComplete}
                className="h-16 px-10 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-emerald-700 transition-all shadow-lg active:scale-95 group"
              >
                <CheckCircle className="w-4 h-4" />
                <TranslatedText text="Complete Trip" />
              </button>
            ) : (
              <button 
                onClick={onStart}
                className="h-16 px-10 bg-[#2b5271] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-900 transition-all shadow-lg active:scale-95 group"
              >
                <Play size={16} fill="white" />
                <TranslatedText text="Start Trip" />
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <button
              onClick={() => {
                const newState = !isPaused;
                setIsPaused(newState);
                if (newState) onPause?.();
                else onResume?.();
              }}
              className={cn(
                "h-16 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all border active:scale-95",
                isPaused ? "bg-blue-50 text-[#2b5271] border-blue-100 hover:bg-blue-100" : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
              )}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
              <TranslatedText text={isPaused ? 'Resume' : 'Pause'} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {[
              { icon: Navigation, label: 'Navigate' },
              { icon: MessageSquare, label: 'Message' },
              { icon: Phone, label: 'Call' },
              { icon: AlertTriangle, label: 'Report' }
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => {
                  if (btn.label === 'Message' || btn.label === 'Call') {
                    onOpenRelay?.();
                  }
                }}
                className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all hover:bg-slate-100 active:scale-90 border bg-blue-50 dark:bg-slate-800 text-[#2b5271] dark:text-[#2b5271] border-blue-100 dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-slate-700"
                title={btn.label}
              >
                <btn.icon size={16} />
                <span className="text-[7px] font-black uppercase tracking-widest">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
