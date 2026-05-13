import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Package,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface Trip {
  id: string;
  tripNumber: string;
  status: 'SCHEDULED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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
  scheduledDeparture: string;
  estimatedArrival: string;
  pickupTime?: string;
  deliveryTime?: string;
  distance: number;
  estimatedDuration: number;
  cargo: {
    description: string;
    weight: number;
    type: string;
    specialInstructions?: string;
  };
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  earnings: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes?: string;
}

interface UpcomingTripsProps {
  trips?: Trip[];
  loading?: boolean;
}

export const UpcomingTrips: React.FC<UpcomingTripsProps> = ({ trips, loading }) => {
  const [showAll, setShowAll] = useState(false);

  const currentTrips = trips || [];
  const displayedTrips = showAll ? currentTrips : currentTrips.slice(0, 2);

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'HIGH': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 animate-pulse h-[400px]" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden"
    >

      <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-[#345E85] shadow-sm">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Upcoming Trips</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Schedule</p>
          </div>
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
        >
          {showAll ? 'Collapse' : `View All (${currentTrips.length})`}
        </button>
      </div>


      <div className="divide-y divide-slate-50">
        <AnimatePresence mode="popLayout">
          {displayedTrips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 sm:p-10 hover:bg-slate-50/50 transition-all group"
            >

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex-1 space-y-8">
                  {/* Header Info */}
                  <div className="flex items-center gap-4">
                    <span className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", getPriorityColor(trip.priority))}>
                      {trip.priority} Priority
                    </span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Trip ID: {trip.tripNumber}</span>
                  </div>

                  {/* Node Trajectory */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="flex gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#345E85] mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Pickup</p>
                        <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{trip.origin.address}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          {(trip.pickupTime || trip.scheduledDeparture) ? formatDateTime(trip.pickupTime || trip.scheduledDeparture) : 'TBD'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Delivery</p>
                        <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{trip.destination.address}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          {(trip.deliveryTime || trip.estimatedArrival) ? formatDateTime(trip.deliveryTime || trip.estimatedArrival) : 'TBD'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats Matrix */}
                  <div className="flex flex-wrap gap-8 items-center border-t border-slate-50 pt-8 mt-auto">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-[#345E85]" />
                      <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">{trip.distance ? Math.round(trip.distance) : '—'} KM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-[#345E85]" />
                      <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">{trip.cargo.weight.toLocaleString()} KG</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button className="h-16 px-10 bg-white border border-slate-100 text-[#345E85] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                    View Details
                  </button>
                  <button className="h-16 w-16 bg-[#345E85] text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg active:scale-95 group/btn">
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!currentTrips.length && (
        <div className="p-20 text-center">
          <Calendar className="w-20 h-20 text-slate-100 mx-auto mb-6" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No Upcoming Trips</p>
        </div>
      )}
    </motion.div>
  );
};
