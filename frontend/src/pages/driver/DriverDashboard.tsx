import React, { useState, useEffect, useMemo } from 'react';
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
import { PreTripChecklist } from '../../components/DriverDashboard/PreTripChecklist';
import { DriverProfile } from '../../components/DriverDashboard/DriverProfile';
import { DriverSettings } from '../../components/DriverDashboard/DriverSettings';
import { DriverAnnouncements } from '../../components/DriverDashboard/DriverAnnouncements';
import { DriverDocuments } from '../../components/DriverDashboard/DriverDocuments';
import { MonthlyLeaderboard } from '../../components/DriverDashboard/MonthlyLeaderboard';
import { IncidentReportModal } from '../../components/DriverDashboard/IncidentReportModal';
import { PostTripChecklist } from '../../components/DriverDashboard/PostTripChecklist';
import { PostTripChecklistModal } from '../../components/DriverDashboard/PostTripChecklistModal';
import { RewardsTimeline } from '../../components/DriverDashboard/RewardsTimeline';
import { MaintenanceHealth } from '../../components/DriverDashboard/MaintenanceHealth';
import { MyTruck } from '../../components/DriverDashboard/MyTruck';
import { DriverRouteMap } from '../../components/DriverDashboard/DriverRouteMap';
import { DriverMessenger } from '../../components/DriverDashboard/DriverMessenger';
import { CommunicationRelay } from '../../components/DriverDashboard/CommunicationRelay';
import { messengerApi } from '../../services/messengerApi';


const DriverDashboard: React.FC = () => {
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
       toast.error("No active trip to perform action on");
       return;
    }
    try {
      if (action === 'complete') {
        setShowPostTripModal(true);
        return; // Don't call API yet, wait for checklist
      }

      const actionLabels = {
        'start': 'Starting trip...',
        'pause': 'Pausing trip...',
        'resume': 'Resuming trip...',
        'complete': 'Completing trip...' // Kept for type safety though bypassed
      };
      toast.loading(actionLabels[action], { id: 'trip-action' });
      switch (action) {
        case 'start': await driverApi.startTrip(currentTrip.id); break;
        case 'pause': await driverApi.pauseTrip(currentTrip.id); break;
        case 'resume': await driverApi.resumeTrip(currentTrip.id); break;
      }
      toast.success(`Trip ${action}ed successfully`, { id: 'trip-action' });
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
    } catch (error) {
       console.error(`Error during trip ${action}:`, error);
       toast.error(`Failed to ${action} trip`, { id: 'trip-action' });
    }
  };

  const confirmTripCompletion = async (data: { odometer: string; location: string }) => {
    if (!currentTrip?.id) return;
    try {
      toast.loading('Confirming mission debrief...', { id: 'trip-action' });
      // In a real app, we would send 'data.odometer' and 'data.location' to the API
      console.log('Completing trip with data:', data);
      await driverApi.completeTrip(currentTrip.id);
      setShowPostTripModal(false);
      toast.success('Mission finalized successfully!', { id: 'trip-action' });
      queryClient.invalidateQueries({ queryKey: ['driver-current-trip'] });
      setActiveTab('overview');
    } catch (error) {
      console.error('Error finalizing mission:', error);
      toast.error('Failed to finalize mission', { id: 'trip-action' });
    }
  };

  const handleEmergency = async (type: 'call' | 'accident') => {
     if (type === 'call') {
        window.location.href = 'tel:911'; 
        toast.success("Initiating emergency call...");
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
        { id: 'checklist', label: 'Pre-Trip Check', icon: ShieldCheck },
        { id: 'post_trip', label: 'Post-Trip Debrief', icon: ShieldCheck },
        { id: 'cargo', label: 'Cargo & Inspection', icon: Package },
        { id: 'leaderboard', label: 'Elite League', icon: Trophy },
        { id: 'announcements', label: 'Announcements', icon: Bell },
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
                Overview
              </h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {driver ? `${driver.firstName} ${driver.lastName}` : 'Active Personnel'} &nbsp;&bull;&nbsp; ID: {driverId.slice(-6).toUpperCase() || 'SYS-01'}
              </p>
            </div>

            {/* Bento Grid */}
            <div className="flex flex-col gap-4 sm:gap-6">
              
              {/* Top Row: Quick KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatCard
                  title="Total Trips"
                  value={statsLoading ? '...' : (stats?.totalTrips ?? 0)}
                  icon={<Route size={20} />}
                  variant="classic"
                  color="primary"
                />
                <StatCard
                  title="On-Time Rate"
                  value={statsLoading ? '...' : `${Math.round(stats?.onTimeDeliveryRate ?? 0)}%`}
                  icon={<CheckCircle size={20} />}
                  variant="classic"
                  color="success"
                />
                <StatCard
                  title="Safety Score"
                  value={statsLoading ? '...' : `${Math.round(stats?.safetyScore ?? 100)}`}
                  icon={<Shield size={20} />}
                  variant="classic"
                  color="primary"
                />
                <StatCard
                  title="Rating"
                  value={statsLoading ? '...' : Number(stats?.rating ?? 0).toFixed(1)}
                  icon={<Trophy size={20} />}
                  variant="classic"
                  color="warning"
                />
              </div>

              {/* Middle Row: Active Mission (2/3) + Actions (1/3) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                
                {/* Active Mission (Col span 2) */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between min-h-[300px]">
                   <div className="flex items-center justify-between mb-4">
                     <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Mission</h2>
                     {analytics?.hos && (
                       <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                         analytics.hos.status === 'Rest Required' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                         analytics.hos.status === 'Caution' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                         'bg-emerald-50 text-emerald-600 border-emerald-100'
                       }`}>
                         HOS: {analytics.hos.consecutiveDrivingHours.toFixed(1)}h / {analytics.hos.maxHoursPerShift}h
                       </span>
                     )}
                   </div>
                   {currentTrip ? (
                      <div className="flex flex-col md:flex-row gap-8 h-full">
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-[10px] font-black text-[#2b5271] uppercase tracking-widest mb-2">Trip #{currentTrip.tripNumber || 'ACTIVE'}</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                              {currentTrip.origin.city || 'Origin'} <span className="text-slate-300 mx-2">→</span> {currentTrip.destination.city || 'Destination'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 mb-4">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase">{currentTrip.status.replace('_', ' ')}</p>
                              </div>
                              {currentTrip.estimatedArrival && (
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ETA</p>
                                  <p className="text-sm font-black text-[#2b5271] dark:text-white">
                                    {new Date(currentTrip.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              )}
                              {currentTrip.distance > 0 && (
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Distance</p>
                                  <p className="text-sm font-black text-slate-700 dark:text-white">{currentTrip.distance} km</p>
                                </div>
                              )}
                              {currentTrip.earnings > 0 && (
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Earnings</p>
                                  <p className="text-sm font-black text-emerald-600">{fmtMoney(Number(currentTrip.earnings))}</p>
                                </div>
                              )}
                            </div>
                            {currentTrip.progress > 0 && (
                              <div className="mb-4">
                                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                  <span>Progress</span>
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
                          <div className="flex items-center gap-3">
                            {currentTrip.status === 'PLANNED' && (
                              <button
                                onClick={() => handleTripAction('start')}
                                className="bg-[#2b5271] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                              >
                                Start Trip
                              </button>
                            )}
                            {currentTrip.status === 'IN_PROGRESS' && (
                              <>
                                <button
                                  onClick={() => handleTripAction('pause')}
                                  className="bg-amber-50 text-amber-600 border border-amber-100 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors"
                                >
                                  Pause
                                </button>
                                <button
                                  onClick={() => handleTripAction('complete')}
                                  className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors"
                                >
                                  Complete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] p-4 flex flex-col justify-center overflow-hidden">
                           <DriverRouteMap trip={currentTrip} />
                        </div>
                      </div>
                   ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <Route size={40} className="text-slate-200 dark:text-slate-700 mb-4" />
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">No Active Mission</h3>
                        <p className="text-sm font-bold text-slate-500 mb-6">You are currently unassigned.</p>
                        <button
                          onClick={() => setActiveTab('missions')}
                          className="bg-[#2b5271] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                        >
                          View Schedule
                        </button>
                      </div>
                   )}
                </div>

                {/* Actions (Col span 1) */}
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8 flex flex-col">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Action Hub</h2>
                  <div className="grid grid-cols-1 gap-3 flex-1">
                    <button 
                      onClick={() => setActiveTab('messages')}
                      className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-left hover:bg-slate-100 transition-colors flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-[#2b5271] group-hover:bg-[#2b5271] group-hover:text-white transition-colors">
                        <MessageIcon size={20} />
                      </div>
                      <p className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">Dispatch</p>
                    </button>
                    <button 
                      onClick={() => handleEmergency('accident')}
                      className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl text-left hover:bg-rose-100 transition-colors flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                        <Shield size={20} />
                      </div>
                      <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Emergency</p>
                    </button>
                    <button 
                      onClick={() => setActiveTab('fuel')}
                      className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-left hover:bg-slate-100 transition-colors flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-[#2b5271] group-hover:bg-[#2b5271] group-hover:text-white transition-colors">
                        <FuelIcon size={20} />
                      </div>
                      <p className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">Fuel Log</p>
                    </button>
                    <button 
                      onClick={() => setActiveTab('checklist')}
                      className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl text-left hover:bg-slate-100 transition-colors flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-[#2b5271] group-hover:bg-[#2b5271] group-hover:text-white transition-colors">
                        <ShieldCheck size={20} />
                      </div>
                      <p className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-widest">Inspection</p>
                    </button>
                  </div>
                </div>

              </div>

              {/* Bottom Row: Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8 h-[400px]">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Earnings Trend</h2>
                  <div className="-mx-6 -my-6 sm:-mx-8 sm:-my-8 h-full">
                    <DriverEarningsChart
                      isLoading={analyticsLoading}
                      timeRange={timeRange}
                      data={analytics?.earnings}
                    />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 sm:p-8 h-[400px]">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Performance Grade</h2>
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
        {activeTab === 'checklist' && (
          <div className="max-w-4xl mx-auto">
            <PreTripChecklist 
              truckId={currentTrip?.truck?.id}
              truckPlate={currentTrip?.truck?.plateNumber}
              driverId={driverId}
              driverName={driver ? `${driver.firstName} ${driver.lastName}` : user?.email}
              onComplete={() => setActiveTab('overview')}
            />
          </div>
        )}
        {activeTab === 'post_trip' && (
          <div className="max-w-4xl mx-auto">
            <PostTripChecklist 
              truckId={currentTrip?.truck?.id}
              truckPlate={currentTrip?.truck?.plateNumber}
              driverId={driverId}
              driverName={driver ? `${driver.firstName} ${driver.lastName}` : user?.email}
              onComplete={(data) => {
                confirmTripCompletion(data);
              }}
            />
          </div>
        )}
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

      <PostTripChecklistModal 
        isOpen={showPostTripModal}
        onClose={() => setShowPostTripModal(false)}
        onComplete={confirmTripCompletion}
        truckId={currentTrip?.truck?.id}
        truckPlate={currentTrip?.truck?.plateNumber}
        driverId={driverId}
        driverName={driver ? `${driver.firstName} ${driver.lastName}` : undefined}
      />
    </div>
  );
};

export default DriverDashboard;
