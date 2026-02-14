import React, { useState, useEffect } from 'react';
import {
  Eye,
  Trash2,
  CheckCircle,
  History,
  Mail,
  Phone,
  DollarSign,
  Grid,
  Table,
  Calendar,
  X,
  Truck,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { biddingAPI, biddingHelpers } from '../../services/biddingApi';
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
  createdAt: string;
  load: {
    title: string;
    weight: number;
    loadValue: number;
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
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER';
}

const BidHistory: React.FC<BidHistoryProps> = ({ userRole }) => {
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
      // Use getMyBids for both cargo owners and truck owners
      const response = await biddingAPI.getMyBids();
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
        `Bid Amount: ${biddingHelpers.formatCurrency(bid.bidAmount, bid.bidCurrency)}\n` +
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
      PENDING: 'bg-amber-50 text-amber-600 ring-amber-100',
      ACCEPTED: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
      REJECTED: 'bg-red-50 text-red-600 ring-red-100',
      WITHDRAWN: 'bg-gray-50 text-gray-600 ring-gray-100',
      EXPIRED: 'bg-gray-50 text-gray-600 ring-gray-100',
    };
    return (
      <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ring-1 ring-inset ${variants[status] || 'bg-gray-50 text-gray-600 ring-gray-100'}`}>
        {status}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
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
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 relative overflow-hidden group">
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
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-4 py-2 text-xs font-black bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Min Amount</label>
            <input
              type="number"
              placeholder="$ 0.00"
              value={filters.minAmount}
              onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
              className="w-full px-4 py-2 text-xs font-black bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Max Amount</label>
            <input
              type="number"
              placeholder="$ 0.00"
              value={filters.maxAmount}
              onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
              className="w-full px-4 py-2 text-xs font-black bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:border-gray-900 transition-all"
            />
          </div>
        </div>

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
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-3 text-xs sm:text-sm text-gray-600">Loading bid history...</p>
      </div>
    );
  }

  return (
    <div className="bid-history">
      {renderFilters()}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-6">
          <div className="flex items-start sm:items-center">
            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-red-800 break-words">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {bids.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center uppercase tracking-widest">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <History size={24} className="text-gray-400" />
          </div>
          <p className="text-[10px] font-black text-gray-400">No bidding history found</p>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Load Details</th>
                      {userRole === 'CARGO_OWNER' && (
                        <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Truck Owner</th>
                      )}
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Bid / success</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {bids.map((bid) => {
                      const truckOwnerName = bid.truckOwner?.profile
                        ? `${bid.truckOwner.profile.firstName || ''} ${bid.truckOwner.profile.lastName || ''}`.trim() || 'Unknown'
                        : bid.truckOwner?.email || 'Unknown';

                      return (
                        <tr key={bid.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Truck size={18} className="text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-gray-900 leading-tight">{bid.load.title}</p>
                                <p className="text-[10px] font-bold text-gray-400 mt-0.5">{bid.load.weight.toLocaleString()} kg</p>
                              </div>
                            </div>
                          </td>
                          {userRole === 'CARGO_OWNER' && (
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-gray-900">{truckOwnerName}</span>
                                {bid.truckOwner?.profile?.companyName && (
                                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight italic mt-0.5">{bid.truckOwner.profile.companyName}</span>
                                )}
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <div className="text-sm font-black text-emerald-600">{formatCurrency(bid.bidAmount, bid.bidCurrency)}</div>
                            {bid.successProbability && (
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{bid.successProbability}% success prob.</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(bid.status)}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-tight">{formatDate(bid.createdAt)}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedBid(bid);
                                  setShowDetailsModal(true);
                                }}
                                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              {bid.status === 'PENDING' && userRole === 'TRUCK_OWNER' && (
                                <button
                                  onClick={() => handleWithdrawBid(bid.id)}
                                  className="p-2 text-red-100 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  title="Withdraw Bid"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                              {bid.status === 'PENDING' && userRole === 'CARGO_OWNER' && (
                                <button
                                  onClick={() => handleAcceptBid(bid.id)}
                                  className="p-2 text-emerald-100 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                                  title="Accept Bid"
                                >
                                  <CheckCircle size={16} />
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
                  <div key={bid.id} className="bg-white rounded-2xl border border-gray-200 hover:border-gray-900 overflow-hidden transition-all duration-300 group flex flex-col shadow-sm">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(bid.status)}
                        </div>
                        <div className="w-8 h-8 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center">
                          <History size={16} />
                        </div>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-sm font-black text-gray-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors uppercase italic">
                          {bid.load.title}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-none">
                          Weight: {bid.load.weight.toLocaleString()} kg
                        </p>
                      </div>

                      {userRole === 'CARGO_OWNER' && (
                        <div className="mb-4 pt-4 border-t border-gray-50">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Truck Owner</p>
                          <p className="text-xs font-black text-gray-900">{truckOwnerName}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Bid Amount</p>
                          <p className="text-sm font-black text-emerald-600">
                            {formatCurrency(bid.bidAmount, bid.bidCurrency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Date</p>
                          <p className="text-[10px] font-black text-gray-900">{formatDate(bid.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedBid(bid);
                          setShowDetailsModal(true);
                        }}
                        className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors"
                      >
                        <Eye size={14} />
                        Details
                      </button>
                      <div className="flex gap-2">
                        {bid.status === 'PENDING' && userRole === 'TRUCK_OWNER' && (
                          <button
                            onClick={() => handleWithdrawBid(bid.id)}
                            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Withdraw"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {bid.status === 'PENDING' && userRole === 'CARGO_OWNER' && (
                          <button
                            onClick={() => handleAcceptBid(bid.id)}
                            className="p-2 text-emerald-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
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
      {showDetailsModal && selectedBid && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <History className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight italic uppercase">Bid Details</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic leading-none">Viewing full bid history record</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <Truck size={80} className="text-gray-900" />
                  </div>
                  <div className="relative">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Load Information</p>
                    <h4 className="text-lg font-black text-gray-900 italic uppercase">{selectedBid.load.title}</h4>
                    <p className="text-sm font-bold text-indigo-600 mt-1">{selectedBid.load.weight.toLocaleString()} kg total weight</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Bid Amount</p>
                    <p className="text-2xl font-black text-emerald-600">
                      {formatCurrency(selectedBid.bidAmount, selectedBid.bidCurrency)}
                    </p>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Status</p>
                    <div className="pt-1">{getStatusBadge(selectedBid.status)}</div>
                  </div>
                </div>

                {userRole === 'CARGO_OWNER' && selectedBid.status === 'ACCEPTED' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        <DollarSign size={16} />
                      </div>
                      <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest italic">Payment Breakdown</h5>
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
                          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Advance (Before Trip)</p>
                            <p className="text-lg font-black text-emerald-700">
                              {formatCurrencyUtil(paymentCalc.advanceAmount, paymentCalc.currency)}
                            </p>
                            {paymentCalc.requireAdvancePayment && (
                              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter mt-0.5">
                                {formatPercentage(paymentCalc.advancePaymentPercentage)} of total
                              </p>
                            )}
                          </div>
                          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Final (After Delivery)</p>
                            <p className="text-lg font-black text-gray-900">
                              {formatCurrencyUtil(paymentCalc.finalAmount, paymentCalc.currency)}
                            </p>
                            {paymentCalc.requireAdvancePayment && (
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                                {formatPercentage(100 - paymentCalc.advancePaymentPercentage)} of total
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
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Proposed Pickup</label>
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-sm font-black text-gray-900">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(selectedBid.proposedPickupDate)}
                      </div>
                    </div>
                  )}
                  {selectedBid.proposedDeliveryDate && (
                    <div>
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Proposed Delivery</label>
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 text-sm font-black text-gray-900">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(selectedBid.proposedDeliveryDate)}
                      </div>
                    </div>
                  )}
                </div>

                {selectedBid.bidNotes && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Notes</label>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-bold text-gray-600 leading-relaxed italic">
                      "{selectedBid.bidNotes}"
                    </div>
                  </div>
                )}

                {userRole === 'CARGO_OWNER' && selectedBid.truckOwner && (
                  <div className="pt-6 border-t border-gray-100">
                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Truck Owner Contact</h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                          <User size={16} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Full Name</p>
                          <p className="text-sm font-black text-gray-900 uppercase italic">{selectedBid.truckOwner.profile?.firstName} {selectedBid.truckOwner.profile?.lastName}</p>
                        </div>
                      </div>
                      {selectedBid.truckOwner.email && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                            <Mail size={16} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Email Address</p>
                            <a href={`mailto:${selectedBid.truckOwner.email}`} className="text-sm font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase italic">{selectedBid.truckOwner.email}</a>
                          </div>
                        </div>
                      )}
                      {(selectedBid.truckOwner.profile?.phone || selectedBid.truckOwner.phone) && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                            <Phone size={16} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Phone Number</p>
                            <a href={`tel:${selectedBid.truckOwner.profile?.phone || selectedBid.truckOwner.phone}`} className="text-sm font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase italic">{selectedBid.truckOwner.profile?.phone || selectedBid.truckOwner.phone}</a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-8 py-2.5 text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-all"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styled Confirmation Dialog */}
      {DialogComponent}
    </div>
  );
};

export default BidHistory; 