import React, { useState, useEffect } from 'react';
import {
  Gavel,
  Users,
  TrendingUp,
  DollarSign,
  PlusCircle,
  BarChart3,
  X,
  AlertCircle,
  Shield,
  Heart
} from 'lucide-react';
import { biddingAPI } from '../../services/biddingApi';
import AuctionList from './AuctionList';
import BidHistory from './BidHistory';
import CreateAuction from './CreateAuction';
import BidAnalytics from './BidAnalytics';
import { cn } from '@/utils/cn';
import { useLocation } from 'react-router-dom';

interface BiddingDashboardProps {
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER';
}

const StatsCard = ({ title, value, icon: Icon, colorClass, secondaryColor }: any) => {
  const displayValue = Array.isArray(value) ? value.length : value;

  return (
    <div className="flex flex-col items-center group">
      <div className="relative w-44 h-44 rounded-full bg-white border-[10px] border-slate-50 flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50">
        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
          <circle
            cx="88"
            cy="88"
            r="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="502"
            strokeDashoffset="400"
            className={cn("opacity-10 transition-all duration-1000 group-hover:stroke-dashoffset-[250]", secondaryColor)}
          />
        </svg>

        <div className={cn("p-2.5 rounded-2xl mb-2 bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-inherit transition-all duration-500 shadow-sm", colorClass)}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex flex-col items-center px-4 w-full overflow-hidden">
          <span className="text-2xl font-black text-[#0f172a] tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
            {displayValue}
          </span>
        </div>

        <div className="absolute inset-4 rounded-full border border-dashed border-slate-100 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
      </div>

      <div className="mt-5 text-center px-2">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-[#345E85] transition-colors duration-300 line-clamp-1">
          {title}
        </p>
      </div>
    </div>
  );
};

const BiddingDashboard: React.FC<BiddingDashboardProps> = ({ userRole }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('auctions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalAuctions: 0,
    activeBids: 0,
    totalValue: 0,
    successRate: 0,
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');
    if (viewParam) {
      setActiveTab(viewParam);
    }
  }, [location.search]);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      // Load dashboard statistics
      const response = await biddingAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      setError('Failed to load dashboard statistics - using demo data');
      console.error('Dashboard stats error:', error);

      // Set demo stats when API fails
      setStats({
        totalAuctions: 12,
        activeBids: 8,
        totalValue: 45000,
        successRate: 72,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStatsCards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 place-items-center bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
      <StatsCard
        title="Active Offers"
        value={stats.totalAuctions}
        icon={Gavel}
        colorClass="bg-blue-50 text-[#345E85]"
        secondaryColor="text-[#345E85]"
      />
      <StatsCard
        title="Live Bids"
        value={Array.isArray(stats.activeBids) ? stats.activeBids.length : stats.activeBids}
        icon={Users}
        colorClass="bg-emerald-50 text-emerald-600"
        secondaryColor="text-emerald-600"
      />
      <StatsCard
        title="Total Volume"
        value={(() => {
          const rawValue = stats.totalValue;
          let value = Array.isArray(rawValue) ? rawValue.reduce((a: any, b: any) => a + (parseFloat(b) || 0), 0) : rawValue;
          if (typeof value !== 'number') value = parseFloat(value as string) || 0;

          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
          return value.toLocaleString();
        })()}
        icon={DollarSign}
        colorClass="bg-amber-50 text-amber-600"
        secondaryColor="text-amber-600"
      />
      <StatsCard
        title="Win Rate"
        value={(() => {
          const rate = Array.isArray(stats.successRate) ? stats.successRate[0] : stats.successRate;
          return `${rate}%`;
        })()}
        icon={TrendingUp}
        colorClass="bg-purple-50 text-purple-600"
        secondaryColor="text-purple-600"
      />
    </div>
  );

  const renderTabs = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
        <nav className="flex gap-1 p-1">
          <button
            onClick={() => setActiveTab('auctions')}
            className={cn(
              "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
              activeTab === 'auctions'
                ? "bg-[#345E85] text-white shadow-lg shadow-blue-900/10"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <Gavel size={14} />
            Live Bidding
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={cn(
              "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
              activeTab === 'bids'
                ? "bg-[#345E85] text-white shadow-lg shadow-blue-900/10"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <Users size={14} />
            My Offers
          </button>
          <button
            onClick={() => setActiveTab('watched')}
            className={cn(
              "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
              activeTab === 'watched'
                ? "bg-[#345E85] text-white shadow-lg shadow-blue-900/10"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <Heart size={14} />
            Watchlist
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
              activeTab === 'analytics'
                ? "bg-[#345E85] text-white shadow-lg shadow-blue-900/10"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <BarChart3 size={14} />
            Performance
          </button>
        </nav>

        {userRole === 'CARGO_OWNER' && (
          <div className="pr-2">
            <button
              onClick={() => setActiveTab('create')}
              className={cn(
                "px-8 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2",
                activeTab === 'create' && "bg-slate-900 shadow-slate-900/10"
              )}
            >
              <PlusCircle size={14} />
              Start Auction
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[400px]">
        {activeTab === 'auctions' && <AuctionList userRole={userRole} />}
        {activeTab === 'bids' && <BidHistory userRole={userRole} />}
        {activeTab === 'watched' && <AuctionList userRole={userRole} showWatchedOnly={true} />}
        {activeTab === 'create' && userRole === 'CARGO_OWNER' && <CreateAuction />}
        {activeTab === 'analytics' && <BidAnalytics userRole={userRole} />}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        <p className="mt-3 text-xs sm:text-sm text-gray-600">Loading bidding dashboard...</p>
      </div>
    );
  }
  return (
    <div className="space-y-12 max-w-[1600px] mx-auto">
      {/* Header - Premium Enlite Prime Style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#345E85]" />
            </div>
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tight">Bidding & Negotiations</h1>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xl">
            {userRole === 'CARGO_OWNER'
              ? 'Real-time auction management and offer evaluation'
              : 'Strategic bid placement and opportunities discovery'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <AlertCircle className="text-red-600" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-black text-red-900 uppercase tracking-tight italic">{error}</h3>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 text-red-400 hover:text-red-600 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {renderStatsCards()}
      {renderTabs()}
    </div>
  );
};

export default BiddingDashboard; 