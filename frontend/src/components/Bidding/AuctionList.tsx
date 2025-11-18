import React, { useState, useEffect } from 'react';
import { FaGavel, FaClock, FaDollarSign, FaMapMarkerAlt, FaTruck, FaEye, FaHeart, FaRegHeart } from 'react-icons/fa';
import { biddingAPI } from '../../services/biddingApi';
import BidForm from './BidForm';

interface Auction {
  id: string;
  loadId: string;
  auctionType: 'REVERSE' | 'FORWARD' | 'DUTCH' | 'SEALED';
  status: 'SCHEDULED' | 'ACTIVE' | 'CLOSED' | 'CANCELLED' | 'PAUSED';
  auctionStart: string;
  auctionEnd: string;
  reservePrice?: number;
  minimumBidIncrement?: number;
  totalBids: number;
  uniqueBidders: number;
  currentHighestBid?: number;
  load: {
    title: string;
    description: string;
    weight: number;
    loadValue: number;
    pickupDate: string;
    deliveryDate: string;
    pickupLocation: string;
    deliveryLocation: string;
  };
}

interface AuctionListProps {
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER';
  showWatchedOnly?: boolean;
}

const AuctionList: React.FC<AuctionListProps> = ({ userRole, showWatchedOnly = false }) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    auctionType: 'all',
    minValue: '',
    maxValue: '',
    showWatchedOnly: false,
  });
  const [watchedAuctions, setWatchedAuctions] = useState<Set<string>>(new Set());
  const [loadingWatched, setLoadingWatched] = useState(false);
  const [watchingAuctions, setWatchingAuctions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAuctions();
    loadWatchedAuctions();
  }, [filters]);

  useEffect(() => {
    if (showWatchedOnly) {
      setFilters(prev => ({ ...prev, showWatchedOnly: true }));
    }
  }, [showWatchedOnly]);

  const loadWatchedAuctions = async () => {
    setLoadingWatched(true);
    try {
      const response = await biddingAPI.getWatchedAuctions();
      const watchedIds = new Set(response.data.map((auction: Auction) => auction.id));
      setWatchedAuctions(watchedIds);
    } catch (error) {
      console.error('Load watched auctions error:', error);
      // If API fails, start with empty watched set
      setWatchedAuctions(new Set());
    } finally {
      setLoadingWatched(false);
    }
  };

  const loadAuctions = async () => {
    setLoading(true);
    try {
      let response;
      if (filters.showWatchedOnly) {
        // If showing watched only, get watched auctions
        response = await biddingAPI.getWatchedAuctions();
      } else {
        // Get all auctions with filters
        response = await biddingAPI.getAuctions(filters);
      }
      setAuctions(response.data);
    } catch (error) {
      console.error('Load auctions error:', error);
      
      // Fallback to mock data if API fails
      const mockAuctions = [
        {
          id: 'mock-auction-1',
          loadId: 'mock-load-1',
          auctionType: 'REVERSE',
          status: 'ACTIVE',
          auctionStart: new Date().toISOString(),
          auctionEnd: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          reservePrice: 1500,
          minimumBidIncrement: 50,
          totalBids: 3,
          uniqueBidders: 2,
          currentHighestBid: 1400,
          load: {
            title: 'Electronics Shipment',
            description: 'Fragile electronics from NYC to LA',
            weight: 500,
            loadValue: 5000,
            pickupDate: new Date().toISOString(),
            deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            pickupLocation: 'New York, NY',
            deliveryLocation: 'Los Angeles, CA',
          },
        },
        {
          id: 'mock-auction-2',
          loadId: 'mock-load-2',
          auctionType: 'FORWARD',
          status: 'SCHEDULED',
          auctionStart: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          auctionEnd: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
          reservePrice: 2000,
          minimumBidIncrement: 100,
          totalBids: 0,
          uniqueBidders: 0,
          currentHighestBid: null,
          load: {
            title: 'Furniture Delivery',
            description: 'Heavy furniture from Chicago to Miami',
            weight: 1200,
            loadValue: 3000,
            pickupDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            pickupLocation: 'Chicago, IL',
            deliveryLocation: 'Miami, FL',
          },
        },
      ];
      
      setAuctions(mockAuctions);
      setError('Using demo data - API endpoint not available');
    } finally {
      setLoading(false);
    }
  };

  const handleBidClick = (auction: Auction) => {
    setSelectedAuction(auction);
    setShowBidModal(true);
  };

  const handleWatchToggle = async (auctionId: string) => {
    try {
      setWatchingAuctions(prev => new Set(prev).add(auctionId));
      
      if (watchedAuctions.has(auctionId)) {
        // Unwatch
        await biddingAPI.unwatchAuction(auctionId);
        setWatchedAuctions(prev => {
          const newSet = new Set(prev);
          newSet.delete(auctionId);
          return newSet;
        });
      } else {
        // Watch
        await biddingAPI.watchAuction(auctionId);
        setWatchedAuctions(prev => new Set(prev).add(auctionId));
      }
    } catch (error) {
      console.error('Watch toggle error:', error);
      // You could add a toast notification here
    } finally {
      setWatchingAuctions(prev => {
        const newSet = new Set(prev);
        newSet.delete(auctionId);
        return newSet;
      });
    }
  };

  const handleBidSubmit = async (bidData: any) => {
    try {
      await biddingAPI.submitBid({
        ...bidData,
        loadId: selectedAuction?.loadId,
      });
      setShowBidModal(false);
      setSelectedAuction(null);
      loadAuctions(); // Refresh the list
    } catch (error) {
      console.error('Bid submission error:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      ACTIVE: 'bg-green-100 text-green-800',
      SCHEDULED: 'bg-yellow-100 text-yellow-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      PAUSED: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${variants[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getAuctionTypeBadge = (type: string) => {
    const variants: { [key: string]: string } = {
      REVERSE: 'bg-blue-100 text-blue-800',
      FORWARD: 'bg-green-100 text-green-800',
      DUTCH: 'bg-yellow-100 text-yellow-800',
      SEALED: 'bg-purple-100 text-purple-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${variants[type] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderFilters = () => (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h6 className="text-lg font-medium text-gray-900 mb-4">Filters</h6>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Auction Type</label>
          <select
            value={filters.auctionType}
            onChange={(e) => setFilters({ ...filters, auctionType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="REVERSE">Reverse</option>
            <option value="FORWARD">Forward</option>
            <option value="DUTCH">Dutch</option>
            <option value="SEALED">Sealed</option>
          </select>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showWatchedOnly"
            checked={filters.showWatchedOnly}
            onChange={(e) => setFilters({ ...filters, showWatchedOnly: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="showWatchedOnly" className="ml-2 block text-sm text-gray-700">
            Show Watched Only
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Value</label>
          <input
            type="number"
            placeholder="Min value"
            value={filters.minValue}
            onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Value</label>
          <input
            type="number"
            placeholder="Max value"
            value={filters.maxValue}
            onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderAuctionCard = (auction: Auction) => (
    <div key={auction.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            {getStatusBadge(auction.status)}
            {getAuctionTypeBadge(auction.auctionType)}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleWatchToggle(auction.id)}
              disabled={watchingAuctions.has(auction.id)}
              className={`p-2 rounded-full transition-colors duration-200 ${
                watchedAuctions.has(auction.id)
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-gray-400 hover:text-red-500'
              } ${watchingAuctions.has(auction.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={watchedAuctions.has(auction.id) ? 'Unwatch auction' : 'Watch auction'}
            >
              {watchingAuctions.has(auction.id) ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : watchedAuctions.has(auction.id) ? (
                <FaHeart />
              ) : (
                <FaRegHeart />
              )}
            </button>
            <FaGavel className="text-blue-500" />
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <h6 className="text-lg font-semibold text-gray-900">{auction.load.title}</h6>
          {watchedAuctions.has(auction.id) && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center">
              <FaHeart className="w-3 h-3 mr-1" />
              Watched
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm mb-4">{auction.load.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <FaMapMarkerAlt className="mr-1" />
              Pickup
            </span>
            <span className="text-gray-700">{auction.load.pickupLocation}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <FaMapMarkerAlt className="mr-1" />
              Delivery
            </span>
            <span className="text-gray-700">{auction.load.deliveryLocation}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <div className="text-sm text-gray-500">Weight</div>
            <div className="font-semibold text-gray-900">{auction.load.weight} kg</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Value</div>
            <div className="font-semibold text-gray-900">{formatCurrency(auction.load.loadValue)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Bids</div>
            <div className="font-semibold text-gray-900">{auction.totalBids}</div>
          </div>
        </div>

        {auction.currentHighestBid && (
          <div className="mb-4">
            <div className="text-sm text-gray-500">Current Highest Bid:</div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(auction.currentHighestBid)}</div>
          </div>
        )}

        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center">
            <FaClock className="mr-1" />
            <span>Ends {formatDate(auction.auctionEnd)}</span>
          </div>
          <div>
            <span>{auction.uniqueBidders} bidders</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-gray-50">
        <div className="flex space-x-2">
          <button
            onClick={() => handleBidClick(auction)}
            disabled={auction.status !== 'ACTIVE' || userRole === 'CARGO_OWNER'}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              auction.status !== 'ACTIVE' || userRole === 'CARGO_OWNER'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <FaGavel className="mr-1" />
            {userRole === 'CARGO_OWNER' ? 'View Bids' : 'Place Bid'}
          </button>
          <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200">
            <FaEye className="mr-1" />
            Details
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-3 text-gray-600">Loading auctions...</p>
      </div>
    );
  }

  return (
    <div className="auction-list">
      {renderFilters()}
      
      {filters.showWatchedOnly && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <FaHeart className="text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Watched Auctions</h3>
            <span className="ml-2 text-sm text-red-600">({auctions.length} auctions)</span>
          </div>
        </div>
      )}
      
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

      {auctions.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <FaGavel className="text-blue-400 mr-2 mt-0.5" />
            <span className="text-blue-800">No auctions found matching your criteria.</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {auctions.map(renderAuctionCard)}
        </div>
      )}

      {/* Bid Modal */}
      {showBidModal && selectedAuction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Place Bid</h3>
                <button
                  onClick={() => setShowBidModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <BidForm
                auction={selectedAuction}
                onSubmit={handleBidSubmit}
                onCancel={() => setShowBidModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionList; 