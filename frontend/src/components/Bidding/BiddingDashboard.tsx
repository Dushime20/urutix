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
import AuctionList from './AuctionList';
import MyAuctions from './MyAuctions';
import BidHistory from './BidHistory';
import CreateAuction from './CreateAuction';
import BidAnalytics from './BidAnalytics';
import InactiveAuctions from './InactiveAuctions';
import { cn } from '@/utils/cn';
import { useLocation } from 'react-router-dom';

interface BiddingDashboardProps {
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER' | 'ADMIN' | 'SUPER_ADMIN';
}

const StatsCard = ({ title, value, icon: Icon, colorClass, secondaryColor }: any) => {
  const displayValue = Array.isArray(value) ? value.length : value;

  return (
    <div className="flex flex-col items-center group">
      <div className="relative w-32 h-32 sm:w-44 sm:h-44 rounded-full bg-white dark:bg-slate-950 border-[6px] sm:border-[10px] border-slate-50 dark:border-slate-900/50 flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 dark:hover:border-slate-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-blue-900/10">
        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
          {/* Mobile circle */}
          <circle
            cx="64"
            cy="64"
            r="58"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="364"
            strokeDashoffset="280"
            className={cn("sm:hidden opacity-10 dark:opacity-20 transition-all duration-1000 group-hover:stroke-dashoffset-[150]", secondaryColor)}
          />
          {/* Desktop circle */}
          <circle
            cx="88"
            cy="88"
            r="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="502"
            strokeDashoffset="400"
            className={cn("hidden sm:block opacity-10 dark:opacity-20 transition-all duration-1000 group-hover:stroke-dashoffset-[250]", secondaryColor)}
          />
        </svg>

        <div className={cn("p-2 sm:p-2.5 rounded-xl sm:rounded-2xl mb-1 sm:mb-2 bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:text-inherit transition-all duration-500 shadow-sm", colorClass)}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        <div className="flex flex-col items-center px-2 sm:px-4 w-full overflow-hidden">
          <span className="text-lg sm:text-2xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
            {displayValue}
          </span>
        </div>

        <div className="absolute inset-3 sm:inset-4 rounded-full border border-dashed border-slate-100 dark:border-slate-800 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
      </div>

      <div className="mt-3 sm:mt-5 text-center px-1 sm:px-2">
        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest sm:tracking-[0.2em] group-hover:text-[#345E85] dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-1">
          {title}
        </p>
      </div>
    </div>
  );
};

const BiddingDashboard: React.FC<BiddingDashboardProps> = ({ userRole }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' 
      ? 'all-bids' 
      : userRole === 'CARGO_OWNER' 
        ? 'my-auctions' 
        : 'auctions'
  );
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
      setError('Failed to load dashboard statistics');
      console.error('Dashboard stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCargoOwnerStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-8 sm:mb-12 place-items-center bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
      <StatsCard
        title="My Auctions"
        value={stats.totalAuctions}
        icon={Gavel}
        colorClass="bg-blue-50 dark:bg-blue-900/20 text-[#345E85] dark:text-blue-400"
        secondaryColor="text-[#345E85] dark:text-blue-400"
      />
      <StatsCard
        title="Active Auctions"
        value={Array.isArray(stats.activeBids) ? stats.activeBids.length : stats.activeBids}
        icon={TrendingUp}
        colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
        secondaryColor="text-emerald-600 dark:text-emerald-400"
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
        colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
        secondaryColor="text-amber-600 dark:text-amber-400"
      />
      <StatsCard
        title="Success Rate"
        value={(() => {
          const rate = Array.isArray(stats.successRate) ? stats.successRate[0] : stats.successRate;
          return `${rate}%`;
        })()}
        icon={DollarSign}
        colorClass="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
        secondaryColor="text-purple-600 dark:text-purple-400"
      />
    </div>
  );

  const renderTruckOwnerStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-8 sm:mb-12 place-items-center bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
      <StatsCard
        title="Active Offers"
        value={stats.totalAuctions}
        icon={Gavel}
        colorClass="bg-blue-50 dark:bg-blue-900/20 text-[#345E85] dark:text-blue-400"
        secondaryColor="text-[#345E85] dark:text-blue-400"
      />
      <StatsCard
        title="Live Bids"
        value={Array.isArray(stats.activeBids) ? stats.activeBids.length : stats.activeBids}
        icon={Users}
        colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
        secondaryColor="text-emerald-600 dark:text-emerald-400"
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
        colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
        secondaryColor="text-amber-600 dark:text-amber-400"
      />
      <StatsCard
        title="Win Rate"
        value={(() => {
          const rate = Array.isArray(stats.successRate) ? stats.successRate[0] : stats.successRate;
          return `${rate}%`;
        })()}
        icon={TrendingUp}
        colorClass="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
        secondaryColor="text-purple-600 dark:text-purple-400"
      />
    </div>
  );

  const renderCargoOwnerTabs = () => (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 justify-between items-center bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm w-full overflow-hidden">
        <nav className="flex items-center gap-1 sm:gap-2 p-1 overflow-x-auto scrollbar-hide w-full">
          <button
            onClick={() => setActiveTab('my-auctions')}
            className={cn(
              "px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.8rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
              activeTab === 'my-auctions'
                ? "bg-[#345E85] text-white shadow-xl shadow-blue-900/10"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Gavel size={14} />
            My Auctions
            <span className={cn(
              "px-2 py-0.5 rounded-lg text-[9px] font-black ml-1",
              activeTab === 'my-auctions' ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            )}>
              {stats.totalAuctions}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={cn(
              "px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.8rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
              activeTab === 'create'
                ? "bg-emerald-500 text-white shadow-xl shadow-emerald-900/10"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <PlusCircle size={14} />
            Create
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.8rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
              activeTab === 'analytics'
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/10"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <BarChart3 size={14} />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={cn(
              "px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.8rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
              activeTab === 'inactive'
                ? "bg-slate-600 text-white shadow-xl shadow-slate-900/10"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <HistoryIcon size={14} />
            Inactive
          </button>
        </nav>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px]">
        {activeTab === 'my-auctions' && <MyAuctions />}
        {activeTab === 'create' && <CreateAuction />}
        {activeTab === 'analytics' && <BidAnalytics userRole={userRole} />}
        {activeTab === 'inactive' && <InactiveAuctions />}
      </div>
    </div>
  );

  const renderTruckOwnerTabs = () => (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 justify-between items-center bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm w-full overflow-hidden">
        <nav className="flex items-center gap-1 sm:gap-2 p-1 overflow-x-auto scrollbar-hide w-full">
          <button
            onClick={() => setActiveTab('auctions')}
            className={cn(
              "px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.8rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
              activeTab === 'auctions'
                ? "bg-[#345E85] text-white shadow-xl shadow-blue-900/10"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Gavel size={14} />
            Available
            <span className={cn(
              "px-2 py-0.5 rounded-lg text-[9px] font-black ml-1",
              activeTab === 'auctions' ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            )}>
              {stats.totalAuctions}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={cn(
              "px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.8rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
              activeTab === 'bids'
                ? "bg-[#345E85] text-white shadow-xl shadow-blue-900/10"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <HistoryIcon size={14} />
            Past Bids
            <span className={cn(
              "px-2 py-0.5 rounded-lg text-[9px] font-black ml-1",
              activeTab === 'bids' ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            )}>
              {stats.activeBids}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('watched')}
            className={cn(
              "px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.8rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
              activeTab === 'watched'
                ? "bg-rose-500 text-white shadow-xl shadow-rose-900/10"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Heart size={14} className={activeTab === 'watched' ? 'fill-current' : ''} />
            Watchlist
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.8rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
              activeTab === 'analytics'
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/10"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <BarChart3 size={14} />
            Performance
          </button>
        </nav>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px]">
        {activeTab === 'auctions' && <AuctionList userRole={userRole} />}
        {activeTab === 'bids' && <BidHistory userRole={userRole} />}
        {activeTab === 'watched' && <AuctionList userRole={userRole} showWatchedOnly={true} />}
        {activeTab === 'analytics' && <BidAnalytics userRole={userRole} />}
      </div>
    </div>
  );

  const renderAdminStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-8 sm:mb-12 place-items-center bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
      <StatsCard
        title="Total Auctions"
        value={stats.totalAuctions}
        icon={Gavel}
        colorClass="bg-blue-50 dark:bg-blue-900/20 text-[#345E85] dark:text-blue-400"
        secondaryColor="text-[#345E85] dark:text-blue-400"
      />
      <StatsCard
        title="Active Bids"
        value={Array.isArray(stats.activeBids) ? stats.activeBids.length : stats.activeBids}
        icon={Users}
        colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
        secondaryColor="text-emerald-600 dark:text-emerald-400"
      />
      <StatsCard
        title="Total Value"
        value={(() => {
          const rawValue = stats.totalValue;
          let value = Array.isArray(rawValue) ? rawValue.reduce((a: any, b: any) => a + (parseFloat(b) || 0), 0) : rawValue;
          if (typeof value !== 'number') value = parseFloat(value as string) || 0;
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
          return value.toLocaleString();
        })()}
        icon={DollarSign}
        colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
        secondaryColor="text-amber-600 dark:text-amber-400"
      />
      <StatsCard
        title="Success Rate"
        value={(() => {
          const rate = Array.isArray(stats.successRate) ? stats.successRate[0] : stats.successRate;
          return `${rate}%`;
        })()}
        icon={TrendingUp}
        colorClass="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
        secondaryColor="text-purple-600 dark:text-purple-400"
      />
    </div>
  );

  const renderAdminTabs = () => (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 justify-between items-center bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm w-full overflow-hidden">
        <nav className="flex items-center gap-1 sm:gap-2 p-1 overflow-x-auto scrollbar-hide w-full">
          <button
            onClick={() => setActiveTab('all-bids')}
            className={cn(
              "px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.8rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
              activeTab === 'all-bids'
                ? "bg-[#345E85] text-white shadow-xl shadow-blue-900/10"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <HistoryIcon size={14} />
            All Bids
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.8rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
              activeTab === 'analytics'
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/10"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <BarChart3 size={14} />
            Analytics
          </button>
        </nav>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px]">
        {activeTab === 'all-bids' && <BidHistory userRole={userRole} />}
        {activeTab === 'analytics' && <BidAnalytics userRole={userRole} />}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-12 sm:py-20">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#345E85]"></div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#345E85]">Loading bidding dashboard...</p>
      </div>
    );
  }
  return (
    <div className="space-y-8 sm:space-y-12 max-w-[1600px] mx-auto p-4 sm:p-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shadow-sm">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-[#345E85] dark:text-blue-400" />
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight">
              {userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' 
                ? 'Admin Bidding Overview' 
                : userRole === 'CARGO_OWNER' 
                  ? 'Auction Hub' 
                  : 'Bid & Strategize'}
            </h1>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest sm:tracking-[0.2em] max-w-xl">
            {userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
              ? 'System-wide bidding analytics & monitoring'
              : userRole === 'CARGO_OWNER'
                ? 'Marketplace-driven cargo allocation & pricing control'
                : 'Competitive bidding workflow & discovery mechanisms'}
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

      {userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' 
        ? renderAdminStats() 
        : userRole === 'CARGO_OWNER' 
          ? renderCargoOwnerStats() 
          : renderTruckOwnerStats()}
      {userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' 
        ? renderAdminTabs() 
        : userRole === 'CARGO_OWNER' 
          ? renderCargoOwnerTabs() 
          : renderTruckOwnerTabs()}
    </div>
  );
};

export default BiddingDashboard;