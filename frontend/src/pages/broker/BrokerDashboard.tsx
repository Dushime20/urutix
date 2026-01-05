import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerStatistics, type BrokerLoad } from '../../services/brokerApi';
import BrokerOnboardingTour from '../../components/Onboarding/BrokerOnboardingTour';
import { useBrokerOnboardingStore } from '../../stores/brokerOnboardingStore';
import DashboardHeader from '../../components/Layout/DashboardHeader';
import DashboardFooter from '../../components/Layout/DashboardFooter';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Zap,
  Target,
  Sparkles,
  MessageSquare,
  Shield,
  FileText,
  BarChart3,
  MapPin,
  Truck,
  Users
} from 'lucide-react';

const BrokerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { incrementLoginCount } = useBrokerOnboardingStore();
  const [statistics, setStatistics] = useState<BrokerStatistics | null>(null);
  const [recentLoads, setRecentLoads] = useState<BrokerLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    if (!user || user.role !== 'BROKER') {
      navigate('/auth');
      return;
    }

    // Increment login count for onboarding
    incrementLoginCount();
    loadDashboardData();
  }, [user, navigate, incrementLoginCount]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load statistics and recent loads in parallel
      const [statsResponse, loadsResponse] = await Promise.all([
        brokerAPI.getBrokerStatistics(user!.id),
        brokerAPI.getBrokerLoads(user!.id, { limit: 5, status: 'ACTIVE' })
      ]);
      
      setStatistics(statsResponse.data);
      setRecentLoads(loadsResponse.data || []);
    } catch (err: any) {
      console.error('Failed to load broker dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Header with Gradient */}
      <div className="bg-gradient-to-r from-orange-500 via-rose-600 to-violet-600 rounded-xl shadow-lg p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.firstName || 'Broker'}! 👋
              </h1>
              <p className="text-orange-100 text-lg">
                Professional logistics facilitation at your fingertips
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
              <p className="text-sm text-orange-100 mb-1">Your Commission Rate</p>
              <p className="text-4xl font-bold">
                {(user as any)?.defaultCommissionRate || 10}%
              </p>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      </div>

      {/* Smart Insights Section */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-violet-600 rounded-lg p-2">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Smart Insights for Today</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Hot Route Alert */}
          <div className="bg-white rounded-lg p-4 border border-orange-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-orange-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Hot Route Alert!</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Nairobi-Mombasa paying <span className="font-bold text-orange-600">20% more</span> this week
            </p>
            <button
              onClick={() => navigate('/dashboard/broker/discovery?route=nairobi-mombasa')}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
            >
              View Loads <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Perfect Match */}
          <div className="bg-white rounded-lg p-4 border border-emerald-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Perfect Matches</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              <span className="font-bold text-emerald-600">3 loads</span> match your top transporters (95% score)
            </p>
            <button
              onClick={() => navigate('/dashboard/broker/smart-matching')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View Matches <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Market Trend */}
          <div className="bg-white rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Market Trend</h3>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Electronics shipments up <span className="font-bold text-blue-600">35%</span> this month
            </p>
            <button
              onClick={() => navigate('/dashboard/broker/market-intelligence')}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Learn More <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Priority Actions */}
      {recentLoads.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-600 rounded-lg p-2">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Priority Actions</h2>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Verify transporter insurance</p>
                  <p className="text-xs text-gray-500">2 transporters need verification</p>
                </div>
              </div>
              <button className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-xs font-medium">
                Verify Now
              </button>
            </div>

            <div className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Review contract signatures</p>
                  <p className="text-xs text-gray-500">1 contract waiting for your signature</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/dashboard/broker/contracts')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium"
              >
                Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Commissions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-violet-600 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commissions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${statistics?.totalCommissions.toLocaleString() || '0.00'}
              </p>
              <p className="text-xs text-emerald-600 font-medium mt-1">↗ +15% this month</p>
            </div>
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-4 shadow-lg">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Total Earned */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-600 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earned</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${statistics?.totalEarned.toLocaleString() || '0.00'}
              </p>
              <p className="text-xs text-gray-500 mt-1">All-time earnings</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 shadow-lg">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Pending Commissions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-600 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${statistics?.totalPending.toLocaleString() || '0.00'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 shadow-lg">
              <Clock className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        {/* Total Loads */}
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-rose-600 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Loads</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {statistics?.totalLoads || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Currently managing</p>
            </div>
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl p-4 shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cargo Discovery */}
          <div 
            className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all text-white"
            onClick={() => navigate('/dashboard/broker/discovery')}
          >
            <div className="bg-white/20 rounded-lg p-3 w-fit mb-3">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Discover Cargo</h3>
            <p className="text-sm text-orange-100 mb-3">
              Find available loads & opportunities
            </p>
            <div className="flex items-center text-sm font-semibold">
              Explore <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>

          {/* Smart Matching */}
          <div 
            className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all text-white"
            onClick={() => navigate('/dashboard/broker/smart-matching')}
          >
            <div className="bg-white/20 rounded-lg p-3 w-fit mb-3">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Smart Matching</h3>
            <p className="text-sm text-violet-100 mb-3">
              AI-powered transporter recommendations
            </p>
            <div className="flex items-center text-sm font-semibold">
              Match Now <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>

          {/* My Loads */}
          <div 
            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all text-white"
            onClick={() => navigate('/dashboard/broker/loads')}
          >
            <div className="bg-white/20 rounded-lg p-3 w-fit mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">My Loads</h3>
            <p className="text-sm text-emerald-100 mb-3">
              Manage assigned loads & tracking
            </p>
            <div className="flex items-center text-sm font-semibold">
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>

          {/* Commissions */}
          <div 
            className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all text-white"
            onClick={() => navigate('/dashboard/broker/commissions')}
          >
            <div className="bg-white/20 rounded-lg p-3 w-fit mb-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Commissions</h3>
            <p className="text-sm text-amber-100 mb-3">
              Track earnings & manage payouts
            </p>
            <div className="flex items-center text-sm font-semibold">
              View Earnings <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Loads & Professional Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Active Loads */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Active Loads</h2>
            <button
              onClick={() => navigate('/dashboard/broker/loads')}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              View All
            </button>
          </div>
          
          {recentLoads.length > 0 ? (
            <div className="space-y-3">
              {recentLoads.slice(0, 3).map((load) => (
                <div
                  key={load.id}
                  onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)}
                  className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{load.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {load.pickupLocation} → {load.deliveryLocation}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      load.status === 'ACTIVE' 
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {load.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <span className="text-xs text-gray-600">
                      Commission: <span className="font-semibold text-emerald-600">
                        ${load.brokerCommissionAmount?.toLocaleString() || '0'}
                      </span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-3">No active loads yet</p>
              <button
                onClick={() => navigate('/dashboard/broker/discovery')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
              >
                Discover Loads
              </button>
            </div>
          )}
        </div>

        {/* Professional Services */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Services</h2>
          <div className="space-y-3">
            <div 
              onClick={() => navigate('/dashboard/broker/contracts')}
              className="p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">Contracts</h3>
                  <p className="text-xs text-gray-500">Manage load agreements</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div 
              onClick={() => navigate('/dashboard/broker/insurance')}
              className="p-4 bg-gradient-to-r from-emerald-50 to-white rounded-lg border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 rounded-lg p-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">Insurance Verification</h3>
                  <p className="text-xs text-gray-500">Verify transporter compliance</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div 
              onClick={() => navigate('/dashboard/broker/escrow')}
              className="p-4 bg-gradient-to-r from-violet-50 to-white rounded-lg border border-violet-200 hover:border-violet-400 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="bg-violet-100 rounded-lg p-2">
                  <DollarSign className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">Escrow Management</h3>
                  <p className="text-xs text-gray-500">Secure payment handling</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div 
              onClick={() => navigate('/dashboard/broker/market-intelligence')}
              className="p-4 bg-gradient-to-r from-amber-50 to-white rounded-lg border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 rounded-lg p-2">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">Market Intelligence</h3>
                  <p className="text-xs text-gray-500">Real-time market insights</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 -m-2 sm:-m-4">
      {/* Broker Onboarding Tour */}
      <BrokerOnboardingTour />

      {/* Dashboard Header */}
      <DashboardHeader />

      {/* Welcome Section with Tabs */}
      <div className="bg-[#1a1f37] text-white -mt-8 sm:-mt-12 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-orange-500/10 rounded-full blur-3xl -mr-8 sm:-mr-16 -mt-8 sm:-mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-rose-500/10 rounded-full blur-3xl -ml-8 sm:-ml-16 -mb-8 sm:-mb-16 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-8 sm:pt-12 pb-3 sm:pb-4">
          {/* Welcome Message */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              {(() => {
                const hour = new Date().getHours();
                const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
                return `${greeting}, ${user?.firstName || 'Broker'}!`;
              })()}
            </h1>
            <p className="text-gray-300 text-sm sm:text-base">
              {statistics?.totalLoads && statistics.totalLoads > 0
                ? `You're managing ${statistics.totalLoads} active load${statistics.totalLoads !== 1 ? 's' : ''} with ${statistics.totalCommissions ? `$${statistics.totalCommissions.toLocaleString()}` : '$0'} in commissions.`
                : 'Ready to facilitate your first deal? Explore available loads below!'}
            </p>
          </div>

          {/* Horizontal Tab Navigation */}
          <div className="flex gap-2 sm:gap-4 border-b border-white/10 text-xs sm:text-sm font-medium overflow-x-auto pb-3 sm:pb-4 scrollbar-hide">
            {[
              { id: 'Overview', label: 'Overview' },
              { id: 'Loads', label: 'My Loads' },
              { id: 'Discovery', label: 'Discovery' },
              { id: 'Matching', label: 'Matching' },
              { id: 'Commissions', label: 'Commissions' },
              { id: 'Contracts', label: 'Contracts' },
              { id: 'Insurance', label: 'Insurance' },
              { id: 'Analytics', label: 'Analytics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-2.5 sm:pb-3 relative transition-colors whitespace-nowrap flex-shrink-0 px-2 sm:px-0 touch-manipulation min-h-[44px] sm:min-h-0 flex items-center ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-400 active:text-gray-300'
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 mt-0 sm:mt-2 relative z-20 min-h-[400px] sm:min-h-[500px] pb-6">
        {activeTab === 'Overview' && renderOverview()}
        
        {activeTab === 'Loads' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">My Loads</h2>
            <p className="text-gray-500">Loads management component will be integrated here</p>
            <button
              onClick={() => navigate('/dashboard/broker/loads')}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              View All Loads
            </button>
          </div>
        )}

        {activeTab === 'Discovery' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Cargo Discovery</h2>
            <p className="text-gray-500">Cargo discovery component will be integrated here</p>
            <button
              onClick={() => navigate('/dashboard/broker/discovery')}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Explore Available Loads
            </button>
          </div>
        )}

        {activeTab === 'Matching' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Smart Matching</h2>
            <p className="text-gray-500">Smart matching component will be integrated here</p>
            <button
              onClick={() => navigate('/dashboard/broker/smart-matching')}
              className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              View Recommendations
            </button>
          </div>
        )}

        {activeTab === 'Commissions' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Commission Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-2">Total Earned</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${statistics?.totalEarned.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-2">This Month</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${statistics?.totalCommissions.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6">
                <p className="text-sm text-gray-600 mb-2">Pending</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${statistics?.totalPending.toLocaleString() || '0'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/broker/commissions')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              View Commission History
            </button>
          </div>
        )}

        {activeTab === 'Contracts' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Contract Management</h2>
            <p className="text-gray-500">Contract management component will be integrated here</p>
            <button
              onClick={() => navigate('/dashboard/broker/contracts')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Manage Contracts
            </button>
          </div>
        )}

        {activeTab === 'Insurance' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Insurance Verification</h2>
            <p className="text-gray-500">Insurance verification component will be integrated here</p>
            <button
              onClick={() => navigate('/dashboard/broker/insurance')}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Verify Insurance
            </button>
          </div>
        )}

        {activeTab === 'Analytics' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Performance Analytics</h2>
            <p className="text-gray-500">Analytics component will be integrated here</p>
            <button
              onClick={() => navigate('/dashboard/broker/analytics')}
              className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              View Analytics
            </button>
          </div>
        )}
      </div>

      {/* Dashboard Footer */}
      <DashboardFooter />
    </div>
  );
};

export default BrokerDashboard;


