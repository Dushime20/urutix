import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Route, 
  CheckCircle, 
  Calendar,
  ChevronRight,
  ArrowRight,
  Zap,
  Package
} from 'lucide-react';
import { driverApi } from '../../services/driverApi';
import toast from 'react-hot-toast';
import { CurrentTrip } from './CurrentTrip';
import { motion } from 'framer-motion';
import { TripChecklist } from './TripChecklist';
import { AnimatePresence } from 'framer-motion';

interface TripsManagementProps {
  driverId: string;
}

export const TripsManagement: React.FC<TripsManagementProps> = ({ driverId }) => {
  const queryClient = useQueryClient();
  const [selectedTripForChecklist, setSelectedTripForChecklist] = useState<string | null>(null);

  // Fetch current trip
  const { data: currentTrip, isLoading: currentLoading } = useQuery({
    queryKey: ['driver-current-trip', driverId],
    queryFn: () => driverApi.getCurrentTrip(driverId),
    enabled: !!driverId,
  });

  // Fetch upcoming trips
  const { data: upcomingTrips, isLoading: upcomingLoading } = useQuery({
    queryKey: ['driver-upcoming-trips', driverId],
    queryFn: () => driverApi.getUpcomingTrips(driverId),
    enabled: !!driverId,
  });

  // Fetch trip history
  const { data: tripHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['driver-trip-history', driverId],
    queryFn: () => driverApi.getTripHistory(driverId, 'all'),
    enabled: !!driverId,
  });

  const handleStartTrip = async (tripId: string) => {
    try {
      await driverApi.startTrip(tripId);
      toast.success('Trip started successfully!');
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
      queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips'] });
    } catch (error) {
      toast.error('Failed to start trip');
    }
  };

  const handleCompleteTrip = async (tripId: string) => {
    try {
      await driverApi.completeTrip(tripId);
      toast.success('Trip completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
      queryClient.invalidateQueries({ queryKey: ['driver-trip-history'] });
    } catch (error) {
      toast.error('Failed to complete trip');
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-blue-50 text-[#345E85] text-[10px] font-black uppercase tracking-[0.2em] rounded-lg">
            Movement
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {currentTrip ? '1 ACTIVE' : 'NO ACTIVE MISSION'}
          </span>
        </div>
        <h2 className="text-3xl font-black text-[#0f172a] uppercase tracking-tight">Trip Management</h2>
        <p className="text-slate-400 font-medium mt-1">Execute your assignments and monitor trip metrics in real-time</p>
      </div>

      {/* Active Trip Section */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Active Mission</h3>
        </div>
        
        {currentLoading ? (
          <div className="h-64 bg-slate-50 border border-slate-100 rounded-[3rem] animate-pulse" />
        ) : currentTrip ? (
          <CurrentTrip 
            trip={currentTrip as any} 
            onComplete={() => handleCompleteTrip(currentTrip.id)}
            onPause={() => driverApi.pauseTrip(currentTrip.id)}
            onResume={() => driverApi.resumeTrip(currentTrip.id)}
          />
        ) : (
          <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Zap className="text-slate-300" size={32} />
            </div>
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Active Trip</h4>
            <p className="text-sm font-medium text-slate-400 mt-1">Select an upcoming trip to begin your next assignment</p>
          </div>
        )}
      </section>

      {/* Upcoming Trips Section */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Upcoming Assignments</h3>
        </div>
        
        {upcomingLoading ? (
          <div className="grid gap-4">
            {[1, 2].map(i => <div key={i} className="h-32 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />)}
          </div>
        ) : upcomingTrips && upcomingTrips.length > 0 ? (
          <div className="grid gap-4">
            {upcomingTrips.map(trip => (
              <motion.div
                key={trip.id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-100 transition-all duration-300 group"
              >
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black text-[#345E85] uppercase tracking-widest">Mission ID</span>
                          <span className="px-2 py-0.5 bg-blue-50 text-[#345E85] text-[9px] font-black uppercase rounded">ORD-{trip.tripNumber}</span>
                        </div>
                        <p className="text-xl font-black text-[#0f172a] uppercase tracking-tight">{trip.origin.city} to {trip.destination.city}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                          <Calendar size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Scheduled</span>
                        </div>
                        <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{new Date(trip.scheduledDeparture).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                          <Route size={16} />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Distance</p>
                          <p className="text-xs font-black text-slate-700 uppercase">{trip.distance} KM</p>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-slate-200 hidden md:block" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                          <Package size={16} />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cargo Weight</p>
                          <p className="text-xs font-black text-slate-700 uppercase">{trip.cargo.weight} KG</p>
                        </div>
                      </div>
                      <div className="w-px h-8 bg-slate-200 hidden md:block" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                          <Zap size={16} />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Earnings</p>
                          <p className="text-xs font-black text-emerald-700 uppercase">${trip.earnings}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-48 lg:border-l lg:border-slate-50 lg:pl-8 flex flex-row lg:flex-col justify-end lg:justify-center gap-3">
                    <button 
                      onClick={() => setSelectedTripForChecklist(trip.id)}
                      className="flex-1 px-6 py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-lg group/btn active:scale-95"
                    >
                      Start
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="px-5 py-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 italic">No upcoming trips assigned</div>
        )}
      </section>

      {/* History Section */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Previous Missions</h3>
        </div>
        
        {historyLoading ? (
           <div className="grid gap-4">
             {[1, 2].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />)}
           </div>
        ) : tripHistory && tripHistory.length > 0 ? (
          <div className="space-y-4">
            {tripHistory.map(trip => (
              <div key={trip.id} className="bg-white rounded-[1.5rem] p-6 border border-slate-100 hover:border-blue-100 transition-all group">
                <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-6">
                  <div className="col-span-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500" />
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Completed</span>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Route</p>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{trip.origin.city}</span>
                      <ArrowRight size={14} className="text-slate-300" />
                      <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{trip.destination.city}</span>
                    </div>
                  </div>

                  <div className="col-span-1 text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{new Date(trip.actualArrival || trip.estimatedArrival).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 italic">No trip history yet</div>
        )}
      </section>

      {/* Pre-Trip Checklist Modal */}
      <AnimatePresence>
        {selectedTripForChecklist && (
          <TripChecklist 
            isOpen={true}
            tripId={selectedTripForChecklist}
            onClose={() => setSelectedTripForChecklist(null)}
            onConfirm={() => {
              handleStartTrip(selectedTripForChecklist);
              setSelectedTripForChecklist(null);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
