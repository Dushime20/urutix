import React, { useState, useEffect } from 'react';
import {
  Gavel,
  Clock,
  MapPin,
  Eye,
  Heart,
  Grid,
  Table,
  Download
} from 'lucide-react';
import { biddingAPI } from '../../services/biddingApi';
import toast from 'react-hot-toast';
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
  const [watchingAuctions, setWatchingAuctions] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

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
    try {
      const response = await biddingAPI.getWatchedAuctions();
      const watchedIds = new Set<string>(response.data.map((auction: Auction) => auction.id));
      setWatchedAuctions(watchedIds);
    } catch (error) {
      console.error('Load watched auctions error:', error);
      // If API fails, start with empty watched set
      setWatchedAuctions(new Set());
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
        // Clean filters before sending
        const apiFilters: any = {};
        if (filters.status && filters.status !== 'all') apiFilters.status = filters.status;
        if (filters.auctionType && filters.auctionType !== 'all') apiFilters.auctionType = filters.auctionType;
        if (filters.minValue) apiFilters.minValue = filters.minValue;
        if (filters.maxValue) apiFilters.maxValue = filters.maxValue;

        // Get all auctions with filters
        response = await biddingAPI.getAuctions(apiFilters);
      }
      setAuctions(response.data);
    } catch (error) {
      console.error('Load auctions error:', error);
      setError('Failed to load auctions. Please try again.');
      setAuctions([]);
      // Mock data removed to enforce API integration testing
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const toastId = toast.loading('Exporting bid history...');

      // Clean filters
      const apiFilters: any = {};
      if (filters.status && filters.status !== 'all') apiFilters.status = filters.status;
      if (filters.auctionType && filters.auctionType !== 'all') apiFilters.auctionType = filters.auctionType;
      if (filters.minValue) apiFilters.minValue = filters.minValue;
      if (filters.maxValue) apiFilters.maxValue = filters.maxValue;
      if (filters.showWatchedOnly) apiFilters.showWatchedOnly = true;

      const response = await biddingAPI.exportBidHistory(apiFilters);

      // Create download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bid-history-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success('Bid history exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export bid history');
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
      toast.error('Failed to update watchlist');
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
      toast.success('Bid submitted successfully');
      setShowBidModal(false);
      setSelectedAuction(null);
      loadAuctions(); // Refresh the list
    } catch (error) {
      console.error('Bid submission error:', error);
      toast.error('Failed to submit bid. Please try again.');
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
    <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
      <h6 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Filters</h6>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-2.5 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Auction Type</label>
          <select
            value={filters.auctionType}
            onChange={(e) => setFilters({ ...filters, auctionType: e.target.value })}
            className="w-full px-2.5 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
          >
            <option value="all">All Types</option>
            <option value="REVERSE">Reverse</option>
            <option value="FORWARD">Forward</option>
            <option value="DUTCH">Dutch</option>
            <option value="SEALED">Sealed</option>
          </select>
        </div>
        <div className="flex items-center pt-6 sm:pt-0">
          <input
            type="checkbox"
            id="showWatchedOnly"
            checked={filters.showWatchedOnly}
            onChange={(e) => setFilters({ ...filters, showWatchedOnly: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded touch-manipulation"
          />
          <label htmlFor="showWatchedOnly" className="ml-2 block text-xs sm:text-sm text-gray-700">
            Show Watched Only
          </label>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Min Value</label>
          <input
            type="number"
            placeholder="Min value"
            value={filters.minValue}
            onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
            className="w-full px-2.5 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Max Value</label>
          <input
            type="number"
            placeholder="Max value"
            value={filters.maxValue}
            onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
            className="w-full px-2.5 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
          />
        </div>
      </div>
    </div>
  );

  const renderAuctionCard = (auction: Auction) => (
    <div key={auction.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
          <div className="flex flex-wrap gap-2">
            {getStatusBadge(auction.status)}
            {getAuctionTypeBadge(auction.auctionType)}
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => handleWatchToggle(auction.id)}
              disabled={watchingAuctions.has(auction.id)}
              className={`p-2 rounded-full transition-colors duration-200 touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center ${watchedAuctions.has(auction.id)
                ? 'text-red-500 hover:text-red-600'
                : 'text-gray-400 hover:text-red-500'
                } ${watchingAuctions.has(auction.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={watchedAuctions.has(auction.id) ? 'Unwatch auction' : 'Watch auction'}
            >
              {watchingAuctions.has(auction.id) ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : watchedAuctions.has(auction.id) ? (
                <Heart className="w-4 h-4 fill-current" />
              ) : (
                <Heart className="w-4 h-4" />
              )}
            </button>
            <Gavel className="text-gray-500 w-4 h-4" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <h6 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{auction.load.title}</h6>
          {watchedAuctions.has(auction.id) && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center w-fit">
              <Heart className="w-3 h-3 mr-1 fill-current" />
              Watched
            </span>
          )}
        </div>
        <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 break-words">{auction.load.description}</p>

        <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
            <span className="text-gray-500 flex items-center">
              <MapPin className="mr-1 flex-shrink-0 w-3 h-3" />
              Pickup
            </span>
            <span className="text-gray-700 break-words text-right sm:text-left">{auction.load.pickupLocation}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
            <span className="text-gray-500 flex items-center">
              <MapPin className="mr-1 flex-shrink-0 w-3 h-3" />
              Delivery
            </span>
            <span className="text-gray-700 break-words text-right sm:text-left">{auction.load.deliveryLocation}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center mb-3 sm:mb-4">
          <div>
            <div className="text-xs sm:text-sm text-gray-500">Weight</div>
            <div className="font-semibold text-gray-900 text-xs sm:text-sm break-words">{auction.load.weight} kg</div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-gray-500">Value</div>
            <div className="font-semibold text-gray-900 text-xs sm:text-sm break-words">{formatCurrency(auction.load.loadValue)}</div>
          </div>
          <div>
            <div className="text-xs sm:text-sm text-gray-500">Bids</div>
            <div className="font-semibold text-gray-900 text-xs sm:text-sm">{auction.totalBids}</div>
          </div>
        </div>

        {auction.currentHighestBid && (
          <div className="mb-3 sm:mb-4">
            <div className="text-xs sm:text-sm text-gray-500">Current Highest Bid:</div>
            <div className="text-base sm:text-lg font-bold text-green-600 break-words">{formatCurrency(auction.currentHighestBid)}</div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-xs sm:text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="mr-1 flex-shrink-0 w-4 h-4" />
            <span className="break-words">Ends {formatDate(auction.auctionEnd)}</span>
          </div>
          <div>
            <span>{auction.uniqueBidders} bidders</span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-6 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => handleBidClick(auction)}
            disabled={auction.status !== 'ACTIVE' || userRole === 'CARGO_OWNER'}
            className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 touch-manipulation min-h-[44px] sm:min-h-0 flex items-center justify-center gap-1.5 ${auction.status !== 'ACTIVE' || userRole === 'CARGO_OWNER'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            <Gavel className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{userRole === 'CARGO_OWNER' ? 'View Bids' : 'Place Bid'}</span>
          </button>
          <button className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 touch-manipulation min-h-[44px] sm:min-h-0 flex items-center justify-center gap-1.5">
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Details</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-3 text-xs sm:text-sm text-gray-600">Loading auctions...</p>
      </div>
    );
  }

  return (
    <div className="auction-list">
      {renderFilters()}

      {/* View Mode Toggle & Actions */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors mr-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export History</span>
        </button>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode('card')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'card'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'table'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {filters.showWatchedOnly && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center flex-wrap gap-2">
            <Heart className="text-red-500 mr-1 flex-shrink-0 fill-current" />
            <h3 className="text-base sm:text-lg font-medium text-red-800">Watched Auctions</h3>
            <span className="text-xs sm:text-sm text-red-600">({auctions.length} auctions)</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-start sm:items-center">
            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-red-800 break-words">{error}</h3>
            </div>
            <div className="ml-2 flex-shrink-0">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-500 transition-colors touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
                aria-label="Dismiss error"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {auctions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Gavel className="text-gray-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-800 break-words">No auctions found matching your criteria.</span>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {auctions.map(renderAuctionCard)}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left">Auction / Load</th>
                      <th className="px-4 py-3 text-left">Route</th>
                      <th className="px-4 py-3 text-left">Type / weight</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Current Bid</th>
                      <th className="px-4 py-3 text-left">Time Left</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auctions.map((auction) => (
                      <tr key={auction.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Gavel className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{auction.load.title}</div>
                              <div className="text-[10px] flex gap-1 mt-0.5">
                                {getStatusBadge(auction.status)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-900">{auction.load.pickupLocation}</div>
                          <div className="text-[10px] text-gray-400">to</div>
                          <div className="text-xs text-gray-900">{auction.load.deliveryLocation}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{auction.load.weight} kg</div>
                          <div className="text-[10px] text-gray-500">{auction.auctionType}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {auction.currentHighestBid ? (
                            <div className="text-sm font-bold text-green-600">{formatCurrency(auction.currentHighestBid)}</div>
                          ) : (
                            <div className="text-sm text-gray-400">No bids</div>
                          )}
                          <div className="text-[10px] text-gray-500">{auction.totalBids} total bids</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center text-[11px] text-gray-600 gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {new Date(auction.auctionEnd).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleBidClick(auction)}
                              disabled={auction.status !== 'ACTIVE' || userRole === 'CARGO_OWNER'}
                              className={`p-2 rounded-lg transition-all ${auction.status !== 'ACTIVE' || userRole === 'CARGO_OWNER'
                                ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                                }`}
                              title={userRole === 'CARGO_OWNER' ? 'View Bids' : 'Place Bid'}
                            >
                              <Gavel className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bid Modal */}
      {showBidModal && selectedAuction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-3 sm:p-4">
          <div className="relative top-4 sm:top-10 md:top-20 mx-auto p-3 sm:p-4 md:p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-0 sm:mt-3">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">Place Bid</h3>
                <button
                  onClick={() => setShowBidModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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