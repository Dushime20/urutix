import React, { useState } from 'react';
import { motion } from 'framer-motion';

import {
  MessageSquare,
  AlertTriangle,
  Play,
  Pause,
  Zap,
  Target,
  Shield,
  ArrowRight,
  Clock,
  Navigation,
  Phone,
  CheckCircle,
  Info,
  Coffee,
  Package,
  Snowflake,
  AlertOctagon,
  Calendar,
  Truck,
} from 'lucide-react';

import { cn } from '@/utils/cn';
import { TranslatedText } from '../translated-text';
import LocationIntelModal from '../Dashboard/Widgets/LocationIntelModal';
import { CargoHealthModal } from './CargoHealthModal';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
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

function isValidDate(value?: string | null): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function formatDateTime(value?: string | null): string | null {
  if (!isValidDate(value)) return null;
  return new Date(value!).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(minutes: number): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}M`;
  if (mins <= 0) return `${hours}H`;
  return `${hours}H ${mins}M`;
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
  const { format: formatCurrency } = useCurrencyFormat();
  const [isPaused, setIsPaused] = useState(false);
  const [showIntel, setShowIntel] = useState(false);
  const [showCargoDetails, setShowCargoDetails] = useState(false);

  const cargo = trip.cargo;
  const startAt = trip.actualDeparture || trip.estimatedDeparture || trip.pickupTime || trip.scheduledDeparture;
  const endAt = trip.estimatedArrival || trip.deliveryTime;
  const startLabel = formatDateTime(startAt);
  const endLabel = formatDateTime(endAt);
  const durationLabel = formatDuration(trip.estimatedDuration);
  const hasDistance = Number(trip.distance) > 0;
  const hasEarnings = Number(trip.earnings) > 0;

  const showTemp =
    cargo.requiresRefrigeration ||
    cargo.requiresTemperatureMonitoring ||
    (cargo.temperatureMin != null && cargo.temperatureMin !== 0) ||
    (cargo.temperatureMax != null && cargo.temperatureMax !== 0);

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

  const cargoFacts = [
    cargo.type ? { label: 'Type', value: cargo.type } : null,
    cargo.weight > 0 ? { label: 'Weight', value: `${cargo.weight.toLocaleString()} kg` } : null,
    quantityParts.length ? { label: 'Quantity', value: quantityParts.join(' · ') } : null,
    cargo.packagingType ? { label: 'Packaging', value: cargo.packagingType } : null,
    cargo.loadType ? { label: 'Load Type', value: cargo.loadType } : null,
    cargo.equipmentType
      ? { label: 'Equipment', value: cargo.equipmentType.replace(/_/g, ' ') }
      : null,
    dimensions ? { label: 'Dimensions', value: dimensions } : null,
    cargo.volume != null && cargo.volume > 0
      ? { label: 'Volume', value: `${cargo.volume} m³` }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const summaryStats = [
    hasDistance
      ? { label: 'Distance', value: `${trip.distance} KM`, icon: Navigation }
      : null,
    durationLabel
      ? { label: 'Duration', value: durationLabel, icon: Clock }
      : null,
    startLabel
      ? { label: 'Start', value: startLabel, icon: Calendar }
      : null,
    endLabel
      ? { label: 'End', value: endLabel, icon: Calendar }
      : null,
    hasEarnings
      ? { label: 'Earnings', value: formatCurrency(trip.earnings), icon: Zap }
      : null,
    trip.truck?.plateNumber
      ? { label: 'Truck', value: trip.truck.plateNumber, icon: Truck }
      : null,
  ].filter(Boolean) as { label: string; value: string; icon: typeof Navigation }[];

  const onTimeLabel =
    trip.onTimePerformance === true
      ? 'Yes'
      : trip.onTimePerformance === false
        ? 'No'
        : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden relative"
    >
      <div className="bg-[#0f172a] dark:bg-slate-950 px-10 py-8 relative overflow-hidden">
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
                {trip.status === 'IN_PROGRESS' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                {trip.tripNumber}
              </h2>
            </div>
          </div>

          <div
            className={cn(
              'px-5 py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-[0.2em]',
              trip.status === 'IN_PROGRESS'
                ? 'bg-[#2b5271]/20 border-[#2b5271]/30 text-[#2b5271]'
                : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
            )}
          >
            {String(trip.status || '').replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      <div className="p-10 space-y-10">
        {hos && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-6 bg-orange-50 dark:bg-orange-950/30 rounded-[2.5rem] border border-orange-100 dark:border-orange-900/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white">
                  <Coffee size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-none mb-1.5">
                    <TranslatedText text="Fatigue Monitor" />
                  </p>
                  <h4 className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                    <TranslatedText text="Driving Time" />
                  </h4>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400 tracking-tighter">
                  {String(Math.floor(hos.consecutiveDrivingHours)).padStart(2, '0')}H{' '}
                  {String(Math.round((hos.consecutiveDrivingHours % 1) * 60)).padStart(2, '0')}M
                </p>
                <p className="text-[8px] font-black text-orange-400/80 uppercase tracking-widest">
                  {hos.fatiguePercent >= 80 ? 'Rest soon' : 'Since last rest'}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 flex flex-col justify-center border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <TranslatedText text="Shift Hours" />
                </p>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    hos.status === 'Rest Required'
                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                      : hos.status === 'Caution'
                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}
                >
                  {hos.status}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    hos.fatiguePercent >= 80
                      ? 'bg-rose-500'
                      : hos.fatiguePercent >= 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, hos.fatiguePercent)}%` }}
                />
              </div>
              <p className="text-xs font-black text-slate-700 dark:text-white">
                {hos.consecutiveDrivingHours.toFixed(1)} / {hos.maxHoursPerShift}h
              </p>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-[#2b5271] border border-blue-100 dark:border-slate-700">
                <Target size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <TranslatedText text="Trip Progress" />
                </p>
                <p className="text-xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                  {Number(trip.progress || 0)}%
                </p>
              </div>
            </div>
            {onTimeLabel && (
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <TranslatedText text="On Time" />
                </p>
                <span className="text-xl font-black text-[#2b5271] uppercase tracking-tight">
                  <TranslatedText text={onTimeLabel} />
                </span>
              </div>
            )}
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 relative overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Number(trip.progress || 0))}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#2b5271] to-[#4a7aab] rounded-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="group relative">
            <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-[#2b5271] opacity-30" />
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-[#2b5271] border border-blue-100 dark:border-slate-700">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Origin" />
                </h3>
                <p className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                  {trip.origin.address}
                </p>
                {(trip.origin.city || trip.origin.state) && (
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                    {[trip.origin.city, trip.origin.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {startLabel && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-black text-[#2b5271] uppercase tracking-widest bg-blue-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-blue-100 dark:border-slate-700">
                    <Calendar size={10} />
                    <TranslatedText text={trip.actualDeparture ? 'Departed' : 'Start'} />
                    : {startLabel}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-[#2b5271] opacity-30" />
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-[#2b5271] border border-blue-100 dark:border-slate-700">
                <Target size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Destination" />
                </h3>
                <p className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                  {trip.destination.address}
                </p>
                {(trip.destination.city || trip.destination.state) && (
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                    {[trip.destination.city, trip.destination.state].filter(Boolean).join(', ')}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                  {endLabel && (
                    <div className="inline-flex items-center gap-1.5 text-[9px] font-black text-[#2b5271] uppercase tracking-widest bg-blue-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-blue-100 dark:border-slate-700">
                      <Calendar size={10} />
                      <TranslatedText text="End" />: {endLabel}
                    </div>
                  )}
                  <button
                    onClick={() => setShowIntel(true)}
                    className="flex items-center gap-1 text-[9px] font-black text-[#2b5271] uppercase tracking-widest hover:opacity-80 transition-opacity"
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
          isOpen={showCargoDetails}
          onClose={() => setShowCargoDetails(false)}
          cargo={{
            ...trip.cargo,
            name: trip.cargo.description,
            pickupLocation: trip.origin.city,
          }}
        />

        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-slate-800 flex items-center justify-center text-amber-600 border border-amber-100 dark:border-slate-700">
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
              onClick={() => setShowCargoDetails(true)}
              className="flex items-center gap-1.5 text-[9px] font-black text-[#2b5271] uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              <Info size={12} />
              <TranslatedText text="Full Details" />
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 space-y-5">
            {cargoFacts.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cargoFacts.map((item) => (
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
            )}

            {showTemp && (
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
                    {[
                      cargo.hazmatClass && `Class ${cargo.hazmatClass}`,
                      cargo.hazmatNumber && `UN ${cargo.hazmatNumber}`,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Hazardous materials — handle with care'}
                  </p>
                </div>
              </div>
            )}

            {handlingFlags.length > 0 && (
              <div className="flex flex-wrap gap-2">
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

            {(cargo.specialInstructions ||
              cargo.loadingInstructions ||
              cargo.unloadingInstructions) && (
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

        {summaryStats.length > 0 && (
          <div
            className={cn(
              'grid gap-6',
              summaryStats.length === 1
                ? 'grid-cols-1'
                : summaryStats.length === 2
                  ? 'grid-cols-1 md:grid-cols-2'
                  : summaryStats.length === 3
                    ? 'grid-cols-1 md:grid-cols-3'
                    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
            )}
          >
            {summaryStats.map((stat) => (
              <div
                key={stat.label}
                className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2rem]"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-center mb-4 text-[#2b5271]">
                  <stat.icon size={18} />
                </div>
                <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">
                  <TranslatedText text={stat.label} />
                </p>
                <p className="text-base font-black text-[#0f172a] dark:text-white uppercase tracking-tight break-words">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-6 pt-10 border-t border-slate-50">
          <div className="flex items-center gap-4">
            {trip.status === 'IN_PROGRESS' ? (
              <button
                onClick={onComplete}
                className="h-16 px-10 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
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
                'h-16 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all border active:scale-95',
                isPaused
                  ? 'bg-blue-50 text-[#2b5271] border-blue-100 hover:bg-blue-100'
                  : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
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
              { icon: AlertTriangle, label: 'Report' },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => {
                  if (btn.label === 'Message' || btn.label === 'Call') {
                    onOpenRelay?.();
                  }
                }}
                className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-90 border bg-blue-50 dark:bg-slate-800 text-[#2b5271] border-blue-100 dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-slate-700"
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
