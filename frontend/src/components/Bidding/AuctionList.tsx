import React, { useState, useEffect } from 'react';
import {
  Gavel,
  Clock,
  Heart,
  Grid,
  Table,
  Download,
  X,
  AlertCircle,
  Package,
  MapPin,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Search
} from 'lucide-react';
import { cn } from '@/utils/cn';
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
      ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      SCHEDULED: 'bg-amber-50 text-amber-600 border-amber-100',
      CLOSED: 'bg-slate-50 text-slate-500 border-slate-100',
      CANCELLED: 'bg-red-50 text-red-600 border-red-100',
      PAUSED: 'bg-blue-50 text-blue-600 border-blue-100',
    };
    return (
      <span className={cn(
        "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-sm flex items-center gap-1.5",
        variants[status] || 'bg-slate-50 text-slate-500 border-slate-100'
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {status}
      </span>
    );
  };

  const getAuctionTypeBadge = (type: string) => {
    return (
      <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-slate-900/10">
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
    <div className="bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="SEARCH OPPORTUNITIES BY ID OR LOCATION..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm placeholder:text-slate-300"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 shadow-sm appearance-none cursor-pointer pr-10 min-w-[140px]"
          >
            <option value="all">Any Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={filters.auctionType}
            onChange={(e) => setFilters({ ...filters, auctionType: e.target.value })}
            className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 shadow-sm appearance-none cursor-pointer pr-10 min-w-[140px]"
          >
            <option value="all">Any Model</option>
            <option value="REVERSE">Reverse Auction</option>
            <option value="FORWARD">Forward Auction</option>
            <option value="DUTCH">Dutch Auction</option>
          </select>

          <button
            onClick={() => setFilters({ ...filters, showWatchedOnly: !filters.showWatchedOnly })}
            className={cn(
              "px-6 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl border transition-all flex items-center gap-2 shadow-sm",
              filters.showWatchedOnly
                ? 'bg-rose-50 border-rose-100 text-rose-600 shadow-rose-900/5'
                : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600'
            )}
          >
            <Heart size={14} className={filters.showWatchedOnly ? 'fill-current' : ''} />
            Watchlist
          </button>

          <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden lg:block" />

          <button
            onClick={handleExport}
            className="p-3.5 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:bg-slate-50 hover:text-[#345E85] transition-all shadow-sm"
            title="Export Records"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAuctionCard = (auction: Auction) => (
    <div key={auction.id} className="relative group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />

      <div className="relative">
        <div className="flex justify-between items-start mb-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-[#345E85] group-hover:bg-[#345E85] group-hover:text-white transition-all shadow-sm">
            <Package size={24} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleWatchToggle(auction.id)}
              disabled={watchingAuctions.has(auction.id)}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                watchedAuctions.has(auction.id)
                  ? 'bg-rose-50 text-rose-500 border border-rose-100 shadow-sm'
                  : 'bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-100'
              )}
            >
              <Heart size={18} className={watchedAuctions.has(auction.id) ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {getStatusBadge(auction.status)}
              {getAuctionTypeBadge(auction.auctionType)}
            </div>
            <h3 className="text-2xl font-black text-[#0f172a] tracking-tight line-clamp-1 group-hover:text-[#345E85] transition-colors">
              {auction.load.title}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {auction.id.slice(0, 12)}</p>
          </div>

          <div className="space-y-4 py-6 border-y border-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                <MapPin size={14} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Route Context</p>
                <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                  <span className="truncate">{auction.load.pickupLocation}</span>
                  <ArrowRight size={12} className="text-slate-300 shrink-0" />
                  <span className="truncate">{auction.load.deliveryLocation}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Pricing Dynamics</p>
                <div className="text-xl font-black text-emerald-600">
                  {auction.currentHighestBid ? formatCurrency(auction.currentHighestBid) : '$-.--'}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Payload</p>
                <p className="text-xs font-black text-slate-900">{auction.load.weight.toLocaleString()} KG</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{formatDate(auction.auctionEnd)}</span>
            </div>
            <button
              onClick={() => handleBidClick(auction)}
              disabled={auction.status !== 'ACTIVE' || userRole === 'CARGO_OWNER'}
              className={cn(
                "flex items-center gap-2 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg",
                auction.status !== 'ACTIVE' || userRole === 'CARGO_OWNER'
                  ? 'bg-slate-50 text-slate-300 shadow-none'
                  : 'bg-[#345E85] text-white hover:bg-slate-800 shadow-blue-900/10 hover:-translate-y-1'
              )}
            >
              {userRole === 'CARGO_OWNER' ? 'Insights' : 'Place Bid'}
              <ChevronRight size={14} />
            </button>
          </div>
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