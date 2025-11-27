import React, { useState, useEffect } from 'react';
import { FaGavel, FaHandshake, FaChartLine, FaClock, FaDollarSign, FaHeart } from 'react-icons/fa';
import { biddingAPI } from '../../services/biddingApi';
import AuctionList from './AuctionList';
import BidHistory from './BidHistory';
import CreateAuction from './CreateAuction';
import BidAnalytics from './BidAnalytics';

interface BiddingDashboardProps {
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER';
}

const BiddingDashboard: React.FC<BiddingDashboardProps> = ({ userRole }) => {
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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-all duration-200 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2.5 w-fit mx-auto mb-2.5 group-hover:scale-110 transition-transform">
            <FaGavel className="text-white" size={18} />
          </div>
          <h5 className="text-xl font-bold text-gray-900 mb-0.5">{stats.totalAuctions}</h5>
          <p className="text-xs text-gray-600">Total Auctions</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-all duration-200 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-2.5 w-fit mx-auto mb-2.5 group-hover:scale-110 transition-transform">
            <FaHandshake className="text-white" size={18} />
          </div>
          <h5 className="text-xl font-bold text-gray-900 mb-0.5">{stats.activeBids}</h5>
          <p className="text-xs text-gray-600">Active Bids</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-all duration-200 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-2.5 w-fit mx-auto mb-2.5 group-hover:scale-110 transition-transform">
            <FaDollarSign className="text-white" size={18} />
          </div>
          <h5 className="text-xl font-bold text-gray-900 mb-0.5">${stats.totalValue.toLocaleString()}</h5>
          <p className="text-xs text-gray-600">Total Value</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center hover:shadow-md transition-all duration-200 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-2.5 w-fit mx-auto mb-2.5 group-hover:scale-110 transition-transform">
            <FaChartLine className="text-white" size={18} />
          </div>
          <h5 className="text-xl font-bold text-gray-900 mb-0.5">{stats.successRate}%</h5>
          <p className="text-xs text-gray-600">Success Rate</p>
        </div>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="mb-6">
      <div className="bg-white rounded-lg border border-gray-200 mb-4">
        <nav className="flex space-x-1 p-1">
          <button
            onClick={() => setActiveTab('auctions')}
            className={`px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === 'auctions'
                ? 'bg-gray-100 text-gray-900 border border-gray-300'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FaGavel className="w-4 h-4" />
            Active Auctions
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
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
            className={`px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === 'watched'
                ? 'bg-gray-100 text-gray-900 border border-gray-300'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FaHeart className="w-4 h-4" />
            Watched
          </button>
          {userRole === 'CARGO_OWNER' && (
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                activeTab === 'create'
                  ? 'bg-gray-100 text-gray-900 border border-gray-300'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FaGavel className="w-4 h-4" />
              Create Auction
            </button>
          )}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === 'analytics'
                ? 'bg-gray-100 text-gray-900 border border-gray-300'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FaChartLine className="w-4 h-4" />
            Analytics
          </button>
        </nav>
      </div>
      
      <div className="mt-4">
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
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-3 text-gray-600">Loading bidding dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bidding-dashboard">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 px-4 py-3 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-1.5">
                <FaGavel className="text-white" size={18} />
              </div>
              Bidding Dashboard
            </h2>
            <p className="text-sm text-gray-600">
              {userRole === 'CARGO_OWNER' 
                ? 'Manage your cargo auctions and review bids'
                : 'Find loads to bid on and track your bidding activity'
              }
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${
            userRole === 'CARGO_OWNER' 
              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
              : 'bg-green-100 text-green-800 border border-green-200'
          }`}>
            {userRole === 'CARGO_OWNER' ? 'Cargo Owner' : 'Truck Owner'}
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
            <div className="ml-2">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-500"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {renderStatsCards()}
      {renderTabs()}
    </div>
  );
};

export default BiddingDashboard; 