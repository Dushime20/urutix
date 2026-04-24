import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Truck,
  DollarSign,
  Shield,
  FileText,
  Route,
  Package,
  Home,
  Bell,
  Fuel as FuelIcon,
  Activity,
  Cloud,
  TrendingUp,
  ShieldCheck,
  Trophy
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';


import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { driverApi } from '../../services/driverApi';
import { TripsManagement } from '@/components/DriverDashboard/TripsManagement';
import { FuelManagement } from '@/components/DriverDashboard/FuelManagement';
import { WalletAdvances } from '@/components/DriverDashboard/WalletAdvances';
import { DriverHeader } from '../../components/DriverDashboard/DriverHeader';
import { DriverQuickStats } from '../../components/DriverDashboard/DriverQuickStats';
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
import { WeatherMonitoring } from '../../components/DriverDashboard/WeatherMonitoring';
import { RewardsTimeline } from '../../components/DriverDashboard/RewardsTimeline';
import { MaintenanceHealth } from '../../components/DriverDashboard/MaintenanceHealth';
import { MyTruck } from '../../components/DriverDashboard/MyTruck';
import { TranslatedText } from '../../components/translated-text';
import { DriverRouteMap } from '../../components/DriverDashboard/DriverRouteMap';
import { DriverMessenger } from '../../components/DriverDashboard/DriverMessenger';
import { CommunicationRelay } from '../../components/DriverDashboard/CommunicationRelay';
import { messengerApi } from '../../services/messengerApi';
import { MessageSquare as MessageIcon } from 'lucide-react';


const DriverDashboard: React.FC = () => {
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

  const { data: upcomingTrips, isLoading: upcomingLoading } = useQuery({
    queryKey: ['driver-upcoming-trips', driverId, timeRange],
    queryFn: () => driverApi.getUpcomingTrips(driverId),
    enabled: !!driverId,
  });

  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ['driver-announcements', driverId],
    queryFn: () => driverApi.getAnnouncements(driverId),
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
        queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips'] }),
        queryClient.invalidateQueries({ queryKey: ['driver-announcements'] }),
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

      <AnimatePresence>
        {/* Sticky bar removed to avoid redundancy with layout-level TacticalMissionOverlay */}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-9 md:px-10 lg:px-12 xl:px-14 py-6 pb-28 lg:pb-6">

        <div className="mb-6 flex justify-start sm:justify-end overflow-hidden px-2">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* 🎯 Priority 0: Active Mission Command Center */}
            {(currentTrip || driverLoading) && (
              <section className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Live Mission Command</h3>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-2">
                    <DriverRouteMap trip={currentTrip} />
                  </div>
                  <div className="xl:col-span-1">
                    {currentTrip ? (
                      <CurrentTrip 
                        trip={currentTrip as any} 
                        onStart={() => handleTripAction('start')}
                        onPause={() => handleTripAction('pause')}
                        onResume={() => handleTripAction('resume')}
                        onComplete={() => handleTripAction('complete')}
                        onOpenRelay={() => setShowRelayModal(true)}
                      />
                    ) : (
                      <DriverSkeleton />
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* 📊 Priority 1: Performance Matrix */}
            <div className="space-y-8">
              <DriverQuickStats
                stats={{
                  totalTrips: stats?.totalTrips,
                  totalEarnings: stats?.totalEarnings,
                  rating: stats?.rating,
                  completionRate: stats?.onTimeDeliveryRate,
                  activeTrips: currentTrip ? 1 : 0,
                  hoursWorked: stats?.hoursWorkedThisWeek
                }}
                hos={analytics?.hos}
                isLoading={statsLoading || analyticsLoading}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#345E85] rounded-[2.5rem] p-10 relative overflow-hidden group border border-white/5 shadow-2xl shadow-[#345E85]/20 transition-all hover:scale-[1.01]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-125" />
                    <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-emerald-500 border border-emerald-400 rotate-12 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 shrink-0">
                             <TrendingUp size={32} />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-2">Operational Excellence</h3>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">You are in the Top 10% of Elite Drivers!</h2>
                            <p className="text-blue-100/70 text-xs font-medium max-w-sm leading-relaxed">System Analysis: Your safety compliance and on-time performance are significantly above the regional average. Maintain this trajectory to secure the Platinum Shield.</p>
                        </div>
                        <div className="flex flex-col items-center md:items-end">
                            <div className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg">
                                Reward Pending: $20.00
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/40 flex flex-col justify-center group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform" />
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100 shadow-sm">
                             <Activity size={20} />
                        </div>
                        <h4 className="text-xs font-black text-[#0f172a] uppercase tracking-widest">Consistency Matrix</h4>
                    </div>
                    <div className="flex items-end gap-3 text-5xl font-black text-[#0f172a] tracking-tighter relative z-10">
                        12 <span className="text-sm text-slate-400 uppercase tracking-[0.2em] pb-2 italic">Days</span>
                    </div>
                    <p className="text-[10px] font-bold text-[#345E85] mt-3 uppercase tracking-widest relative z-10">Next Milestone: 15 Days for Safety Badge</p>
                </div>
              </div>
            </div>

            {/* 📈 Secondary Metrics & Intel */}
            {!currentTrip && (
               <div className="bg-slate-50 border border-slate-100 rounded-[3rem] p-16 flex flex-col items-center justify-center text-center group">
                  <div className="w-24 h-24 bg-white rounded-[2.5rem] border border-slate-100 flex items-center justify-center text-slate-200 shadow-inner mb-8 group-hover:scale-110 transition-transform">
                    <Route size={48} />
                  </div>
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Awaiting Mission Deployment</h3>
                  <p className="text-sm font-medium text-slate-500 italic px-8 max-w-md">No mission is currently executing. Once assigned, your tactical route tracking and cargo telemetry will appear here.</p>
                  <button 
                    onClick={() => setActiveTab('missions')}
                    className="mt-10 px-10 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                  >
                    View Available Assignments
                  </button>
               </div>
            )}


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DriverEarningsChart
                isLoading={analyticsLoading}
                timeRange={timeRange}
                data={analytics?.earnings}
              />
              <DriverPerformanceChart
                data={analytics?.performance}
                isLoading={analyticsLoading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <QuickActions 
                  driverId={driverId} 
                  onTabChange={setActiveTab}
                  onTripAction={handleTripAction}
                  onEmergency={handleEmergency}
                  onOpenRelay={() => setShowRelayModal(true)}
                />
              </div>
              <div className="lg:col-span-1">
                {currentTrip?.id && (
                  <div className="space-y-6">
                    <WeatherMonitoring 
                      destination={{
                        city: currentTrip.destination.city,
                        state: currentTrip.destination.state
                      }} 
                    />
                    <MaintenanceHealth />
                  </div>
                )}
                {!currentTrip?.id && (
                  <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center h-full text-center">
                    <Cloud className="w-12 h-12 text-slate-200 mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <TranslatedText text="Weather Intel Unavailable" />
                    </p>
                    <p className="text-xs font-medium text-slate-500 mt-1 max-w-[200px]">
                      <TranslatedText text="Assign a trip to start monitoring destination weather." />
                    </p>
                  </div>
                )}
              </div>
            </div>
            <UpcomingTrips trips={upcomingTrips as any} loading={upcomingLoading} />
            <div className="pt-6">
              <DriverAnnouncements announcements={announcements as any} loading={announcementsLoading} />
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
