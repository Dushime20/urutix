import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { useLocation } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Trophy,
  CheckCircle,
  Clock,
  Shield,
  MessageSquare as MessageIcon,
  Fuel as FuelIcon,
  Route,
  Home,
  Bell,
  Truck,
  DollarSign,
  FileText,
  Package,
  ClipboardCheck,
} from 'lucide-react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { driverApi } from '../../services/driverApi';
import { StatCard } from '../../components/EnliteUI/Cards/StatCard';
import { TripsManagement } from '@/components/DriverDashboard/TripsManagement';
import { FuelManagement } from '@/components/DriverDashboard/FuelManagement';
import { WalletAdvances } from '@/components/DriverDashboard/WalletAdvances';
import { DriverHeader } from '../../components/DriverDashboard/DriverHeader';
import { TimeRangeSelector } from '../../components/DriverDashboard/TimeRangeSelector';
import { DriverSkeleton } from '../../components/DriverDashboard/DriverSkeleton';
import { DriverEarningsChart } from '@/components/DriverDashboard/DriverEarningsChart';
import { DriverPerformanceChart } from '../../components/DriverDashboard/DriverPerformanceChart';
import { CurrentTrip } from '../../components/DriverDashboard/CurrentTrip';
import { EarningsOverview } from '../../components/DriverDashboard/EarningsOverview';
import { SafetyRecords } from '../../components/DriverDashboard/SafetyRecords';
import { UpcomingTrips } from '../../components/DriverDashboard/UpcomingTrips';
import { QuickActions } from '../../components/DriverDashboard/QuickActions';
import { CargoManagement } from '../../components/DriverDashboard/CargoManagement';
import { PreTripInspectionHub } from '../../components/DriverDashboard/PreTripInspectionHub';
import { DriverProfile } from '../../components/DriverDashboard/DriverProfile';
import { DriverSettings } from '../../components/DriverDashboard/DriverSettings';
import { DriverAnnouncements } from '../../components/DriverDashboard/DriverAnnouncements';
import { DriverDocuments } from '../../components/DriverDashboard/DriverDocuments';
import { MonthlyLeaderboard } from '../../components/DriverDashboard/MonthlyLeaderboard';
import { IncidentReportModal } from '../../components/DriverDashboard/IncidentReportModal';
import { ProofOfDelivery } from '../../components/DriverDashboard/ProofOfDelivery';
import { RewardsTimeline } from '../../components/DriverDashboard/RewardsTimeline';
import { MaintenanceHealth } from '../../components/DriverDashboard/MaintenanceHealth';
import { MyTruck } from '../../components/DriverDashboard/MyTruck';
import { DriverRouteMap } from '../../components/DriverDashboard/DriverRouteMap';
import { DriverMessenger } from '../../components/DriverDashboard/DriverMessenger';
import { CommunicationRelay } from '../../components/DriverDashboard/CommunicationRelay';
import { messengerApi } from '../../services/messengerApi';
import { TranslatedText } from '../../components/translated-text';
import { useTranslation } from '../../hooks/useTranslation';


const DriverDashboard: React.FC = () => {
  const { tSync: t } = useTranslation();
  const { compact: fmtMoney } = useCurrencyFormat();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [driverId, setDriverId] = useState<string>('');
  const [timeRange, setTimeRange] = useState('7d');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showRelayModal, setShowRelayModal] = useState(false);
  const [showPostTripModal, setShowPostTripModal] = useState(false);
  const [initialMessengerRecipient, setInitialMessengerRecipient] = useState<string | undefined>(undefined);
  const location = useLocation();

  const { data: currentDriverProfile } = useQuery({
    queryKey: ['driver-me', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        return await driverApi.getCurrentDriver();
      } catch (error) {
        console.error('Error finding driver:', error);
        return null;
      }
    },
    enabled: !!user?.id && !driverId,
  });

  useEffect(() => {
    if (currentDriverProfile?.id) {
      setDriverId(currentDriverProfile.id);
    }
  }, [currentDriverProfile]);

  useEffect(() => {
    const path = location.pathname;
    if (path.endsWith('/missions') || path.endsWith('/trips')) setActiveTab('missions');
    else if (path.endsWith('/cargo')) setActiveTab('cargo');
    else if (path.endsWith('/inspection')) setActiveTab('inspection');
    else if (path.endsWith('/finance') || path.endsWith('/earnings')) setActiveTab('finance');
    else if (path.endsWith('/safety')) setActiveTab('safety');
    else if (path.endsWith('/documents')) setActiveTab('documents');
    else if (path.endsWith('/settings')) setActiveTab('settings');
    else if (path.endsWith('/profile')) setActiveTab('profile');
    else if (path.endsWith('/leaderboard')) setActiveTab('leaderboard');
    else if (path.endsWith('/messages')) setActiveTab('messages');
    else if (path.endsWith('/fuel')) setActiveTab('fuel');
    else if (path.endsWith('/wallet')) setActiveTab('wallet');
  }, [location.pathname]);

  useEffect(() => {
    if (activeTab !== 'messages') {
      setInitialMessengerRecipient(undefined);
    }
  }, [activeTab]);

  const { data: driver, isLoading: driverLoading } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => driverApi.getDriverProfile(driverId),
    enabled: !!driverId,
  });

  const { data: threads } = useQuery({
    queryKey: ['messenger-threads', driverId],
    queryFn: () => messengerApi.getThreads(),
    enabled: !!driverId,
    refetchInterval: 30000 // Refetch every 30s for the badge
  });

  const totalUnread = useMemo(() => {
    return (threads || []).reduce((sum: number, t: any) => sum + (t.unreadCount || 0), 0);
  }, [threads]);

  const { data: currentTrip } = useQuery({
    queryKey: ['driver-current-trip', driverId],
    queryFn: () => driverApi.getCurrentTrip(driverId),
    enabled: !!driverId,
    refetchInterval: 30000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['driver-stats', driverId, timeRange],
    queryFn: () => driverApi.getDriverStats(driverId),
    enabled: !!driverId,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['driver-analytics', driverId, timeRange],
    queryFn: () => driverApi.getDriverAnalytics(driverId, timeRange),
    enabled: !!driverId,
  });


  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['driver'] }),
        queryClient.invalidateQueries({ queryKey: ['driver-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['driver-trips'] }),
        queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] }),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTripAction = async (action: 'start' | 'pause' | 'resume' | 'complete') => {
    if (!currentTrip?.id) {
       toast.error(t('No active trip to perform action on'));
       return;
    }
    try {
      if (action === 'complete') {
        // Open ePOD — trip is only marked complete after ePOD is submitted
        setShowPostTripModal(true);
        return;
      }

      const actionLabels = {
        'start': t('Starting trip...'),
        'pause': t('Pausing trip...'),
        'resume': t('Resuming trip...'),
        'complete': t('Completing trip...') // Kept for type safety though bypassed
      };
      toast.loading(actionLabels[action], { id: 'trip-action' });
      switch (action) {
        case 'start': await driverApi.startTrip(currentTrip.id); break;
        case 'pause': await driverApi.pauseTrip(currentTrip.id); break;
        case 'resume': await driverApi.resumeTrip(currentTrip.id); break;
      }
      toast.success(t(`Trip ${action}ed successfully`), { id: 'trip-action' });
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
    } catch (error) {
       console.error(`Error during trip ${action}:`, error);
       toast.error(t(`Failed to ${action} trip`), { id: 'trip-action' });
    }
  };

  const handleEmergency = async (type: 'call' | 'accident') => {
     if (type === 'call') {
        window.location.href = 'tel:911'; 
        toast.success(t('Initiating emergency call...'));
     } else {
        setShowIncidentModal(true);
     }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { 
      id: 'missions', 
      label: 'Mission Hub', 
      icon: Route,
      subItems: [
        { id: 'trips', label: 'My Assignments', icon: Route },
        { id: 'cargo', label: 'Cargo', icon: Package },
        { id: 'inspection', label: 'Inspection', icon: ClipboardCheck },
      ]
    },
    { 
      id: 'fleet_finance', 
      label: 'Fleet & Finance', 
      icon: Truck,
      subItems: [
        { id: 'truck_details', label: 'My Truck', icon: Truck },
        { id: 'fuel', label: 'Fuel management', icon: FuelIcon },
        { id: 'wallet', label: 'Wallet & Advances', icon: DollarSign },
        { id: 'earnings', label: 'Earnings Registry', icon: Activity },
        { id: 'safety', label: 'Safety Records', icon: Shield },
        { id: 'documents', label: 'Document Vault', icon: FileText },
      ]
    },
    { 
      id: 'messages', 
      label: 'Messenger', 
      icon: (props: any) => (
        <div className="relative">
          <MessageIcon {...props} />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
              {totalUnread}
            </span>
          )}
        </div>
      )
    },
  ];

  if (driverLoading) return <DriverSkeleton />;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <DriverHeader
        driver={driver}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
      />



      <div className="max-w-7xl mx-auto px-4 sm:px-9 md:px-10 lg:px-12 xl:px-14 py-6 pb-28 lg:pb-6">

        <div className="mb-6 flex justify-start sm:justify-end overflow-hidden px-2">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>

        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-500 w-full max-w-6xl mx-auto bg-slate-100 dark:bg-slate-900/50 p-4 sm:p-6 lg:p-8 rounded-[3rem]">
            
            {/* Header */}
            <div className="mb-8 px-4">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                <TranslatedText text="Overview" />
              </h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {driver ? `${driver.firstName} ${driver.lastName}` : <TranslatedText text="Active Personnel" />}{' '}
                &nbsp;&bull;&nbsp; <TranslatedText text="ID:" /> {driverId.slice(-6).toUpperCase() || 'SYS-01'}
              </p>
            </div>

            {/* Bento Grid */}
            <div className="flex flex-col gap-4 sm:gap-6">
              
              {/* Top Row: Quick KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard
                  title={<TranslatedText text="Total Trips" />}
                  value={statsLoading ? '...' : (stats?.totalTrips ?? 0)}
                  icon={<Route size={20} />}
                  variant="classic"
                  color="primary"
                />
                <StatCard
                  title={<TranslatedText text="On-Time Rate" />}
                  value={statsLoading ? '...' : `${Math.round(stats?.onTimeDeliveryRate ?? 0)}%`}
                  icon={<CheckCircle size={20} />}
                  variant="classic"
                  color="success"
                />
                <StatCard
                  title={<TranslatedText text="Safety Score" />}
                  value={statsLoading ? '...' : `${Math.round(stats?.safetyScore ?? 100)}`}
                  icon={<Shield size={20} />}
                  variant="classic"
                  color="primary"
                />
                <StatCard
                  title={<TranslatedText text="Rating" />}
                  value={statsLoading ? '...' : Number(stats?.rating ?? 0).toFixed(1)}
                  icon={<Trophy size={20} />}
                  variant="classic"
                  color="warning"
                />
              </div>

              {/* Action Hub — horizontal tab strip above Active Mission */}
              <div className="bg-white dark:bg-slate-800 rounded-[2rem] px-4 py-3 sm:px-6 sm:py-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1"><TranslatedText text="Action Hub" /></p>
                {/* Scrollable on very small screens, wraps on sm+ */}
                <div className="flex items-stretch gap-2 overflow-x-auto pb-1 snap-x snap-mandatory sm:flex-wrap sm:overflow-x-visible sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setActiveTab('messages')}
                    className="snap-start shrink-0 flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-[#2b5271] hover:text-white text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl transition-colors group min-w-max"
                  >
                    <MessageIcon size={16} className="shrink-0 text-[#2b5271] group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest"><TranslatedText text="Dispatch" /></span>
                  </button>
                  <button
                    onClick={() => handleEmergency('accident')}
                    className="snap-start shrink-0 flex items-center gap-2.5 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-500 hover:text-white text-rose-600 dark:text-rose-400 px-4 py-2.5 rounded-xl transition-colors group min-w-max"
                  >
                    <Shield size={16} className="shrink-0 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest"><TranslatedText text="Emergency" /></span>
                  </button>
                  <button
                    onClick={() => setActiveTab('fuel')}
                    className="snap-start shrink-0 flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-[#2b5271] hover:text-white text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl transition-colors group min-w-max"
                  >
                    <FuelIcon size={16} className="shrink-0 text-[#2b5271] group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest"><TranslatedText text="Fuel Log" /></span>
                  </button>
                  <button
                    onClick={() => setActiveTab('missions')}
                    className="snap-start shrink-0 flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-[#2b5271] hover:text-white text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl transition-colors group min-w-max"
                  >
                    <Route size={16} className="shrink-0 text-[#2b5271] group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest"><TranslatedText text="My Trips" /></span>
                  </button>
                  <button
                    onClick={() => setActiveTab('cargo')}
                    className="snap-start shrink-0 flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-[#2b5271] hover:text-white text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl transition-colors group min-w-max"
                  >
                    <Package size={16} className="shrink-0 text-[#2b5271] group-hover:text-white transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest"><TranslatedText text="Cargo" /></span>
                  </button>
                </div>
              </div>

              {/* Active Mission — full width, map gets all remaining space */}
              <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between min-h-[320px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Active Mission" /></h2>
                  {analytics?.hos && (
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      analytics.hos.status === 'Rest Required' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      analytics.hos.status === 'Caution' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      <TranslatedText text="HOS:" /> {analytics.hos.consecutiveDrivingHours.toFixed(1)}h / {analytics.hos.maxHoursPerShift}h
                    </span>
                  )}
                </div>
                {currentTrip ? (
                  /* Two-column on md+: trip info left, map right (takes more space) */
                  <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    {/* Trip details — compact on larger screens */}
                    <div className="flex flex-col justify-between md:w-72 lg:w-80 shrink-0">
                      <div>
                        <p className="text-[10px] font-black text-[#2b5271] uppercase tracking-widest mb-2">
                          <TranslatedText text="Trip #" />{currentTrip.tripNumber || <TranslatedText text="ACTIVE" />}
                        </p>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                          {currentTrip.origin.city || <TranslatedText text="Origin" />}{' '}
                          <span className="text-slate-300 mx-1">→</span>{' '}
                          {currentTrip.destination.city || <TranslatedText text="Destination" />}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-3 mb-4">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><TranslatedText text="Status" /></p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                              {currentTrip.status.replace('_', ' ')}
                            </p>
                          </div>
                          {currentTrip.estimatedArrival && (
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><TranslatedText text="ETA" /></p>
                              <p className="text-xs font-black text-[#2b5271] dark:text-white">
                                {new Date(currentTrip.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          )}
                          {currentTrip.distance > 0 && (
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><TranslatedText text="Distance" /></p>
                              <p className="text-xs font-black text-slate-700 dark:text-white">{currentTrip.distance} km</p>
                            </div>
                          )}
                          {currentTrip.earnings > 0 && (
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5"><TranslatedText text="Earnings" /></p>
                              <p className="text-xs font-black text-emerald-600">{fmtMoney(Number(currentTrip.earnings))}</p>
                            </div>
                          )}
                        </div>
                        {currentTrip.progress > 0 && (
                          <div className="mb-4">
                            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                              <span><TranslatedText text="Progress" /></span>
                              <span>{currentTrip.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#2b5271] rounded-full transition-all duration-700"
                                style={{ width: `${Math.min(100, currentTrip.progress)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {currentTrip.cargo?.description && (
                          <p className="text-[10px] text-slate-400 font-medium mb-4 truncate">
                            📦 {currentTrip.cargo.description} · {currentTrip.cargo.weight.toLocaleString()} kg
                          </p>
                        )}
                      </div>
                      {/* Trip action buttons */}
                      <div className="flex items-center gap-3 mt-4">
                        {currentTrip.status === 'PLANNED' && (
                          <button
                            onClick={() => handleTripAction('start')}
                            className="bg-[#2b5271] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                          >
                            <TranslatedText text="Start Trip" />
                          </button>
                        )}
                        {currentTrip.status === 'IN_PROGRESS' && (
                          <>
                            <button
                              onClick={() => handleTripAction('pause')}
                              className="bg-amber-50 text-amber-600 border border-amber-100 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors"
                            >
                              <TranslatedText text="Pause" />
                            </button>
                            <button
                              onClick={() => handleTripAction('complete')}
                              className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                            >
                              <TranslatedText text="Complete" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Map — fills all remaining horizontal space */}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] overflow-hidden min-h-[260px] sm:min-h-[320px]">
                      <DriverRouteMap trip={currentTrip} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Route size={40} className="text-slate-200 dark:text-slate-700 mb-4" />
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2"><TranslatedText text="No Active Mission" /></h3>
                    <p className="text-sm font-bold text-slate-500 mb-6"><TranslatedText text="You are currently unassigned." /></p>
                    <button
                      onClick={() => setActiveTab('missions')}
                      className="bg-[#2b5271] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                    >
                      <TranslatedText text="View Schedule" />
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Row: Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8 h-[400px]">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6"><TranslatedText text="Earnings Trend" /></h2>
                  <div className="-mx-6 -my-6 sm:-mx-8 sm:-my-8 h-full">
                    <DriverEarningsChart
                      isLoading={analyticsLoading}
                      timeRange={timeRange}
                      data={analytics?.earnings}
                    />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8 h-[400px]">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6"><TranslatedText text="Performance Grade" /></h2>
                  <div className="-mx-6 -my-6 sm:-mx-8 sm:-my-8 h-full">
                    <DriverPerformanceChart
                      data={analytics?.performance}
                      isLoading={analyticsLoading}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeTab === 'cargo' && <CargoManagement driverId={driverId} />}
        {activeTab === 'inspection' && <PreTripInspectionHub driverId={driverId} />}
        {(activeTab === 'missions' || activeTab === 'trips') && <TripsManagement driverId={driverId} />}
        {(activeTab === 'finance' || activeTab === 'earnings') && <EarningsOverview driverId={driverId} />}
        {activeTab === 'wallet' && <WalletAdvances driverId={driverId} />}
        {activeTab === 'fuel' && <FuelManagement driverId={driverId} />}
        {activeTab === 'safety' && <SafetyRecords driverId={driverId} onReportIncident={() => setShowIncidentModal(true)} />}
        {activeTab === 'documents' && <DriverDocuments driverId={driverId} />}
        {activeTab === 'truck_details' && <MyTruck driverId={driverId} />}
        {activeTab === 'profile' && <DriverProfile driver={driver || currentDriverProfile} loading={driverLoading} />}
        {activeTab === 'leaderboard' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-1">
              <RewardsTimeline />
            </div>
            <div className="xl:col-span-3">
              <MonthlyLeaderboard />
            </div>
          </div>
        )}
        {activeTab === 'messages' && (
          <DriverMessenger 
            driverId={driverId} 
            initialRecipientId={initialMessengerRecipient}
          />
        )}
        {activeTab === 'settings' && <DriverSettings />}
      </div>

      {showIncidentModal && (
        <IncidentReportModal
          isOpen={showIncidentModal}
          onClose={() => setShowIncidentModal(false)}
          driverId={driver?.id || ''}
        />
      )}

      <CommunicationRelay
        isOpen={showRelayModal}
        onClose={() => setShowRelayModal(false)}
        trip={currentTrip}
        onInAppMessage={(recipientId) => {
          setInitialMessengerRecipient(recipientId);
          setActiveTab('messages');
        }}
      />

      {/* ── ePOD Modal — opens when driver clicks "Complete Trip" ── */}
      <AnimatePresence>
        {showPostTripModal && currentTrip && (
          <motion.div
            key="epod-overview-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPostTripModal(false)}
            />
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.97 }}
              animate={{ y: 0,  opacity: 1, scale: 1    }}
              exit={{    y: 80, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full sm:max-w-2xl h-[96vh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <ProofOfDelivery
                tripId={currentTrip.id}
                tripNumber={currentTrip.tripNumber}
                cargoTitle={currentTrip.cargo?.description}
                origin={currentTrip.origin?.city}
                destination={currentTrip.destination?.city}
                cargoWeight={currentTrip.cargo?.weight}
                onComplete={() => {
                  setShowPostTripModal(false);
                  queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
                  queryClient.invalidateQueries({ queryKey: ['driver-stats'] });
                  setActiveTab('overview');
                }}
                onCancel={() => setShowPostTripModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverDashboard;
