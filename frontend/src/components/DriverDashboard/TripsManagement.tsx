import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Route, 
  CheckCircle, 
  Calendar,
  ArrowRight,
  Zap,
  Package,
  ShieldCheck,
  MapPin,
  Clock,
  Truck,
  DollarSign,
  Navigation,
  Activity,
  AlertCircle,
  Eye,
  X,
  ChevronRight,
  User,
  Phone,
  Mail,
  FileText,
  Info,
  Hash
} from 'lucide-react';
import { driverApi } from '../../services/driverApi';
import toast from 'react-hot-toast';
import { CurrentTrip } from './CurrentTrip';
import { motion } from 'framer-motion';
import { TripChecklist } from './TripChecklist';
import { TripStartFlow } from './TripStartFlow';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { getApiErrorMessage } from '../../config/errorMessages';
import { ProofOfDelivery } from './ProofOfDelivery';
import {
  getInspectionStatusLabel,
  getInspectionStatusStyles,
  getPreTripStatusFromLoad,
} from './preTripInspection';
import type { Trip } from '../../services/driverApi';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface TripsManagementProps {
  driverId: string;
}

export const TripsManagement: React.FC<TripsManagementProps> = ({ driverId }) => {
  const { tSync: t } = useTranslation();
  const queryClient = useQueryClient();
  const { format: formatCurrency } = useCurrencyFormat();
  const [selectedTripForChecklist, setSelectedTripForChecklist] = useState<string | null>(null);
  const [selectedTripForStart, setSelectedTripForStart] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'previous'>('active');
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [selectedTripDetail, setSelectedTripDetail] = useState<string | null>(null);
  const [epodTrip, setEpodTrip] = useState<{ id: string; tripNumber?: string; cargoTitle?: string } | null>(null);

  // Fetch driver profile to get currentTruckId
  const { data: driverProfile } = useQuery({
    queryKey: ['driver-profile', driverId],
    queryFn: () => driverApi.getDriverProfile(driverId),
    enabled: !!driverId,
  });

  // Fetch the truck assigned to this driver
  const { data: assignedTruck, isLoading: truckLoading } = useQuery({
    queryKey: ['driver-assigned-truck', driverProfile?.currentTruckId],
    queryFn: () => driverApi.getAssignedTruck(driverProfile!.currentTruckId!),
    enabled: !!driverProfile?.currentTruckId,
  });

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

  // Pre-trip inspection status for upcoming trip cards
  const { data: preTripLoads } = useQuery({
    queryKey: ['driver-pre-trip-inspections', driverId],
    queryFn: () => driverApi.getPreTripInspectionLoads(driverId),
    enabled: !!driverId,
  });

  const getLoadInspectionStatus = (loadId?: string) => {
    if (!loadId || !preTripLoads) return 'PENDING';
    const load = preTripLoads.find((l: any) => l.id === loadId);
    return getPreTripStatusFromLoad(load || {});
  };

  const handleStartTrip = async (tripId: string) => {
    try {
      await driverApi.startTrip(tripId);
      toast.success(t('Trip started successfully!'));
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
      queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips'] });
    } catch (error: any) {
      toast.error(t(getApiErrorMessage(error)));
    }
  };

  const handleCompleteTrip = (trip: { id: string; tripNumber?: string; cargo?: { description?: string } }) => {
    setEpodTrip({
      id: trip.id,
      tripNumber: trip.tripNumber,
      cargoTitle: trip.cargo?.description,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-blue-50 text-[#345E85] text-[10px] font-black uppercase tracking-[0.2em] rounded-lg">
            <TranslatedText text="Movement" />
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {currentTrip ? <TranslatedText text="1 ACTIVE" /> : <TranslatedText text="NO ACTIVE MISSION" />}
          </span>
        </div>
        <h2 className="text-3xl font-black text-[#0f172a] uppercase tracking-tight"><TranslatedText text="Trip Management" /></h2>
        <p className="text-slate-400 font-medium mt-1 mb-8"><TranslatedText text="Execute your assignments and monitor trip metrics in real-time" /></p>
        
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/60 shadow-inner">
          <button 
            onClick={() => setActiveTab('active')} 
            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'active' ? 'bg-white text-[#345E85] shadow-md shadow-slate-200/50 border border-slate-200/50 scale-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95 hover:scale-100'}`}
          >
            <TranslatedText text="Active Mission" />
          </button>
          <button 
            onClick={() => setActiveTab('upcoming')} 
            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'upcoming' ? 'bg-white text-[#345E85] shadow-md shadow-slate-200/50 border border-slate-200/50 scale-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95 hover:scale-100'}`}
          >
            <TranslatedText text="Upcoming Assignments" />
          </button>
          <button 
            onClick={() => setActiveTab('previous')} 
            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === 'previous' ? 'bg-white text-[#345E85] shadow-md shadow-slate-200/50 border border-slate-200/50 scale-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95 hover:scale-100'}`}
          >
            <TranslatedText text="Previous Missions" />
          </button>
        </div>
      </div>

      {/* Assigned Truck Banner */}
      {truckLoading && driverProfile?.currentTruckId ? (
        <div className="h-16 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
      ) : assignedTruck ? (
        <div className="flex items-center gap-4 px-5 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#345E85]/10 flex items-center justify-center shrink-0">
            <Truck size={18} className="text-[#345E85]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5"><TranslatedText text="Your Assigned Vehicle" /></p>
            <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight truncate">
              {[assignedTruck.make, assignedTruck.model].filter(Boolean).join(' ') || 'Vehicle'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><TranslatedText text="Plate" /></p>
              <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{assignedTruck.plateNumber}</p>
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
              assignedTruck.status === 'AVAILABLE' || assignedTruck.status === 'IN_USE'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
              <TranslatedText text={assignedTruck.status?.replace('_', ' ') || 'Active'} />
            </div>
          </div>
        </div>
      ) : driverProfile && !driverProfile.currentTruckId ? (
        <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <AlertCircle size={16} className="text-amber-500 shrink-0" />
          <p className="text-xs font-bold text-amber-700"><TranslatedText text="No truck has been assigned to you yet. Contact your fleet manager." /></p>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {/* Active Trip Section */}
        {activeTab === 'active' && (
          <motion.section
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {currentLoading ? (
              <div className="h-32 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
            ) : currentTrip && currentTrip.status === 'IN_PROGRESS' ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-between px-5 py-3 bg-[#0f172a]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest"><TranslatedText text="In Progress" /></span>
                    <span className="text-slate-600 mx-1">·</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">#{currentTrip.tripNumber}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{currentTrip.progress}% <TranslatedText text="complete" /></span>
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-slate-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${currentTrip.progress}%` }}
                    transition={{ duration: 1, ease: 'circOut' }}
                    className="h-full bg-emerald-500"
                  />
                </div>

                {/* Main content */}
                <div className="p-5">
                  {/* Route */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><TranslatedText text="From" /></p>
                      <p className="text-sm font-black text-[#0f172a] uppercase truncate">{currentTrip.origin.city}</p>
                      <p className="text-[9px] text-slate-400 truncate">{currentTrip.origin.address}</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 shrink-0" />
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><TranslatedText text="To" /></p>
                      <p className="text-sm font-black text-[#0f172a] uppercase truncate">{currentTrip.destination.city}</p>
                      <p className="text-[9px] text-slate-400 truncate">{currentTrip.destination.address}</p>
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { label: 'Distance', value: `${currentTrip.distance} km`, icon: Navigation },
                      { label: 'ETA', value: currentTrip.estimatedArrival ? new Date(currentTrip.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBD', icon: Clock },
                      { label: 'Cargo', value: `${currentTrip.cargo.weight.toLocaleString()} kg`, icon: Package },
                      { label: 'Earnings', value: formatCurrency(currentTrip.earnings), icon: DollarSign },
                    ].map(m => (
                      <div key={m.label} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <div className="flex items-center gap-1 mb-1">
                          <m.icon size={10} className="text-slate-400" />
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text={m.label} /></p>
                        </div>
                        <p className="text-xs font-black text-slate-800 truncate">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Cargo description */}
                  {currentTrip.cargo.description && currentTrip.cargo.description !== 'N/A' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                      <Package size={12} className="text-slate-400 shrink-0" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate">{currentTrip.cargo.description}</span>
                      {currentTrip.cargo.type && currentTrip.cargo.type !== 'General' && (
                        <span className="ml-auto px-2 py-0.5 bg-blue-50 text-[#345E85] border border-blue-100 rounded text-[8px] font-black uppercase shrink-0">{currentTrip.cargo.type}</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCompleteTrip(currentTrip)}
                      className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle size={13} />
                      <TranslatedText text="Complete" />
                    </button>
                    <button
                      onClick={() => setExpandedTripId(expandedTripId === currentTrip.id ? null : currentTrip.id)}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Activity size={13} />
                      {expandedTripId === currentTrip.id ? t('Less') : t('Details')}
                    </button>
                  </div>
                </div>

                {/* Expandable full detail */}
                <AnimatePresence>
                  {expandedTripId === currentTrip.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <div className="p-5">
                        <CurrentTrip
                          trip={currentTrip as any}
                          onComplete={() => handleCompleteTrip(currentTrip.id)}
                          onPause={() => driverApi.pauseTrip(currentTrip.id)}
                          onResume={() => driverApi.resumeTrip(currentTrip.id)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-12 px-6 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-100">
                  <Route size={22} className="text-slate-300" />
                </div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1"><TranslatedText text="No Active Trip" /></h4>
                <p className="text-xs text-slate-400 mb-4"><TranslatedText text="No trip is currently in progress." /></p>
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className="px-5 py-2.5 bg-[#345E85] text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#2a4d6d] transition-all active:scale-95 inline-flex items-center gap-1.5"
                >
                  <Calendar size={12} />
                  <TranslatedText text="View Upcoming" />
                </button>
              </div>
            )}
          </motion.section>
        )}

        {/* Upcoming Trips Section */}
        {activeTab === 'upcoming' && (
          <motion.section
            key="upcoming"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]"><TranslatedText text="Upcoming Assignments" /></h3>
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
                              <span className="text-[9px] font-black uppercase tracking-widest"><TranslatedText text="Mission ID" /></span>
                              <span className="px-2 py-0.5 bg-blue-50 text-[#345E85] text-[9px] font-black uppercase rounded">ORD-{trip.tripNumber}</span>
                              {trip.loadId && (
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getInspectionStatusStyles(getLoadInspectionStatus(trip.loadId))}`}>
                                  {getInspectionStatusLabel(getLoadInspectionStatus(trip.loadId))}
                                </span>
                              )}
                            </div>
                            <p className="text-xl font-black text-[#0f172a] uppercase tracking-tight">{trip.origin.city} to {trip.destination.city}</p>
                          </div>
                          <div className="text-right space-y-2">
                            <div>
                              <div className="flex items-center gap-2 text-slate-400 mb-0.5 justify-end">
                                <Calendar size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest"><TranslatedText text="Pickup" /></span>
                              </div>
                              <p className="text-xs font-black text-[#0f172a] uppercase tracking-tight">
                                {(trip as any).pickupTime || trip.scheduledDeparture
                                  ? new Date((trip as any).pickupTime || trip.scheduledDeparture).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
                                  : 'TBD'}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 text-emerald-500 mb-0.5 justify-end">
                                <Calendar size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest"><TranslatedText text="Delivery" /></span>
                              </div>
                              <p className="text-xs font-black text-[#0f172a] uppercase tracking-tight">
                                {(trip as any).deliveryTime || trip.estimatedArrival
                                  ? new Date((trip as any).deliveryTime || trip.estimatedArrival).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
                                  : 'TBD'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                              <Route size={16} />
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Distance" /></p>
                              <p className="text-xs font-black text-slate-700 uppercase">{trip.distance} KM</p>
                            </div>
                          </div>
                          <div className="w-px h-8 bg-slate-200 hidden md:block" />
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                              <Package size={16} />
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Cargo Weight" /></p>
                              <p className="text-xs font-black text-slate-700 uppercase">{trip.cargo.weight} KG</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-48 lg:border-l lg:border-slate-50 lg:pl-8 flex flex-row lg:flex-col justify-end lg:justify-center gap-3">
                        <button 
                          onClick={() => setSelectedTripForStart(trip)}
                          className="flex-1 px-6 py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-lg group/btn active:scale-95"
                        >
                          <TranslatedText text="Start Trip" />
                          <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                        <button
                          onClick={() => setSelectedTripDetail(trip.id)}
                          className="px-5 py-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-blue-50 hover:text-[#345E85] hover:border-blue-100 border border-transparent transition-all"
                          title={t('View trip details')}
                        >
                          <Eye size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                  <Calendar className="text-slate-300" size={32} />
                </div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight"><TranslatedText text="No Upcoming Assignments" /></h4>
                <p className="text-sm font-medium text-slate-400 mt-1"><TranslatedText text="You currently have no scheduled trips in the queue." /></p>
              </div>
            )}
          </motion.section>
        )}

        {/* History Section */}
        {activeTab === 'previous' && (
          <motion.section
            key="previous"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]"><TranslatedText text="Previous Missions" /></h3>
            </div>
            
            {historyLoading ? (
               <div className="grid gap-4">
                 {[1, 2].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />)}
               </div>
            ) : tripHistory && tripHistory.length > 0 ? (
              <div className="space-y-4">
                {tripHistory.map(trip => (
                  <div key={trip.id} className="bg-white rounded-[1.5rem] p-6 border border-slate-100 hover:border-blue-100 hover:shadow-md transition-all group">
                    <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-6">
                      <div className="col-span-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><TranslatedText text="Status" /></p>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={14} className="text-emerald-500" />
                          <span className="text-xs font-black text-emerald-600 uppercase tracking-widest"><TranslatedText text="Completed" /></span>
                          {trip.pod && (
                            <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                              <ShieldCheck size={8} />
                              <TranslatedText text="POD SECURED" />
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><TranslatedText text="Route" /></p>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{trip.origin.city}</span>
                          <ArrowRight size={14} className="text-slate-300" />
                          <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{trip.destination.city}</span>
                        </div>
                      </div>

                      <div className="col-span-1 text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><TranslatedText text="Date" /></p>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{new Date(trip.actualArrival || trip.estimatedArrival).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                  <CheckCircle className="text-slate-300" size={32} />
                </div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight"><TranslatedText text="No Trip History" /></h4>
                <p className="text-sm font-medium text-slate-400 mt-1"><TranslatedText text="Completed missions will appear here." /></p>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Trip Start Flow — Vehicle Check → Cargo Inspection → Launch */}
      <AnimatePresence>
        {selectedTripForStart && (
          <TripStartFlow
            trip={selectedTripForStart}
            driverId={driverId}
            isOpen={true}
            onClose={() => setSelectedTripForStart(null)}
            onTripStarted={() => {
              queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
              queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips'] });
              queryClient.invalidateQueries({ queryKey: ['driver-pre-trip-inspections'] });
            }}
          />
        )}
      </AnimatePresence>

      {/* Legacy standalone checklist (kept for other entry points) */}
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

      {/* Trip Detail Modal */}
      <AnimatePresence>
        {selectedTripDetail && (() => {
          const trip = upcomingTrips?.find(t => t.id === selectedTripDetail);
          if (!trip) return null;

          const priorityColors: Record<string, string> = {
            URGENT: 'bg-red-50 text-red-600 border-red-100',
            HIGH:   'bg-orange-50 text-orange-600 border-orange-100',
            MEDIUM: 'bg-blue-50 text-[#345E85] border-blue-100',
            LOW:    'bg-slate-50 text-slate-500 border-slate-200',
          };
          const priority = (trip as any).priority || 'MEDIUM';

          return (
            <motion.div
              key="trip-detail-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setSelectedTripDetail(null)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

              {/* Panel */}
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#0f172a] rounded-t-[2rem] px-8 py-6 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Mission ID" /></span>
                      <span className="px-2 py-0.5 bg-[#345E85]/30 text-blue-300 text-[9px] font-black uppercase rounded">
                        ORD-{trip.tripNumber}
                      </span>
                      <span className={cn('px-2 py-0.5 text-[8px] font-black uppercase rounded border', priorityColors[priority])}>
                        {priority}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                      {trip.origin.city} → {trip.destination.city}
                    </h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                      {trip.status}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTripDetail(null)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-8 space-y-8">

                  {/* Route Details */}
                  <section>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4"><TranslatedText text="Route Details" /></p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Pickup */}
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-[#345E85] flex items-center justify-center">
                            <MapPin size={13} className="text-white" />
                          </div>
                          <span className="text-[9px] font-black text-[#345E85] uppercase tracking-widest"><TranslatedText text="Pickup" /></span>
                        </div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{trip.origin.city}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{trip.origin.address}</p>
                        {trip.origin.state && (
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{trip.origin.state}</p>
                        )}
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock size={11} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              {(trip as any).pickupTime || trip.scheduledDeparture
                                ? new Date((trip as any).pickupTime || trip.scheduledDeparture).toLocaleString('en-US', {
                                    weekday: 'short', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit', hour12: true,
                                  })
                                : 'TBD'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery */}
                      <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
                            <MapPin size={13} className="text-white" />
                          </div>
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest"><TranslatedText text="Delivery" /></span>
                        </div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{trip.destination.city}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{trip.destination.address}</p>
                        {trip.destination.state && (
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{trip.destination.state}</p>
                        )}
                        <div className="mt-3 pt-3 border-t border-emerald-200/60">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock size={11} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              {(trip as any).deliveryTime || trip.estimatedArrival
                                ? new Date((trip as any).deliveryTime || trip.estimatedArrival).toLocaleString('en-US', {
                                    weekday: 'short', month: 'short', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit', hour12: true,
                                  })
                                : 'TBD'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Trip Metrics */}
                  <section>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4"><TranslatedText text="Trip Metrics" /></p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Distance', value: `${trip.distance} km`, icon: Navigation, color: 'text-blue-500' },
                        { label: 'Est. Duration', value: trip.estimatedDuration ? `${Math.floor(trip.estimatedDuration / 60)}h ${trip.estimatedDuration % 60}m` : 'TBD', icon: Clock, color: 'text-orange-500' },
                        { label: 'Earnings', value: formatCurrency(trip.earnings), icon: DollarSign, color: 'text-emerald-500' },
                        { label: 'Cargo Weight', value: `${trip.cargo.weight.toLocaleString()} kg`, icon: Package, color: 'text-purple-500' },
                      ].map(m => (
                        <div key={m.label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                          <m.icon size={18} className={cn('mx-auto mb-2', m.color)} />
                          <p className="text-xs font-black text-slate-800">{m.value}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5"><TranslatedText text={m.label} /></p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Cargo Info */}
                  <section>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4"><TranslatedText text="Cargo Information" /></p>
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><TranslatedText text="Description" /></p>
                          <p className="text-sm font-bold text-slate-800">{trip.cargo.description}</p>
                        </div>
                        <span className="shrink-0 px-3 py-1 bg-white border border-slate-200 text-slate-600 text-[9px] font-black uppercase rounded-lg">
                          {trip.cargo.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><TranslatedText text="Weight" /></p>
                          <p className="text-sm font-black text-slate-800">{trip.cargo.weight.toLocaleString()} kg</p>
                        </div>
                        {trip.cargo.specialInstructions && (
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><TranslatedText text="Special Instructions" /></p>
                            <p className="text-xs font-medium text-orange-600">{trip.cargo.specialInstructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Customer Info */}
                  {trip.customer.name && trip.customer.name !== 'N/A' && (
                    <section>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4"><TranslatedText text="Customer" /></p>
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-[#345E85]/10 flex items-center justify-center">
                            <User size={18} className="text-[#345E85]" />
                          </div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{trip.customer.name}</p>
                        </div>
                        <div className="space-y-2">
                          {trip.customer.phone && (
                            <div className="flex items-center gap-3">
                              <Phone size={13} className="text-slate-400 shrink-0" />
                              <span className="text-xs font-medium text-slate-600">{trip.customer.phone}</span>
                            </div>
                          )}
                          {trip.customer.email && (
                            <div className="flex items-center gap-3">
                              <Mail size={13} className="text-slate-400 shrink-0" />
                              <span className="text-xs font-medium text-slate-600">{trip.customer.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Truck Info */}
                  {(trip.truck.plateNumber || trip.truck.model) && (
                    <section>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4"><TranslatedText text="Assigned Vehicle" /></p>
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
                          <Truck size={18} className="text-slate-500" />
                        </div>
                        <div>
                          {trip.truck.model && <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{trip.truck.model}</p>}
                          {trip.truck.plateNumber && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <Hash size={11} className="text-slate-400" />
                              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{trip.truck.plateNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Notes */}
                  {trip.notes && (
                    <section>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4"><TranslatedText text="Notes" /></p>
                      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex gap-3">
                        <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-amber-800">{trip.notes}</p>
                      </div>
                    </section>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setSelectedTripDetail(null);
                        setSelectedTripForStart(trip);
                      }}
                      className="flex-1 px-6 py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                    >
                      <TranslatedText text="Start Trip" />
                      <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={() => setSelectedTripDetail(null)}
                      className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95"
                    >
                      <TranslatedText text="Close" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── ePOD Full-Screen Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {epodTrip && (
          <motion.div
            key="epod-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal panel */}
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.97 }}
              animate={{ y: 0,  opacity: 1, scale: 1    }}
              exit={{    y: 80, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full sm:max-w-2xl h-[96vh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <ProofOfDelivery
                tripId={epodTrip.id}
                tripNumber={epodTrip.tripNumber}
                cargoTitle={epodTrip.cargoTitle}
                origin={currentTrip?.origin?.city}
                destination={currentTrip?.destination?.city}
                cargoWeight={currentTrip?.cargo?.weight}
                onComplete={() => {
                  setEpodTrip(null);
                  // Refresh trip lists — trip is now COMPLETED via ePOD service
                  queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
                  queryClient.invalidateQueries({ queryKey: ['driver-trip-history'] });
                  queryClient.invalidateQueries({ queryKey: ['driver-stats'] });
                  setActiveTab('previous');
                }}
                onCancel={() => setEpodTrip(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
