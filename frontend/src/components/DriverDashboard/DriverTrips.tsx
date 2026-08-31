import React, { useState, useMemo, useEffect } from 'react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi, type Trip } from '../../services/driverApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import {
  X,
  Play,
  Pause,
  ArrowRight,
  Navigation,
  CheckCircle2,
  TrendingUp,
  Search,
  Truck,
  MapPin,
  Box,
  User,
  History,
  Filter,
  RefreshCw,
  Fuel,
  Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { toastActionSuccess, toastActionError, TRIP_COMPLETE_SUPPRESS_TYPES } from '../../utils/actionToast';
import { cn } from '@/utils/cn';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import FuelEntryModal from '../FleetDashboard/Fuel/FuelEntryModal';
import { ActiveTripTracker } from './ActiveTripTracker';
import { ReportTripDelayModal } from './ReportTripDelayModal';
import { OverdueTripBanner } from './OverdueTripBanner';
import { useAuth } from '../../contexts/AuthContext';
import {
  isOverdueTripStatus,
  TRIP_OVERDUE_QUERY_KEYS,
} from '../../utils/overdueTrip';

interface DriverTripsProps {
  driverId: string;
}

const DriverTrips: React.FC<DriverTripsProps> = ({ driverId }) => {
  const { tSync: t } = useTranslation();
  const { compact: fmtMoney } = useCurrencyFormat();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'startTime' | 'distance' | 'revenue'>('createdAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showLiveTracker, setShowLiveTracker] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const { user } = useAuth();

  // Fetch current trip
  const { data: currentTrip, isLoading: currentTripLoading } = useQuery({
    queryKey: ['driver-current-trip', driverId],
    queryFn: () => driverApi.getCurrentTrip(driverId),
    enabled: !!driverId,
    refetchInterval: 30000,
  });

  // Fetch upcoming trips
  const { data: upcomingTrips, isLoading: upcomingLoading } = useQuery({
    queryKey: ['driver-upcoming-trips', driverId],
    queryFn: () => driverApi.getUpcomingTrips(driverId),
    enabled: !!driverId,
  });

  // Fetch trip history
  const { data: tripHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['driver-trip-history', driverId, 'all'],
    queryFn: () => driverApi.getTripHistory(driverId, 'all'),
    enabled: !!driverId,
  });

  // Combine trips
  const allTrips: Trip[] = useMemo(() => {
    const trips: Trip[] = [];
    if (currentTrip) trips.push(currentTrip);
    if (upcomingTrips) trips.push(...upcomingTrips);
    if (tripHistory) trips.push(...tripHistory);

    // Deduplicate
    return trips.filter((trip, index, self) =>
      index === self.findIndex((t) => t.id === trip.id)
    );
  }, [currentTrip, upcomingTrips, tripHistory]);

  // Auto-open detail modal
  useEffect(() => {
    const tripId = searchParams.get('tripId');
    if (tripId && allTrips.length > 0) {
      const trip = allTrips.find((t) => t.id === tripId);
      if (trip) {
        setSelectedTrip(trip);
        setShowDetailsModal(true);
      }
    }
  }, [searchParams, allTrips]);

  // Mutations
  const startTripMutation = useMutation({
    mutationFn: (tripId: string) => driverApi.startTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
      queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips'] });
      toast.success(t('Trip started successfully'));
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error)),
  });

  const pauseTripMutation = useMutation({
    mutationFn: (tripId: string) => driverApi.pauseTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
      toast.success(t('Trip paused'));
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error)),
  });

  const resumeTripMutation = useMutation({
    mutationFn: (tripId: string) => driverApi.resumeTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
      toast.success(t('Trip resumed'));
    },
    onError: (error: any) => toast.error(getApiErrorMessage(error)),
  });

  const completeTripMutation = useMutation({
    mutationFn: (tripId: string) => driverApi.completeTrip(tripId),
    onSuccess: () => {
      TRIP_OVERDUE_QUERY_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      toastActionSuccess(t('Trip completed successfully'), {
        id: 'trip-complete',
        suppressTypes: TRIP_COMPLETE_SUPPRESS_TYPES,
      });
    },
    onError: (error: any) => toastActionError(getApiErrorMessage(error), { id: 'trip-complete' }),
  });

  // Filtering & Sorting
  const filteredAndSortedTrips = useMemo(() => {
    const filtered = allTrips.filter((trip) => {
      const matchesSearch = !searchTerm ||
        trip.tripNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.origin?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destination?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.cargo?.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || trip.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aVal = 0, bVal = 0;
      switch (sortBy) {
        case 'startTime':
          aVal = a.scheduledDeparture ? new Date(a.scheduledDeparture).getTime() : 0;
          bVal = b.scheduledDeparture ? new Date(b.scheduledDeparture).getTime() : 0;
          break;
        case 'distance':
          aVal = Number(a.distance || 0);
          bVal = Number(b.distance || 0);
          break;
        case 'revenue':
          aVal = Number(a.earnings || 0);
          bVal = Number(b.earnings || 0);
          break;
        case 'createdAt':
        default:
          aVal = a.scheduledDeparture ? new Date(a.scheduledDeparture).getTime() : 0;
          bVal = b.scheduledDeparture ? new Date(b.scheduledDeparture).getTime() : 0;
          break;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return filtered;
  }, [allTrips, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleTripAction = (tripId: string, action: 'start' | 'pause' | 'resume' | 'complete') => {
    switch (action) {
      case 'start': startTripMutation.mutate(tripId); break;
      case 'pause': pauseTripMutation.mutate(tripId); break;
      case 'resume': resumeTripMutation.mutate(tripId); break;
      case 'complete': completeTripMutation.mutate(tripId); break;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      in_progress: 'bg-blue-50 text-blue-600 border-blue-100',
      active: 'bg-blue-50 text-blue-600 border-blue-100',
      scheduled: 'bg-amber-50 text-amber-600 border-amber-100',
      planned: 'bg-amber-50 text-amber-600 border-amber-100',
      cancelled: 'bg-rose-50 text-rose-600 border-rose-100',
      paused: 'bg-yellow-50 text-yellow-600 border-yellow-100',
      delayed: 'bg-yellow-50 text-yellow-600 border-yellow-100',
      overdue: 'bg-amber-50 text-amber-700 border-amber-200',
    };

    return (
      <span className={cn(
        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5",
        variants[status?.toLowerCase()] || 'bg-slate-50 text-slate-500 border-slate-100'
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {status?.replace('_', ' ') ? <TranslatedText text={status.replace('_', ' ')} /> : null}
      </span>
    );
  };

  const isLoading = currentTripLoading || upcomingLoading || historyLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans text-[#0f172a]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f172a] uppercase tracking-tight"><TranslatedText text="Trip" /> <span className="text-primary-500"><TranslatedText text="Command" /></span></h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]"><TranslatedText text="Real-time fleet operations & dispatching" /></p>
        </div>

        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
            queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips'] });
            queryClient.invalidateQueries({ queryKey: ['driver-trip-history'] });
            toast.success(t('System synchronization complete'));
          }}
          className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-500 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          <span><TranslatedText text="Sync Data" /></span>
        </button>
      </div>

      {/* Current Trip Card */}
      {currentTrip && (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 dark:bg-slate-800/50 rounded-full -mr-16 -mt-16 opacity-50 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-500 shadow-sm">
                  <Truck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight"><TranslatedText text="Current Mission" /></h3>
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                      isOverdueTripStatus(currentTrip.status)
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-primary-100 text-primary-600'
                    }`}>
                      <TranslatedText text={isOverdueTripStatus(currentTrip.status) ? 'Trip Overdue' : 'In Progress'} />
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"><TranslatedText text="Protocol ID:" /> #{currentTrip.tripNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isOverdueTripStatus(currentTrip.status) ? (
                  <>
                    <button
                      onClick={() => handleTripAction(currentTrip.id, 'complete')}
                      className="px-5 py-3 bg-primary-500 text-white hover:bg-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-md shadow-primary-200"
                    >
                      <CheckCircle2 className="w-4 h-4" /> <TranslatedText text="Complete Trip" />
                    </button>
                    <button
                      onClick={() => setShowDelayModal(true)}
                      className="px-5 py-3 bg-amber-500 text-white hover:bg-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-md"
                    >
                      <TranslatedText text="Report Delay" />
                    </button>
                  </>
                ) : currentTrip.status?.toLowerCase() === 'in_progress' ? (
                  <>
                    <button
                      onClick={() => handleTripAction(currentTrip.id, 'pause')}
                      className="px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Pause className="w-4 h-4" /> <TranslatedText text="Pause" />
                    </button>
                    <button
                      onClick={() => handleTripAction(currentTrip.id, 'complete')}
                      className="px-5 py-3 bg-primary-500 text-white hover:bg-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-md shadow-primary-200"
                    >
                      <CheckCircle2 className="w-4 h-4" /> <TranslatedText text="Complete" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleTripAction(currentTrip.id, 'resume')}
                    className="px-5 py-3 bg-primary-500 text-white hover:bg-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-md shadow-primary-200"
                  >
                    <Play className="w-4 h-4" /> <TranslatedText text="Resume" />
                  </button>
                )}
                <button
                  onClick={() => setShowFuelModal(true)}
                  className="px-5 py-3 bg-amber-500 text-white hover:bg-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-md shadow-amber-200"
                >
                  <Fuel className="w-4 h-4" /> <TranslatedText text="Record Fuel" />
                </button>
                {/* Live Tracking button — shows the GPS map for this active trip */}
                <button
                  onClick={() => setShowLiveTracker(true)}
                  className="px-5 py-3 bg-[#345E85] text-white hover:bg-[#0f172a] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-md"
                >
                  <Radio className="w-4 h-4 animate-pulse" /> <TranslatedText text="Live Map" />
                </button>
              </div>
            </div>

            {isOverdueTripStatus(currentTrip.status) && (
              <div className="mb-8">
                <OverdueTripBanner
                  tripNumber={currentTrip.tripNumber}
                  expectedEnd={currentTrip.expectedEndAt || currentTrip.plannedEndTime || currentTrip.estimatedArrival}
                  overdueDurationLabel={currentTrip.overdueDurationLabel}
                  delayReason={currentTrip.delayReason}
                  delayDescription={currentTrip.delayDescription}
                  newEta={currentTrip.estimatedEndTime || currentTrip.estimatedArrival}
                  delayReportedAt={currentTrip.delayReportedAt}
                />
              </div>
            )}

            {/* Progress */}
            {currentTrip.progress !== undefined && (
              <div className="mb-8 p-4 bg-slate-50/50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest"><TranslatedText text="Mission Progress" /></span>
                  <span className="text-xl font-black text-[#0f172a]">{currentTrip.progress}%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-500 relative"
                    style={{ width: `${currentTrip.progress}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress_1s_linear_infinite]" />
                  </div>
                </div>
              </div>
            )}

            {/* Route Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <div className="w-3 h-3 rounded-full bg-primary-500 ring-4 ring-primary-50" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1"><TranslatedText text="Origin Point" /></span>
                  <p className="font-black text-[#0f172a] text-lg uppercase">{currentTrip.origin?.city}</p>
                  <p className="text-slate-500 text-xs font-medium">{currentTrip.origin?.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1"><TranslatedText text="Destination Vector" /></span>
                  <p className="font-black text-[#0f172a] text-lg uppercase">{currentTrip.destination?.city}</p>
                  <p className="text-slate-500 text-xs font-medium">{currentTrip.destination?.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 w-full relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder={t('SEARCH TRIP DATA...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white dark:bg-slate-900 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="flex gap-4">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-6 pr-10 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all min-w-[160px] appearance-none"
              >
                <option value="all">{t('Status: ALL')}</option>
                <option value="scheduled">{t('Scheduled')}</option>
                <option value="in_progress">{t('Active')}</option>
                <option value="overdue">{t('Overdue')}</option>
                <option value="completed">{t('Complete')}</option>
                <option value="cancelled">{t('Voided')}</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Filter className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-6 pr-10 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all min-w-[160px] appearance-none"
              >
                <option value="createdAt">{t('Newest First')}</option>
                <option value="startTime">{t('Start Time')}</option>
                <option value="distance">{t('Distance')}</option>
                <option value="revenue">{t('Revenue')}</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <TrendingUp className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trips Records List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"><TranslatedText text="Loading Data..." /></span>
          </div>
        ) : filteredAndSortedTrips.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 dashed border-2 p-12 text-center shadow-none flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] flex items-center justify-center mb-6">
              <Navigation className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-primary-900 uppercase tracking-tight mb-2"><TranslatedText text="No Data Detected" /></h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {searchTerm || statusFilter !== 'all'
                ? t('Adjust filters to locate records.')
                : t('No active transit records found.')}
            </p>
            <div className="mt-6">
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="px-6 py-3 bg-primary-50 text-primary-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-100 transition-colors"
              >
                <TranslatedText text="Reset Filters" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="px-8 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 hidden md:flex">
              <div className="flex-1"><TranslatedText text="Operational ID" /></div>
              <div className="flex-[2] text-center px-12"><TranslatedText text="Route Vector" /></div>
              <div className="flex-1 text-right"><TranslatedText text="Yield / Performance" /></div>
            </div>
            {filteredAndSortedTrips.map((trip) => (
              <div
                key={trip.id}
                className="group bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 p-6 hover:shadow-md hover:border-primary-100 transition-all cursor-pointer flex flex-col md:flex-row items-center gap-6"
                onClick={() => {
                  setSelectedTrip(trip);
                  setShowDetailsModal(true);
                }}
              >
                <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                    <History size={20} className="text-slate-400 group-hover:text-primary-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#0f172a] leading-tight truncate uppercase tracking-tight">#{trip.tripNumber}</p>
                    <div className="mt-1">{getStatusBadge(trip.status || '')}</div>
                  </div>
                </div>

                <div className="flex-[2] w-full relative px-0 md:px-8 flex items-center justify-between">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500 ring-2 ring-primary-100" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide truncate max-w-[100px]">{trip.origin?.city}</span>
                  </div>
                  <div className="flex-1 mx-4 h-px bg-slate-200 relative flex items-center justify-center">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-3 py-0.5 rounded-full text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap z-10">
                      {trip.distance ? Math.round(trip.distance) : 0} KM
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <MapPin className="w-3 h-3 text-sky-500" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide truncate max-w-[100px]">{trip.destination?.city}</span>
                  </div>
                </div>

                <div className="flex-1 w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between gap-2 pl-0 md:pl-8 border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0">
                  <div className="text-right">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5"><TranslatedText text="Yield" /></span>
                    <span className="text-lg font-black text-primary-950">{fmtMoney(Number(trip.earnings || 0))}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleDateString() : 'TBD'}</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Protocol Detail Modal */}
      {
        showDetailsModal && selectedTrip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary-950/40 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)}>
            <div
              className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400"><TranslatedText text="Mission Details" /></span>
                    <h3 className="text-xl font-black text-primary-500 tracking-tight">#{selectedTrip.tripNumber}</h3>
                  </div>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-8 overflow-y-auto">
                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTrip.status?.toLowerCase() === 'scheduled' && (
                    <button onClick={() => handleTripAction(selectedTrip.id, 'start')} className="col-span-2 py-4 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary-200">
                      <TranslatedText text="Start Trip" />
                    </button>
                  )}
                  {isOverdueTripStatus(selectedTrip.status) && (
                    <>
                      <button onClick={() => handleTripAction(selectedTrip.id, 'complete')} className="py-4 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary-200 flex items-center justify-center gap-2">
                        <CheckCircle2 size={14} /> <TranslatedText text="Complete Trip" />
                      </button>
                      <button onClick={() => { setShowDetailsModal(false); setShowDelayModal(true); }} className="py-4 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors flex items-center justify-center gap-2">
                        <TranslatedText text="Report Delay" />
                      </button>
                      <button
                        onClick={() => { setShowDetailsModal(false); setShowLiveTracker(true); }}
                        className="py-4 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0f172a] transition-colors flex items-center justify-center gap-2 sm:col-span-2"
                      >
                        <Radio size={14} className="animate-pulse" /> <TranslatedText text="Open Live Map" />
                      </button>
                    </>
                  )}
                  {selectedTrip.status?.toLowerCase() === 'in_progress' && (
                    <>
                      <button onClick={() => handleTripAction(selectedTrip.id, 'pause')} className="py-4 bg-slate-100 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                        <Pause size={14} /> <TranslatedText text="Pause" />
                      </button>
                      <button onClick={() => setShowFuelModal(true)} className="py-4 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200 flex items-center justify-center gap-2">
                        <History size={14} /> <TranslatedText text="Log Fuel" />
                      </button>
                      <button onClick={() => handleTripAction(selectedTrip.id, 'complete')} className="py-4 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary-200 flex items-center justify-center gap-2 sm:col-span-2">
                        <CheckCircle2 size={14} /> <TranslatedText text="Complete Mission" />
                      </button>
                      {/* Live GPS map button inside detail modal */}
                      <button
                        onClick={() => { setShowDetailsModal(false); setShowLiveTracker(true); }}
                        className="py-4 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0f172a] transition-colors flex items-center justify-center gap-2 sm:col-span-2"
                      >
                        <Radio size={14} className="animate-pulse" /> <TranslatedText text="Open Live Map" />
                      </button>
                    </>
                  )}
                </div>

                {/* Route Timeline */}
                <div className="relative pl-8 border-l-2 border-slate-100 dark:border-slate-800 space-y-8 py-2">
                  {/* Pickup */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-4 border-primary-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary-500 block mb-1"><TranslatedText text="Origin" /></span>
                    <h4 className="text-lg font-bold text-primary-900 leading-tight">{selectedTrip.origin?.address}</h4>
                    <p className="text-slate-500 text-xs mt-0.5">{selectedTrip.origin?.city}, {selectedTrip.origin?.state}</p>
                  </div>

                  {/* Delivery */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-4 border-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block mb-1"><TranslatedText text="Destination" /></span>
                    <h4 className="text-lg font-bold text-primary-900 leading-tight">{selectedTrip.destination?.address}</h4>
                    <p className="text-slate-500 text-xs mt-0.5">{selectedTrip.destination?.city}, {selectedTrip.destination?.state}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                      <Box className="w-4 h-4 text-slate-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400"><TranslatedText text="Cargo" /></span>
                    </div>
                    <p className="text-sm font-bold text-primary-900">{selectedTrip.cargo?.type || t('Standard Freight')}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedTrip.cargo?.weight?.toLocaleString() || 0} kg
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400"><TranslatedText text="Customer" /></span>
                    </div>
                    <p className="text-sm font-bold text-primary-900">{selectedTrip.customer?.name || t('Authorized Proxy')}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate">{selectedTrip.customer?.phone || t('Contact Available')}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5"><TranslatedText text="Total Value" /></span>
                  <p className="text-xl font-black text-primary-500">
                    {fmtMoney(Number(selectedTrip.earnings || 0))}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <TranslatedText text="Close" />
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Fuel Entry Modal for Drivers */}
      <FuelEntryModal
        isOpen={showFuelModal}
        onClose={() => setShowFuelModal(false)}
        onSuccess={() => {
          toast.success(t('Fuel entry recorded successfully'));
          setShowFuelModal(false);
          queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
        }}
      />

      {/* ── Live GPS Tracking overlay for active trip ───────────────── */}
      <AnimatePresence>
        {showLiveTracker && currentTrip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setShowLiveTracker(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl my-6 overflow-hidden border border-slate-100 dark:border-slate-800"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#0f172a]">
                <div className="flex items-center gap-3">
                  <Radio size={18} className="text-emerald-400 animate-pulse" />
                  <span className="text-sm font-black text-white uppercase tracking-widest">
                    <TranslatedText text="GPS Tracking" /> · #{currentTrip.tripNumber}
                  </span>
                </div>
                <button
                  onClick={() => setShowLiveTracker(false)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* ActiveTripTracker — broadcasts GPS, shows live map */}
              <div className="p-6">
                <ActiveTripTracker
                  trip={{
                    id: currentTrip.id,
                    tripNumber: currentTrip.tripNumber,
                    status: currentTrip.status,
                    origin: {
                      address: currentTrip.origin?.address ?? '',
                      city: currentTrip.origin?.city ?? '',
                      coordinates: currentTrip.origin?.coordinates,
                    },
                    destination: {
                      address: currentTrip.destination?.address ?? '',
                      city: currentTrip.destination?.city ?? '',
                      coordinates: currentTrip.destination?.coordinates,
                    },
                    estimatedArrival: currentTrip.estimatedArrival,
                    cargo: currentTrip.cargo,
                  }}
                  driverId={driverId}
                  onTripEnded={() => {
                    setShowLiveTracker(false);
                    queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
                    queryClient.invalidateQueries({ queryKey: ['driver-trip-history'] });
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReportTripDelayModal
        isOpen={showDelayModal}
        tripId={(selectedTrip || currentTrip)?.id || ''}
        tripNumber={(selectedTrip || currentTrip)?.tripNumber}
        onClose={() => setShowDelayModal(false)}
        onSubmitted={() => {
          TRIP_OVERDUE_QUERY_KEYS.forEach((key) =>
            queryClient.invalidateQueries({ queryKey: [key] }),
          );
        }}
      />
    </div>
  );
};

export default DriverTrips;
