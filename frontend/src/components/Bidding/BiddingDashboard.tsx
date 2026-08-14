import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Gavel,
  PlusCircle,
  BarChart3,
  X,
  AlertCircle,
  Shield,
  CheckCircle,
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
import { queryKeys } from '@/lib/queryKeys';
import { useNavigationPermissions } from '../../hooks/useNavigationPermissions';

interface BiddingDashboardProps {
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER' | 'ADMIN' | 'SUPER_ADMIN';
}

const BiddingDashboard: React.FC<BiddingDashboardProps> = ({ userRole }) => {
  const location = useLocation();
  const {
    canAccessBidding,
    canViewAuctions,
    canCreateAuction,
    canManageBids,
    isLoading: permsLoading,
  } = useNavigationPermissions();
  const [activeTab, setActiveTab] = useState(
    userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' 
      ? 'all-bids' 
      : userRole === 'CARGO_OWNER' 
        ? 'my-auctions' 
        : 'auctions'
  );
  const [error, setError] = useState<string | null>(null);

  const { data: stats = {
    totalAuctions: 0,
    activeBids: 0,
  }, isLoading: loading, isError } = useQuery({
    queryKey: queryKeys.bidding.stats,
    queryFn: async () => {
      const response = await biddingAPI.getDashboardStats();
      return response.data;
    },
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (isError) {
      setError('Failed to load dashboard statistics');
    } else {
      setError(null);
    }
  }, [isError]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');
    if (viewParam) {
      setActiveTab(viewParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (permsLoading) return;
    if (userRole === 'TRUCK_OWNER' && activeTab === 'auctions' && !canViewAuctions) {
      setActiveTab('bids');
    }
    if (userRole === 'CARGO_OWNER' && activeTab === 'create' && !canCreateAuction) {
      setActiveTab('my-auctions');
    }
  }, [permsLoading, userRole, activeTab, canViewAuctions, canCreateAuction]);

  if (!permsLoading && !canAccessBidding) {
    return (
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-2">
        <AlertCircle className="mx-auto text-slate-400" size={28} />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No bidding permissions</p>
        <p className="text-xs text-slate-500">Contact an administrator if you need access to auctions or bids.</p>
      </div>
    );
  }

  const renderCargoOwnerTabs = () => (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 justify-between items-center bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm w-full overflow-hidden">
        <nav className="flex items-center gap-1 sm:gap-2 p-1 overflow-x-auto scrollbar-hide w-full">
          {(canManageBids || canCreateAuction || canViewAuctions) && (
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
          )}
          {canCreateAuction && (
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
          )}
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
          {(canManageBids || canCreateAuction) && (
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
          )}
        </nav>
      </div>

      <div className={cn(
        "min-h-[400px]",
        activeTab === 'analytics'
          ? ""
          : "bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm"
      )}>
        {activeTab === 'my-auctions' && <MyAuctions />}
        {activeTab === 'create' && canCreateAuction && <CreateAuction />}
        {activeTab === 'analytics' && <BidAnalytics userRole={userRole} />}
        {activeTab === 'inactive' && <InactiveAuctions />}
      </div>
    </div>
  );

  const renderTruckOwnerTabs = () => (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 justify-between items-center bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm w-full overflow-hidden">
        <nav className="flex items-center gap-1 sm:gap-2 p-1 overflow-x-auto scrollbar-hide w-full">
          {canViewAuctions && (
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
          )}
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
            onClick={() => setActiveTab('accepted')}
            className={cn(
              "px-4 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-[1.8rem] text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 transition-all duration-300 whitespace-nowrap flex-1 md:flex-none justify-center md:justify-start",
              activeTab === 'accepted'
                ? "bg-emerald-500 text-white shadow-xl shadow-emerald-900/10"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <CheckCircle size={14} />
            Accepted Bids
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

      <div className={cn(
        "min-h-[400px]",
        activeTab === 'analytics'
          ? ""
          : "bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm"
      )}>
        {activeTab === 'auctions' && (
          canViewAuctions ? (
            <AuctionList userRole={userRole} />
          ) : (
            <div className="py-16 text-center space-y-2">
              <AlertCircle className="mx-auto text-slate-400" size={28} />
              <p className="text-sm font-bold text-slate-700">Cannot view auctions</p>
              <p className="text-xs text-slate-500">Your account does not have the auctions:view permission.</p>
            </div>
          )
        )}
        {activeTab === 'bids' && <BidHistory userRole={userRole} />}
        {activeTab === 'accepted' && <BidHistory userRole={userRole} initialStatusFilter="ACCEPTED" />}
        {activeTab === 'analytics' && <BidAnalytics userRole={userRole} />}
      </div>
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

      <div className={cn(
        "min-h-[400px]",
        activeTab === 'analytics'
          ? ""
          : "bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm"
      )}>
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
        ? renderAdminTabs() 
        : userRole === 'CARGO_OWNER' 
          ? renderCargoOwnerTabs() 
          : renderTruckOwnerTabs()}
    </div>
  );
};

export default BiddingDashboard;