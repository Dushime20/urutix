import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi, type Trip } from '../../services/driverApi';
import {
  X,
  Play,
  Pause,
  Calendar,
  ArrowRight,
  Navigation,
  CheckCircle2,
  TrendingUp,
  Search,
  Truck,
  DollarSign,
  MapPin,
  Box,
  User,
  History,
  Filter,
  RefreshCw,
  Fuel
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import FuelEntryModal from '../FleetDashboard/Fuel/FuelEntryModal';

interface DriverTripsProps {
  driverId: string;
}

interface TripStats {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  scheduledTrips: number;
  totalRevenue: number;
  totalDistance: number;
}

const DriverTrips: React.FC<DriverTripsProps> = ({ driverId }) => {
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
      toast.success('Trip started successfully');
    },
    onError: () => toast.error('Failed to start trip'),
  });

  const pauseTripMutation = useMutation({
    mutationFn: (tripId: string) => driverApi.pauseTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
      toast.success('Trip paused');
    },
    onError: () => toast.error('Failed to pause trip'),
  });

  const resumeTripMutation = useMutation({
    mutationFn: (tripId: string) => driverApi.resumeTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
      toast.success('Trip resumed');
    },
    onError: () => toast.error('Failed to resume trip'),
  });

  const completeTripMutation = useMutation({
    mutationFn: (tripId: string) => driverApi.completeTrip(tripId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
      queryClient.invalidateQueries({ queryKey: ['driver-trip-history'] });
      toast.success('Trip completed successfully');
    },
    onError: () => toast.error('Failed to complete trip'),
  });

  // Stats
  const stats: TripStats = useMemo(() => {
    const totalTrips = allTrips.length;
    const activeTrips = allTrips.filter(t =>
      ['in_progress', 'active'].includes(t.status?.toLowerCase() || '')
    ).length;
    const completedTrips = allTrips.filter(t =>
      ['completed', 'delivered'].includes(t.status?.toLowerCase() || '')
    ).length;
    const scheduledTrips = allTrips.filter(t =>
      ['scheduled', 'planned'].includes(t.status?.toLowerCase() || '')
    ).length;
    const totalRevenue = allTrips.reduce((sum, t) => sum + Number(t.earnings || 0), 0);
    const totalDistance = allTrips.reduce((sum, t) => sum + Number(t.distance || 0), 0);

    return { totalTrips, activeTrips, completedTrips, scheduledTrips, totalRevenue, totalDistance };
  }, [allTrips]);

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
    };

    return (
      <span className={cn(
        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5",
        variants[status?.toLowerCase()] || 'bg-slate-50 text-slate-500 border-slate-100'
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {status?.replace('_', ' ')}
      </span>
    );
  };

  const isLoading = currentTripLoading || upcomingLoading || historyLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans text-[#0f172a]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl sm:text-4xl font-black text-[#0f172a] uppercase tracking-tight">Trip <span className="text-primary-500">Command</span></h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Real-time fleet operations & dispatching</p>
        </div>

        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
            queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips'] });
            queryClient.invalidateQueries({ queryKey: ['driver-trip-history'] });
            toast.success('System synchronization complete');
          }}
          className="px-6 py-3 bg-white border border-slate-100 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-primary-500 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          <span>Sync Data</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Trips', value: stats.totalTrips, icon: Navigation, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: stats.activeTrips, icon: Truck, color: 'text-sky-600', bg: 'bg-sky-50' },
          { label: 'Scheduled', value: stats.scheduledTrips, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Revenue', value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(stats.totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' }
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-[#0f172a] tracking-tight">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Current Trip Card */}
      {currentTrip && (
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-500 shadow-sm">
                  <Truck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Current Mission</h3>
                    <span className="px-3 py-1 bg-primary-100 text-primary-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                      In Progress
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol ID: #{currentTrip.tripNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {currentTrip.status?.toLowerCase() === 'in_progress' ? (
                  <>
                    <button
                      onClick={() => handleTripAction(currentTrip.id, 'pause')}
                      className="px-5 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                    <button
                      onClick={() => handleTripAction(currentTrip.id, 'complete')}
                      className="px-5 py-3 bg-primary-500 text-white hover:bg-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-md shadow-primary-200"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Complete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleTripAction(currentTrip.id, 'resume')}
                    className="px-5 py-3 bg-primary-500 text-white hover:bg-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-md shadow-primary-200"
                  >
                    <Play className="w-4 h-4" /> Resume
                  </button>
                )}
                <button
                  onClick={() => setShowFuelModal(true)}
                  className="px-5 py-3 bg-amber-500 text-white hover:bg-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-md shadow-amber-200"
                >
                  <Fuel className="w-4 h-4" /> Record Fuel
                </button>
              </div>
            </div>

            {/* Progress */}
            {currentTrip.progress !== undefined && (
              <div className="mb-8 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Mission Progress</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <div className="w-3 h-3 rounded-full bg-primary-500 ring-4 ring-primary-50" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Origin Point</span>
                  <p className="font-black text-[#0f172a] text-lg uppercase">{currentTrip.origin?.city}</p>
                  <p className="text-slate-500 text-xs font-medium">{currentTrip.origin?.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Destination Vector</span>
                  <p className="font-black text-[#0f172a] text-lg uppercase">{currentTrip.destination?.city}</p>
                  <p className="text-slate-500 text-xs font-medium">{currentTrip.destination?.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 w-full relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH TRIP DATA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="flex gap-4">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-6 pr-10 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer hover:bg-slate-50 transition-all min-w-[160px] appearance-none"
              >
                <option value="all">Status: ALL</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">Active</option>
                <option value="completed">Complete</option>
                <option value="cancelled">Voided</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Filter className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="pl-6 pr-10 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer hover:bg-slate-50 transition-all min-w-[160px] appearance-none"
              >
                <option value="createdAt">Newest First</option>
                <option value="startTime">Start Time</option>
                <option value="distance">Distance</option>
                <option value="revenue">Revenue</option>
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Data...</span>
          </div>
        ) : filteredAndSortedTrips.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 dashed border-2 p-12 text-center shadow-none flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-6">
              <Navigation className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-primary-900 uppercase tracking-tight mb-2">No Data Detected</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {searchTerm || statusFilter !== 'all'
                ? 'Adjust filters to locate records.'
                : 'No active transit records found.'}
            </p>
            <div className="mt-6">
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="px-6 py-3 bg-primary-50 text-primary-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-100 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="px-8 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 hidden md:flex">
              <div className="flex-1">Operational ID</div>
              <div className="flex-[2] text-center px-12">Route Vector</div>
              <div className="flex-1 text-right">Yield / Performance</div>
            </div>
            {filteredAndSortedTrips.map((trip) => (
              <div
                key={trip.id}
                className="group bg-white rounded-[1.5rem] border border-slate-100 p-6 hover:shadow-md hover:border-primary-100 transition-all cursor-pointer flex flex-col md:flex-row items-center gap-6"
                onClick={() => {
                  setSelectedTrip(trip);
                  setShowDetailsModal(true);
                }}
              >
                <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
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
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide truncate max-w-[100px]">{trip.origin?.city}</span>
                  </div>
                  <div className="flex-1 mx-4 h-px bg-slate-200 relative flex items-center justify-center">
                    <div className="bg-white border border-slate-100 px-3 py-0.5 rounded-full text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap z-10">
                      {trip.distance ? Math.round(trip.distance) : 0} KM
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <MapPin className="w-3 h-3 text-sky-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide truncate max-w-[100px]">{trip.destination?.city}</span>
                  </div>
                </div>

                <div className="flex-1 w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between gap-2 pl-0 md:pl-8 border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0">
                  <div className="text-right">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Yield</span>
                    <span className="text-lg font-black text-primary-950">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(Number(trip.earnings || 0))}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleDateString() : 'TBD'}</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
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
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mission Details</span>
                    <h3 className="text-xl font-black text-primary-500 tracking-tight">#{selectedTrip.tripNumber}</h3>
                  </div>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-8 overflow-y-auto">
                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTrip.status?.toLowerCase() === 'scheduled' && (
                    <button onClick={() => handleTripAction(selectedTrip.id, 'start')} className="col-span-2 py-4 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary-200">
                      Start Trip
                    </button>
                  )}
                  {selectedTrip.status?.toLowerCase() === 'in_progress' && (
                    <>
                      <button onClick={() => handleTripAction(selectedTrip.id, 'pause')} className="py-4 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                        <Pause size={14} /> Pause
                      </button>
                      <button onClick={() => setShowFuelModal(true)} className="py-4 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200 flex items-center justify-center gap-2">
                        <History size={14} /> Log Fuel
                      </button>
                      <button onClick={() => handleTripAction(selectedTrip.id, 'complete')} className="py-4 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary-200 flex items-center justify-center gap-2 sm:col-span-2">
                        <CheckCircle2 size={14} /> Complete Mission
                      </button>
                    </>
                  )}
                </div>

                {/* Route Timeline */}
                <div className="relative pl-8 border-l-2 border-slate-100 space-y-8 py-2">
                  {/* Pickup */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-white border-4 border-primary-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary-500 block mb-1">Origin</span>
                    <h4 className="text-lg font-bold text-primary-900 leading-tight">{selectedTrip.origin?.address}</h4>
                    <p className="text-slate-500 text-xs mt-0.5">{selectedTrip.origin?.city}, {selectedTrip.origin?.state}</p>
                  </div>

                  {/* Delivery */}
                  <div className="relative">
                    <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-white border-4 border-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block mb-1">Destination</span>
                    <h4 className="text-lg font-bold text-primary-900 leading-tight">{selectedTrip.destination?.address}</h4>
                    <p className="text-slate-500 text-xs mt-0.5">{selectedTrip.destination?.city}, {selectedTrip.destination?.state}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <Box className="w-4 h-4 text-slate-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cargo</span>
                    </div>
                    <p className="text-sm font-bold text-primary-900">{selectedTrip.cargo?.type || 'Standard Freight'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedTrip.cargo?.weight?.toLocaleString() || 0} kg
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Customer</span>
                    </div>
                    <p className="text-sm font-bold text-primary-900">{selectedTrip.customer?.name || 'Authorized Proxy'}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate">{selectedTrip.customer?.phone || 'Contact Available'}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 p-6 flex items-center justify-between border-t border-slate-100">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Total Value</span>
                  <p className="text-xl font-black text-primary-500">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(selectedTrip.earnings || 0))}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Close
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
          toast.success('Fuel entry recorded successfully');
          setShowFuelModal(false);
          queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
        }}
      />
    </div>
  );
};

export default DriverTrips;
