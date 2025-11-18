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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <FaGavel className="text-blue-500 mb-2 mx-auto" size={24} />
        <h5 className="text-2xl font-bold text-gray-900">{stats.totalAuctions}</h5>
        <p className="text-sm text-gray-500">Total Auctions</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <FaHandshake className="text-green-500 mb-2 mx-auto" size={24} />
        <h5 className="text-2xl font-bold text-gray-900">{stats.activeBids}</h5>
        <p className="text-sm text-gray-500">Active Bids</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <FaDollarSign className="text-yellow-500 mb-2 mx-auto" size={24} />
        <h5 className="text-2xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</h5>
        <p className="text-sm text-gray-500">Total Value</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <FaChartLine className="text-blue-500 mb-2 mx-auto" size={24} />
        <h5 className="text-2xl font-bold text-gray-900">{stats.successRate}%</h5>
        <p className="text-sm text-gray-500">Success Rate</p>
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('auctions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'auctions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Auctions
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bids'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Bids
          </button>
          <button
            onClick={() => setActiveTab('watched')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'watched'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaHeart className="inline mr-1" />
            Watched
          </button>
          {userRole === 'CARGO_OWNER' && (
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create Auction
            </button>
          )}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>
      
      <div className="mt-6">
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            <FaGavel className="text-blue-500 inline mr-2" />
            Bidding Dashboard
          </h2>
          <p className="text-gray-600">
            {userRole === 'CARGO_OWNER' 
              ? 'Manage your cargo auctions and review bids'
              : 'Find loads to bid on and track your bidding activity'
            }
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          userRole === 'CARGO_OWNER' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {userRole === 'CARGO_OWNER' ? 'Cargo Owner' : 'Truck Owner'}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-500"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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