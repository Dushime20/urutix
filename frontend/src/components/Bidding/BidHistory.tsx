import React, { useState, useEffect } from 'react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import {
  Eye,
  Trash2,
  CheckCircle,
  History,
  DollarSign,
  Grid,
  Table,
  Calendar,
  X,
  Truck,
  Search,
  Clock
} from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { biddingAPI, biddingHelpers } from '../../services/biddingApi';
import { createPortal } from 'react-dom';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { calculateAdvancePayment, formatCurrency as formatCurrencyUtil, formatPercentage } from '../../utils/paymentCalculations';

interface Bid {
  id: string;
  loadId: string;
  bidAmount: number;
  bidCurrency: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  proposedPickupDate?: string;
  proposedDeliveryDate?: string;
  bidNotes?: string;
  successProbability?: number;
  advancePaymentPercentage?: number | null;
  requireAdvancePayment?: boolean;
  isCounterOffer?: boolean;
  createdAt: string;
  load: {
    id: string;
    title: string;
    weight: number;
    loadValue: number;
    brokerId?: string;
    broker?: {
      id: string;
      email: string;
    };
  };
  auction?: {
    id: string;
    auctionType: string;
    status: string;
    auctionEnd: string;
  };
  truckOwner?: {
    id: string;
    email: string;
    phone?: string;
    profile?: {
      firstName: string;
      lastName: string;
      companyName?: string;
      phone?: string;
    };
  };
}

interface BidHistoryProps {
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER' | 'BROKER' | 'ADMIN' | 'SUPER_ADMIN';
}

const BidHistory: React.FC<BidHistoryProps> = ({ userRole }) => {
  const { compactIn: fmtBid } = useCurrencyFormat();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    minAmount: '',
    maxAmount: '',
  });
  const { confirm, DialogComponent } = useConfirmDialog();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

  useEffect(() => {
    loadBidHistory();
  }, [filters]);

  const loadBidHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use admin endpoint for admin users, otherwise use regular endpoint
      const response = (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN')
        ? await biddingAPI.getAllBidsForAdmin()
        : await biddingAPI.getMyBids();
      const bidsData = response.data || response;

      // Filter bids based on status filter
      let filteredBids = Array.isArray(bidsData) ? bidsData : [];
      if (filters.status && filters.status !== 'all') {
        filteredBids = filteredBids.filter((bid: Bid) => bid.status === filters.status);
      }

      setBids(filteredBids);
    } catch (error) {
      setError('Failed to load bid history');
      console.error('Bid history error:', error);

      // Set demo bid history when API fails
      setBids([
        {
          id: 'bid-1',
          loadId: 'load-1',
          bidAmount: 1500,
          bidCurrency: 'USD',
          status: 'PENDING',
          proposedPickupDate: '2024-01-15',
          proposedDeliveryDate: '2024-01-18',
          bidNotes: 'Experienced driver with refrigerated truck',
          successProbability: 85,
          createdAt: '2024-01-10T10:30:00Z',
          load: {
            id: 'load-1',
            title: 'Electronics Shipment',
            weight: 500,
            loadValue: 5000,
          },
          auction: {
            id: 'auction-1',
            auctionType: 'REVERSE',
            status: 'ACTIVE',
            auctionEnd: '2024-01-20T18:00:00Z',
          },
        },
        {
          id: 'bid-2',
          loadId: 'load-2',
          bidAmount: 1800,
          bidCurrency: 'USD',
          status: 'ACCEPTED',
          proposedPickupDate: '2024-01-12',
          proposedDeliveryDate: '2024-01-15',
          bidNotes: 'Flatbed truck available',
          successProbability: 100,
          createdAt: '2024-01-08T14:20:00Z',
          load: {
            id: 'load-2',
            title: 'Furniture Delivery',
            weight: 1200,
            loadValue: 3000,
          },
          auction: {
            id: 'auction-2',
            auctionType: 'FORWARD',
            status: 'COMPLETED',
            auctionEnd: '2024-01-15T18:00:00Z',
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawBid = async (bidId: string) => {
    try {
      await biddingAPI.withdrawBid(bidId);
      loadBidHistory(); // Refresh the list
    } catch (error) {
      console.error('Withdraw bid error:', error);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    const bid = bids.find(b => b.id === bidId);
    if (!bid) return;

    // Styled confirmation dialog
    const confirmed = await confirm({
      title: 'Accept Bid',
      message: `Are you sure you want to accept this bid?\n\n` +
        `Bid Amount: ${fmtBid(bid.bidAmount, bid.bidCurrency)}\n` +
        `Load: ${bid.load?.title || 'N/A'}\n\n` +
        `This will assign the load to the truck owner and close the auction. The assigned driver will see it in their cargo management dashboard.`,
      confirmText: 'Accept Bid',
      cancelText: 'Cancel',
      variant: 'info',
    });

    if (!confirmed) return;

    try {
      await biddingAPI.acceptBid(bidId);
      toast.success('Bid accepted successfully! The load has been assigned to the truck owner. The assigned driver will see it in their cargo management dashboard.');
      loadBidHistory(); // Refresh the list
    } catch (error: any) {
      console.error('Accept bid error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to accept bid';
      toast.error(errorMessage);
    }
  };

   const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      PENDING: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
      ACCEPTED: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
      REJECTED: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800',
      WITHDRAWN: 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800',
      EXPIRED: 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800',
    };
    return (
      <span className={cn(
        "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-sm flex items-center gap-1.5",
        variants[status] || 'bg-slate-50 text-slate-500 border-slate-100'
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {status}
      </span>
    );
  };

  const getAINegotiationBadge = () => (
    <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-blue-500 dark:bg-blue-600 text-white border border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/20 flex items-center gap-1.5 animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)]" />
      Neural AI Counter
    </span>
  );



  // formatCurrency provided by useCurrencyFormat hook

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
    <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="SEARCH OFFERS BY CONTENT OR ID..."
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 shadow-sm appearance-none cursor-pointer pr-10 min-w-[140px]"
          >
            <option value="all">Any Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="px-6 py-3.5 text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 shadow-sm appearance-none cursor-pointer pr-10 min-w-[140px]"
          >
            <option value="all">Any Time</option>
            <option value="today">Past 24h</option>
            <option value="week">Past Week</option>
          </select>

          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2 hidden lg:block" />

          <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setViewMode('card')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'card' 
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-lg" 
                  : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"
              )}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-xl transition-all",
                viewMode === 'table' 
                  ? "bg-slate-900 dark:bg-blue-600 text-white shadow-lg" 
                  : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"
              )}
            >
              <Table size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
        <p className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">Loading bid history...</p>
      </div>
    );
  }

  return (
    <div className="bid-history">
      {renderFilters()}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3 sm:p-4 mb-3 sm:mb-6">
          <div className="flex items-start sm:items-center">
            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 dark:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-400 break-words">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {bids.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center uppercase tracking-widest">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <History size={24} className="text-slate-400 dark:text-slate-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500">No bidding history found</p>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="w-full overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr>
                      <th className="px-6 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Context</th>
                      {(userRole === 'CARGO_OWNER' || userRole === 'BROKER') && (
                        <th className="px-6 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Bidder</th>
                      )}
                      <th className="px-6 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Financials</th>
                      <th className="px-6 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                      <th className="px-6 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Timeline</th>
                      <th className="px-6 py-2 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map((bid) => {
                      const truckOwnerName = bid.truckOwner?.profile
                        ? `${bid.truckOwner.profile.firstName || ''} ${bid.truckOwner.profile.lastName || ''}`.trim() || 'Unknown'
                        : bid.truckOwner?.email || 'Unknown';

                      return (
                        <tr key={bid.id} className="group transition-all">
                          <td className="px-6 py-4 bg-white dark:bg-slate-900 border-y border-l border-slate-100 dark:border-slate-800 first:rounded-l-[1.5rem] group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0 group-hover:bg-white dark:group-hover:bg-slate-900 group-hover:scale-110 transition-all">
                                <Truck size={20} className="text-[#345E85] dark:text-blue-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-[#0f172a] dark:text-slate-100 leading-tight truncate">{bid.load.title}</p>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Ref: {bid.id.slice(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                          {(userRole === 'CARGO_OWNER' || userRole === 'BROKER') && (
                            <td className="px-6 py-4 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-900 dark:text-slate-100">{truckOwnerName}</span>
                                {bid.truckOwner?.profile?.companyName && (
                                  <span className="text-[9px] font-black text-[#345E85] dark:text-blue-400 uppercase tracking-widest mt-1 opacity-70">{bid.truckOwner.profile.companyName}</span>
                                )}
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50">
                            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(bid.bidAmount, bid.bidCurrency)}</div>
                            {bid.successProbability && (
                              <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mt-1">{bid.successProbability}% MATCH</div>
                            )}
                          </td>
                          <td className="px-6 py-4 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50">
                            <div className="flex flex-col gap-1.5">
                              {getStatusBadge(bid.status)}
                              {bid.isCounterOffer && getAINegotiationBadge()}
                            </div>
                          </td>
                          <td className="px-6 py-4 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50">
                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                              <Clock size={12} />
                              <span className="text-[10px] font-black uppercase tracking-tight">{formatDate(bid.createdAt)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 bg-white dark:bg-slate-900 border-y border-r border-slate-100 dark:border-slate-800 last:rounded-r-[1.5rem] group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/50 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBid(bid);
                                  setShowDetailsModal(true);
                                }}
                                className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-[#345E85] dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                              >
                                <Eye size={18} />
                              </button>
                               {bid.status === 'PENDING' && userRole === 'TRUCK_OWNER' && (
                                <button
                                  type="button"
                                  onClick={() => handleWithdrawBid(bid.id)}
                                  className="p-2.5 text-rose-400 dark:text-rose-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                              {(bid.status === 'PENDING' && (userRole === 'CARGO_OWNER' || userRole === 'BROKER')) && (
                                <button
                                  type="button"
                                  onClick={() => handleAcceptBid(bid.id)}
                                  className="p-2.5 text-emerald-400 dark:text-emerald-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30"
                                >
                                  <CheckCircle size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bids.map((bid) => {
                const truckOwnerName = bid.truckOwner?.profile
                  ? `${bid.truckOwner.profile.firstName || ''} ${bid.truckOwner.profile.lastName || ''}`.trim() || 'Unknown'
                  : bid.truckOwner?.email || 'Unknown';

                return (
                  <div key={bid.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-900 dark:hover:border-blue-900/50 overflow-hidden transition-all duration-300 group flex flex-col shadow-sm">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(bid.status)}
                          {bid.isCounterOffer && getAINegotiationBadge()}
                        </div>
                         <div className="w-8 h-8 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 rounded-xl flex items-center justify-center">
                          <History size={16} />
                        </div>
                      </div>

                       <div className="mb-4">
                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight group-hover:text-indigo-600 dark:group-hover:text-blue-400 transition-colors uppercase italic">
                          {bid.load.title}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest leading-none">
                          Weight: {bid.load.weight.toLocaleString()} kg
                        </p>
                      </div>

                       {(userRole === 'CARGO_OWNER' || userRole === 'BROKER') && (
                        <div className="mb-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Truck Owner</p>
                          <p className="text-xs font-black text-slate-900 dark:text-slate-100">{truckOwnerName}</p>
                        </div>
                      )}

                       <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Bid Amount</p>
                          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(bid.bidAmount, bid.bidCurrency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Date</p>
                          <p className="text-[10px] font-black text-slate-900 dark:text-slate-100">{formatDate(bid.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                     <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBid(bid);
                          setShowDetailsModal(true);
                        }}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                      >
                        <Eye size={14} />
                        Details
                      </button>
                       <div className="flex gap-2">
                        {bid.status === 'PENDING' && userRole === 'TRUCK_OWNER' && (
                          <button
                            type="button"
                            onClick={() => handleWithdrawBid(bid.id)}
                            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                            title="Withdraw"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {(bid.status === 'PENDING' && (userRole === 'CARGO_OWNER' || userRole === 'BROKER')) && (
                          <button
                            type="button"
                            onClick={() => handleAcceptBid(bid.id)}
                            className="p-2 text-emerald-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                            title="Accept"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

       {/* Bid Details Modal */}
      {showDetailsModal && selectedBid && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-sm">
                    <History className="text-[#345E85] dark:text-blue-400" size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight">Bid Intelligence</h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1">Full operational record</p>
                  </div>
                </div>
                 <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 dark:text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

               <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-slate-50/50 dark:bg-slate-950/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-white dark:bg-slate-900 rounded-full opacity-50 dark:opacity-20 group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Subject Entity</p>
                    <h4 className="text-xl font-black text-[#0f172a] dark:text-slate-100">{selectedBid.load.title}</h4>
                    <p className="text-xs font-black text-[#345E85] dark:text-blue-400 mt-1">{selectedBid.load.weight.toLocaleString()} KG PAYLOAD</p>
                  </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Valuation</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(selectedBid.bidAmount, selectedBid.bidCurrency)}
                    </p>
                  </div>
                  <div className="p-6 bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Operational Status</p>
                    <div className="pt-1">{getStatusBadge(selectedBid.status)}</div>
                  </div>
                </div>

                {(userRole === 'CARGO_OWNER' || userRole === 'BROKER') && selectedBid.status === 'ACCEPTED' && (
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 text-[#345E85] dark:text-blue-400 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                        <DollarSign size={16} />
                      </div>
                      <h5 className="text-[10px] font-black text-[#0f172a] dark:text-slate-100 uppercase tracking-[0.2em]">Settlement breakdown</h5>
                    </div>

                    {(() => {
                      const paymentCalc = calculateAdvancePayment(
                        selectedBid.bidAmount,
                        selectedBid.advancePaymentPercentage,
                        selectedBid.requireAdvancePayment !== false,
                        selectedBid.bidCurrency
                      );

                      return (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-900/30">
                            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Advance Commitment</p>
                            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                              {formatCurrencyUtil(paymentCalc.advanceAmount, paymentCalc.currency)}
                            </p>
                            {paymentCalc.requireAdvancePayment && (
                              <p className="text-[10px] font-black text-emerald-500/70 dark:text-emerald-400/50 uppercase tracking-tighter mt-1">
                                {formatPercentage(paymentCalc.advancePaymentPercentage)} OF TOTAL
                              </p>
                            )}
                          </div>
                           <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Final Settlement</p>
                            <p className="text-xl font-black text-[#0f172a] dark:text-slate-100">
                              {formatCurrencyUtil(paymentCalc.finalAmount, paymentCalc.currency)}
                            </p>
                            {paymentCalc.requireAdvancePayment && (
                              <p className="text-[10px] font-black text-slate-400/70 dark:text-slate-500/50 uppercase tracking-tighter mt-1">
                                {formatPercentage(100 - paymentCalc.advancePaymentPercentage)} OF TOTAL
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {selectedBid.proposedPickupDate && (
                     <div className="space-y-2">
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Pickup Log</label>
                      <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-black text-[#0f172a] dark:text-slate-100 shadow-sm">
                        <Calendar size={14} className="text-[#345E85] dark:text-blue-400" />
                        {formatDate(selectedBid.proposedPickupDate)}
                      </div>
                    </div>
                  )}
                  {selectedBid.proposedDeliveryDate && (
                     <div className="space-y-2">
                      <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Delivery Log</label>
                      <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-black text-[#0f172a] dark:text-slate-100 shadow-sm">
                        <Calendar size={14} className="text-[#345E85] dark:text-blue-400" />
                        {formatDate(selectedBid.proposedDeliveryDate)}
                      </div>
                    </div>
                  )}
                </div>

                 {selectedBid.bidNotes && (
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Contextual notes</label>
                    <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic border-l-4 border-l-[#345E85] dark:border-l-blue-400">
                      "{selectedBid.bidNotes}"
                    </div>
                  </div>
                )}

                 {(userRole === 'CARGO_OWNER' || userRole === 'BROKER') && selectedBid.truckOwner && (
                  <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                    <h5 className="text-[10px] font-black text-[#0f172a] dark:text-slate-100 uppercase tracking-[0.2em] mb-6">Entity contact intelligence</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                       <div className="flex flex-col gap-1">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Name</p>
                        <p className="text-xs font-black text-[#0f172a] dark:text-slate-100 uppercase">{selectedBid.truckOwner.profile?.firstName} {selectedBid.truckOwner.profile?.lastName}</p>
                      </div>
                      {selectedBid.truckOwner.email && (
                        <div className="flex flex-col gap-1">
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email Record</p>
                          <a href={`mailto:${selectedBid.truckOwner.email}`} className="text-xs font-black text-[#345E85] dark:text-blue-400 hover:underline uppercase truncate">{selectedBid.truckOwner.email}</a>
                        </div>
                      )}
                       {(selectedBid.truckOwner.profile?.phone || selectedBid.truckOwner.phone) && (
                        <div className="flex flex-col gap-1">
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Comms Line</p>
                          <p className="text-xs font-black text-[#0f172a] dark:text-slate-100">{selectedBid.truckOwner.profile?.phone || selectedBid.truckOwner.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

               <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="px-10 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-lg shadow-slate-900/10 dark:shadow-blue-500/20"
                >
                  Close Data Record
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Styled Confirmation Dialog */}
      {DialogComponent}
    </div>
  );
};

export default BidHistory; 