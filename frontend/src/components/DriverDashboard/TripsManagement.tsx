import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Route,
  CheckCircle,
  Calendar,
  ArrowRight,
  Package,
  MapPin,
  Clock,
  Truck,
  DollarSign,
  Navigation,
  AlertCircle,
  Eye,
  X,
  User,
  Phone,
  Mail,
  Info,
  Hash,
} from 'lucide-react';
import { driverApi } from '../../services/driverApi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { TripChecklist } from './TripChecklist';
import { TripStartFlow } from './TripStartFlow';
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
import {
  StandardDataTable,
  StatusBadge,
  type Column,
  type TableAction,
} from '../EnliteUI/Tables';

interface TripsManagementProps {
  driverId: string;
}

function formatShortDateTime(value?: string | null): string {
  if (!value) return 'TBD';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatFullDateTime(value?: string | null): string {
  if (!value) return 'TBD';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'TBD';
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export const TripsManagement: React.FC<TripsManagementProps> = ({ driverId }) => {
  const { tSync: t } = useTranslation();
  const queryClient = useQueryClient();
  const { format: formatCurrency } = useCurrencyFormat();
  const [selectedTripForChecklist, setSelectedTripForChecklist] = useState<string | null>(null);
  const [selectedTripForStart, setSelectedTripForStart] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'previous'>('active');
  const [selectedTripDetail, setSelectedTripDetail] = useState<string | null>(null);
  const [epodTrip, setEpodTrip] = useState<{ id: string; tripNumber?: string; cargoTitle?: string } | null>(null);

  const { data: driverProfile } = useQuery({
    queryKey: ['driver-profile', driverId],
    queryFn: () => driverApi.getDriverProfile(driverId),
    enabled: !!driverId,
  });

  const { data: assignedTruck, isLoading: truckLoading } = useQuery({
    queryKey: ['driver-assigned-truck', driverProfile?.currentTruckId],
    queryFn: () => driverApi.getAssignedTruck(driverProfile!.currentTruckId!),
    enabled: !!driverProfile?.currentTruckId,
  });

  const { data: activeTrips = [], isLoading: activeLoading } = useQuery({
    queryKey: ['driver-active-trips', driverId],
    queryFn: () => driverApi.getActiveTrips(driverId),
    enabled: !!driverId,
  });

  const { data: upcomingTrips, isLoading: upcomingLoading } = useQuery({
    queryKey: ['driver-upcoming-trips', driverId],
    queryFn: () => driverApi.getUpcomingTrips(driverId),
    enabled: !!driverId,
  });

  const { data: tripHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['driver-trip-history', driverId],
    queryFn: () => driverApi.getTripHistory(driverId, 'all'),
    enabled: !!driverId,
  });

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
      queryClient.invalidateQueries({ queryKey: ['driver-active-trips'] });
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

  const detailTrip =
    activeTrips.find((t) => t.id === selectedTripDetail) ||
    upcomingTrips?.find((t) => t.id === selectedTripDetail) ||
    null;

  const tabBtn = (id: typeof activeTab, label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        'px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300',
        activeTab === id
          ? 'bg-white dark:bg-slate-900 text-primary-500 shadow-md shadow-slate-200/50 border border-slate-200 dark:border-slate-700/50'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-200/50'
      )}
    >
      <TranslatedText text={label} />
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-primary-50 text-primary-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg">
            <TranslatedText text="Movement" />
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {activeTrips.length > 0 ? (
              <>
                {activeTrips.length} <TranslatedText text={activeTrips.length === 1 ? 'ACTIVE' : 'ACTIVE'} />
              </>
            ) : (
              <TranslatedText text="NO ACTIVE MISSION" />
            )}
          </span>
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
          <TranslatedText text="Trip Management" />
        </h2>
        <p className="text-slate-400 font-medium mt-1 mb-8">
          <TranslatedText text="Execute your assignments and monitor trip metrics in real-time" />
        </p>

        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit border border-slate-200 dark:border-slate-700/60 shadow-inner">
          {tabBtn('active', 'Active Mission')}
          {tabBtn('upcoming', 'Upcoming Assignments')}
          {tabBtn('previous', 'Previous Missions')}
        </div>
      </div>

      {/* Assigned Truck Banner */}
      {truckLoading && driverProfile?.currentTruckId ? (
        <div className="h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse" />
      ) : assignedTruck ? (
        <div className="flex items-center gap-4 px-5 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <Truck size={18} className="text-primary-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
              <TranslatedText text="Your Assigned Vehicle" />
            </p>
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
              {[assignedTruck.make, assignedTruck.model].filter(Boolean).join(' ') || 'Vehicle'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                <TranslatedText text="Plate" />
              </p>
              <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                {assignedTruck.plateNumber}
              </p>
            </div>
            <div className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border bg-primary-50 text-primary-600 border-primary-100">
              <TranslatedText text={assignedTruck.status?.replace('_', ' ') || 'Active'} />
            </div>
          </div>
        </div>
      ) : driverProfile && !driverProfile.currentTruckId ? (
        <div className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl">
          <AlertCircle size={16} className="text-slate-400 shrink-0" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            <TranslatedText text="No truck has been assigned to you yet. Contact your fleet manager." />
          </p>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {/* Active Missions — table */}
        {activeTab === 'active' && (
          <motion.section
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {activeLoading ? (
              <div className="h-40 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse" />
            ) : activeTrips.length > 0 ? (
              <StandardDataTable<Trip>
                embedded
                columns={[
                  {
                    key: 'tripNumber',
                    label: 'Mission',
                    sortable: true,
                    alwaysVisible: true,
                    render: (_: any, trip: Trip) => (
                      <span className="text-xs font-black text-primary-500 uppercase tracking-widest">
                        ORD-{trip.tripNumber}
                      </span>
                    ),
                  },
                  {
                    key: 'origin.city',
                    label: 'Route',
                    render: (_: any, trip: Trip) => (
                      <div className="flex items-center gap-2 min-w-[160px]">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate max-w-[100px]">
                          {trip.origin.city}
                        </span>
                        <ArrowRight size={12} className="text-slate-300 shrink-0" />
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate max-w-[100px]">
                          {trip.destination.city}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: () => (
                      <StatusBadge
                        status="in_progress"
                        label={<TranslatedText text="In Progress" />}
                        icon={<span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />}
                      />
                    ),
                  },
                  {
                    key: 'progress',
                    label: 'Progress',
                    sortable: true,
                    render: (_: any, trip: Trip) => (
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Number(trip.progress) || 0)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 tabular-nums w-8 text-right">
                          {Number(trip.progress) || 0}%
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: 'distance',
                    label: 'Distance',
                    sortable: true,
                    align: 'right',
                    render: (value: number) => (
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{value} km</span>
                    ),
                  },
                  {
                    key: 'estimatedArrival',
                    label: 'ETA',
                    align: 'right',
                    render: (_: any, trip: Trip) => (
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {formatShortDateTime(trip.estimatedArrival || trip.deliveryTime)}
                      </span>
                    ),
                  },
                  {
                    key: 'cargo.weight',
                    label: 'Cargo',
                    align: 'right',
                    render: (_: any, trip: Trip) => (
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {trip.cargo.weight.toLocaleString()} kg
                      </span>
                    ),
                  },
                  {
                    key: 'earnings',
                    label: 'Earnings',
                    sortable: true,
                    align: 'right',
                    render: (value: number) => (
                      <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(value)}</span>
                    ),
                  },
                ] as Column<Trip>[]}
                data={activeTrips}
                getRowId={(row) => row.id}
                searchable
                searchPlaceholder="Search active trips…"
                searchKeys={['tripNumber', 'origin.city', 'destination.city', 'status']}
                pagination
                pageSize={10}
                columnVisibility
                stickyHeader
                striped
                hoverable
                emptyMessage="No active trip"
                rowActions={[
                  {
                    key: 'details',
                    label: 'Details',
                    icon: <Eye size={14} />,
                    onClick: (trip) => setSelectedTripDetail(trip.id),
                  },
                  {
                    key: 'complete',
                    label: 'Complete',
                    icon: <CheckCircle size={14} />,
                    variant: 'success',
                    onClick: (trip) => handleCompleteTrip(trip),
                  },
                ] as TableAction<Trip>[]}
                ariaLabel="Active trips"
              />
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 py-12 px-6 text-center">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-100 dark:border-slate-800">
                  <Route size={22} className="text-slate-300" />
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-1">
                  <TranslatedText text="No Active Trip" />
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  <TranslatedText text="No trip is currently in progress." />
                </p>
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className="px-5 py-2.5 bg-primary-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-600 transition-all active:scale-95 inline-flex items-center gap-1.5"
                >
                  <Calendar size={12} />
                  <TranslatedText text="View Upcoming" />
                </button>
              </div>
            )}
          </motion.section>
        )}

        {/* Upcoming */}
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
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                <TranslatedText text="Upcoming Assignments" />
              </h3>
            </div>

            {upcomingLoading ? (
              <div className="grid gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : upcomingTrips && upcomingTrips.length > 0 ? (
              <StandardDataTable<Trip>
                embedded
                columns={[
                  {
                    key: 'tripNumber',
                    label: 'Mission',
                    sortable: true,
                    alwaysVisible: true,
                    render: (_: any, trip: Trip) => (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-primary-500 uppercase tracking-widest">
                          ORD-{trip.tripNumber}
                        </span>
                        {trip.loadId && (
                          <span
                            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getInspectionStatusStyles(getLoadInspectionStatus(trip.loadId))}`}
                          >
                            {getInspectionStatusLabel(getLoadInspectionStatus(trip.loadId))}
                          </span>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'origin.city',
                    label: 'Route',
                    render: (_: any, trip: Trip) => (
                      <div className="flex items-center gap-2 min-w-[160px]">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate max-w-[100px]">
                          {trip.origin.city}
                        </span>
                        <ArrowRight size={12} className="text-slate-300 shrink-0" />
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate max-w-[100px]">
                          {trip.destination.city}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: 'scheduledDeparture',
                    label: 'Pickup',
                    render: (_: any, trip: Trip) => (
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {formatShortDateTime((trip as any).pickupTime || trip.scheduledDeparture)}
                      </span>
                    ),
                  },
                  {
                    key: 'estimatedArrival',
                    label: 'Delivery',
                    render: (_: any, trip: Trip) => (
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {formatShortDateTime((trip as any).deliveryTime || trip.estimatedArrival)}
                      </span>
                    ),
                  },
                  {
                    key: 'distance',
                    label: 'Distance',
                    sortable: true,
                    align: 'right',
                    render: (value: number) => (
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{value} km</span>
                    ),
                  },
                  {
                    key: 'cargo.weight',
                    label: 'Cargo',
                    align: 'right',
                    render: (_: any, trip: Trip) => (
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {trip.cargo.weight.toLocaleString()} kg
                      </span>
                    ),
                  },
                ] as Column<Trip>[]}
                data={upcomingTrips}
                getRowId={(row) => row.id}
                searchable
                searchPlaceholder="Search upcoming trips…"
                searchKeys={['tripNumber', 'origin.city', 'destination.city']}
                pagination
                pageSize={10}
                columnVisibility
                stickyHeader
                striped
                hoverable
                emptyMessage="No upcoming assignments"
                rowActions={[
                  {
                    key: 'details',
                    label: 'Details',
                    icon: <Eye size={14} />,
                    onClick: (trip) => setSelectedTripDetail(trip.id),
                  },
                  {
                    key: 'start',
                    label: 'Start Trip',
                    icon: <ArrowRight size={14} />,
                    variant: 'success',
                    onClick: (trip) => setSelectedTripForStart(trip),
                  },
                ] as TableAction<Trip>[]}
                ariaLabel="Upcoming trips"
              />
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
                  <Calendar className="text-slate-300" size={32} />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  <TranslatedText text="No Upcoming Assignments" />
                </h4>
                <p className="text-sm font-medium text-slate-400 mt-1">
                  <TranslatedText text="You currently have no scheduled trips in the queue." />
                </p>
              </div>
            )}
          </motion.section>
        )}

        {/* History */}
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
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                <TranslatedText text="Previous Missions" />
              </h3>
            </div>

            {historyLoading ? (
              <div className="grid gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : tripHistory && tripHistory.length > 0 ? (
              <StandardDataTable<Trip>
                embedded
                columns={[
                  {
                    key: 'status',
                    label: 'Status',
                    alwaysVisible: true,
                    render: (_: any, trip: Trip) => (
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          status="completed"
                          label={<TranslatedText text="Completed" />}
                          icon={<CheckCircle size={12} />}
                        />
                        {trip.pod && (
                          <span className="ml-1 px-2 py-0.5 bg-primary-50 text-primary-600 border border-primary-100 rounded text-[8px] font-black uppercase tracking-widest">
                            <TranslatedText text="POD SECURED" />
                          </span>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'origin.city',
                    label: 'Route',
                    render: (_: any, trip: Trip) => (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                          {trip.origin.city}
                        </span>
                        <ArrowRight size={14} className="text-slate-300" />
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                          {trip.destination.city}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: 'actualArrival',
                    label: 'Date',
                    sortable: true,
                    align: 'right',
                    render: (_: any, trip: Trip) => (
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {new Date(trip.actualArrival || trip.estimatedArrival).toLocaleDateString()}
                      </span>
                    ),
                  },
                ] as Column<Trip>[]}
                data={tripHistory}
                getRowId={(row) => row.id}
                searchable
                searchPlaceholder="Search trip history…"
                searchKeys={['tripNumber', 'origin.city', 'destination.city', 'status']}
                pagination
                pageSize={10}
                columnVisibility
                stickyHeader
                striped
                hoverable
                emptyMessage="No trip history"
                ariaLabel="Previous missions"
              />
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800">
                  <CheckCircle className="text-slate-300" size={32} />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  <TranslatedText text="No Trip History" />
                </h4>
                <p className="text-sm font-medium text-slate-400 mt-1">
                  <TranslatedText text="Completed missions will appear here." />
                </p>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Trip Start Flow */}
      <AnimatePresence>
        {selectedTripForStart && (
          <TripStartFlow
            trip={selectedTripForStart}
            driverId={driverId}
            isOpen={true}
            onClose={() => setSelectedTripForStart(null)}
            onTripStarted={() => {
              queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
              queryClient.invalidateQueries({ queryKey: ['driver-active-trips'] });
              queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips'] });
              queryClient.invalidateQueries({ queryKey: ['driver-pre-trip-inspections'] });
            }}
          />
        )}
      </AnimatePresence>

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

      {/* Trip Detail Modal — system colors, white light surface */}
      <AnimatePresence>
        {selectedTripDetail && detailTrip && (() => {
          const trip = detailTrip;
          const isActive = trip.status === 'IN_PROGRESS';
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
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header — white */}
                <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 sm:px-8 py-5 flex items-start justify-between">
                  <div className="min-w-0 pr-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <TranslatedText text="Mission ID" />
                      </span>
                      <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-[9px] font-black uppercase rounded border border-primary-100">
                        ORD-{trip.tripNumber}
                      </span>
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded border bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700">
                        {priority}
                      </span>
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded border bg-primary-50 text-primary-600 border-primary-100">
                        {String(trip.status || '').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                      {trip.origin.city} → {trip.destination.city}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedTripDetail(null)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 text-slate-500 border border-slate-100 dark:border-slate-800 transition-all shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-6 sm:p-8 space-y-8">
                  {/* Route */}
                  <section>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                      <TranslatedText text="Route Details" />
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
                            <MapPin size={13} className="text-white" />
                          </div>
                          <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest">
                            <TranslatedText text="Pickup" />
                          </span>
                        </div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {trip.origin.city}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{trip.origin.address}</p>
                        {trip.origin.state && (
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
                            {trip.origin.state}
                          </p>
                        )}
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock size={11} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              {formatFullDateTime(
                                (trip as any).pickupTime || trip.scheduledDeparture || trip.actualDeparture
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center">
                            <MapPin size={13} className="text-white" />
                          </div>
                          <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                            <TranslatedText text="Delivery" />
                          </span>
                        </div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {trip.destination.city}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{trip.destination.address}</p>
                        {trip.destination.state && (
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
                            {trip.destination.state}
                          </p>
                        )}
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock size={11} />
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              {formatFullDateTime(
                                (trip as any).deliveryTime || trip.estimatedArrival
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Metrics */}
                  <section>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                      <TranslatedText text="Trip Metrics" />
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Distance', value: `${trip.distance} km`, icon: Navigation },
                        {
                          label: 'Est. Duration',
                          value: trip.estimatedDuration
                            ? `${Math.floor(trip.estimatedDuration / 60)}h ${trip.estimatedDuration % 60}m`
                            : 'TBD',
                          icon: Clock,
                        },
                        { label: 'Earnings', value: formatCurrency(trip.earnings), icon: DollarSign },
                        {
                          label: 'Cargo Weight',
                          value: `${trip.cargo.weight.toLocaleString()} kg`,
                          icon: Package,
                        },
                      ].map((m) => (
                        <div
                          key={m.label}
                          className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-center"
                        >
                          <m.icon size={18} className="mx-auto mb-2 text-primary-500" />
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100">{m.value}</p>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            <TranslatedText text={m.label} />
                          </p>
                        </div>
                      ))}
                    </div>
                    {isActive && (
                      <div className="mt-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <TranslatedText text="Progress" />
                          </p>
                          <span className="text-xs font-black text-primary-500 tabular-nums">
                            {Number(trip.progress) || 0}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${Math.min(100, Number(trip.progress) || 0)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Cargo */}
                  <section>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                      <TranslatedText text="Cargo Information" />
                    </p>
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                            <TranslatedText text="Description" />
                          </p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{trip.cargo.description}</p>
                        </div>
                        <span className="shrink-0 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase rounded-lg">
                          {trip.cargo.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                            <TranslatedText text="Weight" />
                          </p>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                            {trip.cargo.weight.toLocaleString()} kg
                          </p>
                        </div>
                        {(trip.cargo.numberOfPieces || trip.cargo.numberOfPallets) && (
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                              <TranslatedText text="Quantity" />
                            </p>
                            <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                              {[
                                trip.cargo.numberOfPieces ? `${trip.cargo.numberOfPieces} pcs` : null,
                                trip.cargo.numberOfPallets ? `${trip.cargo.numberOfPallets} plt` : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </div>
                        )}
                        {trip.cargo.packagingType && (
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                              <TranslatedText text="Packaging" />
                            </p>
                            <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase">
                              {trip.cargo.packagingType}
                            </p>
                          </div>
                        )}
                        {trip.cargo.equipmentType && (
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                              <TranslatedText text="Equipment" />
                            </p>
                            <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase">
                              {trip.cargo.equipmentType.replace(/_/g, ' ')}
                            </p>
                          </div>
                        )}
                        {(trip.cargo.length || trip.cargo.width || trip.cargo.height) && (
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                              <TranslatedText text="Dimensions" />
                            </p>
                            <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                              {[trip.cargo.length, trip.cargo.width, trip.cargo.height]
                                .map((v) => v ?? '—')
                                .join(' × ')}{' '}
                              m
                            </p>
                          </div>
                        )}
                        {(trip.cargo.requiresRefrigeration ||
                          trip.cargo.requiresTemperatureMonitoring ||
                          (trip.cargo.temperatureMin != null && trip.cargo.temperatureMin !== 0) ||
                          (trip.cargo.temperatureMax != null && trip.cargo.temperatureMax !== 0)) && (
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                              <TranslatedText text="Temp Range" />
                            </p>
                            <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                              {trip.cargo.temperatureMin != null || trip.cargo.temperatureMax != null
                                ? `${trip.cargo.temperatureMin ?? '—'}°C – ${trip.cargo.temperatureMax ?? '—'}°C`
                                : 'Refrigerated'}
                            </p>
                          </div>
                        )}
                      </div>
                      {(trip.cargo.isFragile ||
                        trip.cargo.isHazardous ||
                        trip.cargo.requiresForklift ||
                        trip.cargo.requiresRefrigeration) && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {[
                            trip.cargo.isFragile && 'Fragile',
                            trip.cargo.isHazardous && 'Hazardous',
                            trip.cargo.requiresRefrigeration && 'Refrigerated',
                            trip.cargo.requiresForklift && 'Forklift',
                            trip.cargo.requiresCrane && 'Crane',
                            trip.cargo.requiresLoadingDock && 'Loading dock',
                          ]
                            .filter(Boolean)
                            .map((flag) => (
                              <span
                                key={String(flag)}
                                className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[8px] font-black uppercase tracking-widest rounded-md"
                              >
                                {flag}
                              </span>
                            ))}
                        </div>
                      )}
                      {(trip.cargo.specialInstructions ||
                        trip.cargo.loadingInstructions ||
                        trip.cargo.unloadingInstructions) && (
                        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                          {trip.cargo.specialInstructions && (
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                <TranslatedText text="Special Instructions" />
                              </p>
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {trip.cargo.specialInstructions}
                              </p>
                            </div>
                          )}
                          {trip.cargo.loadingInstructions && (
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                <TranslatedText text="Loading" />
                              </p>
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {trip.cargo.loadingInstructions}
                              </p>
                            </div>
                          )}
                          {trip.cargo.unloadingInstructions && (
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                <TranslatedText text="Unloading" />
                              </p>
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {trip.cargo.unloadingInstructions}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Customer */}
                  {trip.customer.name && trip.customer.name !== 'N/A' && (
                    <section>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                        <TranslatedText text="Customer" />
                      </p>
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                            <User size={18} className="text-primary-500" />
                          </div>
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {trip.customer.name}
                          </p>
                        </div>
                        <div className="space-y-2">
                          {trip.customer.phone && (
                            <div className="flex items-center gap-3">
                              <Phone size={13} className="text-slate-400 shrink-0" />
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {trip.customer.phone}
                              </span>
                            </div>
                          )}
                          {trip.customer.email && (
                            <div className="flex items-center gap-3">
                              <Mail size={13} className="text-slate-400 shrink-0" />
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                {trip.customer.email}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Truck */}
                  {(trip.truck.plateNumber || trip.truck.model) && (
                    <section>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                        <TranslatedText text="Assigned Vehicle" />
                      </p>
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                          <Truck size={18} className="text-slate-500" />
                        </div>
                        <div>
                          {trip.truck.model && (
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                              {trip.truck.model}
                            </p>
                          )}
                          {trip.truck.plateNumber && (
                            <div className="flex items-center gap-2 mt-0.5">
                              <Hash size={11} className="text-slate-400" />
                              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                {trip.truck.plateNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Notes */}
                  {trip.notes && (
                    <section>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                        <TranslatedText text="Notes" />
                      </p>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800 flex gap-3">
                        <Info size={16} className="text-primary-500 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{trip.notes}</p>
                      </div>
                    </section>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    {isActive ? (
                      <button
                        onClick={() => {
                          setSelectedTripDetail(null);
                          handleCompleteTrip(trip);
                        }}
                        className="flex-1 px-6 py-4 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary-600 transition-all active:scale-95"
                      >
                        <CheckCircle size={14} />
                        <TranslatedText text="Complete" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedTripDetail(null);
                          setSelectedTripForStart(trip);
                        }}
                        className="flex-1 px-6 py-4 bg-primary-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary-600 transition-all active:scale-95"
                      >
                        <TranslatedText text="Start Trip" />
                        <ArrowRight size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedTripDetail(null)}
                      className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
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

      {/* ePOD Modal */}
      <AnimatePresence>
        {epodTrip && (
          <motion.div
            key="epod-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full sm:max-w-2xl h-[96vh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <ProofOfDelivery
                tripId={epodTrip.id}
                tripNumber={epodTrip.tripNumber}
                cargoTitle={epodTrip.cargoTitle}
                origin={activeTrips.find((t) => t.id === epodTrip.id)?.origin?.city}
                destination={activeTrips.find((t) => t.id === epodTrip.id)?.destination?.city}
                cargoWeight={activeTrips.find((t) => t.id === epodTrip.id)?.cargo?.weight}
                onComplete={() => {
                  setEpodTrip(null);
                  queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
                  queryClient.invalidateQueries({ queryKey: ['driver-active-trips'] });
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
