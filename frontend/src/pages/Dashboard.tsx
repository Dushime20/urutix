import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Plus,
  DollarSign,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  Zap,
  Target,
  Star,
  TrendingUp as TrendingUpIcon,
  Activity,
  BarChart3,
  Sparkles,
  Gavel,
  Users,
  CreditCard,
  MapPin,
  CheckCircle2,
  Mic,
  Camera
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

// Feature Components
import UnifiedFinancialManagement from './dashboard/financial/UnifiedFinancialManagement';
import UnifiedAnalyticsManagement from './dashboard/analytics/UnifiedAnalyticsManagement';
import UnifiedCargoManagement from './dashboard/cargos/list/UnifiedCargoManagement';
import UnifiedDocumentManagement from './dashboard/documents/UnifiedDocumentManagement';
import UnifiedNotificationManagement from './dashboard/notifications/UnifiedNotificationManagement';
import UnifiedTrackingManagement from './dashboard/tracking/UnifiedTrackingManagement';
import UnifiedAccountManagement from './dashboard/account/UnifiedAccountManagement';
import CargoHelpSupport from './CargoHelpSupport';
import DashboardHeader from '../components/Layout/DashboardHeader';
import DashboardFooter from '../components/Layout/DashboardFooter';
import QuickCreateModal from '../components/Cargo/QuickCreateModal';
import QuickActionPanel from '../components/Cargo/QuickActionPanel';
import QuickActionFlow from '../components/Dashboard/QuickActionFlow';
import OnboardingTour from '../components/Onboarding/OnboardingTour';
import { useOnboardingStore, useShouldShowOnboarding } from '../stores/onboardingStore';
import VoiceCargoInput from '../components/VoiceInput/VoiceCargoInput';
import CameraDocumentScanner from '../components/Camera/CameraDocumentScanner';

const Dashboard = () => {
  const layoutContext = useCargoOwnerLayout();
  const { user } = useAuth();
  const { setHideHeader } = layoutContext || {};
  const navigate = useNavigate();

  // Onboarding state
  const shouldShowOnboarding = useShouldShowOnboarding();
  const { completeOnboarding, incrementLogin, markFeatureDiscovered } = useOnboardingStore();
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);

  // Hide default header on mount, show on unmount
  useEffect(() => {
    if (setHideHeader) {
      setHideHeader(true);
      return () => setHideHeader(false);
    }
  }, [setHideHeader]);

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
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showQuickActionPanel, setShowQuickActionPanel] = useState(false);
  const [showQuickActionFlow, setShowQuickActionFlow] = useState(false);

  // Advanced features state
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showDocumentScanner, setShowDocumentScanner] = useState(false);

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
  const [brokerData, setBrokerData] = useState({
    assignedBrokers: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
    recentAssignments: [] as any[],
  });

  // Payment data for loaded cargos
  const [paymentData, setPaymentData] = useState({
    pendingPayments: 0,
    totalAmount: 0,
    loadedCargos: [] as any[],
    loading: false,
  });

  // Auto-refresh cargos every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await fetchCargos(1, '', {});
        setCargos(Array.isArray(data) ? data : []);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error refreshing cargos:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch cargos and related data on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch cargos
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

        // Calculate broker data from cargos
        try {
          const cargoArray = Array.isArray(cargoData) ? cargoData : [];
          const brokerAssignments = cargoArray.filter((c: any) => c.brokerId).length;
          const brokersWithCommissions = cargoArray.filter((c: any) =>
            c.brokerId && c.brokerCommissionAmount
          );
          const totalCommissions = brokersWithCommissions.reduce((sum: number, c: any) =>
            sum + (Number(c.brokerCommissionAmount) || 0), 0
          );
          const pendingCommissions = brokersWithCommissions.filter((c: any) =>
            c.brokerCommissionStatus === 'PENDING'
          ).length;

          setBrokerData({
            assignedBrokers: brokerAssignments,
            totalCommissions,
            pendingCommissions,
            recentAssignments: cargoArray.filter((c: any) => c.brokerId).slice(0, 5),
          });
        } catch (error) {
          // Set defaults if calculation fails
          setBrokerData({
            assignedBrokers: 0,
            totalCommissions: 0,
            pendingCommissions: 0,
            recentAssignments: [],
          });
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
    const totalValue = cargos.reduce((sum, c) => {
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
  }, [cargos]);

  // Get active/recent cargos for "saving plans" section
  const activeCargosList = useMemo(() => {
    return cargos
      .filter(c => c.status === 'IN_TRANSIT' || c.status === 'ASSIGNED' || c.status === 'PUBLISHED')
      .slice(0, 3)
      .map((cargo, index) => ({
        id: cargo.id,
        name: cargo.title || `Cargo ${cargo.id.slice(0, 8)}`,
        target: cargo.loadValue || 0,
        current: cargo.loadValue ? cargo.loadValue * 0.6 : 0, // Simulated progress
        icon: Truck,
        color: index === 0 ? 'bg-orange-100 text-orange-600' : index === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600',
        status: cargo.status,
        pickupLocation: cargo.pickupLocation?.name || 'Unknown',
        deliveryLocation: cargo.deliveryLocation?.name || 'Unknown',
      }));
  }, [cargos]);

  // Get recent cargo activity for "transactions" section
  const recentCargoActivity = useMemo(() => {
    return cargos
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 4)
      .map((cargo, index) => {
        const date = new Date(cargo.updatedAt || cargo.createdAt);
        const statusColors: Record<string, string> = {
          'DELIVERED': 'bg-green-100 text-green-700',
          'IN_TRANSIT': 'bg-blue-100 text-blue-700',
          'ASSIGNED': 'bg-purple-100 text-purple-700',
          'PUBLISHED': 'bg-yellow-100 text-yellow-700',
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
        };
      });
  }, [cargos]);

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

  // Sync horizontal menu with tabs
  const handleNavClick = (tabName: string) => {
    setActiveTab(tabName);
  };

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
        onClick: () => { setActiveTab('All Cargos'); navigate('/dashboard/cargos?status=DRAFT'); },
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
    <div className="space-y-8">
      {/* 1. Critical Alerts Section */}
      {(biddingData.pendingBids > 0 || matchingData.matchRecommendations > 0 || paymentData.pendingPayments > 0 || stats.incompleteCargos > 0) && (
        <section aria-label="Action Required">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Action Required</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quick Action - Create & Choose */}
            <div
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2 transition-all hover:scale-[1.02] hover:shadow-xl cursor-pointer relative overflow-hidden group"
              onClick={() => setShowQuickActionFlow(true)}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">Quick Action</h3>
                  <div className="p-2 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-3">Create cargo & choose your journey in one flow</p>
                <div className="flex items-center gap-2 text-gray-600 font-medium text-sm group-hover:underline">
                  <span>Get Started</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Pending Bids */}
            {biddingData.pendingBids > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2 transition-transform hover:scale-[1.02] cursor-pointer hover:shadow-md" onClick={() => navigate('/dashboard/bidding')}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">Pending Bids</h3>
                  <div className="p-2 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Gavel className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500">You have {biddingData.pendingBids} bid{biddingData.pendingBids !== 1 ? 's' : ''} waiting.</p>
              </div>
            )}
            {/* Matches */}
            {matchingData.matchRecommendations > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2 transition-transform hover:scale-[1.02] cursor-pointer hover:shadow-md" onClick={() => { setActiveTab('All Cargos'); navigate('/dashboard/cargos?filter=matching'); }}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">Matches</h3>
                  <div className="p-2 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500">{matchingData.matchRecommendations} new match{matchingData.matchRecommendations !== 1 ? 'es' : ''} found.</p>
              </div>
            )}
            {/* Payments */}
            {paymentData.pendingPayments > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2 transition-transform hover:scale-[1.02] cursor-pointer hover:shadow-md" onClick={() => setActiveTab('Transactions')}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">Payments</h3>
                  <div className="p-2 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500">{paymentData.pendingPayments} payment{paymentData.pendingPayments !== 1 ? 's' : ''} due.</p>
              </div>
            )}
            {/* Incomplete */}
            {stats.incompleteCargos > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2 transition-transform hover:scale-[1.02] cursor-pointer hover:shadow-md" onClick={() => { setActiveTab('All Cargos'); navigate('/dashboard/cargos?filter=drafts'); }}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">Drafts</h3>
                  <div className="p-2 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500">{stats.incompleteCargos} draft{stats.incompleteCargos !== 1 ? 's' : ''} pending.</p>
              </div>
            )}
          </div>
        </section>
      )}

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
                  <div className={`p - 2 rounded - lg bg - gray - 50 ${insight.color} shadow - sm`}>
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

      {/* 3. Advanced Features Section */}
      <section aria-label="Advanced Features" className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-gray-900">Advanced Features</h2>
          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-semibold">NEW</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Voice Input */}
          {/* Voice Input */}
          <button
            onClick={() => {
              setShowVoiceInput(true);
              markFeatureDiscovered('voice_input');
            }}
            className="p-6 bg-white border border-gray-200 rounded-2xl text-left hover:shadow-lg transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Voice Create</h3>
              <div className="bg-gray-50 rounded-xl p-3 w-fit group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Speak to create cargo hands-free</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">2 min</span>
              <span className="text-xs text-gray-400">→</span>
            </div>
          </button>

          {/* Document Scanner */}
          <button
            onClick={() => {
              setShowDocumentScanner(true);
              markFeatureDiscovered('document_scanner');
            }}
            className="p-6 bg-white border border-gray-200 rounded-2xl text-left hover:shadow-lg transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Scan Documents</h3>
              <div className="bg-gray-50 rounded-xl p-3 w-fit group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Camera upload with OCR</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Instant</span>
              <span className="text-xs text-gray-400">→</span>
            </div>
          </button>

          {/* Custom Reports */}
          <button
            onClick={() => {
              navigate('/dashboard/reports/builder');
              markFeatureDiscovered('custom_reports');
            }}
            className="p-6 bg-white border border-gray-200 rounded-2xl text-left hover:shadow-lg transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Custom Reports</h3>
              <div className="bg-gray-50 rounded-xl p-3 w-fit group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Build your own dashboards</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Drag & Drop</span>
              <span className="text-xs text-gray-400">→</span>
            </div>
          </button>

          {/* Route Planner */}
          <button
            onClick={() => {
              navigate('/dashboard/routes');
              markFeatureDiscovered('route_planner');
            }}
            className="p-6 bg-white border border-gray-200 rounded-2xl text-left hover:shadow-lg transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Route Planner</h3>
              <div className="bg-gray-50 rounded-xl p-3 w-fit group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Optimize multi-stop routes</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">AI Powered</span>
              <span className="text-xs text-gray-400">→</span>
            </div>
          </button>
        </div>
      </section>

      {/* 4. Key Performance Indicators */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-900">Performance Overview</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Cargos */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Cargos</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCargos}</h3>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            {stats.growthRate > 0 && (
              <div className="flex items-center text-sm text-green-600 font-medium">
                <TrendingUpIcon className="w-4 h-4 mr-1" />
                <span>+{stats.growthRate}% growth</span>
              </div>
            )}
          </div>

          {/* Active Cargos */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Cargos</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.activeCargos}</h3>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <Truck className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-sky-600 font-medium">
              <Activity className="w-4 h-4 mr-1" />
              <span>Live Operations</span>
            </div>
          </div>

          {/* Completed Cargos */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.completedCargos}</h3>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: stats.totalCargos > 0 ? `${(stats.completedCargos / stats.totalCargos) * 100}% ` : '0%' }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{Math.round(stats.completionRate)}% completion rate</p>
          </div>

          {/* Total Value */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : `$${(Number(stats.totalValue) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} `}
                </h3>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-emerald-600 font-medium">
              <Wallet className="w-4 h-4 mr-1" />
              <span>Revenue</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Activity Area */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
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
              activeCargosList.map((cargo, idx) => (
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operations Status */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Operations Status</h3>
            <div className="p-2 rounded-lg bg-gray-50">
              <Truck className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bidding */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/bidding')}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Bidding</span>
                <Gavel className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">{biddingData.activeAuctions}</span>
                <span className="text-xs text-gray-500">active</span>
              </div>
              <div className="mt-2 text-xs text-gray-600 flex justify-between">
                <span>Pending: {biddingData.pendingBids}</span>
                <span>Avg: ${Math.round(biddingData.averageBidAmount)}</span>
              </div>
            </div>

            {/* Matching */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab('All Cargos'); navigate('/dashboard/cargos?filter=matching'); }}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Matching</span>
                <Zap className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">{matchingData.matchRecommendations}</span>
                <span className="text-xs text-gray-500">new</span>
              </div>
              <div className="mt-2 text-xs text-gray-600 flex justify-between">
                <span>Success: {Math.round(matchingData.matchSuccessRate)}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Financial Status */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
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
                  return `$${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} `;
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
                Total: ${paymentData.totalAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 5. Recent Transactions */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No recent activity</td></tr>
              ) : (
                recentCargoActivity.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{tx.name}</td>
                    <td className="px-6 py-4 text-gray-500">{tx.type}</td>
                    <td className="px-6 py-4 text-gray-500">{tx.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">${Number(tx.amount).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px - 2 py - 1 rounded - full text - xs font - medium ${tx.statusColor} `}>
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
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 -m-2 sm:-m-4">
      {/* Use shared DashboardHeader component */}
      <DashboardHeader />

      {/* Welcome Section - unique to Dashboard */}
      {/* Welcome Section - unique to Dashboard */}
      <div className="bg-white border-b border-gray-200 pt-4 pb-0 mb-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-gray-900">
                {(() => {
                  const hour = new Date().getHours();
                  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
                  return `${greeting}, ${user?.firstName || 'User'}!`;
                })()}
              </h1>
              <p className="text-gray-500 text-sm sm:text-base">
                {stats.totalCargos > 0
                  ? `You have ${stats.activeCargos} active cargo${stats.activeCargos !== 1 ? 's' : ''} and ${stats.completedCargos} completed.`
                  : 'Ready to ship your first cargo? Get started below!'}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => setActiveTab('Transactions')}
                className="flex items-center justify-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium touch-manipulation min-h-[40px] hover:shadow-md whitespace-nowrap"
              >
                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Request Financing</span>
              </button>
              <button
                onClick={() => setShowQuickActionPanel(true)}
                className="relative flex items-center justify-center gap-1.5 sm:gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium touch-manipulation min-h-[40px] hover:shadow-lg whitespace-nowrap group"
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:animate-pulse" />
                <span className="font-semibold">Quick Post</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('All Cargos');
                  setTimeout(() => {
                    navigate('/dashboard/cargos/create');
                  }, 100);
                }}
                className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white hover:bg-gray-50 text-gray-700 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium touch-manipulation min-h-[40px] hover:shadow-sm whitespace-nowrap border border-gray-300"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                <span>Full Form</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-4 border-b border-gray-200 text-xs sm:text-sm font-medium overflow-x-auto scrollbar-hide">
            {[
              { id: 'Overview', label: 'Overview' },
              { id: 'All Cargos', label: 'Cargo Management' },
              { id: 'Transactions', label: 'Financials' },
              { id: 'Analytics', label: 'Reports' },
              { id: 'Tracking', label: 'Live Tracking' },
              { id: 'Documents', label: 'Documents' },
              { id: 'Notifications', label: 'Notifications' },
              { id: 'Settings', label: 'Profile' },
              { id: 'Support', label: 'Support' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 relative transition-colors whitespace-nowrap flex-shrink-0 px-2 sm:px-0 touch-manipulation min-h-[44px] sm:min-h-0 flex items-center border-b-2 ${activeTab === tab.id
                  ? 'text-emerald-600 border-emerald-600 font-semibold'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <span className="text-xs sm:text-sm">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 mt-0 sm:mt-2 relative z-20 min-h-[400px] sm:min-h-[500px]">
        {activeTab === 'Overview' && renderOverview()}
        {activeTab === 'All Cargos' && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm min-h-[500px] sm:min-h-[600px]">
            <UnifiedCargoManagement />
          </div>
        )}
        {activeTab === 'Transactions' && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm min-h-[500px] sm:min-h-[600px]">
            <UnifiedFinancialManagement />
          </div>
        )}
        {activeTab === 'Analytics' && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm min-h-[500px] sm:min-h-[600px]">
            <UnifiedAnalyticsManagement />
          </div>
        )}
        {activeTab === 'Tracking' && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm min-h-[500px] sm:min-h-[600px]">
            <UnifiedTrackingManagement />
          </div>
        )}
        {activeTab === 'Documents' && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm min-h-[500px] sm:min-h-[600px]">
            <UnifiedDocumentManagement />
          </div>
        )}
        {activeTab === 'Notifications' && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm min-h-[500px] sm:min-h-[600px]">
            <UnifiedNotificationManagement />
          </div>
        )}
        {activeTab === 'Settings' && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm min-h-[500px] sm:min-h-[600px]">
            <UnifiedAccountManagement />
          </div>
        )}
        {activeTab === 'Support' && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm min-h-[500px] sm:min-h-[600px]">
            <CargoHelpSupport />
          </div>
        )}
      </div>

      {/* Use shared DashboardFooter component */}
      <DashboardFooter />

      {/* Floating Action Button - Always Accessible */}
      <button
        onClick={() => setShowQuickActionFlow(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 group"
        title="Quick Action: Create & Ship"
      >
        <Zap className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
          1
        </span>
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
              setLastUpdate(new Date());
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
              setLastUpdate(new Date());
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
              setLastUpdate(new Date());
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
    </div>
  );
};

export default Dashboard;