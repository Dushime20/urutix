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

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is a truck owner (CARRIER), redirect to fleet dashboard
  useEffect(() => {
    if (user && user.role === 'CARRIER') {
      navigate('/dashboard/fleet', { replace: true });
    }
  }, [user, navigate]);

  // Otherwise show cargo owner dashboard
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
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showQuickActionPanel, setShowQuickActionPanel] = useState(false);
  const [showQuickActionFlow, setShowQuickActionFlow] = useState(false);

  // Advanced features state
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showDocumentScanner, setShowDocumentScanner] = useState(false);


  // Handle cargo row click - view if CREATED, edit if DRAFT
  const handleCargoRowClick = (cargo: any) => {
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
      type: 'danger'
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

  // Auto-refresh cargos every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await fetchCargos(1, '', {});
        setCargos(Array.isArray(data) ? data : []);
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

  // Get recent cargo activity for "transactions" section - filter for CREATED and DRAFT only
  const recentCargoActivity = useMemo(() => {
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
      {/* 1. Performance Overview - MOVED TO TOP */}
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
                <span>+{formatNumber(stats.growthRate)}% growth</span>
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
            <p className="text-xs text-gray-500 mt-2">{formatNumber(stats.completionRate)}% completion rate</p>
          </div>

          {/* Total Value */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {loading ? '...' : formatCurrency(stats.totalValue)}
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

      {/* 2. Recent Activity - MOVED TO SECOND */}
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
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentCargoActivity.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No drafts or created cargos yet</td></tr>
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-blue-600 group-hover:text-blue-800 font-medium flex items-center gap-1 w-20">
                          {tx.status === 'DRAFT' ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Continue
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </>
                          )}
                        </span>
                        
                        <button
                          onClick={(e) => handleDeleteCargo(e, tx.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Cargo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Advanced Features Section - Premium Styling */}
      <section aria-label="Advanced Features">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl md:text-2xl font-black text-[#0f172a] tracking-tight">Advanced Features</h2>
          <span className="text-[10px] bg-gradient-to-r from-violet-500 to-purple-600 text-white px-3 py-1.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-violet-500/20">NEW</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Voice Input */}
          <button
            onClick={() => {
              setShowVoiceInput(true);
              markFeatureDiscovered('voice_input');
            }}
            className="p-6 md:p-8 bg-white border border-slate-100 rounded-3xl text-left hover:shadow-2xl hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg md:text-xl font-black text-[#0f172a] tracking-tight">Voice Create</h3>
                <div className="bg-teal-50 rounded-2xl p-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Mic className="w-6 h-6 text-teal-600" />
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
            className="p-6 md:p-8 bg-white border border-slate-100 rounded-3xl text-left hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg md:text-xl font-black text-[#0f172a] tracking-tight">Scan Documents</h3>
                <div className="bg-indigo-50 rounded-2xl p-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Camera className="w-6 h-6 text-indigo-600" />
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
            className="p-6 md:p-8 bg-white border border-slate-100 rounded-3xl text-left hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg md:text-xl font-black text-[#0f172a] tracking-tight">Custom Reports</h3>
                <div className="bg-purple-50 rounded-2xl p-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
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
            className="p-6 md:p-8 bg-white border border-slate-100 rounded-3xl text-left hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg md:text-xl font-black text-[#0f172a] tracking-tight">Route Planner</h3>
                <div className="bg-amber-50 rounded-2xl p-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <MapPin className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">Optimize multi-stop routes</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-lg font-bold">AI Powered</span>
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
                <span>Avg: {formatCurrency(biddingData.averageBidAmount)}</span>
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
                <span>Success: {formatNumber(matchingData.matchSuccessRate)}%</span>
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
        </section>
      </div>
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
                  return `${greeting}, ${user?.firstName || 'User'}`;
                })()}
              </h1>
              <p className="mt-1 text-gray-600">
                {stats.totalCargos > 0
                  ? `${stats.activeCargos} active shipment${stats.activeCargos !== 1 ? 's' : ''} • ${stats.completedCargos} completed`
                  : 'Welcome to your dashboard'}
              </p>
            </div>
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
          </div>

          {/* Clean Navigation Tabs */}
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
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