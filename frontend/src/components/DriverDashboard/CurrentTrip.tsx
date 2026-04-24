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
  Thermometer,
  Award
} from 'lucide-react';

import { cn } from '@/utils/cn';
import { TranslatedText } from '../translated-text';
import LocationIntelModal from '../Dashboard/Widgets/LocationIntelModal';
import { CargoHealthModal } from './CargoHealthModal';

// removed useTranslation to fix lint error

interface Trip {
  id: string;
  tripNumber: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
  origin: {
    address: string;
    city: string;
    state: string;
    coordinates: [number, number];
  };
  destination: {
    address: string;
    city: string;
    state: string;
    coordinates: [number, number];
  };
  cargo: {
    description: string;
    weight: number;
    type: string;
    specialInstructions?: string;
  };
  estimatedDeparture: string;
  estimatedArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  distance: number;
  estimatedDuration: number;
  currentLocation?: [number, number];
  progress: number;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  truck: {
    id: string;
    plateNumber: string;
    model: string;
  };
  earnings: number;
  notes?: string;
}
interface CurrentTripProps {
  trip: Trip;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onComplete?: () => void;
  onOpenRelay?: () => void;
}

export const CurrentTrip: React.FC<CurrentTripProps> = ({ 
  trip, 
  onStart, 
  onPause, 
  onResume, 
  onComplete,
  onOpenRelay
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [showIntel, setShowIntel] = useState(false);
  const [showCargoHealth, setShowCargoHealth] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);


  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      toast.success('Path optimized! Found route saving 12 mins.', {
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
    >
      {/* Premium Header */}
      <div className="bg-[#0f172a] px-10 py-8 relative overflow-hidden">
        {/* Abstract pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/10 text-blue-400">
              <Zap size={28} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">
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
                <Navigation size={12} className="text-blue-400" />
                <TranslatedText text="Live Tracking" />
              </div>
            </div>
            <div className={cn(
              "px-5 py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-[0.2em]",
              trip.status === 'IN_PROGRESS' ? "bg-blue-500/20 border-blue-500/30 text-blue-400" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
            )}>
              {trip.status.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      <div className="p-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fatigue Monitor */}
          <div className="flex items-center justify-between p-6 bg-orange-50 rounded-[2.5rem] border border-orange-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-200">
                  <Coffee size={24} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mb-1.5">Fatigue Monitor</p>
                  <h4 className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Driving Time</h4>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-orange-600 tracking-tighter">03H 45M</p>
              <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Since last rest</p>
            </div>
          </div>

          {/* Road Intel */}
          <div className="bg-slate-900 rounded-[2.5rem] p-6 flex flex-col justify-center overflow-hidden relative border border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 mb-3 ml-2">
                  <Zap size={14} fill="currentColor" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Road Alerts</span>
              </div>
              <div className="relative h-6 overflow-hidden">
                <motion.div 
                    animate={{ x: [400, -800] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="flex gap-12 text-[11px] font-bold text-white uppercase tracking-wider whitespace-nowrap items-center h-full"
                >
                    <span>⚠️ Heavy traffic on Gulu-Kampala Highway</span>
                    <span>🏗️ Road works near Luwero - Expect delays</span>
                    <span>👮 Security Checkpoint at mile 45</span>
                </motion.div>
              </div>
          </div>
        </div>

        {/* Mission Trajectory */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100">
                <Target size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <TranslatedText text="Trip Progress" />
                </p>
                <p className="text-xl font-black text-[#0f172a] uppercase tracking-tight">{trip.progress}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <TranslatedText text="On Time" />
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-[#345E85] uppercase tracking-tight">
                  <TranslatedText text="Yes" />
                </span>
                <Activity size={18} className="text-[#345E85]" />
              </div>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 relative group cursor-pointer overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${trip.progress}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#345E85] to-[#4a7aab] rounded-full shadow-[0_0_20px_rgba(52,94,133,0.3)]"
            />
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Departure Node */}
          <div className="group relative">
            <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#345E85] to-transparent opacity-30" />
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100 transition-transform group-hover:scale-110">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Origin" />
                </h3>
                <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{trip.origin.address}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{trip.origin.city}, {trip.origin.state}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[9px] font-black text-[#345E85] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
                    <Clock size={10} />
                    <TranslatedText text="Departed" />: {formatTime(trip.estimatedDeparture)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Arrival Node */}
          <div className="group relative">
            <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#345E85] to-transparent opacity-30" />
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100 transition-transform group-hover:scale-110">
                <Target size={20} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <TranslatedText text="Destination" />
                </h3>
                <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{trip.destination.address}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{trip.destination.city}, {trip.destination.state}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[9px] font-black text-[#345E85] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
                    <Clock size={10} />
                    <TranslatedText text="ETA" />: {formatTime(trip.estimatedArrival)}
                  </div>
                  <button 
                    onClick={() => setShowIntel(true)}
                    className="flex items-center gap-1 text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-600 transition-colors"
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
            pickupLocation: trip.origin.city
          }}
        />


        {/* Load Intelligence Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Distance', value: `${trip.distance} KM`, icon: Navigation },
            { label: 'Duration', value: formatDuration(trip.estimatedDuration), icon: Clock },
            { label: 'Cargo Health', value: 'OPTIMAL', icon: Thermometer, color: 'text-emerald-500' },
            { label: 'Earnings', value: `$${trip.earnings}`, icon: Zap, color: 'text-amber-500' },
          ].map((stat) => (
            <div 
              key={stat.label} 
              onClick={() => {
                if (stat.label === 'Cargo Health') setShowCargoHealth(true);
              }}
              className={cn(
                "p-6 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group",
                stat.label === 'Cargo Health' && "cursor-pointer"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4 transition-transform group-hover:rotate-12", stat.color || "text-[#345E85]")}>
                <stat.icon size={18} />
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                <TranslatedText text={stat.label} />
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-black text-[#0f172a] uppercase tracking-tight">{stat.value}</p>
                {stat.label === 'Cargo Health' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                className="h-16 px-10 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-900 transition-all shadow-lg active:scale-95 group"
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
                isPaused ? "bg-blue-50 text-[#345E85] border-blue-100 hover:bg-blue-100" : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100"
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
                className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all hover:shadow-lg active:scale-90 border bg-blue-50 text-[#345E85] border-blue-100"
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
