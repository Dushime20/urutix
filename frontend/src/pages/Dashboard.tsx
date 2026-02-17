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
  TrendingUp as TrendingUpIcon,
  Activity,
  BarChart3,
  Sparkles,
  Gavel,
  CreditCard,
  MapPin,
  Mic,
  Camera,
  FileText,
  Settings,
  Plus,
  Trash2
} from 'lucide-react';
// Dynamically import recharts to reduce initial bundle size
import {
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { useCargoOwnerLayout } from '../contexts/CargoOwnerLayoutContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchCargos } from '../services/cargoApi';
import { cargoOwnerAPI } from '../services/cargoOwnerAPI';
import api from '../services/api';
import { loadsAPI } from '@/services/load';
import receiverService from '../services/receiverService';
import toast from 'react-hot-toast';
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
import DashboardHeader from '../components/Layout/DashboardHeader';
import DashboardFooter from '../components/Layout/DashboardFooter';
import QuickCreateModal from '../components/Cargo/QuickCreateModal';
import QuickActionPanel from '../components/Cargo/QuickActionPanel';
import QuickActionFlow from '../components/Dashboard/QuickActionFlow';
import OnboardingTour from '../components/Onboarding/OnboardingTour';
import { useOnboardingStore, useShouldShowOnboarding } from '../stores/onboardingStore';
import VoiceCargoInput from '../components/VoiceInput/VoiceCargoInput';
import CameraDocumentScanner from '../components/Camera/CameraDocumentScanner';
import { formatNumber, formatCurrency } from '../utils/formatNumber';
import StatCard from '../components/EnliteUI/Cards/StatCard';

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
  const layoutContext = useCargoOwnerLayout();
  const { user } = useAuth();
  const { setHideHeader } = layoutContext || {};
  const navigate = useNavigate();
  const { confirm: confirmDelete, DialogComponent } = useConfirmDialog();

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
  const [loading, setLoading] = useState(true);
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

  // Handle cargo deletion
  const handleDeleteCargo = async (e: React.MouseEvent, cargoId: string) => {
    e.stopPropagation(); // Prevent row click

    // Use custom confirm dialog
    const shouldDelete = await confirmDelete({
      title: 'Delete Draft',
      message: 'Are you sure you want to delete this draft? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!shouldDelete) return;

    try {
      await loadsAPI.delete(cargoId);
      toast.success('Cargo deleted successfully');

      // Update state to remove deleted cargo
      setCargos(prev => prev.filter(c => c.id !== cargoId));
    } catch (error) {
      console.error('Error deleting cargo:', error);
      toast.error('Failed to delete cargo');
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
  const [receiverStats, setReceiverStats] = useState({
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
    <div className="space-y-6 md:space-y-8">
      {/* 1. Hero / Performance Overview */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm p-8 md:p-12 mb-8">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/10 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">Intelligence Briefing</h2>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                Operations <span className="text-[#345E85]">Command Center</span>
              </h1>
              <p className="text-lg text-slate-500 font-medium mb-8 leading-relaxed">
                Real-time visibility across your logistics network. Optimizing {stats.activeCargos} active shipments with AI-powered matching and automated documentation.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowQuickActionFlow(true)}
                  className="px-8 py-4 bg-[#345E85] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-md hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3"
                >
                  <Plus className="w-4 h-4" />
                  Initiate Shipment
                </button>
                <button
                  onClick={() => navigate('/dashboard/analytics')}
                  className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-xs hover:border-[#345E85] hover:text-[#345E85] transition-all flex items-center gap-3 shadow-sm"
                >
                  <BarChart3 className="w-4 h-4" />
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
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efficiency Score</div>
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
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-white/50">Total Asset Value</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Performance Indicators - ENLITE STYLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard
          title="Total Shipments"
          value={stats.totalCargos}
          icon={<Package />}
          color="primary"
          trend={`${stats.growthRate}%`}
          trendDirection="up"
          subtitle="All Time"
          variant="modern"
          onClick={() => setActiveTab('All Cargos')}
        />
        <StatCard
          title="Active Operations"
          value={stats.activeCargos}
          icon={<Truck />}
          color="primary"
          trend="Live"
          trendDirection="neutral"
          subtitle="En Route / Assigned"
          variant="modern"
          onClick={() => setActiveTab('Tracking')}
        />
        <StatCard
          title="Service Compliance"
          value={`${formatNumber(stats.onTimeDeliveryRate)}%`}
          icon={<CheckCircle />}
          color="primary"
          trend="+2.4%"
          trendDirection="up"
          subtitle="On-Time Delivery"
          variant="modern"
        />
        <StatCard
          title="Pending Actions"
          value={stats.incompleteCargos}
          icon={<Clock />}
          color="primary"
          trend={stats.incompleteCargos > 0 ? "Attention" : "Clear"}
          trendDirection={stats.incompleteCargos > 0 ? "down" : "up"}
          subtitle="Drafts / Pending Info"
          variant="modern"
          onClick={() => navigate('/dashboard/cargos/list?status=DRAFT')}
        />
      </div>

      {/* 2. Recent Activity - MOVED TO SECOND */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-none overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900">Recent Activity</h3>
            <div className="p-2 rounded-lg bg-gray-50">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <button onClick={() => setActiveTab('All Cargos')} className="text-sm text-violet-600 hover:text-violet-700 font-medium">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">Cargo</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentCargoActivity.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No drafts or created cargos yet</td></tr>
              ) : (
                recentCargoActivity.map(tx => (
                  <tr
                    key={tx.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer group"
                    onClick={() => handleCargoRowClick(tx.fullCargo)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-blue-700">{tx.name}</td>
                    <td className="px-6 py-4 text-gray-500">{tx.type}</td>
                    <td className="px-6 py-4 text-gray-500">{tx.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(tx.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.statusColor}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hide all sections below for CARGO_RECEIVER users */}
      {
        user?.role !== 'CARGO_RECEIVER' && (
          <>
            {/* 3. Advanced Features Section - Premium Styling */}
            <section aria-label="Advanced Features">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl md:text-2xl font-black text-[#0f172a] tracking-tight">Advanced Features</h2>
                <span className="text-[10px] bg-[#345E85] text-white px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-sm">NEW</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Voice Input */}
                <button
                  onClick={() => {
                    setShowVoiceInput(true);
                    markFeatureDiscovered('voice_input');
                  }}
                  className="p-6 md:p-8 bg-white border border-slate-200 rounded-3xl text-left hover:shadow-md transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-lg md:text-xl font-black text-[#0f172a] tracking-tight">Voice Create</h3>
                      <div className="bg-blue-50 rounded-2xl p-3 group-hover:scale-110 transition-all duration-300">
                        <Mic className="w-6 h-6 text-[#345E85]" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">Speak to create cargo hands-free</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold">2 min</span>
                      <span className="text-slate-300 text-xs">→</span>
                    </div>
                  </div>
                </button>

                {/* Document Scanner */}
                <button
                  onClick={() => {
                    setShowDocumentScanner(true);
                    markFeatureDiscovered('document_scanner');
                  }}
                  className="p-6 md:p-8 bg-white border border-slate-200 rounded-3xl text-left hover:shadow-md transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-lg md:text-xl font-black text-[#0f172a] tracking-tight">Scan Documents</h3>
                      <div className="bg-blue-50 rounded-2xl p-3 group-hover:scale-110 transition-all duration-300">
                        <Camera className="w-6 h-6 text-[#345E85]" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">Camera upload with OCR</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold">Instant</span>
                      <span className="text-slate-300 text-xs">→</span>
                    </div>
                  </div>
                </button>

                {/* Custom Reports */}
                <button
                  onClick={() => {
                    navigate('/dashboard/reports/builder');
                    markFeatureDiscovered('custom_reports');
                  }}
                  className="p-6 md:p-8 bg-white border border-slate-200 rounded-3xl text-left hover:shadow-md transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-lg md:text-xl font-black text-[#0f172a] tracking-tight">Custom Reports</h3>
                      <div className="bg-blue-50 rounded-2xl p-3 group-hover:scale-110 transition-all duration-300">
                        <BarChart3 className="w-6 h-6 text-[#345E85]" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">Build your own dashboards</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold">Drag & Drop</span>
                      <span className="text-slate-300 text-xs">→</span>
                    </div>
                  </div>
                </button>

                {/* Route Planner */}
                <button
                  onClick={() => {
                    navigate('/dashboard/routes');
                    markFeatureDiscovered('route_planner');
                  }}
                  className="p-6 md:p-8 bg-white border border-slate-200 rounded-3xl text-left hover:shadow-md transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <h3 className="text-lg md:text-xl font-black text-[#0f172a] tracking-tight">Route Planner</h3>
                      <div className="bg-blue-50 rounded-2xl p-3 group-hover:scale-110 transition-all duration-300">
                        <MapPin className="w-6 h-6 text-[#345E85]" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mb-4">Optimize multi-stop routes</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-[#345E85] text-white px-2.5 py-1 rounded-lg font-bold">AI Powered</span>
                      <span className="text-slate-300 text-xs">→</span>
                    </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {insights.map((insight, index) => (
                    <div
                      key={index}
                      className="rounded-xl p-4 border bg-white border-gray-200 flex flex-col justify-between h-full hover:shadow-md transition-shadow cursor-pointer"
                      onClick={insight.onClick}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900 text-sm">{insight.title}</h3>
                        <div className={`p-2 rounded-lg bg-gray-50 ${insight.color} shadow-sm`}>
                          <insight.icon className="w-5 h-5" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{insight.message}</p>
                      </div>
                      <button
                        onClick={insight.onClick}
                        className="self-start text-xs font-semibold text-gray-600 hover:underline mt-2 flex items-center gap-1"
                      >
                        {insight.action}
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3. Main Activity Area */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-none p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900">Cargo Activity</h3>
                  <select className="text-xs border-none bg-gray-50 rounded-lg px-2 py-1 outline-none hover:bg-gray-100">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                  </select>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cargoActivityData}>
                      <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Live Active List */}
              <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900">Live Shipments</h3>
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    Live
                  </div>
                </div>
                <div className="space-y-4">
                  {activeCargosList.length === 0 ? (
                    <p className="text-center text-gray-400 py-4 text-sm">No active shipments</p>
                  ) : (
                    activeCargosList.map((cargo) => (
                      <div key={cargo.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors cursor-pointer" onClick={() => setActiveTab('Tracking')}>
                        <div className="p-2 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                          <cargo.icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{cargo.name}</p>
                          <p className="text-xs text-gray-500 truncate">{cargo.pickupLocation} → {cargo.deliveryLocation}</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))
                  )}
                </div>
                <button onClick={() => setActiveTab('Tracking')} className="w-full mt-4 py-2 text-sm text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition-colors">
                  View Map
                </button>
              </div>
            </section>

            {/* 4. Department & Financials Split */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24">
              {/* Operations Status */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-none p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900">Operations Status</h3>
                  <div className="p-2 rounded-lg bg-gray-50">
                    <Activity className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bidding */}
                  <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/bidding')}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-primary-500 text-xs font-medium uppercase tracking-wider">Bidding</span>
                      <Gavel className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-primary-900">{biddingData.activeAuctions}</span>
                      <span className="text-xs text-primary-500">active</span>
                    </div>
                    <div className="mt-2 text-xs text-primary-600 flex justify-between">
                      <span>Pending: {biddingData.pendingBids}</span>
                      <span>Avg: {formatCurrency(biddingData.averageBidAmount)}</span>
                    </div>
                  </div>

                  {/* Matching */}
                  <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab('All Cargos'); navigate('/dashboard/cargos?filter=matching'); }}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-primary-500 text-xs font-medium uppercase tracking-wider">Matching</span>
                      <Zap className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-primary-900">{matchingData.matchRecommendations}</span>
                      <span className="text-xs text-primary-500">new</span>
                    </div>
                    <div className="mt-2 text-xs text-primary-600 flex justify-between">
                      <span>Success: {formatNumber(matchingData.matchSuccessRate)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Status */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-none p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-900">Financial Overview</h3>
                  <div className="p-2 rounded-lg bg-gray-50">
                    <Wallet className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Wallet */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Balance</span>
                      <Wallet className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-xl font-bold text-gray-900 truncate">
                      {(() => {
                        const balance = (Number(stats.totalValue) || 0) * 0.15;
                        return formatCurrency(balance);
                      })()}
                    </div>
                  </div>

                  {/* Due Payments */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('Transactions')}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Due</span>
                      <AlertCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-xl font-bold text-gray-900">{paymentData.pendingPayments}</div>
                    <div className="mt-2 text-xs text-gray-600">
                      Total: {formatCurrency(paymentData.totalAmount)}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Use shared DashboardHeader component */}
      <DashboardHeader />

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
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowQuickActionFlow(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
                >
                  <Zap className="w-5 h-5" />
                  Quick Create
                </button>
                <button
                  onClick={() => setActiveTab('Transactions')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
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

          {/* Clean Navigation Tabs - Hidden for CARGO_RECEIVER role */}
          {user?.role !== 'CARGO_RECEIVER' && (
            <div className="mt-8 flex gap-1 overflow-x-auto scrollbar-hide">
              {[
                { id: 'Overview', label: 'Overview', icon: Activity },
                { id: 'All Cargos', label: 'Cargos', icon: Package },
                ...(cargos.some(c => c.brokerId) ? [{ id: 'Contracts', label: 'Contracts', icon: FileText }] : []),
                { id: 'Transactions', label: 'Financials', icon: Wallet },
                { id: 'Analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'Documents', label: 'Documents', icon: FileText },
                { id: 'Settings', label: 'Settings', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
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

      {/* Use shared DashboardFooter component */}
      <DashboardFooter />

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