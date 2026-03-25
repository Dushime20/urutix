import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  DollarSign,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  Zap,
  Star,
  Activity,
  BarChart3,
  Sparkles,
  Gavel,
  CreditCard,
  MapPin,
  Mic,
  Camera,
  Plus
} from 'lucide-react';
// Dynamically import recharts to reduce initial bundle size
import {
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { fetchCargos } from '../services/cargoApi';
import { cargoOwnerAPI } from '../services/cargoOwnerAPI';
import api from '../services/api';
import receiverService from '../services/receiverService';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

// Feature Components
import UnifiedFinancialManagement from './dashboard/financial/UnifiedFinancialManagement';
import UnifiedAnalyticsManagement from './dashboard/analytics/UnifiedAnalyticsManagement';
import UnifiedCargoManagement from './dashboard/cargos/list/UnifiedCargoManagement';
import UnifiedDocumentManagement from './dashboard/documents/UnifiedDocumentManagement';
import UnifiedNotificationManagement from './dashboard/notifications/UnifiedNotificationManagement';
import UnifiedTrackingManagement from './dashboard/tracking/UnifiedTrackingManagement';
import UnifiedAccountManagement from './dashboard/account/UnifiedAccountManagement';
import CargoHelpSupport from './CargoHelpSupport';
import CargoOwnerContracts from './cargo-owner/Contracts';
import QuickCreateModal from '../components/Cargo/QuickCreateModal';
import QuickActionPanel from '../components/Cargo/QuickActionPanel';
import QuickActionFlow from '../components/Dashboard/QuickActionFlow';
import OnboardingTour from '../components/Onboarding/OnboardingTour';
import { useOnboardingStore, useShouldShowOnboarding } from '../stores/onboardingStore';
import VoiceCargoInput from '../components/VoiceInput/VoiceCargoInput';
import CameraDocumentScanner from '../components/Camera/CameraDocumentScanner';
import { formatNumber, formatCurrency } from '../utils/formatNumber';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is a truck owner (CARRIER), redirect to fleet dashboard
  useEffect(() => {
    if (user && user.role === 'CARRIER') {
      navigate('/dashboard/fleet', { replace: true });
    }
  }, [user, navigate]);

  // Otherwise show cargo owner dashboard (CARGO_RECEIVER sees simplified version)
  return <CargoOwnerDashboard />;
};

const CargoOwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { DialogComponent } = useConfirmDialog();

  // Onboarding state
  const shouldShowOnboarding = useShouldShowOnboarding();
  const { completeOnboarding, incrementLogin, markFeatureDiscovered } = useOnboardingStore();
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);

  // Hide default header on mount, show on unmount


  // Check if should show onboarding on mount
  useEffect(() => {
    incrementLogin();
    if (shouldShowOnboarding) {
      // Small delay to let dashboard render first
      setTimeout(() => setShowOnboardingTour(true), 1000);
    }
  }, []);

  const [activeTab, setActiveTab] = useState('Overview');
  const [cargos, setCargos] = useState<any[]>([]);
  const [dashboardAnalytics, setDashboardAnalytics] = useState<any>(null);
  const [, setLoading] = useState(true);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showQuickActionPanel, setShowQuickActionPanel] = useState(false);
  const [showQuickActionFlow, setShowQuickActionFlow] = useState(false);

  // Advanced features state
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showDocumentScanner, setShowDocumentScanner] = useState(false);


  // Handle cargo row click - view if CREATED, edit if DRAFT
  const handleCargoRowClick = (cargo: any) => {
    if (user?.role === 'CARGO_RECEIVER') {
      navigate(`/dashboard/cargos/my-cargos?view=${cargo.id}`);
      return;
    }

    if (cargo.status === 'DRAFT') {
      // Navigate to edit the draft
      navigate(`/dashboard/cargos/create`, { state: { editCargo: cargo } });
    } else if (cargo.status === 'CREATED') {
      // Navigate to view the cargo
      navigate(`/dashboard/cargos/list?view=${cargo.id}`);
    }
  };

  // Bidding and matching data
  const [biddingData, setBiddingData] = useState({
    activeAuctions: 0,
    pendingBids: 0,
    acceptedBids: 0,
    totalBids: 0,
    averageBidAmount: 0,
    recentBids: [] as any[],
  });
  const [matchingData, setMatchingData] = useState({
    matchRecommendations: 0,
    acceptedMatches: 0,
    matchSuccessRate: 0,
    recentMatches: [] as any[],
  });

  // Payment data for loaded cargos
  const [paymentData, setPaymentData] = useState({
    pendingPayments: 0,
    totalAmount: 0,
    loadedCargos: [] as any[],
    loading: false,
  });

  // Receiver-specific stats (for CARGO_RECEIVER role)
  const [, setReceiverStats] = useState({
    totalReceived: 0,    // Cargos with completed inspection
    activeCargos: 0,     // Cargos pending inspection
    loading: true,
  });


  // Auto-refresh cargos every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if (user?.role === 'CARGO_RECEIVER') {
          // Fetch receiver's assigned cargos
          const receiverCargos = await receiverService.getMyCargos();
          const cargosArray = Array.isArray(receiverCargos) ? receiverCargos : [];

          // Calculate receiver stats
          const inspected = cargosArray.filter((c: any) =>
            c.inspectionStatus === 'COMPLETED' || c.status === 'DELIVERED' || c.status === 'COMPLETED'
          ).length;
          const pending = cargosArray.filter((c: any) =>
            c.inspectionStatus !== 'COMPLETED' && c.status !== 'DELIVERED' && c.status !== 'COMPLETED'
          ).length;

          setReceiverStats({
            totalReceived: inspected,
            activeCargos: pending,
            loading: false,
          });
          setCargos(cargosArray);
        } else {
          const data = await fetchCargos(1, '', {});
          setCargos(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error refreshing cargos:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Fetch cargos and related data on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Different data fetching for CARGO_RECEIVER
        if (user?.role === 'CARGO_RECEIVER') {
          // Fetch receiver's assigned cargos
          const receiverCargos = await receiverService.getMyCargos();
          const cargosArray = Array.isArray(receiverCargos) ? receiverCargos : [];

          // Calculate receiver stats based on inspection status
          const inspected = cargosArray.filter((c: any) =>
            c.inspectionStatus === 'COMPLETED' || c.status === 'DELIVERED' || c.status === 'COMPLETED'
          ).length;
          const pending = cargosArray.filter((c: any) =>
            c.inspectionStatus !== 'COMPLETED' && c.status !== 'DELIVERED' && c.status !== 'COMPLETED'
          ).length;

          setReceiverStats({
            totalReceived: inspected,
            activeCargos: pending,
            loading: false,
          });
          setCargos(cargosArray);
          setLoading(false);
          return; // Exit early for receivers
        }


        // Fetch analytics
        try {
          const analyticsRes = await cargoOwnerAPI.getDashboardAnalytics('all');
          setDashboardAnalytics(analyticsRes.data);
        } catch (e) {
          console.error('Failed to fetch analytics', e);
        }

        // Fetch cargos for cargo owners
        const cargoData = await fetchCargos(1, '', {});
        setCargos(Array.isArray(cargoData) ? cargoData : []);

        // Calculate bidding data from cargos
        try {
          // Get all bids for user's cargos
          const allBids: any[] = [];
          const cargoIds = Array.isArray(cargoData) ? cargoData.map((c: any) => c.id) : [];

          // Try to fetch bids for each cargo (limit to first 10 to avoid too many requests)
          for (const cargoId of cargoIds.slice(0, 10)) {
            try {
              const bidsResponse = await cargoOwnerAPI.getBids(cargoId);
              if (Array.isArray(bidsResponse.data)) {
                allBids.push(...bidsResponse.data);
              }
            } catch (err) {
              // Silently skip if endpoint doesn't exist for this cargo
            }
          }

          const activeAuctions = Array.isArray(cargoData)
            ? cargoData.filter((c: any) => c.status === 'PUBLISHED' || c.status === 'CREATED').length
            : 0;
          const pendingBids = allBids.filter((b: any) => b.status === 'PENDING').length;
          const acceptedBids = allBids.filter((b: any) => b.status === 'ACCEPTED').length;
          const totalBids = allBids.length;
          const averageBidAmount = allBids.length > 0
            ? allBids.reduce((sum: number, b: any) => sum + (Number(b.bidAmount) || 0), 0) / allBids.length
            : 0;

          setBiddingData({
            activeAuctions,
            pendingBids,
            acceptedBids,
            totalBids,
            averageBidAmount,
            recentBids: allBids.slice(0, 5),
          });
        } catch (error) {
          // Calculate from cargos if API fails
          const activeAuctions = Array.isArray(cargoData)
            ? cargoData.filter((c: any) => c.status === 'PUBLISHED' || c.status === 'CREATED').length
            : 0;
          setBiddingData({
            activeAuctions,
            pendingBids: 0,
            acceptedBids: 0,
            totalBids: 0,
            averageBidAmount: 0,
            recentBids: [],
          });
        }

        // Calculate matching data from cargos
        try {
          // Cargos that were assigned via matching (have assignedTruckId but no brokerId)
          const matchedCargos = Array.isArray(cargoData)
            ? cargoData.filter((c: any) => c.assignedTruckId && !c.brokerId)
            : [];
          const acceptedMatches = matchedCargos.length;

          // Estimate recommendations (cargos that could use matching)
          const potentialMatches = Array.isArray(cargoData)
            ? cargoData.filter((c: any) =>
              (c.status === 'PUBLISHED' || c.status === 'CREATED') &&
              !c.assignedTruckId &&
              !c.brokerId
            ).length
            : 0;

          const totalMatchable = acceptedMatches + potentialMatches;
          const matchSuccessRate = totalMatchable > 0 ? (acceptedMatches / totalMatchable) * 100 : 0;

          setMatchingData({
            matchRecommendations: potentialMatches,
            acceptedMatches,
            matchSuccessRate,
            recentMatches: matchedCargos.slice(0, 5),
          });
        } catch (error) {
          // Set defaults if calculation fails
          setMatchingData({
            matchRecommendations: 0,
            acceptedMatches: 0,
            matchSuccessRate: 0,
            recentMatches: [],
          });
        }

        // Calculate broker data from cargos (not currently used)
        // This section can be removed or re-enabled when broker features are needed
        try {
          // Broker data calculation removed since it's not being used
        } catch (error) {
          // Set defaults if calculation fails
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setCargos([]);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();

    // Fetch loads ready for payment (status = LOADED)
    const fetchLoadedCargos = async () => {
      if (!user?.id) return;

      try {
        setPaymentData(prev => ({ ...prev, loading: true }));
        const response = await api.get('/loads-v2/my-loads', {
          params: {
            status: 'LOADED',
            limit: 100,
            page: 1,
          },
        });

        const responseData = response.data;
        let loadsData: any[] = [];

        if (responseData?.data && Array.isArray(responseData.data)) {
          loadsData = responseData.data;
        } else if (Array.isArray(responseData)) {
          loadsData = responseData;
        } else if (responseData?.items && Array.isArray(responseData.items)) {
          loadsData = responseData.items;
        }

        const totalAmount = loadsData.reduce((sum, load) => {
          return sum + (Number(load.offeredPrice) || Number(load.loadValue) || 0);
        }, 0);

        setPaymentData({
          pendingPayments: loadsData.length,
          totalAmount,
          loadedCargos: loadsData,
          loading: false,
        });
      } catch (error: any) {
        console.error('Error fetching loaded cargos:', error);
        setPaymentData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchLoadedCargos();
  }, [user]);

  // Calculate cargo statistics with competitive metrics
  const stats = useMemo(() => {
    const totalCargos = cargos.length;
    const activeCargos = cargos.filter(c =>
      c.status === 'IN_TRANSIT' || c.status === 'ASSIGNED' || c.status === 'PUBLISHED'
    ).length;
    const pendingCargos = cargos.filter(c =>
      c.status === 'DRAFT' || c.status === 'PENDING' || c.status === 'CREATED'
    ).length;
    const completedCargos = cargos.filter(c =>
      c.status === 'DELIVERED' || c.status === 'COMPLETED'
    ).length;
    const totalValue = dashboardAnalytics?.totalLoadValue ?? cargos.reduce((sum, c) => {
      const value = Number(c.loadValue) || 0;
      return sum + value;
    }, 0);
    const totalWeight = cargos.reduce((sum, c) => {
      const weight = Number(c.weight) || 0;
      return sum + weight;
    }, 0);

    // Competitive metrics
    const completionRate = totalCargos > 0 ? (completedCargos / totalCargos) * 100 : 0;
    const efficiencyScore = totalCargos > 0 ? Math.min(100, (activeCargos / totalCargos) * 100 + completionRate) : 0;
    const onTimeDeliveryRate = completedCargos > 0 ? 85 : 0; // Mock - would calculate from actual delivery dates
    const growthRate = 12.5; // Mock - would calculate from historical data

    // Achievement badges
    const achievements = [];
    if (totalCargos >= 100) achievements.push({ name: 'Century Club', icon: Award, color: 'text-yellow-500' });
    if (completionRate >= 90) achievements.push({ name: 'Excellence', icon: Star, color: 'text-blue-500' });
    if (activeCargos >= 10) achievements.push({ name: 'Power User', icon: Zap, color: 'text-purple-500' });
    if (totalValue >= 100000) achievements.push({ name: 'High Value', icon: DollarSign, color: 'text-green-500' });

    const incompleteCargos = cargos.filter(c =>
      c.status === 'DRAFT' || (c.status === 'CREATED' && !c.pickupLocation && !c.deliveryLocation)
    ).length;

    return {
      totalCargos,
      activeCargos,
      pendingCargos,
      completedCargos,
      incompleteCargos,
      totalValue,
      totalWeight,
      averageValue: totalCargos > 0 ? totalValue / totalCargos : 0,
      completionRate,
      efficiencyScore,
      onTimeDeliveryRate,
      growthRate,
      achievements,
    };
  }, [cargos, dashboardAnalytics]);

  // Get active/recent cargos for "saving plans" section
  const activeCargosList = useMemo(() => {
    return cargos
      .filter(c => c.status === 'IN_TRANSIT' || c.status === 'ASSIGNED' || c.status === 'PUBLISHED')
      .slice(0, 3)
      .map((cargo) => ({
        id: cargo.id,
        name: cargo.title || `Cargo ${cargo.id.slice(0, 8)}`,
        target: cargo.loadValue || 0,
        current: cargo.loadValue ? cargo.loadValue * 0.6 : 0, // Simulated progress
        icon: Truck,
        color: 'bg-orange-100 text-orange-600',
        status: cargo.status,
        pickupLocation: cargo.pickupLocation?.name || 'Unknown',
        deliveryLocation: cargo.deliveryLocation?.name || 'Unknown',
      }));
  }, [cargos]);

  // Get recent cargo activity for "transactions" section
  const recentCargoActivity = useMemo(() => {
    // For CARGO_RECEIVER: Show recent assigned cargos with inspection status
    if (user?.role === 'CARGO_RECEIVER') {
      return cargos
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 5)
        .map((cargo) => {
          const date = new Date(cargo.updatedAt || cargo.createdAt);
          const isCompleted = cargo.inspectionStatus === 'COMPLETED' || cargo.allItemsVerified;
          const status = isCompleted ? 'COMPLETED' : 'PENDING';

          return {
            id: cargo.id,
            name: cargo.title || `Cargo ${cargo.id.slice(0, 8)} `,
            type: cargo.cargoType || 'General',
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            amount: Number(cargo.loadValue) || 0,
            status: status,
            logo: cargo.title?.[0]?.toUpperCase() || 'C',
            statusColor: isCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700',
            fullCargo: cargo,
          };
        });
    }

    // For other roles: filter for CREATED and DRAFT only
    return cargos
      .filter(c => c.status === 'CREATED' || c.status === 'DRAFT')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 5)
      .map((cargo) => {
        const date = new Date(cargo.updatedAt || cargo.createdAt);
        const statusColors: Record<string, string> = {
          'DELIVERED': 'bg-green-100 text-green-700',
          'IN_TRANSIT': 'bg-blue-100 text-blue-700',
          'ASSIGNED': 'bg-purple-100 text-purple-700',
          'PUBLISHED': 'bg-yellow-100 text-yellow-700',
          'CREATED': 'bg-blue-100 text-blue-700',
          'DRAFT': 'bg-gray-100 text-gray-700',
        };
        return {
          id: cargo.id,
          name: cargo.title || `Cargo ${cargo.id.slice(0, 8)} `,
          type: cargo.cargoType || 'General',
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          amount: Number(cargo.loadValue) || 0,
          status: cargo.status || 'DRAFT',
          logo: cargo.title?.[0]?.toUpperCase() || 'C',
          statusColor: statusColors[cargo.status] || 'bg-gray-100 text-gray-700',
          fullCargo: cargo, // Store full cargo data for click handlers
        };
      });
  }, [cargos, user]);

  // Cargo activity data for chart (last 7 days)
  const cargoActivityData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    return days.map((day, index) => {
      const dayDate = new Date(now);
      dayDate.setDate(now.getDate() - (6 - index));
      const dayStart = new Date(dayDate.setHours(0, 0, 0, 0));
      const dayEnd = new Date(dayDate.setHours(23, 59, 59, 999));

      const cargosOnDay = cargos.filter(c => {
        const cargoDate = new Date(c.createdAt || c.updatedAt);
        return cargoDate >= dayStart && cargoDate <= dayEnd;
      }).length;

      return { name: day, value: cargosOnDay };
    });
  }, [cargos]);

  // Sync horizontal menu with tabs (currently unused)
  // const handleNavClick = (tabName: string) => {
  //   setActiveTab(tabName);
  // };

  // Calculate recommendations/insights
  const insights = useMemo(() => {
    const list = [];

    // Draft completion insight
    if (stats.incompleteCargos > 0) {
      list.push({
        type: 'optimization',
        title: 'Finish your drafts',
        message: `You have ${stats.incompleteCargos} incomplete cargo drafts.Finishing them now could help you secure carriers faster.`,
        action: 'View Drafts',
        onClick: () => { setActiveTab('All Cargos'); navigate('/dashboard/cargos/list?status=DRAFT'); },
        icon: Sparkles,
        color: 'text-gray-600',
      });
    }

    // Matching insight
    if (matchingData.matchRecommendations > 0) {
      list.push({
        type: 'opportunity',
        title: 'Smart Matching available',
        message: `We found ${matchingData.matchRecommendations} potential carrier matches.Using Smart Matching typically saves 15 % on shipping costs.`,
        action: 'View Matches',
        onClick: () => { setActiveTab('All Cargos'); navigate('/dashboard/cargos?filter=matching'); },
        icon: Zap,
        color: 'text-gray-600',
      });
    }

    // Market insight (mocked logic for demo)
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 3) { // Mon-Wed
      list.push({
        type: 'trend',
        title: 'High carrier availability',
        message: 'Mid-week is the best time to publish. Carriers are actively looking for backhauls right now.',
        action: 'Create Cargo',
        onClick: () => setShowQuickCreate(true),
        icon: TrendingUp,
        color: 'text-gray-600',
      });
    }

    return list;
  }, [stats.incompleteCargos, matchingData.matchRecommendations]);
  const renderOverview = () => (
    <div className="space-y-4 md:space-y-8 pb-10">
      {/* 1. Hero / Performance Overview */}
      <section className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-white border border-slate-200 shadow-sm p-6 md:p-12 mb-4 md:mb-8">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-[#345E85]/10 text-[#345E85] p-1.5 rounded-lg border border-[#345E85]/10">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#345E85]">System_Summary</h2>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-5">
                Neural <span className="text-[#345E85]">Insights</span>
              </h1>
              <p className="text-xs md:text-lg text-slate-500 font-medium mb-6 md:mb-8 leading-relaxed">
                Aggregated logistics intelligence for {stats.activeCargos} active missions. Optimized with AI matching protocols and real-time capital management.
              </p>

              <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:gap-4">
                <button
                  onClick={() => setShowQuickActionFlow(true)}
                  className="px-4 md:px-8 py-3 md:py-4 bg-[#345E85] text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-md hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 md:gap-3"
                >
                  <Plus className="w-3 h-3 md:w-4 md:w-4" />
                  Add Cargo
                </button>
                <button
                  onClick={() => navigate('/dashboard/analytics')}
                  className="px-4 md:px-8 py-3 md:py-4 bg-white text-slate-700 border border-slate-200 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:border-[#345E85] hover:text-[#345E85] transition-all flex items-center justify-center gap-2 md:gap-3 shadow-sm"
                >
                  <BarChart3 className="w-3 h-3 md:w-4 md:w-4" />
                  Visual Analytics
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Achievements / Status Summary */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-inner">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900">{formatNumber(stats.efficiencyScore)}%</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</div>
                  </div>
                </div>
                <div className="h-2 w-48 bg-white rounded-full overflow-hidden shadow-sm">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full"
                    style={{ width: `${stats.efficiencyScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-2xl p-6 shadow-md text-white">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-black">{formatCurrency(stats.totalValue)}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-white/50">Total Value</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Performance Indicators - Circular Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-6 md:mb-10 place-items-center bg-white p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm">
        {[
          { icon: Package, label: 'TOTAL_PAYLOAD', value: stats.totalCargos, colorClass: 'bg-blue-50 text-[#345E85]', secondaryColor: 'text-[#345E85]', onClick: () => navigate('/dashboard/cargos/list') },
          { icon: Truck, label: 'ACTIVE_MISSIONS', value: stats.activeCargos, colorClass: 'bg-blue-50 text-[#345E85]', secondaryColor: 'text-[#345E85]', onClick: () => navigate('/dashboard/tracking') },
          { icon: CheckCircle, label: 'PROTOCOL_RATE', value: `${formatNumber(stats.onTimeDeliveryRate)}%`, colorClass: 'bg-primary-50 text-primary-500', secondaryColor: 'text-primary-500', onClick: undefined },
          { icon: Clock, label: 'DRAFT_SCOOPES', value: stats.incompleteCargos, colorClass: 'bg-rose-50 text-rose-600', secondaryColor: 'text-rose-600', onClick: () => navigate('/dashboard/cargos/list?status=DRAFT') },
        ].map(({ icon: Icon, label, value, colorClass, secondaryColor, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className={`flex flex-col items-center group ${onClick ? 'cursor-pointer' : ''} w-full`}
          >
            <div className="relative w-full aspect-square max-w-[140px] md:max-w-[160px] rounded-full bg-white border-[6px] md:border-[8px] border-slate-50 flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%" cy="50%" r="44%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className={`opacity-10 transition-all duration-1000 ${secondaryColor}`}
                  strokeDasharray="100 100"
                  strokeDashoffset="25"
                />
              </svg>
              <div className={`p-1.5 rounded-xl mb-1.5 bg-slate-50 group-hover:bg-white transition-all duration-500 shadow-sm ${colorClass}`}>
                <Icon size={14} />
              </div>
              <div className="flex flex-col items-center px-2 w-full overflow-hidden">
                <span className="text-lg font-black text-[#0f172a] tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center leading-none">
                  {value}
                </span>
              </div>
            </div>
            <div className="mt-3 text-center px-1">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-[#345E85] transition-colors duration-300 line-clamp-1">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <section className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
        <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-slate-50 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#345E85]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Recent Activity</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latest cargo updates</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/cargos/list')}
            className="px-4 py-2 bg-slate-50 hover:bg-[#345E85] hover:text-white text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-xl transition-all"
          >
            View All
          </button>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cargo</th>
                <th className="px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Type</th>
                <th className="px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</th>
                <th className="px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Amount</th>
                <th className="px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentCargoActivity.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-7 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No drafts or created cargos yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentCargoActivity.map(tx => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                    onClick={() => handleCargoRowClick(tx.fullCargo)}
                  >
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#345E85] transition-colors shrink-0">
                          <span className="text-xs font-black">{tx.logo}</span>
                        </div>
                        <p className="text-sm font-black text-slate-900 group-hover:text-[#345E85] transition-colors">{tx.name}</p>
                      </div>
                    </td>
                    <td className="px-7 py-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tx.type}</span>
                    </td>
                    <td className="px-7 py-4">
                      <span className="text-xs font-medium text-slate-500">{tx.date}</span>
                    </td>
                    <td className="px-7 py-4">
                      <span className="text-sm font-black text-slate-900">{formatCurrency(tx.amount)}</span>
                    </td>
                    <td className="px-7 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${tx.statusColor}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile-only List View for Recent Activity */}
        <div className="md:hidden divide-y divide-slate-50">
          {recentCargoActivity.length === 0 ? (
            <div className="px-7 py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="size-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No activity yet</p>
              </div>
            </div>
          ) : (
            recentCargoActivity.map(tx => (
              <div 
                key={tx.id} 
                className="p-5 active:bg-slate-50 transition-colors"
                onClick={() => handleCargoRowClick(tx.fullCargo)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                      <span className="text-xs font-black">{tx.logo}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">{tx.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{tx.type}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${tx.statusColor}`}>
                    {tx.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                  <span className="text-[10px] font-medium text-slate-400">{tx.date}</span>
                  <span className="text-sm font-black text-[#345E85]">{formatCurrency(tx.amount)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Hide all sections below for CARGO_RECEIVER users */}
      {
        user?.role !== 'CARGO_RECEIVER' && (
          <>
            {/* 3. Advanced Features Section - Premium Styling */}
            <section aria-label="Quick Tools">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl md:text-2xl font-black text-[#0f172a] tracking-tight">Quick Tools</h2>
                <span className="text-[10px] bg-[#345E85] text-white px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-sm">NEW</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Voice Input */}
                <button
                  onClick={() => {
                    setShowVoiceInput(true);
                    markFeatureDiscovered('voice_input');
                  }}
                  className="p-8 bg-white border border-slate-100 rounded-[2.5rem] text-left hover:shadow-xl hover:border-blue-100 transition-all duration-300 group relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-blue-50 rounded-2xl p-4 group-hover:bg-[#345E85] group-hover:text-white transition-all duration-300">
                        <Mic className="w-6 h-6 text-[#345E85] group-hover:text-white" />
                      </div>
                      <span className="text-[10px] bg-slate-50 text-slate-400 px-3 py-1 rounded-lg font-black uppercase tracking-widest">2 Min</span>
                    </div>
                    <h3 className="text-xl font-black text-[#0f172a] tracking-tight mb-2 group-hover:text-[#345E85] transition-colors">Voice Create</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Speak to create cargo hands-free</p>
                  </div>
                </button>

                {/* Document Scanner */}
                <button
                  onClick={() => {
                    setShowDocumentScanner(true);
                    markFeatureDiscovered('document_scanner');
                  }}
                  className="p-8 bg-white border border-slate-100 rounded-[2.5rem] text-left hover:shadow-xl hover:border-blue-100 transition-all duration-300 group relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-blue-50 rounded-2xl p-4 group-hover:bg-[#345E85] group-hover:text-white transition-all duration-300">
                        <Camera className="w-6 h-6 text-[#345E85] group-hover:text-white" />
                      </div>
                      <span className="text-[10px] bg-slate-50 text-slate-400 px-3 py-1 rounded-lg font-black uppercase tracking-widest">Instant</span>
                    </div>
                    <h3 className="text-xl font-black text-[#0f172a] tracking-tight mb-2 group-hover:text-[#345E85] transition-colors">Scan Docs</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Camera upload with OCR</p>
                  </div>
                </button>

                {/* Custom Reports */}
                <button
                  onClick={() => {
                    navigate('/dashboard/reports/builder');
                    markFeatureDiscovered('custom_reports');
                  }}
                  className="p-8 bg-white border border-slate-100 rounded-[2.5rem] text-left hover:shadow-xl hover:border-blue-100 transition-all duration-300 group relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-blue-50 rounded-2xl p-4 group-hover:bg-[#345E85] group-hover:text-white transition-all duration-300">
                        <BarChart3 className="w-6 h-6 text-[#345E85] group-hover:text-white" />
                      </div>
                      <span className="text-[10px] bg-slate-50 text-slate-400 px-3 py-1 rounded-lg font-black uppercase tracking-widest">Builder</span>
                    </div>
                    <h3 className="text-xl font-black text-[#0f172a] tracking-tight mb-2 group-hover:text-[#345E85] transition-colors">Reports</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Build your own dashboards</p>
                  </div>
                </button>

                {/* Route Planner */}
                <button
                  onClick={() => {
                    navigate('/dashboard/routes');
                    markFeatureDiscovered('route_planner');
                  }}
                  className="p-8 bg-white border border-slate-100 rounded-[2.5rem] text-left hover:shadow-xl hover:border-blue-100 transition-all duration-300 group relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-blue-50 rounded-2xl p-4 group-hover:bg-[#345E85] group-hover:text-white transition-all duration-300">
                        <MapPin className="w-6 h-6 text-[#345E85] group-hover:text-white" />
                      </div>
                      <span className="text-[10px] bg-[#345E85] text-white px-3 py-1 rounded-lg font-black uppercase tracking-widest">AI Power</span>
                    </div>
                    <h3 className="text-xl font-black text-[#0f172a] tracking-tight mb-2 group-hover:text-[#345E85] transition-colors">Route Planner</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Optimize multi-stop routes</p>
                  </div>
                </button>
              </div>
            </section>

            {/* 2. Smart Insights Section */}
            {insights.length > 0 && (
              <section aria-label="Smart Insights">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">Smart Insights</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {insights.map((insight, index) => (
                    <div
                      key={index}
                      className="group relative bg-white rounded-[2rem] p-6 border border-slate-100 flex flex-col justify-between h-full hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer shadow-sm"
                      onClick={insight.onClick}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-wider group-hover:text-[#345E85] transition-colors">{insight.title}</h3>
                        <div className={`p-2.5 rounded-xl bg-slate-50 ${insight.color} group-hover:bg-[#345E85] group-hover:text-white transition-all`}>
                          <insight.icon className="w-5 h-5 flex-shrink-0" />
                        </div>
                      </div>
                      <div className="mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{insight.message}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#345E85] uppercase tracking-[0.2em]">Execute Optimization</span>
                        <ArrowUpRight className="w-4 h-4 text-[#345E85] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Main Activity Area */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 hover:shadow-xl transition-all group">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#0f172a] tracking-tight">Cargo Activity</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Global logistics throughput</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-50 text-[#345E85]">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <select className="text-[10px] font-black uppercase tracking-widest border-none bg-slate-50 rounded-xl px-4 py-2 outline-none hover:bg-slate-100 transition-colors">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                    </select>
                  </div>
                </div>
                <div className="h-72 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cargoActivityData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#345E85" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#345E85" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#345E85"
                        strokeWidth={4}
                        dot={{ r: 6, fill: '#345E85', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Live Active List */}
              <div className="lg:col-span-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 hover:shadow-xl transition-all">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#0f172a] tracking-tight">Live Shipments</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time status tracking</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    Operational
                  </div>
                </div>
                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {activeCargosList.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                      <Truck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active deployments</p>
                    </div>
                  ) : (
                    activeCargosList.map((cargo) => (
                      <div
                        key={cargo.id}
                        className="group flex items-center gap-4 p-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg hover:border-blue-100 transition-all cursor-pointer"
                        onClick={() => setActiveTab('Tracking')}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 group-hover:bg-[#345E85] group-hover:text-white transition-all shadow-sm">
                          <cargo.icon className="w-6 h-6 text-[#345E85] group-hover:text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-[#0f172a] text-sm truncate uppercase tracking-tight">{cargo.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate mt-1">{cargo.pickupLocation} → {cargo.deliveryLocation}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 group-hover:border-blue-200">
                          <ArrowUpRight className="w-4 h-4 text-[#345E85]" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('Tracking')}
                  className="w-full mt-8 py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Visual Fleet Map
                </button>
              </div>
            </section>

            {/* 4. Department & Financials Split */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-32">
              {/* Operations Status */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 hover:shadow-xl transition-all">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#0f172a] tracking-tight">Operations Status</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time matching & bidding intelligence</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 text-[#345E85]">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
                {/* Circular cards row */}
                <div className="grid grid-cols-2 gap-6 place-items-center bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100">
                  {[
                    { icon: Gavel, label: 'Global Bidding', value: biddingData.activeAuctions, sub: `Pending: ${biddingData.pendingBids}`, colorClass: 'bg-blue-50 text-[#345E85]', secondaryColor: 'text-[#345E85]', onClick: () => navigate('/dashboard/bidding') },
                    { icon: Zap, label: 'Smart Matching', value: matchingData.matchRecommendations, sub: `Success: ${formatNumber(matchingData.matchSuccessRate)}%`, colorClass: 'bg-blue-50 text-[#345E85]', secondaryColor: 'text-[#345E85]', onClick: () => navigate('/dashboard/cargos?filter=matching') },
                  ].map(({ icon: Icon, label, value, sub, colorClass, secondaryColor, onClick }) => (
                    <div
                      key={label}
                      onClick={onClick}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div className="relative w-36 h-36 rounded-full bg-white border-[8px] border-white flex flex-col items-center justify-center transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50 shadow-sm">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
                          <circle
                            cx="72" cy="72" r="64"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray="402"
                            strokeDashoffset="310"
                            className={`opacity-10 transition-all duration-1000 ${secondaryColor}`}
                          />
                        </svg>
                        <div className={`p-2 rounded-2xl mb-1.5 bg-slate-50 group-hover:bg-white transition-all duration-500 shadow-sm ${colorClass}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col items-center px-3 w-full overflow-hidden">
                          <span className="text-xl font-black text-[#0f172a] tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
                            {value}
                          </span>
                        </div>
                        <div className="absolute inset-3 rounded-full border border-dashed border-slate-100 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
                      </div>
                      <div className="mt-3 text-center px-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-[#345E85] transition-colors duration-300 line-clamp-1">{label}</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Overview */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 hover:shadow-xl transition-all">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#0f172a] tracking-tight">Financial Overview</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Capital distribution & payment lifecycle</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 text-[#345E85]">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>
                {/* Circular cards row */}
                <div className="grid grid-cols-2 gap-6 place-items-center bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100">
                  {[
                    { icon: CreditCard, label: 'Available Balance', value: formatCurrency((Number(stats.totalValue) || 0) * 0.15), sub: '75% utilization', colorClass: 'bg-blue-50 text-[#345E85]', secondaryColor: 'text-[#345E85]', onClick: undefined },
                    { icon: AlertCircle, label: 'Accounts Payable', value: paymentData.pendingPayments, sub: `Value: ${formatCurrency(paymentData.totalAmount)}`, colorClass: 'bg-amber-50 text-amber-500', secondaryColor: 'text-amber-500', onClick: () => navigate('/dashboard/financial') },
                  ].map(({ icon: Icon, label, value, sub, colorClass, secondaryColor, onClick }) => (
                    <div
                      key={label}
                      onClick={onClick}
                      className={`flex flex-col items-center group ${onClick ? 'cursor-pointer' : ''}`}
                    >
                      <div className="relative w-36 h-36 rounded-full bg-white border-[8px] border-white flex flex-col items-center justify-center transition-all duration-500 hover:shadow-xl hover:shadow-slate-200/50 shadow-sm">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
                          <circle
                            cx="72" cy="72" r="64"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray="402"
                            strokeDashoffset="310"
                            className={`opacity-10 transition-all duration-1000 ${secondaryColor}`}
                          />
                        </svg>
                        <div className={`p-2 rounded-2xl mb-1.5 bg-slate-50 group-hover:bg-white transition-all duration-500 shadow-sm ${colorClass}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col items-center px-3 w-full overflow-hidden">
                          <span className="text-sm font-black text-[#0f172a] tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center leading-tight">
                            {value}
                          </span>
                        </div>
                        <div className="absolute inset-3 rounded-full border border-dashed border-slate-100 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
                      </div>
                      <div className="mt-3 text-center px-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-[#345E85] transition-colors duration-300 line-clamp-1">{label}</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Modern Welcome Section - Clean White Theme */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {(() => {
                  const hour = new Date().getHours();
                  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
                  // Get firstName from user object, fallback to profile.firstName, then to 'User'
                  const firstName = (user?.firstName && user.firstName.trim()) ||
                    ((user as any)?.profile?.firstName && (user as any).profile.firstName.trim()) ||
                    'User';
                  return `${greeting}, ${firstName}`;
                })()}
              </h1>
              <p className="mt-1 text-gray-600">
                {stats.totalCargos > 0
                  ? `${stats.activeCargos} active shipment${stats.activeCargos !== 1 ? 's' : ''} • ${stats.completedCargos} completed`
                  : 'Welcome to your dashboard'}
              </p>
            </div>
            {/* Action Buttons - Hidden for CARGO_RECEIVER role */}
            {user?.role !== 'CARGO_RECEIVER' && (
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
                <button
                  onClick={() => setShowQuickActionFlow(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#345E85] text-white rounded-2xl transition-all font-black text-sm shadow-lg shadow-blue-900/10 hover:bg-slate-800"
                >
                  <Zap className="w-5 h-5" />
                  QUICK CREATE
                </button>
                <button
                  onClick={() => setActiveTab('Transactions')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#358c9c] text-white rounded-lg hover:bg-[#2c7380] transition-colors font-medium shadow-sm"
                >
                  <CreditCard className="w-5 h-5" />
                  Request Financing
                </button>
                <button
                  onClick={() => navigate('/cargo-owner/cargos/create')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  Full Form
                </button>
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'All Cargos' && <UnifiedCargoManagement />}
        {activeTab === 'Contracts' && <CargoOwnerContracts />}
        {activeTab === 'Transactions' && <UnifiedFinancialManagement />}
        {activeTab === 'Analytics' && <UnifiedAnalyticsManagement />}
        {activeTab === 'Tracking' && <UnifiedTrackingManagement />}
        {activeTab === 'Documents' && <UnifiedDocumentManagement />}
        {activeTab === 'Notifications' && <UnifiedNotificationManagement />}
        {activeTab === 'Settings' && <UnifiedAccountManagement />}
        {activeTab === 'Support' && <CargoHelpSupport />}
      </div>


      {/* Floating Action Button */}
      <button
        onClick={() => setShowQuickActionFlow(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
        title="Quick Create"
      >
        <Zap className="w-7 h-7" />
      </button>

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onSuccess={() => {
          // Refresh cargo data
          const refreshData = async () => {
            try {
              const cargoData = await fetchCargos(1, '', {});
              setCargos(Array.isArray(cargoData) ? cargoData : []);
            } catch (error) {
              console.error('Error refreshing cargos:', error);
            }
          };
          refreshData();
        }}
      />

      {/* Quick Action Flow - Create & Choose Journey */}
      <QuickActionFlow
        isOpen={showQuickActionFlow}
        onClose={() => setShowQuickActionFlow(false)}
        onComplete={() => {
          markFeatureDiscovered('quick-action-flow');
          // Refresh cargo data
          const refreshData = async () => {
            try {
              const cargoData = await fetchCargos(1, '', {});
              setCargos(Array.isArray(cargoData) ? cargoData : []);
            } catch (error) {
              console.error('Error refreshing cargos:', error);
            }
          };
          refreshData();
        }}
      />

      {/* Onboarding Tour */}
      <OnboardingTour
        isOpen={showOnboardingTour}
        onClose={() => setShowOnboardingTour(false)}
        onComplete={() => {
          completeOnboarding();
          setShowOnboardingTour(false);
        }}
        userRole={(user?.role as "CARGO_OWNER" | "CARRIER" | "ADMIN") || 'CARGO_OWNER'}
      />

      {/* Quick Action Panel */}
      <QuickActionPanel
        isOpen={showQuickActionPanel}
        onClose={() => setShowQuickActionPanel(false)}
        onComplete={() => {
          // Refresh cargo data and optionally navigate to matches/bids
          const refreshData = async () => {
            try {
              const cargoData = await fetchCargos(1, '', {});
              setCargos(Array.isArray(cargoData) ? cargoData : []);
            } catch (error) {
              console.error('Error refreshing cargos:', error);
            }
          };
          refreshData();
        }}
      />

      {/* Voice Input Modal */}
      {showVoiceInput && (
        <VoiceCargoInput
          onDataCaptured={(data) => {
            console.log('Voice data captured:', data);
            // TODO: Open cargo creation form with pre-filled data
            // For now, just show the quick create modal
            setShowVoiceInput(false);
            setShowQuickCreate(true);
          }}
          onClose={() => setShowVoiceInput(false)}
        />
      )}

      {/* Document Scanner Modal */}
      {showDocumentScanner && (
        <CameraDocumentScanner
          documentType="general"
          onDocumentCaptured={(documents) => {
            console.log('Documents captured:', documents);
            // TODO: Handle document upload to backend
            // For now, just close the modal
            setShowDocumentScanner(false);
          }}
          onClose={() => setShowDocumentScanner(false)}
        />
      )}
      {DialogComponent}
    </div>
  );
};

export default Dashboard;