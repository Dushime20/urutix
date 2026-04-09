import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield,
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
  Plus,
  Download,
  Clock,
  User,
  Activity,
  XCircle,
  Coffee,
  Play,
  Square,
  TrendingUp,
  TrendingDown,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { FleetInspections } from './FleetInspections';
import { safetyApi } from '../../services/safetyApi';
import { fleetApi } from '../../services/fleetApi';
import { driverApi } from '../../services/driverApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface SafetyManagementProps {
  fleetId?: string;
}

// Driver Scores Tab Component
const DriverScoresTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  // Fetch all drivers
  const { data: driversData, isLoading } = useQuery({
    queryKey: ['fleet-drivers'],
    queryFn: () => fleetApi.getDrivers({}),
  });

  const drivers = Array.isArray(driversData) ? driversData : [];

  // Fetch breaks for selected driver
  const { data: breaksData } = useQuery({
    queryKey: ['driver-breaks', selectedDriver?.id],
    queryFn: () => selectedDriver ? driverApi.getBreaks(selectedDriver.id, { limit: 5 }) : null,
    enabled: !!selectedDriver,
  });

  // Fetch trip history for selected driver
  const { data: tripHistory, isLoading: loadingTrips } = useQuery({
    queryKey: ['driver-trip-history', selectedDriver?.id],
    queryFn: () => selectedDriver ? driverApi.getTripHistory(selectedDriver.id, 'all') : null,
    enabled: !!selectedDriver,
  });

  const activeBreak = breaksData?.breaks?.find((b: any) => !b.endTime);

  // Start break mutation
  const startBreakMutation = useMutation({
    mutationFn: (driverId: string) => driverApi.startBreak(driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-breaks'] });
      toast.success('Break started successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start break');
    },
  });

  // End break mutation
  const endBreakMutation = useMutation({
    mutationFn: (driverId: string) => driverApi.endBreak(driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-breaks'] });
      toast.success('Break ended successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to end break');
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 75) return 'text-blue-600 dark:text-blue-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900';
    if (score >= 75) return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900';
    if (score >= 60) return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900';
    return 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900';
  };

  if (isLoading) {
    return (
      <div className="p-20 text-center flex flex-col items-center">
        <Activity className="animate-pulse text-primary-500 mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Driver Scores...</p>
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="p-20 text-center flex flex-col items-center">
        <User className="text-slate-200 dark:text-slate-800 mb-6" size={48} />
        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">No Drivers Found</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Add drivers to your fleet to see their safety scores.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Driver Safety Scores</h3>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Performance & Compliance Tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{drivers.length} Active Drivers</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver: any) => {
          const safetyScore = Number(driver.safetyScore) || 100;
          const rating = Number(driver.rating) || 0;
          const totalTrips = Number(driver.totalTrips) || 0;
          const onTimeRate = Number(driver.onTimeDeliveryRate) || 0;

          return (
            <div
              key={driver.id}
              className="bg-white dark:bg-slate-900/50 rounded-[28px] border border-slate-100 dark:border-slate-800 p-6 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none transition-all duration-300 group cursor-pointer"
              onClick={() => setSelectedDriver(driver)}
            >
              {/* Driver Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="size-12 bg-primary-50 dark:bg-primary-950/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-lg">
                    {driver.firstName?.[0] || 'D'}{driver.lastName?.[0] || 'R'}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{driver.firstName} {driver.lastName}</h4>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{driver.status}</p>
                  </div>
                </div>
                <div className={cn("px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest", getScoreBgColor(safetyScore), getScoreColor(safetyScore))}>
                  {safetyScore.toFixed(0)}%
                </div>
              </div>

              {/* Score Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Award size={12} className="text-amber-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Rating</span>
                  </div>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{rating.toFixed(1)}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Activity size={12} className="text-blue-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Trips</span>
                  </div>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{totalTrips}</p>
                </div>
              </div>

              {/* On-Time Rate Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">On-Time Rate</span>
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400">{onTimeRate.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${onTimeRate}%` }}
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDriver(driver);
                  }}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Driver Detail Modal */}
      {selectedDriver && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-7 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-14 bg-primary-50 dark:bg-primary-950/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-2xl">
                  {selectedDriver.firstName?.[0]}{selectedDriver.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedDriver.firstName} {selectedDriver.lastName}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedDriver.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriver(null)}
                className="size-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <XCircle className="size-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-7 space-y-6">
              {/* Safety Score Card */}
              <div className={cn("p-6 rounded-[24px] border", getScoreBgColor(Number(selectedDriver.safetyScore) || 100))}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Safety Score</h4>
                  <Shield className={cn("size-6", getScoreColor(Number(selectedDriver.safetyScore) || 100))} />
                </div>
                <p className={cn("text-5xl font-black mb-2", getScoreColor(Number(selectedDriver.safetyScore) || 100))}>
                  {(Number(selectedDriver.safetyScore) || 100).toFixed(0)}%
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Overall safety performance rating</p>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="size-4 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rating</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{(Number(selectedDriver.rating) || 0).toFixed(1)}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="size-4 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Trips</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{Number(selectedDriver.totalTrips) || 0}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="size-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">On-Time Rate</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{(Number(selectedDriver.onTimeDeliveryRate) || 0).toFixed(0)}%</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="size-4 text-purple-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Distance</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{(Number(selectedDriver.totalDistance) || 0).toLocaleString()} km</p>
                </div>
              </div>

              {/* Break Management */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 rounded-[24px] border border-blue-200 dark:border-blue-900/50">
                <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">
                  <Coffee size={14} /> Break Management
                </h4>
                
                {activeBreak ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-sm font-bold text-blue-900 dark:text-blue-100">Driver is currently on break</span>
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                      Started: {new Date(activeBreak.startTime).toLocaleString()}
                    </div>
                    <button
                      onClick={() => endBreakMutation.mutate(selectedDriver.id)}
                      disabled={endBreakMutation.isPending}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Square size={14} />
                      {endBreakMutation.isPending ? 'Ending Break...' : 'End Break'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startBreakMutation.mutate(selectedDriver.id)}
                    disabled={startBreakMutation.isPending}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Play size={14} />
                    {startBreakMutation.isPending ? 'Starting Break...' : 'Start Break'}
                  </button>
                )}
              </div>

              {/* Recent Breaks */}
              {breaksData?.breaks && breaksData.breaks.filter((b: any) => b.endTime).length > 0 && (
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Recent Breaks</h4>
                  <div className="space-y-2">
                    {breaksData.breaks
                      .filter((b: any) => b.endTime)
                      .slice(0, 5)
                      .map((breakItem: any) => (
                        <div key={breakItem.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{breakItem.breakType}</span>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400">
                              {new Date(breakItem.startTime).toLocaleDateString()} {new Date(breakItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="text-xs font-black text-slate-600 dark:text-slate-400">
                            {Math.floor((breakItem.duration || 0) / 60)}h {(breakItem.duration || 0) % 60}m
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Trip History */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Trip History</h4>
                {loadingTrips ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="size-8 border-4 border-slate-100 dark:border-slate-800 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : !tripHistory || tripHistory.length === 0 ? (
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500">No trip history available</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {tripHistory.slice(0, 10).map((trip: any) => {
                      const isCompleted = trip.status === 'COMPLETED' || trip.status === 'DELIVERED';
                      const statusColor = isCompleted 
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                        : trip.status === 'IN_PROGRESS' || trip.status === 'IN_TRANSIT'
                        ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900'
                        : trip.status === 'CANCELLED'
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

                      return (
                        <div key={trip.id} className="p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-black text-slate-900 dark:text-white">
                                  {trip.tripNumber || `Trip #${trip.id.slice(0, 8)}`}
                                </span>
                                <span className={cn("px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest", statusColor)}>
                                  {trip.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[9px] text-slate-500 dark:text-slate-400">
                                <span>📍 {trip.origin?.city || trip.origin?.address || 'Unknown'}</span>
                                <span>→</span>
                                <span>📍 {trip.destination?.city || trip.destination?.address || 'Unknown'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[9px]">
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block mb-1">Start Date</span>
                              <span className="text-slate-900 dark:text-white font-bold">
                                {trip.startTime ? new Date(trip.startTime).toLocaleDateString() : 'Not started'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block mb-1">
                                {isCompleted ? 'Completed' : 'Expected'}
                              </span>
                              <span className="text-slate-900 dark:text-white font-bold">
                                {trip.endTime 
                                  ? new Date(trip.endTime).toLocaleDateString()
                                  : trip.estimatedArrival 
                                  ? new Date(trip.estimatedArrival).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>

                          {trip.distance && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-between text-[9px]">
                                <span className="text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Distance</span>
                                <span className="text-slate-900 dark:text-white font-bold">{trip.distance} km</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-7 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedDriver(null)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const SafetyManagement: React.FC<SafetyManagementProps> = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [reviewIncident, setReviewIncident] = useState<any>(null);
  const queryClient = useQueryClient();

  const createIncidentMutation = useMutation({
    mutationFn: (data: any) => safetyApi.createIncident(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-stats'] });
      toast.success('Incident reported successfully');
      setShowIncidentModal(false);
    },
    onError: () => toast.error('Failed to report incident'),
  });

  const { data: inspectionsData } = useQuery({
    queryKey: ['safety-stats'],
    queryFn: () => safetyApi.getInspections()
  });

  const inspectionsList = (inspectionsData as any)?.data?.inspections || [];
  const passedCount = inspectionsList.filter((i: any) => i.status === 'passed').length;
  const failedCount = inspectionsList.filter((i: any) => i.status === 'failed').length;

  const safetyScore = inspectionsList.length > 0 
    ? Math.round((passedCount / inspectionsList.length) * 100) 
    : 100;

  const safetyStats = {
    safetyScore: safetyScore,
    incidents: failedCount,
    inspections: inspectionsList.length
  };

  const CircularStatsCard = ({ title, value, icon: Icon, colorClass, secondaryColor }: any) => {
    return (
      <div className="flex flex-col items-center group">
        <div className="relative w-40 h-40 rounded-full bg-white dark:bg-gray-900 border-[8px] border-gray-50 dark:border-gray-800 flex flex-col items-center justify-center transition-all duration-500 hover:border-gray-100 dark:hover:border-gray-700">
          <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
            <circle
              cx="80"
              cy="80"
              r="72"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="452"
              strokeDashoffset="350"
              className={cn("opacity-10 transition-all duration-1000 group-hover:stroke-dashoffset-[200]", secondaryColor)}
            />
          </svg>

          <div className={cn("p-2 rounded-2xl mb-2 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-white dark:group-hover:bg-gray-700 group-hover:text-inherit transition-all duration-500", colorClass)}>
            <Icon size={18} />
          </div>

          <div className="flex flex-col items-center px-4 w-full overflow-hidden">
            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
              {value}
            </span>
          </div>

          <div className="absolute inset-4 rounded-full border border-dashed border-gray-100 dark:border-gray-800 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
        </div>

        <div className="mt-4 text-center px-2">
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-1">
            {title}
          </p>
        </div>
      </div>
    );
  };

  const IncidentsContainer = () => {
    const { data: incidentsData, isLoading } = useQuery({
      queryKey: ['safety-incidents'],
      queryFn: () => safetyApi.getIncidents()
    });

    const incidents = (incidentsData as any)?.data?.incidents || [];

    if (isLoading) {
      return (
        <div className="p-20 text-center flex flex-col items-center">
          <Activity className="animate-pulse text-primary-500 mb-4" size={32} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Incidents...</p>
        </div>
      );
    }

    if (incidents.length === 0) {
      return (
        <div className="p-20 text-center flex flex-col items-center">
          <Shield className="text-slate-200 dark:text-slate-800 mb-6" size={48} />
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">No Incidents Reported</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">The fleet is currently operating within safe parameters.</p>
        </div>
      );
    }

    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Reported Incidents</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Audit Trail & Resolution Tracking</p>
          </div>
        </div>

        <div className="space-y-4">
          {incidents.map((incident: any) => (
            <div key={incident.id} className="p-6 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none transition-all duration-300 group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className={cn(
                    "size-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-110",
                    incident.severity === 'critical' || incident.severity === 'major' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-500" : "bg-primary-50 dark:bg-primary-950/30 text-primary-500"
                  )}>
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{incident.type.replace('_', ' ')}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                        incident.severity === 'critical' ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400" :
                        incident.severity === 'major' ? "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400" :
                        "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                      )}>{incident.severity}</span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest">{incident.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 line-clamp-2 max-w-2xl">{incident.description}</p>
                    <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest tracking-loose">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(incident.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Activity size={12} /> {incident.location}</span>
                      <span className="flex items-center gap-1.5"><User size={12} /> {incident.driverName || 'Unknown Driver'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setReviewIncident(incident)}
                  className="h-10 px-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0f172a] dark:text-white hover:bg-[#0f172a] dark:hover:bg-slate-700 hover:text-white hover:border-[#0f172a] dark:hover:border-slate-600 transition-all shadow-sm">
                  Review Incident
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Matrix */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-gray-900 p-8 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="flex items-center gap-5">
          <div className="size-14 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors duration-200">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-500 mb-1">Safety Control</h2>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Fleet Safety</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIncidentModal(true)}
            className="h-12 px-6 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
            <Plus size={14} />
            Report Incident
          </button>
          <button
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200 font-medium">
            <Download size={14} />
            Safety Audit
          </button>
        </div>
      </div>

      {/* Safety Stat Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 place-items-center bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-slate-100 dark:border-gray-800 shadow-sm transition-colors duration-200">
        <CircularStatsCard
          title="Safety Score"
          value={`${safetyStats.safetyScore}%`}
          icon={Shield}
          colorClass="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
          secondaryColor="text-emerald-600 dark:text-emerald-400"
        />
        <CircularStatsCard
          title="Safety Incidents"
          value={safetyStats.incidents}
          icon={AlertTriangle}
          colorClass="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
          secondaryColor="text-rose-600 dark:text-rose-400"
        />
        <CircularStatsCard
          title="Inspections Done"
          value={safetyStats.inspections}
          icon={ClipboardCheck}
          colorClass="bg-primary-50 dark:bg-primary-950/30 text-primary-500 dark:text-primary-400"
          secondaryColor="text-primary-500 dark:text-primary-400"
        />
      </div>

      {/* Navigation Vectors */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800 rounded-[24px] border border-slate-100 dark:border-gray-700 shadow-sm w-fit max-w-full overflow-x-auto transition-colors duration-200">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
          { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
          { id: 'training', label: 'Training', icon: GraduationCap },
          { id: 'scores', label: 'Driver Scores', icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`h-11 px-6 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
              ? 'text-primary-500 border-b-2 border-primary-500 bg-white dark:bg-gray-900 shadow-sm'
              : 'text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-white/50 dark:hover:bg-gray-700'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Vector */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white dark:bg-gray-900 rounded-[40px] border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-200"
        >
          {activeTab === 'overview' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Safety Overview</h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Real-time Safety Updates</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-slate-500">
                        <User size={12} />
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">3 Operators Active</span>
                </div>
              </div>

              {/* Overview Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Recent Alerts</h4>
                  <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 rounded-[28px] border border-rose-100 dark:border-rose-900/30 flex items-start gap-4">
                    <div className="size-10 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm flex-shrink-0 border border-transparent dark:border-gray-700">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white mb-1">Unit ABC-123: Inspection Failure</p>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Brake system integrity compromised. Operational lockout active.</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Clock size={10} /> 14:32:05
                        </span>
                        <span className="text-[10px] font-black uppercase text-rose-500 dark:text-rose-400 px-2 py-0.5 bg-rose-100 dark:bg-rose-900/50 rounded-full">Immediate Action Required</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 rounded-[28px] border border-amber-100 dark:border-amber-900/30 flex items-start gap-4">
                    <div className="size-10 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0 border border-transparent dark:border-gray-700">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white mb-1">Operator Training Latency</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">John Smith: Defensive Driving Protocol refresher due in 48 hours.</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Clock size={10} /> 09:15:22
                        </span>
                        <span className="text-[10px] font-black uppercase text-amber-500 dark:text-amber-400 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded-full">Coming Up</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1C1E] dark:bg-gray-800 rounded-[32px] p-8 text-white relative overflow-hidden transition-colors duration-200">
                  <div className="absolute bottom-0 right-0 p-16 opacity-[0.05] grayscale rotate-12 -mr-10 -mb-10">
                    <Shield size={160} />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-white/40 mb-8">System Health</h4>
                    <div className="space-y-8">
                      <div>
                        <div className="flex justify-between items-end mb-3">
                          <span className="text-[10px] font-black uppercase text-white/60">Brake Status</span>
                          <span className="text-xs font-black">98.4%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "98.4%" }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-3">
                          <span className="text-[10px] font-black uppercase text-white/60">Cargo Safety</span>
                          <span className="text-xs font-black">94.2%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "94.2%" }}
                            className="h-full bg-primary-500"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-3">
                          <span className="text-[10px] font-black uppercase text-white/60">Hardware Status</span>
                          <span className="text-xs font-black">100%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inspections' && (
            <div className="p-8">
               <FleetInspections />
            </div>
          )}

          {activeTab === 'incidents' && (
            <IncidentsContainer />
          )}

          {activeTab === 'scores' && (
            <DriverScoresTab />
          )}

          {(activeTab !== 'overview' && activeTab !== 'inspections' && activeTab !== 'incidents' && activeTab !== 'scores') && (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-[28px] flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6">
                <Shield size={32} className="opacity-20" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">{activeTab} loading</p>
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-2">Loading information...</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Review Incident Modal */}
      {reviewIncident && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" style={{ zIndex: 99999 }}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-7 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center",
                  reviewIncident.severity === 'critical' || reviewIncident.severity === 'major'
                    ? "bg-rose-50 dark:bg-rose-900/20" : "bg-amber-50 dark:bg-amber-900/20")}>
                  <AlertTriangle className={cn("w-5 h-5",
                    reviewIncident.severity === 'critical' || reviewIncident.severity === 'major'
                      ? "text-rose-500" : "text-amber-500")} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white capitalize">
                    {reviewIncident.type?.replace('_', ' ')}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                      reviewIncident.severity === 'critical' ? "bg-rose-100 text-rose-600" :
                      reviewIncident.severity === 'major' ? "bg-orange-100 text-orange-600" :
                      "bg-blue-100 text-blue-600")}>{reviewIncident.severity}</span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest">{reviewIncident.status}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setReviewIncident(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <XCircle className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Details */}
            <div className="overflow-y-auto flex-1 p-7 space-y-3">
              {[
                { label: 'Date', value: new Date(reviewIncident.date).toLocaleDateString() },
                { label: 'Location', value: reviewIncident.location },
                { label: 'Description', value: reviewIncident.description },
                { label: 'Driver', value: reviewIncident.driverName || '—' },
                { label: 'Truck Plate', value: reviewIncident.truckPlate || '—' },
                { label: 'Injuries', value: reviewIncident.injuries || 'None reported' },
                { label: 'Property Damage', value: reviewIncident.propertyDamage ? `$${Number(reviewIncident.propertyDamage).toLocaleString()}` : '—' },
                { label: 'Police Report', value: reviewIncident.policeReport ? 'Yes' : 'No' },
                { label: 'Report Number', value: reviewIncident.reportNumber || '—' },
                { label: 'Assigned To', value: reviewIncident.assignedTo || '—' },
                { label: 'Cost', value: reviewIncident.cost ? `$${Number(reviewIncident.cost).toLocaleString()}` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start py-3 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 text-right max-w-[60%]">{value}</span>
                </div>
              ))}
              {reviewIncident.correctiveActions?.length > 0 && (
                <div className="py-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Corrective Actions</span>
                  <ul className="space-y-1">
                    {reviewIncident.correctiveActions.map((action: string, i: number) => (
                      <li key={i} className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-start gap-2">
                        <span className="text-rose-400 mt-0.5">•</span>{action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-7 flex-shrink-0 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setReviewIncident(null)}
                className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Report Incident Modal */}
      {showIncidentModal && createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" style={{ zIndex: 99999 }}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-7 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Report Incident</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Safety incident report</p>
                </div>
              </div>
              <button onClick={() => setShowIncidentModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <XCircle className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <div className="overflow-y-auto flex-1">
              <form id="incident-form" className="p-7 grid grid-cols-2 gap-5"
                onSubmit={e => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const data: any = Object.fromEntries(fd.entries());
                  data.policeReport = fd.get('policeReport') === 'on';
                  createIncidentMutation.mutate(data);
                }}>
                {/* Type */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Incident Type *</label>
                  <select name="type" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-100 transition-all">
                    <option value="accident">Accident</option>
                    <option value="near_miss">Near Miss</option>
                    <option value="injury">Injury</option>
                    <option value="property_damage">Property Damage</option>
                    <option value="traffic_violation">Traffic Violation</option>
                  </select>
                </div>
                {/* Severity */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Severity *</label>
                  <select name="severity" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-100 transition-all">
                    <option value="minor">Minor</option>
                    <option value="moderate">Moderate</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                {/* Date */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date *</label>
                  <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
                {/* Location */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Location *</label>
                  <input name="location" required placeholder="e.g. Nairobi Highway KM 45"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description *</label>
                  <textarea name="description" required rows={3} placeholder="Describe what happened..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-100 transition-all resize-none" />
                </div>
                {/* Driver name */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Driver Name</label>
                  <input name="driverName" placeholder="Optional"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
                {/* Truck plate */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Truck Plate</label>
                  <input name="truckPlate" placeholder="Optional"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
                {/* Injuries */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Injuries</label>
                  <input name="injuries" placeholder="Describe any injuries"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
                {/* Property damage */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Property Damage ($)</label>
                  <input name="propertyDamage" type="number" step="0.01" placeholder="0.00"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-100 transition-all" />
                </div>
                {/* Police report */}
                <div className="col-span-2 flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <input type="checkbox" name="policeReport" id="policeReport" className="w-5 h-5 rounded-lg text-rose-500" />
                  <label htmlFor="policeReport" className="text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Police report filed</label>
                </div>
              </form>
            </div>

            {/* Actions */}
            <div className="p-7 flex gap-3 flex-shrink-0 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={() => setShowIncidentModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                Cancel
              </button>
              <button type="submit" form="incident-form" disabled={createIncidentMutation.isPending}
                className="flex-[2] py-3 rounded-2xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 disabled:opacity-50 transition-colors">
                {createIncidentMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};