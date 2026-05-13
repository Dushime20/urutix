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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
import PendingDeliveriesList from '../components/CargoReceiver/PendingDeliveriesList';
import CargoOwnerEpodDashboard from '../components/CargoOwner/CargoOwnerEpodDashboard';
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
  const [chartPeriod, setChartPeriod] = useState<'7' | '30'>('7');
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

  // Financial summary for Financial Overview (cargo owner payments)
  const [financialSummary, setFinancialSummary] = useState<{
    paidCount: number;
    paidTotal: number;
    pendingCount: number;
    pendingTotal: number;
    loading: boolean;
  }>({
    paidCount: 0,
    paidTotal: 0,
    pendingCount: 0,
    pendingTotal: 0,
    loading: true,
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
          const data = await fetchCargos(1, '', { limit: 50 });
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

        // Fetch cargos for cargo owners (fetch more for recent activity)
        const cargoData = await fetchCargos(1, '', { limit: 50 });
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

    // Fetch payment summary for Financial Overview (cargo owner: paid & pending)
    const fetchPaymentSummary = async () => {
      try {
        const [completedRes, pendingRes] = await Promise.allSettled([
          api.get('/payments', { params: { status: 'completed', limit: 100 } }),
          api.get('/payments', { params: { status: 'pending', limit: 100 } }),
        ]);

        const completedPayments: any[] =
          completedRes.status === 'fulfilled'
            ? (completedRes.value.data?.payments ?? [])
            : [];
        const pendingPayments: any[] =
          pendingRes.status === 'fulfilled'
            ? (pendingRes.value.data?.payments ?? [])
            : [];

        const paidTotal = completedPayments.reduce(
          (sum: number, p: any) => sum + (Number(p.amount) || 0), 0
        );
        const pendingTotal = pendingPayments.reduce(
          (sum: number, p: any) => sum + (Number(p.amount) || 0), 0
        );

        setFinancialSummary({
          paidCount: completedPayments.length,
          paidTotal,
          pendingCount: pendingPayments.length,
          pendingTotal,
          loading: false,
        });
      } catch {
        setFinancialSummary(prev => ({ ...prev, loading: false }));
      }
    };
    fetchPaymentSummary();
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

    // For other roles: show all recent cargos sorted by latest update
    const statusColors: Record<string, string> = {
      'DELIVERED': 'bg-green-100 text-green-700',
      'IN_TRANSIT': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      'ASSIGNED': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      'PUBLISHED': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      'CREATED': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      'DRAFT': 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400',
      'CANCELLED': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      'COMPLETED': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    };

    return [...cargos]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 10)
      .map((cargo) => {
        const date = new Date(cargo.updatedAt || cargo.createdAt);
        return {
          id: cargo.id,
          name: cargo.title || `Cargo ${cargo.id.slice(0, 8)}`,
          type: cargo.cargoType || 'General',
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          amount: Number(cargo.loadValue) || 0,
          status: cargo.status || 'DRAFT',
          logo: cargo.title?.[0]?.toUpperCase() || 'C',
          statusColor: statusColors[cargo.status] || 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400',
          fullCargo: cargo,
        };
      });
  }, [cargos, user]);

  // Cargo activity data for chart (dynamic period)
  const cargoActivityData = useMemo(() => {
    const days = Number(chartPeriod);
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
      const dayDate = new Date(now);
      dayDate.setDate(now.getDate() - (days - 1 - i));
      const dayStart = new Date(dayDate); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayDate); dayEnd.setHours(23, 59, 59, 999);

      const count = cargos.filter(c => {
        const d = new Date(c.updatedAt || c.createdAt);
        return d >= dayStart && d <= dayEnd;
      }).length;

      const label = days <= 7
        ? dayDate.toLocaleDateString('en-US', { weekday: 'short' })
        : dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      return { name: label, value: count };
    });
  }, [cargos, chartPeriod]);

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
        color: 'text-gray-600 dark:text-slate-400',
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
        color: 'text-gray-600 dark:text-slate-400',
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
        color: 'text-gray-600 dark:text-slate-400',
      });
    }

    return list;
  }, [stats.incompleteCargos, matchingData.matchRecommendations]);
  const renderOverview = () => (
    <div className="space-y-4 md:space-y-6">
      {/* 1. Hero / Performance Overview */}
      <section className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-8 lg:p-10 transition-colors duration-300">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/10 dark:from-blue-900/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
            <div className="max-w-full lg:max-w-2xl">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <div className="bg-[#345E85]/10 dark:bg-primary-900/30 text-[#345E85] dark:text-primary-400 p-1.5 rounded-lg border border-[#345E85]/10 dark:border-primary-800">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#345E85] dark:text-primary-400">System_Summary</h2>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-[1.1] mb-3 md:mb-4">
                Neural <span className="text-[#345E85] dark:text-primary-400">Insights</span>
              </h1>
              <p className="text-xs md:text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium mb-4 md:mb-6 leading-relaxed">
                Aggregated logistics intelligence for {stats.activeCargos} active missions. Optimized with AI matching protocols and real-time capital management.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-3">
                <button
                  onClick={() => setShowQuickActionFlow(true)}
                  className="px-4 md:px-6 lg:px-8 py-2.5 md:py-3 bg-[#345E85] dark:bg-primary-600 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-[10px] lg:text-xs shadow-md hover:bg-slate-800 dark:hover:bg-primary-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Add Cargo
                </button>
                <button
                  onClick={() => navigate('/dashboard/analytics')}
                  className="px-4 md:px-6 lg:px-8 py-2.5 md:py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-[10px] lg:text-xs hover:border-[#345E85] dark:hover:border-primary-500 hover:text-[#345E85] dark:hover:text-primary-400 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Analytics
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:gap-4">
              {/* Achievements / Status Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-5 md:p-6 shadow-inner transition-colors duration-300 w-full lg:w-auto">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100">{formatNumber(stats.efficiencyScore)}%</div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Efficiency</div>
                  </div>
                </div>
                <div className="h-2 w-full max-w-[12rem] bg-white dark:bg-slate-700 rounded-full overflow-hidden shadow-sm">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-600 dark:from-blue-500 dark:to-indigo-700 rounded-full"
                    style={{ width: `${stats.efficiencyScore}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-[#0f172a] dark:bg-slate-950 rounded-2xl p-6 shadow-md text-white border border-transparent dark:border-slate-800 transition-colors duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 dark:bg-slate-900 flex items-center justify-center">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-6 md:mb-10 place-items-center bg-white dark:bg-slate-900 p-4 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
        {[
          { icon: Package, label: 'TOTAL_PAYLOAD', value: stats.totalCargos, colorClass: 'bg-blue-50 dark:bg-blue-900/30 text-[#345E85] dark:text-blue-400', secondaryColor: 'text-[#345E85] dark:text-blue-400', onClick: () => navigate('/dashboard/cargos/list') },
          { icon: Truck, label: 'ACTIVE_MISSIONS', value: stats.activeCargos, colorClass: 'bg-blue-50 dark:bg-blue-900/30 text-[#345E85] dark:text-blue-400', secondaryColor: 'text-[#345E85] dark:text-blue-400', onClick: () => navigate('/dashboard/tracking') },
          { icon: CheckCircle, label: 'PROTOCOL_RATE', value: `${formatNumber(stats.onTimeDeliveryRate)}%`, colorClass: 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400', secondaryColor: 'text-primary-500 dark:text-primary-400', onClick: undefined },
          { icon: Clock, label: 'DRAFT_SCOOPES', value: stats.incompleteCargos, colorClass: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400', secondaryColor: 'text-rose-600 dark:text-rose-400', onClick: () => navigate('/dashboard/cargos/list?status=DRAFT') },
        ].map(({ icon: Icon, label, value, colorClass, secondaryColor, onClick }) => (
          <div
            key={label}
            onClick={onClick}
            className={`flex flex-col items-center group ${!!onClick ? 'cursor-pointer' : ''} w-full`}
          >
            <div className="relative w-full aspect-square max-w-[120px] sm:max-w-[140px] md:max-w-[160px] rounded-full bg-white dark:bg-slate-800 border-[4px] sm:border-[6px] md:border-[8px] border-slate-50 dark:border-slate-700 flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 dark:hover:border-slate-600 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%" cy="50%" r="44%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`opacity-10 transition-all duration-1000 ${secondaryColor}`}
                  strokeDasharray="100 100"
                  strokeDashoffset="25"
                />
              </svg>
              <div className={`p-1 md:p-1.5 rounded-lg md:rounded-xl mb-1 md:mb-1.5 bg-slate-50 dark:bg-slate-700 group-hover:bg-white dark:group-hover:bg-slate-600 transition-all duration-500 shadow-sm ${colorClass}`}>
                <Icon className="w-3 h-3 md:w-4 md:h-4" />
              </div>
              <div className="flex flex-col items-center px-2 w-full overflow-hidden">
                <span className="text-sm sm:text-lg font-black text-[#0f172a] dark:text-slate-100 tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center leading-none">
                  {value}
                </span>
              </div>
            </div>
            <div className="mt-2 md:mt-3 text-center px-1">
              <p className="text-[7px] sm:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] group-hover:text-[#345E85] dark:group-hover:text-primary-400 transition-colors duration-300 line-clamp-1">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <section className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-colors duration-300">
        <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#345E85] dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">Recent Activity</h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Latest cargo updates</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/cargos/list')}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-[#345E85] dark:hover:bg-primary-600 hover:text-white text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 rounded-xl transition-all"
          >
            View All
          </button>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Cargo</th>
                <th className="px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Type</th>
                <th className="px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Date</th>
                <th className="px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Amount</th>
                <th className="px-7 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentCargoActivity.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-7 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">No cargo activity yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentCargoActivity.map(tx => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    onClick={() => handleCargoRowClick(tx.fullCargo)}
                  >
                    <td className="px-7 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-[#345E85] dark:group-hover:text-primary-400 transition-colors shrink-0">
                          <span className="text-xs font-black">{tx.logo}</span>
                        </div>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-[#345E85] dark:group-hover:text-primary-400 transition-colors">{tx.name}</p>
                      </div>
                    </td>
                    <td className="px-7 py-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{tx.type}</span>
                    </td>
                    <td className="px-7 py-4">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{tx.date}</span>
                    </td>
                    <td className="px-7 py-4">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(tx.amount)}</span>
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
        {/* Mobile-only List View for Recent Activity - Modern Premium Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {recentCargoActivity.length === 0 ? (
            <div className="px-7 py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="size-14 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center">
                  <Package className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">No activity yet</p>
              </div>
            </div>
          ) : (
            recentCargoActivity.map(tx => (
              <div 
                key={tx.id} 
                className="p-5 active:bg-slate-50 dark:active:bg-slate-800/50 transition-all cursor-pointer relative group"
                onClick={() => handleCargoRowClick(tx.fullCargo)}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="size-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0 shadow-sm border border-slate-50 dark:border-slate-700">
                      <span className="text-sm font-black text-[#345E85] dark:text-primary-400">{tx.logo}</span>
                    </div>
                    <div>
                      <h4 className="text-[13px] font-black text-slate-900 dark:text-slate-100 leading-tight mb-0.5">{tx.name}</h4>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{tx.type}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.1em] border ${tx.statusColor}`}>
                    {tx.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{tx.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-[#345E85] dark:text-primary-400">{formatCurrency(tx.amount)}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                  </div>
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
                <h2 className="text-xl md:text-2xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight">Quick Tools</h2>
                <span className="text-[10px] bg-[#345E85] dark:bg-primary-600 text-white px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-sm">NEW</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Voice Input */}
                <button
                  onClick={() => {
                    setShowVoiceInput(true);
                    markFeatureDiscovered('voice_input');
                  }}
                  className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-left hover:shadow-xl hover:border-blue-100 dark:hover:border-primary-700 transition-all duration-300 group relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-4 group-hover:bg-[#345E85] dark:group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                        <Mic className="w-6 h-6 text-[#345E85] dark:text-blue-400 group-hover:text-white" />
                      </div>
                      <span className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-3 py-1 rounded-lg font-black uppercase tracking-widest">2 Min</span>
                    </div>
                    <h3 className="text-xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight mb-2 group-hover:text-[#345E85] dark:group-hover:text-primary-400 transition-colors">Voice Create</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">Speak to create cargo hands-free</p>
                  </div>
                </button>

                {/* Document Scanner */}
                <button
                  onClick={() => {
                    setShowDocumentScanner(true);
                    markFeatureDiscovered('document_scanner');
                  }}
                  className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-left hover:shadow-xl hover:border-blue-100 dark:hover:border-primary-700 transition-all duration-300 group relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-4 group-hover:bg-[#345E85] dark:group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                        <Camera className="w-6 h-6 text-[#345E85] dark:text-blue-400 group-hover:text-white" />
                      </div>
                      <span className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-3 py-1 rounded-lg font-black uppercase tracking-widest">Instant</span>
                    </div>
                    <h3 className="text-xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight mb-2 group-hover:text-[#345E85] dark:group-hover:text-primary-400 transition-colors">Scan Docs</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">Camera upload with OCR</p>
                  </div>
                </button>

                {/* Custom Reports */}
                <button
                  onClick={() => {
                    navigate('/dashboard/reports/builder');
                    markFeatureDiscovered('custom_reports');
                  }}
                  className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-left hover:shadow-xl hover:border-blue-100 dark:hover:border-primary-700 transition-all duration-300 group relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-4 group-hover:bg-[#345E85] dark:group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                        <BarChart3 className="w-6 h-6 text-[#345E85] dark:text-blue-400 group-hover:text-white" />
                      </div>
                      <span className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-3 py-1 rounded-lg font-black uppercase tracking-widest">Builder</span>
                    </div>
                    <h3 className="text-xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight mb-2 group-hover:text-[#345E85] dark:group-hover:text-primary-400 transition-colors">Reports</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">Build your own dashboards</p>
                  </div>
                </button>

                {/* Route Planner */}
                <button
                  onClick={() => {
                    navigate('/dashboard/routes');
                    markFeatureDiscovered('route_planner');
                  }}
                  className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-left hover:shadow-xl hover:border-blue-100 dark:hover:border-primary-700 transition-all duration-300 group relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-4 group-hover:bg-[#345E85] dark:group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                        <MapPin className="w-6 h-6 text-[#345E85] dark:text-blue-400 group-hover:text-white" />
                      </div>
                      <span className="text-[10px] bg-[#345E85] dark:bg-primary-600 text-white px-3 py-1 rounded-lg font-black uppercase tracking-widest">AI Power</span>
                    </div>
                    <h3 className="text-xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight mb-2 group-hover:text-[#345E85] dark:group-hover:text-primary-400 transition-colors">Route Planner</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">Optimize multi-stop routes</p>
                  </div>
                </button>
              </div>
            </section>

            {/* 2. Smart Insights Section */}
            {insights.length > 0 && (
              <section aria-label="Smart Insights">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Smart Insights</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {insights.map((insight, index) => (
                    <div
                      key={index}
                      className="group relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-full hover:shadow-xl hover:border-blue-100 dark:hover:border-primary-700 transition-all cursor-pointer shadow-sm"
                      onClick={insight.onClick}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-black text-[#0f172a] dark:text-slate-100 uppercase tracking-wider group-hover:text-[#345E85] dark:group-hover:text-primary-400 transition-colors">{insight.title}</h3>
                        <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 ${insight.color} group-hover:bg-[#345E85] dark:group-hover:bg-primary-600 group-hover:text-white transition-all`}>
                          <insight.icon className="w-5 h-5 flex-shrink-0" />
                        </div>
                      </div>
                      <div className="mb-6">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">{insight.message}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-black text-[#345E85] dark:text-primary-400 uppercase tracking-[0.2em]">Execute Optimization</span>
                        <ArrowUpRight className="w-4 h-4 text-[#345E85] dark:text-primary-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Main Activity Area */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10 hover:shadow-xl transition-all group">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight">Cargo Activity</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Global logistics throughput</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#345E85] dark:text-blue-400">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <select
                      value={chartPeriod}
                      onChange={e => setChartPeriod(e.target.value as '7' | '30')}
                      className="text-[10px] font-black uppercase tracking-widest border-none bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl px-4 py-2 outline-none hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <option value="7">Last 7 Days</option>
                      <option value="30">Last 30 Days</option>
                    </select>
                  </div>
                </div>
                <div className="h-72 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cargoActivityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        interval={chartPeriod === '30' ? 4 : 0}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', padding: '8px 14px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}
                        itemStyle={{ color: '#fff', fontSize: 12, fontWeight: 900 }}
                        formatter={(value: number) => [value, 'Cargos']}
                        cursor={{ stroke: '#345E85', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#345E85"
                        strokeWidth={4}
                        dot={{ r: 5, fill: '#345E85', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, fill: '#345E85', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Live Active List */}
              <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10 hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight">Live Shipments</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Real-time status tracking</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                    <div className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></div>
                    Operational
                  </div>
                </div>
                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                  {activeCargosList.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                      <Truck className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">No active deployments</p>
                    </div>
                  ) : (
                    activeCargosList.map((cargo) => (
                      <div
                        key={cargo.id}
                        className="group flex items-center gap-4 p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:border-blue-100 dark:hover:border-primary-700 transition-all duration-300 cursor-pointer"
                        onClick={() => setActiveTab('Tracking')}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center flex-shrink-0 group-hover:bg-[#345E85] dark:group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <cargo.icon className="w-6 h-6 text-[#345E85] dark:text-blue-400 group-hover:text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-[#0f172a] dark:text-slate-100 text-sm truncate uppercase tracking-tight">{cargo.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate mt-1">{cargo.pickupLocation} → {cargo.deliveryLocation}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:border-blue-200 dark:group-hover:border-primary-700">
                          <ArrowUpRight className="w-4 h-4 text-[#345E85] dark:text-blue-400" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('Tracking')}
                  className="w-full mt-8 py-4 bg-[#345E85] dark:bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-primary-700 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  Visual Fleet Map
                </button>
              </div>
            </section>

            {/* 4. Department & Financials Split */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-32">
              {/* Operations Status */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10 hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight">Operations Status</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Real-time matching & bidding intelligence</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#345E85] dark:text-blue-400">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
                {/* Circular cards row */}
                <div className="grid grid-cols-2 gap-6 place-items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700">
                  {[
                    { icon: Gavel, label: 'Global Bidding', value: biddingData.activeAuctions, sub: `Pending: ${biddingData.pendingBids}`, colorClass: 'bg-blue-50 dark:bg-blue-900/30 text-[#345E85] dark:text-blue-400', secondaryColor: 'text-[#345E85] dark:text-blue-400', onClick: () => navigate('/dashboard/bidding') },
                    { icon: Zap, label: 'Smart Matching', value: matchingData.matchRecommendations, sub: `Success: ${formatNumber(matchingData.matchSuccessRate)}%`, colorClass: 'bg-blue-50 dark:bg-blue-900/30 text-[#345E85] dark:text-blue-400', secondaryColor: 'text-[#345E85] dark:text-blue-400', onClick: () => navigate('/dashboard/smart-matching') },
                  ].map(({ icon: Icon, label, value, sub, colorClass, secondaryColor, onClick }) => (
                    <div
                      key={label}
                      onClick={onClick}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div className="relative w-36 h-36 rounded-full bg-white dark:bg-slate-900 border-[8px] border-white dark:border-slate-900 flex flex-col items-center justify-center transition-all duration-500 hover:shadow-xl shadow-sm">
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
                        <div className={`p-2 rounded-2xl mb-1.5 bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-900 transition-all duration-500 shadow-sm ${colorClass}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col items-center px-3 w-full overflow-hidden">
                          <span className="text-xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
                            {value}
                          </span>
                        </div>
                        <div className="absolute inset-3 rounded-full border border-dashed border-slate-100 dark:border-slate-700 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
                      </div>
                      <div className="mt-3 text-center px-2">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] group-hover:text-[#345E85] dark:group-hover:text-primary-400 transition-colors duration-300 line-clamp-1">{label}</p>
                        <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-1">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Overview */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10 hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight">Financial Overview</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Capital distribution & payment lifecycle</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#345E85] dark:text-blue-400">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>
                {/* Circular cards row */}
                <div className="grid grid-cols-2 gap-6 place-items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700">
                  {[
                    { icon: CheckCircle, label: 'Paid Transactions', value: financialSummary.loading ? '...' : `${financialSummary.paidCount} paid`, sub: `Total: ${formatCurrency(financialSummary.paidTotal)}`, colorClass: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', secondaryColor: 'text-emerald-600 dark:text-emerald-400', onClick: () => navigate('/dashboard/financial') },
                    { icon: AlertCircle, label: 'Pending Payments', value: financialSummary.loading ? '...' : `${financialSummary.pendingCount} pending`, sub: `Total: ${formatCurrency(financialSummary.pendingTotal)}`, colorClass: 'bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400', secondaryColor: 'text-amber-500 dark:text-amber-400', onClick: () => navigate('/dashboard/financial') },
                  ].map(({ icon: Icon, label, value, sub, colorClass, secondaryColor, onClick }) => (
                    <div
                      key={label}
                      onClick={onClick}
                      className={`flex flex-col items-center group ${!!onClick ? 'cursor-pointer' : ''}`}
                    >
                      <div className="relative w-36 h-36 rounded-full bg-white dark:bg-slate-900 border-[8px] border-white dark:border-slate-900 flex flex-col items-center justify-center transition-all duration-500 hover:shadow-xl shadow-sm">
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
                        <div className={`p-2 rounded-2xl mb-1.5 bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-900 transition-all duration-500 shadow-sm ${colorClass}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex flex-col items-center px-3 w-full overflow-hidden">
                          <span className="text-sm font-black text-[#0f172a] dark:text-slate-100 tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center leading-tight">
                            {value}
                          </span>
                        </div>
                        <div className="absolute inset-3 rounded-full border border-dashed border-slate-100 dark:border-slate-700 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
                      </div>
                      <div className="mt-3 text-center px-2">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] group-hover:text-[#345E85] dark:group-hover:text-primary-400 transition-colors duration-300 line-clamp-1">{label}</p>
                        <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-1">{sub}</p>
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
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">

      {/* Modern Welcome Section */}
      <div className="bg-white dark:bg-slate-900 shadow-sm transition-colors duration-300 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 md:gap-4">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-slate-100">
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
              <p className="mt-1 text-sm md:text-base text-gray-600 dark:text-slate-400">
                {stats.totalCargos > 0
                  ? `${stats.activeCargos} active shipment${stats.activeCargos !== 1 ? 's' : ''} • ${stats.completedCargos} completed`
                  : 'Welcome to your dashboard'}
              </p>
            </div>
            {/* Action Buttons - Optimized for Mobile Flow */}
            {user?.role !== 'CARGO_RECEIVER' && (
              <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-center justify-center lg:justify-end gap-2 md:gap-3 mt-4 lg:mt-0 w-full lg:w-auto">
                <button
                  onClick={() => setShowQuickActionFlow(true)}
                  className="col-span-2 sm:col-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#345E85] dark:bg-primary-600 text-white rounded-xl md:rounded-2xl transition-all duration-300 font-black text-xs md:text-sm hover:bg-slate-800 dark:hover:bg-primary-700 shadow-lg shadow-blue-500/10 active:scale-95"
                >
                  <Zap className="w-4 h-4 md:w-5 md:h-5" />
                  QUICK CREATE
                </button>
                <button
                  onClick={() => navigate('/dashboard/loan-requests')}
                  className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white dark:bg-slate-800 text-[#358c9c] dark:text-teal-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-teal-100 dark:hover:border-teal-900 transition-all duration-300 font-black text-[10px] md:text-sm shadow-sm active:scale-95"
                >
                  <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
                  Financing
                </button>
                <button
                  onClick={() => navigate('/cargo-owner/cargos/create')}
                  className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 font-black text-[10px] md:text-sm shadow-sm active:scale-95"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  Full Form
                </button>
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Cargo Receiver: Pending Deliveries Section */}
      {user?.role === 'CARGO_RECEIVER' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PendingDeliveriesList />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'All Cargos' && <UnifiedCargoManagement />}
        {activeTab === 'ePOD Reports' && <CargoOwnerEpodDashboard />}
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
              const cargoData = await fetchCargos(1, '', { limit: 50 });
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
              const cargoData = await fetchCargos(1, '', { limit: 50 });
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
              const cargoData = await fetchCargos(1, '', { limit: 50 });
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
