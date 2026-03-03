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
  Heart,
  History as HistoryIcon
} from 'lucide-react';
import { biddingAPI } from '../../services/biddingApi';
import toast from 'react-hot-toast';
import AuctionList from './AuctionList';
import MyAuctions from './MyAuctions';
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
  const [activeTab, setActiveTab] = useState(userRole === 'CARGO_OWNER' ? 'my-auctions' : 'auctions');
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
      const response = await biddingAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      setError('Failed to load dashboard statistics - using demo data');
      console.error('Dashboard stats error:', error);
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

  const renderCargoOwnerStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 place-items-center bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
      <StatsCard
        title="My Auctions"
        value={stats.totalAuctions}
        icon={Gavel}
        colorClass="bg-blue-50 text-[#345E85]"
        secondaryColor="text-[#345E85]"
      />
      <StatsCard
        title="Active Auctions"
        value={Array.isArray(stats.activeBids) ? stats.activeBids.length : stats.activeBids}
        icon={TrendingUp}
        colorClass="bg-emerald-50 text-emerald-600"
        secondaryColor="text-emerald-600"
      />
      <StatsCard
        title="Bids Received"
        value={(() => {
          const rawValue = stats.totalValue;
          let value = Array.isArray(rawValue) ? rawValue.reduce((a: any, b: any) => a + (parseFloat(b) || 0), 0) : rawValue;
          if (typeof value !== 'number') value = parseFloat(value as string) || 0;
          return value.toLocaleString();
        })()}
        icon={Users}
        colorClass="bg-amber-50 text-amber-600"
        secondaryColor="text-amber-600"
      />
      <StatsCard
        title="Success Rate"
        value={(() => {
          const rate = Array.isArray(stats.successRate) ? stats.successRate[0] : stats.successRate;
          return `${rate}%`;
        })()}
        icon={DollarSign}
        colorClass="bg-purple-50 text-purple-600"
        secondaryColor="text-purple-600"
      />
    </div>
  );

  const renderTruckOwnerStats = () => (
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

  const renderCargoOwnerTabs = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <nav className="flex flex-wrap gap-2 p-1">
          <button
            onClick={() => setActiveTab('my-auctions')}
            className={cn(
              "px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-300",
              activeTab === 'my-auctions'
                ? "bg-[#345E85] text-white shadow-xl shadow-blue-900/10"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <Gavel size={14} />
            My Auctions
            <span className={cn(
              "px-2 py-0.5 rounded-lg text-[9px] font-black ml-1",
              activeTab === 'my-auctions' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
            )}>
              {stats.totalAuctions}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={cn(
              "px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-300",
              activeTab === 'create'
                ? "bg-emerald-500 text-white shadow-xl shadow-emerald-900/10"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <PlusCircle size={14} />
            Create Auction
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-300",
              activeTab === 'analytics'
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/10"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <BarChart3 size={14} />
            Analytics
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[400px]">
        {activeTab === 'my-auctions' && <MyAuctions />}
        {activeTab === 'create' && <CreateAuction />}
        {activeTab === 'analytics' && <BidAnalytics userRole={userRole} />}
      </div>
    </div>
  );

  const renderTruckOwnerTabs = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <nav className="flex flex-wrap gap-2 p-1">
          <button
            onClick={() => setActiveTab('auctions')}
            className={cn(
              "px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-300",
              activeTab === 'auctions'
                ? "bg-[#345E85] text-white shadow-xl shadow-blue-900/10"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <Gavel size={14} />
            Available Auctions
            <span className={cn(
              "px-2 py-0.5 rounded-lg text-[9px] font-black ml-1",
              activeTab === 'auctions' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
            )}>
              {stats.totalAuctions}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={cn(
              "px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-300",
              activeTab === 'bids'
                ? "bg-[#345E85] text-white shadow-xl shadow-blue-900/10"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <HistoryIcon size={14} />
            My Past Bids
            <span className={cn(
              "px-2 py-0.5 rounded-lg text-[9px] font-black ml-1",
              activeTab === 'bids' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
            )}>
              {stats.activeBids}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('watched')}
            className={cn(
              "px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-300",
              activeTab === 'watched'
                ? "bg-rose-500 text-white shadow-xl shadow-rose-900/10"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <Heart size={14} className={activeTab === 'watched' ? 'fill-current' : ''} />
            Watchlist
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-300",
              activeTab === 'analytics'
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/10"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <BarChart3 size={14} />
            Performance
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm min-h-[400px]">
        {activeTab === 'auctions' && <AuctionList userRole={userRole} />}
        {activeTab === 'bids' && <BidHistory userRole={userRole} />}
        {activeTab === 'watched' && <AuctionList userRole={userRole} showWatchedOnly={true} />}
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#345E85]" />
            </div>
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tight">
              {userRole === 'CARGO_OWNER' ? 'Auction Management' : 'Bidding & Negotiations'}
            </h1>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xl">
            {userRole === 'CARGO_OWNER'
              ? 'Create and manage auctions for your cargo loads'
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

      {userRole === 'CARGO_OWNER' ? renderCargoOwnerStats() : renderTruckOwnerStats()}
      {userRole === 'CARGO_OWNER' ? renderCargoOwnerTabs() : renderTruckOwnerTabs()}
    </div>
  );
};

export default BiddingDashboard;