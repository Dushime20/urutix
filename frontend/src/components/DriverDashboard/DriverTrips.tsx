import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi, type Trip } from '../../services/driverApi';
import {
  MapPin,
  Truck,
  Clock,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  Box,
  User,
  X,
  Play,
  Pause,
  Square,
  Calendar,
  ArrowRight,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'in_progress':
      case 'active': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'scheduled':
      case 'planned': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'paused': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const isLoading = currentTripLoading || upcomingLoading || historyLoading;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-blue-50 text-[#345E85] text-[10px] font-black uppercase tracking-[0.2em] rounded-lg">
              Fleet Operations
            </span>
          </div>
          <h2 className="text-3xl font-black text-[#0f172a] uppercase tracking-tight">
            My Trips
          </h2>
          <p className="text-slate-400 font-medium mt-1">
            Manage your active routes and trip history
          </p>
        </div>

        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
            queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips'] });
            queryClient.invalidateQueries({ queryKey: ['driver-trip-history'] });
            toast.success('Refreshed trip data');
          }}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Trips - Blue Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-lg hover:border-blue-100 transition-all cursor-default"
        >
          <div className="w-14 h-14 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
            <Navigation className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalTrips}</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-blue-50 text-[#345E85]">
                Total
              </span>
            </div>
            <p className="text-sm font-bold text-slate-600">Total Trips</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">All Time</p>
          </div>
        </motion.div>

        {/* Active Trips - Blue Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-lg hover:border-blue-100 transition-all cursor-default"
        >
          <div className="w-14 h-14 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
            <Truck className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stats.activeTrips}</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-blue-50 text-[#345E85]">
                Active
              </span>
            </div>
            <p className="text-sm font-bold text-slate-600">In Transit</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Current Status</p>
          </div>
        </motion.div>

        {/* Scheduled Trips - Blue Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-lg hover:border-blue-100 transition-all cursor-default"
        >
          <div className="w-14 h-14 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
            <Calendar className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stats.scheduledTrips}</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-blue-50 text-[#345E85]">
                Planned
              </span>
            </div>
            <p className="text-sm font-bold text-slate-600">Scheduled</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Upcoming</p>
          </div>
        </motion.div>

        {/* Total Revenue - Blue Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-lg hover:border-blue-100 transition-all cursor-default"
        >
          <div className="w-14 h-14 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
            <DollarSign className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(stats.totalRevenue)}
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-blue-50 text-[#345E85]">
                Gross
              </span>
            </div>
            <p className="text-sm font-bold text-slate-600">Total Earnings</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Revenue</p>
          </div>
        </motion.div>
      </div>

      {/* Current Trip Banner */}
      {currentTrip && (
        <div className="bg-[#345E85] rounded-[1.5rem] p-6 md:p-8 shadow-xl shadow-blue-900/20 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-black uppercase tracking-tight">Current Trip</h3>
                    <span className="px-2 py-0.5 bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                      In Progress
                    </span>
                  </div>
                  <p className="text-blue-100 text-sm font-medium">Trip #{currentTrip.tripNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {currentTrip.status?.toLowerCase() === 'in_progress' ? (
                  <>
                    <button
                      onClick={() => handleTripAction(currentTrip.id, 'pause')}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                    <button
                      onClick={() => handleTripAction(currentTrip.id, 'complete')}
                      className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                    >
                      <Square className="w-4 h-4" /> Complete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleTripAction(currentTrip.id, 'resume')}
                    className="px-4 py-2 bg-white text-[#345E85] hover:bg-blue-50 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
                  >
                    <Play className="w-4 h-4" /> Resume
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {currentTrip.progress !== undefined && (
              <div className="mb-8">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-blue-200 mb-2">
                  <span>Progress</span>
                  <span>{currentTrip.progress}%</span>
                </div>
                <div className="h-2 bg-blue-900/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${currentTrip.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Route Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <div className="w-3 h-3 rounded-full bg-blue-400 mb-1" />
                  <div className="w-0.5 h-full bg-blue-400/30 mx-auto" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 block mb-1">Origin</span>
                  <p className="font-bold text-white text-lg leading-tight">{currentTrip.origin?.city}, {currentTrip.origin?.state}</p>
                  <p className="text-blue-200 text-sm mt-1 opacity-80">{currentTrip.origin?.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <MapPin className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 block mb-1">Destination</span>
                  <p className="font-bold text-white text-lg leading-tight">{currentTrip.destination?.city}, {currentTrip.destination?.state}</p>
                  <p className="text-blue-200 text-sm mt-1 opacity-80">{currentTrip.destination?.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Constraints & Filters */}
      <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search route, cargo, trip #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#345E85] focus:border-transparent transition-all"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#345E85] appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full h-12 pl-4 pr-10 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#345E85] appearance-none cursor-pointer"
            >
              <option value="createdAt">Date (Newest)</option>
              <option value="startTime">Start Time</option>
              <option value="distance">Distance</option>
              <option value="revenue">Revenue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trips List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAndSortedTrips.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight">No Trips Found</h3>
            <p className="text-slate-400">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAndSortedTrips.map((trip, idx) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white rounded-[1.5rem] border border-slate-100 p-6 hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer relative overflow-hidden"
                onClick={() => {
                  setSelectedTrip(trip);
                  setShowDetailsModal(true);
                }}
              >
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  {/* Status Line */}
                  <div className="w-full md:w-auto flex flex-row md:flex-col justify-between md:items-center gap-2 md:border-r md:border-slate-50 md:pr-6">
                    <span className="text-2xl font-black text-slate-200">#{trip.tripNumber.slice(-4)}</span>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusColor(trip.status || '')}`}>
                      {trip.status?.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Route Block */}
                  <div className="flex-1 w-full relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#345E85]" />
                        <span className="text-xs font-bold text-slate-700">{trip.origin?.city}</span>
                      </div>
                      <div className="flex-1 mx-4 h-px bg-slate-200 relative">
                        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-slate-100 px-2 text-[10px] font-medium text-slate-400">
                          {trip.distance ? Math.round(trip.distance) : 0} km
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">{trip.destination?.city}</span>
                        <div className="w-2 h-2 rounded-full bg-[#345E85]" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Clock className="w-3 h-3" />
                      {trip.estimatedDuration ? `${Math.round(trip.estimatedDuration / 60)}h ${Math.round(trip.estimatedDuration % 60)}m` : 'N/A'}
                    </p>
                  </div>

                  {/* Info Block */}
                  <div className="w-full md:w-auto flex flex-row md:flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-6 justify-between">
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Earnings</span>
                      <span className="text-lg font-black text-[#345E85]">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(Number(trip.earnings || 0))}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Date</span>
                      <span className="text-sm font-bold text-slate-700">{trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleDateString() : 'TBD'}</span>
                    </div>
                  </div>

                  {/* Action Hint */}
                  <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-300 group-hover:bg-[#345E85] group-hover:text-white transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedTrip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/90 backdrop-blur-md p-6 border-b border-slate-100 flex items-center justify-between z-10">
                <div>
                  <span className="px-3 py-1 bg-blue-50 text-[#345E85] text-[10px] font-black uppercase tracking-wider rounded-lg border border-blue-100">
                    Trip Details
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">#{selectedTrip.tripNumber}</h3>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Actions Row */}
                <div className="flex gap-4 pb-8 border-b border-slate-50">
                  {selectedTrip.status?.toLowerCase() === 'scheduled' && (
                    <button onClick={() => handleTripAction(selectedTrip.id, 'start')} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20">
                      Start Trip
                    </button>
                  )}
                  {selectedTrip.status?.toLowerCase() === 'in_progress' && (
                    <>
                      <button onClick={() => handleTripAction(selectedTrip.id, 'pause')} className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-600 transition-all">Pause</button>
                      <button onClick={() => handleTripAction(selectedTrip.id, 'complete')} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all">Complete</button>
                    </>
                  )}
                </div>

                {/* Route Timeline */}
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
                  {/* Pickup */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#345E85] border-4 border-white shadow-sm" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#345E85] block mb-1">Pickup</span>
                    <h4 className="text-lg font-bold text-slate-800">{selectedTrip.origin?.address}</h4>
                    <p className="text-slate-500 text-sm">{selectedTrip.origin?.city}, {selectedTrip.origin?.state}</p>
                  </div>

                  {/* Delivery */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#345E85] border-4 border-white shadow-sm" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#345E85] block mb-1">Delivery</span>
                    <h4 className="text-lg font-bold text-slate-800">{selectedTrip.destination?.address}</h4>
                    <p className="text-slate-500 text-sm">{selectedTrip.destination?.city}, {selectedTrip.destination?.state}</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <Box className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Cargo</span>
                    </div>
                    <p className="font-bold text-slate-700">{selectedTrip.cargo?.type || 'Standard Cargo'}</p>
                    <p className="text-xs text-slate-500 mt-1">{selectedTrip.cargo?.weight || 0} kg</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                      <User className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Customer</span>
                    </div>
                    <p className="font-bold text-slate-700">{selectedTrip.customer?.name || 'N/A'}</p>
                    <p className="text-xs text-slate-500 mt-1">{selectedTrip.customer?.phone || 'No contact info'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverTrips;
