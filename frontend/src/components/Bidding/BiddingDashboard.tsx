import React, { useState, useEffect } from 'react';
import { Gavel, Users, TrendingUp, DollarSign, Heart, LayoutDashboard, PlusCircle, BarChart3, X, AlertCircle } from 'lucide-react';
import { biddingAPI } from '../../services/biddingApi';
import AuctionList from './AuctionList';
import BidHistory from './BidHistory';
import CreateAuction from './CreateAuction';
import BidAnalytics from './BidAnalytics';

import { formatCurrency } from '../../utils/formatNumber';

import { useLocation } from 'react-router-dom';

interface BiddingDashboardProps {
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER';
}

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Auctions</p>
            <h5 className="text-2xl font-black text-gray-900 leading-none">{stats.totalAuctions}</h5>
          </div>
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center group-hover:bg-black transition-colors shadow-lg shadow-gray-200">
            <Gavel className="text-white" size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Bids</p>
            <h5 className="text-2xl font-black text-gray-900 leading-none">{stats.activeBids}</h5>
          </div>
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center group-hover:bg-black transition-colors shadow-lg shadow-gray-200">
            <Users className="text-white" size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Value</p>
            <h5 className="text-2xl font-black text-gray-900 leading-none">
              {(() => {
                const value = stats.totalValue;
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
                return `$${value.toLocaleString()}`;
              })()}
            </h5>
          </div>
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center group-hover:bg-black transition-colors shadow-lg shadow-gray-200">
            <DollarSign className="text-white" size={20} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Success Rate</p>
            <h5 className="text-2xl font-black text-gray-900 leading-none">{stats.successRate}%</h5>
          </div>
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center group-hover:bg-black transition-colors shadow-lg shadow-gray-200">
            <TrendingUp className="text-white" size={20} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="mb-6">
      <div className="bg-gray-50/50 p-1 rounded-xl border border-gray-100 mb-6">
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('auctions')}
            className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap min-h-[40px] ${activeTab === 'auctions'
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <Gavel size={14} />
            Active Auctions
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap min-h-[40px] ${activeTab === 'bids'
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <Users size={14} />
            My Bids
          </button>
          <button
            onClick={() => setActiveTab('watched')}
            className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap min-h-[40px] ${activeTab === 'watched'
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <Heart size={14} />
            Watched
          </button>
          {userRole === 'CARGO_OWNER' && (
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap min-h-[40px] ${activeTab === 'create'
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <PlusCircle size={14} />
              Create Auction
            </button>
          )}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap min-h-[40px] ${activeTab === 'analytics'
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <BarChart3 size={14} />
            Analytics
          </button>
        </nav>
      </div>

      <div className="mt-3 sm:mt-4">
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
    <div className="bidding-dashboard">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <Gavel size={120} className="text-gray-900" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-gray-200">
              <LayoutDashboard className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">
                Bidding <span className="text-gray-400 font-light">Dashboard</span>
              </h2>
              <p className="text-xs text-gray-500 font-bold mt-0.5 uppercase tracking-wider">
                {userRole === 'CARGO_OWNER'
                  ? 'Manage your cargo auctions and review bids'
                  : 'Find loads to bid on and track your activity'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-4 py-1.5 bg-gray-100 text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest ring-1 ring-gray-200">
              {userRole === 'CARGO_OWNER' ? 'Cargo Owner' : 'Truck Owner'}
            </span>
          </div>
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