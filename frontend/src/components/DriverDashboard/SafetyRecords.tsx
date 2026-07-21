import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Clock,
  Truck,
  Coffee,
  MapPin,
  Calendar,
  Eye,
  Edit,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { driverApi } from '../../services/driverApi';
import { safetyApi } from '../../services/safetyApi';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { IncidentDetailModal } from './IncidentDetailModal';
import { IncidentReportModal } from './IncidentReportModal';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../../config/errorMessages';
import StatCard from '../EnliteUI/Cards/StatCard';
interface SafetyRecordsProps {
  driverId: string;
  onReportIncident?: () => void;
}

export const SafetyRecords: React.FC<SafetyRecordsProps> = ({ 
  driverId,
  onReportIncident 
}) => {
  const [showAllIncidents, setShowAllIncidents] = useState(false);
  const [showAllTrips, setShowAllTrips] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [showIncidentDetail, setShowIncidentDetail] = useState(false);
  const [showIncidentEdit, setShowIncidentEdit] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch driver data
  const { data: driverData } = useQuery({
    queryKey: ['driver-details', driverId],
    queryFn: () => driverApi.getDriver(driverId),
    enabled: !!driverId,
  });

  // Fetch trip history
  const { data: tripHistory, isLoading: loadingTrips } = useQuery({
    queryKey: ['driver-trip-history', driverId],
    queryFn: () => driverApi.getTripHistory(driverId, 'all'),
    enabled: !!driverId,
  });

  // Fetch break history
  const { data: breaksData } = useQuery({
    queryKey: ['driver-breaks', driverId],
    queryFn: () => driverApi.getBreaks(driverId, { limit: 50 }),
    enabled: !!driverId,
  });

  // Fetch incidents reported by this driver
  const { data: incidentsData, isLoading: loadingIncidents, error: incidentsError } = useQuery({
    queryKey: ['driver-incidents', driverId],
    queryFn: async () => {
      const response = await safetyApi.getIncidents();
      const allIncidents = response.data.incidents || [];
      return allIncidents.filter((inc: any) => inc.driverId === driverId);
    },
    enabled: !!driverId,
  });

  const driver = driverData || {};
  const trips = tripHistory || [];
  const allBreaks = breaksData?.breaks || [];
  const incidents = incidentsData || [];
  const safetyScore = Number(driver.safetyScore) || 100;
  const rating = Number(driver.rating) || 0;
  const activeBreak = allBreaks.find((b: any) => !b.endTime && !b.duration);
  const openIncidents = incidents.filter(
    (inc: any) => !['RESOLVED', 'CLOSED', 'resolved', 'closed'].includes(inc.status)
  ).length;

  const getSafetyScoreColor = (score: number): 'emerald' | 'primary' | 'warning' | 'error' => {
    if (score >= 90) return 'emerald';
    if (score >= 80) return 'primary';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getIncidentTypeColor = (type: string) => {
    switch (type) {
      case 'ACCIDENT':
      case 'accident':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'NEAR_MISS':
      case 'near_miss':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'INJURY':
      case 'injury':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'PROPERTY_DAMAGE':
      case 'property_damage':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'TRAFFIC_VIOLATION':
      case 'traffic_violation':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getIncidentSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MAJOR':
      case 'major':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'MODERATE':
      case 'moderate':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MINOR':
      case 'minor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
      case 'CLOSED':
      case 'resolved':
      case 'closed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INVESTIGATING':
      case 'investigating':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'REPORTED':
      case 'reported':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getTripStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
      case 'IN_TRANSIT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const SectionCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
  }> = ({ title, icon, action, children, className }) => (
    <div className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm', className)}>
      <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-slate-100">
        <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  // Incident handlers
  const handleViewIncident = (incident: any) => {
    setSelectedIncident(incident);
    setShowIncidentDetail(true);
  };

  const handleEditIncident = (incident: any) => {
    setEditingIncident(incident);
    setShowIncidentDetail(false);
    setShowIncidentEdit(true);
  };

  const handleDeleteIncident = async (incidentId: string) => {
    try {
      await safetyApi.deleteIncident(incidentId);
      toast.success('Incident deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['driver-incidents', driverId] });
    } catch (error: any) {
      console.error('Error deleting incident:', error);
      toast.error(getApiErrorMessage(error));
    }
  };

  // Break handlers
  const handleRevertBreak = async (breakId: string) => {
    try {
      await driverApi.deleteBreak(driverId, breakId);
      toast.success('Break reverted successfully');
      queryClient.invalidateQueries({ queryKey: ['driver-breaks', driverId] });
    } catch (error: any) {
      console.error('Error reverting break:', error);
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleStartBreak = async () => {
    try {
      await driverApi.startBreak(driverId);
      toast.success('Break started successfully');
      queryClient.invalidateQueries({ queryKey: ['driver-breaks', driverId] });
      queryClient.invalidateQueries({ queryKey: ['driver-details', driverId] });
    } catch (error: any) {
      console.error('Error starting break:', error);
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleEndBreak = async () => {
    try {
      await driverApi.endBreak(driverId);
      toast.success('Break ended successfully');
      queryClient.invalidateQueries({ queryKey: ['driver-breaks', driverId] });
      queryClient.invalidateQueries({ queryKey: ['driver-details', driverId] });
    } catch (error: any) {
      console.error('Error ending break:', error);
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Safety Records</h2>
          <p className="text-sm text-slate-500 mt-1">
            Track your safety score, incidents, rest breaks, and trip compliance.
          </p>
        </div>
        <button
          onClick={onReportIncident}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm shadow-rose-200"
        >
          <AlertTriangle className="w-4 h-4" />
          Report Incident
        </button>
      </div>

      {/* Safety Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Safety Score"
          value={`${safetyScore.toFixed(0)}%`}
          subtitle={rating > 0 ? `${rating.toFixed(1)} driver rating` : 'Based on compliance'}
          icon={<Shield size={22} />}
          color={getSafetyScoreColor(safetyScore)}
          variant="classic"
        />
        <StatCard
          title="Total Trips"
          value={trips.length}
          subtitle="Completed & in progress"
          icon={<Truck size={22} />}
          color="primary"
          variant="classic"
          loading={loadingTrips}
        />
        <StatCard
          title="Rest Breaks"
          value={allBreaks.length}
          subtitle={activeBreak ? 'Break currently active' : 'Logged this period'}
          icon={<Coffee size={22} />}
          color="purple"
          variant="classic"
        />
        <StatCard
          title="Incidents"
          value={incidents.length}
          subtitle={openIncidents > 0 ? `${openIncidents} open case${openIncidents !== 1 ? 's' : ''}` : 'No open cases'}
          icon={<AlertTriangle size={22} />}
          color={incidents.length > 0 ? 'error' : 'emerald'}
          variant="classic"
          loading={loadingIncidents}
        />
      </div>

      {/* Primary Content: Incidents + Break Management */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Safety Incidents — primary focus */}
        <SectionCard
          className="xl:col-span-2"
          title="Safety Incidents"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          action={
            incidents.length > 5 ? (
              <button
                onClick={() => setShowAllIncidents(!showAllIncidents)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors"
              >
                {showAllIncidents ? 'Show Less' : 'View All'}
              </button>
            ) : undefined
          }
        >
          {incidentsError ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-rose-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Unable to load incidents</p>
              <p className="text-xs text-slate-400 mt-2">{(incidentsError as Error).message}</p>
            </div>
          ) : loadingIncidents ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No incidents reported</p>
              <p className="text-xs text-slate-400 mt-2">Great job maintaining a safe driving record!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.slice(0, showAllIncidents ? undefined : 5).map((incident: any) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={cn("px-3 py-1 rounded-full border text-[9px] font-black uppercase", getIncidentTypeColor(incident.type))}>
                          {incident.type.replace('_', ' ')}
                        </span>
                        <span className={cn("px-3 py-1 rounded-full border text-[9px] font-black uppercase", getIncidentSeverityColor(incident.severity))}>
                          {incident.severity}
                        </span>
                        <span className={cn("px-3 py-1 rounded-full border text-[9px] font-black uppercase", getIncidentStatusColor(incident.status))}>
                          {incident.status}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mb-2">{incident.description}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{incident.location}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleViewIncident(incident)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditIncident(incident)}
                        className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteIncident(incident.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                      <p className="text-xs font-bold text-slate-900">{formatDate(incident.date)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Truck</p>
                      <p className="text-xs font-bold text-slate-900">{incident.truckPlate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Police Report</p>
                      <p className="text-xs font-bold text-slate-900">{incident.policeReport ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Insurance Claim</p>
                      <p className="text-xs font-bold text-slate-900">{incident.insuranceClaim ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {(incident.injuries || incident.weatherConditions || incident.roadConditions) && (
                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {incident.injuries && (
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Injuries</p>
                            <p className="text-xs text-slate-700">{incident.injuries}</p>
                          </div>
                        )}
                        {incident.weatherConditions && (
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Weather</p>
                            <p className="text-xs text-slate-700">{incident.weatherConditions}</p>
                          </div>
                        )}
                        {incident.roadConditions && (
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Road Conditions</p>
                            <p className="text-xs text-slate-700">{incident.roadConditions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {incident.correctiveActions && incident.correctiveActions.length > 0 && (
                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Corrective Actions</p>
                      <ul className="space-y-1">
                        {incident.correctiveActions.map((action: string, idx: number) => (
                          <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5">✓</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Rest Break Management — sidebar */}
        <SectionCard
          title="Rest Breaks"
          icon={<Coffee className="w-5 h-5 text-[#345E85]" />}
          action={
            <div className="flex gap-2">
              <button
                onClick={handleStartBreak}
                disabled={!!activeBreak}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-600 rounded-xl text-[10px] font-bold transition-colors flex items-center gap-1.5 border border-emerald-200"
              >
                <Coffee className="w-3.5 h-3.5" />
                Start
              </button>
              <button
                onClick={handleEndBreak}
                disabled={!activeBreak}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed text-rose-600 rounded-xl text-[10px] font-bold transition-colors flex items-center gap-1.5 border border-rose-200"
              >
                <Clock className="w-3.5 h-3.5" />
                End
              </button>
            </div>
          }
        >
          {activeBreak && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider mb-1">Active Break</p>
              <p className="text-sm font-bold text-slate-900">{activeBreak.breakType}</p>
              <p className="text-xs text-slate-500 mt-1">
                Started {formatDate(activeBreak.startTime)} at{' '}
                {new Date(activeBreak.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}

          {allBreaks.length === 0 ? (
            <div className="text-center py-10">
              <Coffee className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">No breaks logged yet</p>
              <p className="text-xs text-slate-400 mt-1">Start a break when you need rest</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {allBreaks.slice(0, 12).map((breakItem: any) => (
                <div
                  key={breakItem.id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all relative group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase">
                      {breakItem.breakType}
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      {breakItem.duration ? formatDuration(breakItem.duration) : 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(breakItem.startTime)}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(breakItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <button
                    onClick={() => handleRevertBreak(breakItem.id)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Revert Break"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Trip History — reference section */}
      <SectionCard
        title="Trip History"
        icon={<Truck className="w-5 h-5 text-[#345E85]" />}
        action={
          trips.length > 5 ? (
            <button
              onClick={() => setShowAllTrips(!showAllTrips)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors"
            >
              {showAllTrips ? 'Show Less' : 'View All'}
            </button>
          ) : undefined
        }
      >
        {loadingTrips ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No trip history available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.slice(0, showAllTrips ? undefined : 5).map((trip: any) => {
              const tripBreaks = allBreaks.filter(b => {
                if (!b.startTime || !trip.startTime) return false;
                const breakTime = new Date(b.startTime).getTime();
                const tripStart = new Date(trip.startTime).getTime();
                const tripEnd = trip.endTime ? new Date(trip.endTime).getTime() : Date.now();
                return breakTime >= tripStart && breakTime <= tripEnd;
              });

              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                >
                  {/* Trip Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-sm font-black text-slate-900">
                          {trip.tripNumber || `Trip #${trip.id.slice(0, 8)}`}
                        </h4>
                        <span className={cn("px-3 py-1 rounded-full border text-[9px] font-black uppercase", getTripStatusColor(trip.status))}>
                          {trip.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        <span>{trip.origin?.city || trip.origin?.address || 'Unknown'}</span>
                        <span>→</span>
                        <span>{trip.destination?.city || trip.destination?.address || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</p>
                      <p className="text-xs font-bold text-slate-900">{formatDate(trip.startTime)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Date</p>
                      <p className="text-xs font-bold text-slate-900">
                        {trip.endTime ? formatDate(trip.endTime) : trip.estimatedArrival ? formatDate(trip.estimatedArrival) : 'In Progress'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Distance</p>
                      <p className="text-xs font-bold text-slate-900">{trip.distance ? `${trip.distance} km` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Breaks Taken</p>
                      <p className="text-xs font-bold text-slate-900">{tripBreaks.length}</p>
                    </div>
                  </div>

                  {/* Breaks in this trip */}
                  {tripBreaks.length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Coffee className="w-3 h-3" />
                        Breaks During Trip
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {tripBreaks.map((breakItem: any) => (
                          <div key={breakItem.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-900">{breakItem.breakType}</p>
                              <p className="text-[9px] text-slate-500">
                                {formatDate(breakItem.startTime)} {new Date(breakItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <span className="text-xs font-black text-slate-600">
                              {breakItem.duration ? formatDuration(breakItem.duration) : 'Active'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Modals */}
      {showIncidentDetail && selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => {
            setShowIncidentDetail(false);
            setSelectedIncident(null);
          }}
          onEdit={handleEditIncident}
          onDelete={handleDeleteIncident}
        />
      )}

      {showIncidentEdit && editingIncident && (
        <IncidentReportModal
          isOpen={showIncidentEdit}
          onClose={() => {
            setShowIncidentEdit(false);
            setEditingIncident(null);
            queryClient.invalidateQueries({ queryKey: ['driver-incidents', driverId] });
          }}
          driverId={driverId}
          editingIncident={editingIncident}
        />
      )}
    </div>
  );
};
