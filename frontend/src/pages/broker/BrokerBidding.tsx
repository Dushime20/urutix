import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { biddingAPI } from '../../services/biddingApi';
import AuctionList from '../../components/Bidding/AuctionList';
import BidHistory from '../../components/Bidding/BidHistory';
import BidAnalytics from '../../components/Bidding/BidAnalytics';
import CreateAuction from '../../components/Bidding/CreateAuction';
import { FaGavel, FaHandshake, FaChartLine, FaDollarSign, FaHeart, FaPlus } from 'react-icons/fa';

const BrokerBidding: React.FC = () => {
  const { user } = useAuth();
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
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await biddingAPI.getDashboardStats();
      setStats(response.data);
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      if (error?.response?.status === 401) {
        // Session expired
         // We can't use toast here easily as it's not imported, or maybe it is globally?
         // The other file used toast.
         // Let's use setError for now or assume toast is available if I import it?
         // I don't see toast imported in Step 603 file view.
         setError('Session expired. Please login again.');
      } else {
         setError('Failed to load dashboard statistics - using demo data');
         setStats({
          totalAuctions: 8,
          activeBids: 5,
          totalValue: 32000,
          successRate: 68,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-all">
        <div className="bg-gray-100 rounded-lg p-2.5 w-fit mx-auto mb-2.5">
          <FaGavel className="text-violet-600" size={16} />
        </div>
        <h5 className="text-xl font-bold text-gray-900 mb-0.5">{stats.totalAuctions}</h5>
        <p className="text-xs text-gray-600">My Auctions</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-all">
        <div className="bg-gray-100 rounded-lg p-2.5 w-fit mx-auto mb-2.5">
          <FaHandshake className="text-emerald-600" size={16} />
        </div>
        <h5 className="text-xl font-bold text-gray-900 mb-0.5">{stats.activeBids}</h5>
        <p className="text-xs text-gray-600">My Active Bids</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-all">
        <div className="bg-gray-100 rounded-lg p-2.5 w-fit mx-auto mb-2.5">
          <FaDollarSign className="text-amber-600" size={16} />
        </div>
        <h5 className="text-xl font-bold text-gray-900 mb-0.5">
          {(() => {
            const value = stats.totalValue;
            if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
            return `$${value.toLocaleString()}`;
          })()}
        </h5>
        <p className="text-xs text-gray-600">Total Value</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-all">
        <div className="bg-gray-100 rounded-lg p-2.5 w-fit mx-auto mb-2.5">
          <FaChartLine className="text-rose-600" size={16} />
        </div>
        <h5 className="text-xl font-bold text-gray-900 mb-0.5">{stats.successRate}%</h5>
        <p className="text-xs text-gray-600">Success Rate</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
        <p className="mt-3 text-sm text-gray-600">Loading bidding dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <div className="bg-gray-100 rounded-lg p-2">
                <FaGavel className="text-violet-600" size={20} />
              </div>
              Bidding Management
            </h1>
            <p className="text-gray-600">
              Participate in cargo auctions and manage your bids
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
            Broker
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 flex-1">
              <h3 className="text-xs font-medium text-red-800">{error}</h3>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-500"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {renderStatsCards()}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <nav className="flex space-x-1 p-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('auctions')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'auctions'
                ? 'bg-gray-100 text-gray-900 border border-gray-300'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FaGavel className="w-4 h-4" />
            Available Auctions
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'bids'
                ? 'bg-gray-100 text-gray-900 border border-gray-300'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FaHandshake className="w-4 h-4" />
            My Bids
          </button>
          <button
            onClick={() => setActiveTab('watched')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'watched'
                ? 'bg-gray-100 text-gray-900 border border-gray-300'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FaHeart className="w-4 h-4" />
            Watched
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'create'
                ? 'bg-gray-100 text-gray-900 border border-gray-300'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FaPlus className="w-4 h-4" />
            Create Auction
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-gray-100 text-gray-900 border border-gray-300'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FaChartLine className="w-4 h-4" />
            Analytics
          </button>
        </nav>

        <div className="p-6">
          {activeTab === 'auctions' && <AuctionList userRole="TRUCK_OWNER" />}
          {activeTab === 'bids' && <BidHistory userRole="TRUCK_OWNER" />}
          {activeTab === 'watched' && <AuctionList userRole="TRUCK_OWNER" showWatchedOnly={true} />}
          {activeTab === 'create' && <CreateAuction />}
          {activeTab === 'analytics' && <BidAnalytics userRole="TRUCK_OWNER" />}
        </div>
      </div>
    </div>
  );
};

export default BrokerBidding;