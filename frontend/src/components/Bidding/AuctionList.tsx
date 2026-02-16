import React, { useState, useEffect } from 'react';
import {
  Gavel,
  Clock,
  Heart,
  Grid,
  Table,
  Download,
  X,
  AlertCircle
} from 'lucide-react';
import { biddingAPI } from '../../services/biddingApi';
import toast from 'react-hot-toast';
import BidForm from './BidForm';
import { formatCurrency } from '../../utils/formatNumber';

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
      ACTIVE: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      SCHEDULED: 'bg-amber-50 text-amber-600 ring-amber-100',
      CLOSED: 'bg-gray-50 text-gray-600 ring-gray-100',
      CANCELLED: 'bg-red-50 text-red-600 ring-red-100',
      PAUSED: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ring-1 ring-inset ${variants[status] || 'bg-gray-50 text-gray-600 ring-gray-100'}`}>
        {status}
      </span>
    );
  };

  const getAuctionTypeBadge = (type: string) => {
    const variants: { [key: string]: string } = {
      REVERSE: 'bg-slate-900 text-white',
      FORWARD: 'bg-gray-100 text-gray-900',
      DUTCH: 'bg-indigo-600 text-white',
      SEALED: 'bg-purple-600 text-white',
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${variants[type] || 'bg-gray-100 text-gray-900'}`}>
        {type}
      </span>
    );
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
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 relative overflow-hidden group">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 text-xs font-black bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Auction Type</label>
            <select
              value={filters.auctionType}
              onChange={(e) => setFilters({ ...filters, auctionType: e.target.value })}
              className="w-full px-4 py-2 text-xs font-black bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="REVERSE">Reverse</option>
              <option value="FORWARD">Forward</option>
              <option value="DUTCH">Dutch</option>
              <option value="SEALED">Sealed</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Watchlist</label>
            <button
              onClick={() => setFilters({ ...filters, showWatchedOnly: !filters.showWatchedOnly })}
              className={`w-full px-4 py-2 text-xs font-black rounded-xl border transition-all flex items-center justify-between gap-2 ${filters.showWatchedOnly
                ? 'bg-red-50 border-red-100 text-red-600'
                : 'bg-gray-50 border-gray-100 text-gray-500 hover:text-gray-900'
                }`}
            >
              <span className="flex items-center gap-2">
                <Heart size={14} className={filters.showWatchedOnly ? 'fill-current' : ''} />
                {filters.showWatchedOnly ? 'Showing Watched' : 'All Auctions'}
              </span>
            </button>
          </div>
          <div className="relative group/search">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Search Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minValue}
                onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
                className="w-full px-4 py-2 text-xs font-black bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all"
              />
              <span className="text-gray-300 font-bold">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxValue}
                onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
                className="w-full px-4 py-2 text-xs font-black bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuctionCard = (auction: Auction) => (
    <div key={auction.id} className="bg-white rounded-2xl border border-gray-200 hover:border-gray-900 overflow-hidden transition-all duration-300 group flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-wrap gap-2">
            {getStatusBadge(auction.status)}
            {getAuctionTypeBadge(auction.auctionType)}
          </div>
          <button
            onClick={() => handleWatchToggle(auction.id)}
            disabled={watchingAuctions.has(auction.id)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${watchedAuctions.has(auction.id)
              ? 'bg-red-50 text-red-500'
              : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500'
              }`}
          >
            {watchingAuctions.has(auction.id) ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Heart size={16} className={watchedAuctions.has(auction.id) ? 'fill-current' : ''} />
            )}
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-black text-gray-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
            {auction.load.title}
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider italic">
            ID: {auction.id.slice(0, 8)}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            <div className="mb-4 relative">
              <div className="absolute -left-[1.375rem] top-0 w-3 h-3 rounded-full bg-white border-2 border-gray-900 z-10"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 leading-none">Pickup</p>
              <p className="text-xs font-black text-gray-900 truncate">{auction.load.pickupLocation}</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[1.375rem] top-0 w-3 h-3 rounded-full bg-white border-2 border-indigo-600 z-10"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 leading-none">Delivery</p>
              <p className="text-xs font-black text-gray-900 truncate">{auction.load.deliveryLocation}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Current Bid</p>
            <p className="text-lg font-black text-emerald-600">
              {auction.currentHighestBid ? formatCurrency(auction.currentHighestBid) : '---'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Weight</p>
            <p className="text-sm font-black text-gray-900">{auction.load.weight.toLocaleString()} kg</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-500">
          <Clock size={14} />
          <span className="text-[10px] font-black uppercase tracking-tight">{formatDate(auction.auctionEnd)}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleBidClick(auction)}
            disabled={auction.status !== 'ACTIVE' || userRole === 'CARGO_OWNER'}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${auction.status !== 'ACTIVE' || userRole === 'CARGO_OWNER'
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200'
              }`}
          >
            <Gavel size={14} />
            {userRole === 'CARGO_OWNER' ? 'View Bids' : 'Bid Now'}
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
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-black text-[10px] uppercase tracking-wider group"
        >
          <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
          Export Data
        </button>

        <div className="flex items-center gap-1 bg-gray-50/50 p-1 rounded-xl border border-gray-100 shadow-inner">
          <button
            onClick={() => setViewMode('card')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${viewMode === 'card'
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            <Grid size={14} />
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${viewMode === 'table'
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
              : 'text-gray-500 hover:text-gray-900'
              }`}
          >
            <Table size={14} />
            Table
          </button>
        </div>
      </div>

      {filters.showWatchedOnly && (
        <div className="bg-red-50/50 border border-red-100 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <Heart className="text-red-500 fill-current" size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-red-900 uppercase tracking-tight italic">
              Watched Auctions <span className="text-red-400 font-light ml-2">({auctions.length} total)</span>
            </h3>
          </div>
        </div>
      )}

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
            className="p-1 text-red-400 hover:text-red-600 rounded-lg transition-colors border border-red-100 rounded-lg"
          >
            <X size={16} />
          </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {auctions.map(renderAuctionCard)}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Auction / Load</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Route</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Type / weight</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Current Bid</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Time Left</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {auctions.map((auction) => (
                      <tr key={auction.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <Gavel size={18} className="text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900 leading-tight">{auction.load.title}</p>
                              <div className="mt-1">{getStatusBadge(auction.status)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-gray-900">{auction.load.pickupLocation}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight italic">to</span>
                            <span className="text-xs font-black text-gray-900">{auction.load.deliveryLocation}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-black text-gray-900">{auction.load.weight.toLocaleString()} kg</span>
                            <div>{getAuctionTypeBadge(auction.auctionType)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {auction.currentHighestBid ? (
                            <div className="text-sm font-black text-emerald-600">{formatCurrency(auction.currentHighestBid)}</div>
                          ) : (
                            <div className="text-xs font-bold text-gray-300 italic uppercase">No bids</div>
                          )}
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{auction.totalBids} total bids</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Clock size={12} />
                            <span className="text-[10px] font-black uppercase tracking-tight">{formatDate(auction.auctionEnd)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleBidClick(auction)}
                            disabled={auction.status !== 'ACTIVE' || userRole === 'CARGO_OWNER'}
                            className={`p-2 rounded-xl transition-all ${auction.status !== 'ACTIVE' || userRole === 'CARGO_OWNER'
                                ? 'bg-gray-50 text-gray-300'
                                : 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200'
                              }`}
                          >
                            <Gavel size={16} />
                          </button>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col ring-1 ring-black/5">
            <div className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <Gavel className="text-indigo-600" size={18} /> Place Your Bid
              </h3>
              <button
                onClick={() => setShowBidModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors border border-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
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