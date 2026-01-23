import React, { useState, useEffect } from 'react';
import { FaEye, FaEdit, FaTrash, FaCheck, FaTimes, FaHistory, FaEnvelope, FaPhone, FaDollarSign, FaPercentage } from 'react-icons/fa';
import { Grid, Table } from 'lucide-react';
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
      const response = await biddingAPI.acceptBid(bidId);
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
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      WITHDRAWN: 'bg-gray-100 text-gray-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${variants[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
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
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="w-full px-2.5 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Min Amount</label>
          <input
            type="number"
            placeholder="Min amount"
            value={filters.minAmount}
            onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
            className="w-full px-2.5 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Max Amount</label>
          <input
            type="number"
            placeholder="Max amount"
            value={filters.maxAmount}
            onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
            className="w-full px-2.5 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-manipulation min-h-[44px] sm:min-h-0"
          />
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-end gap-2 bg-white border border-gray-200 rounded-lg p-1 w-fit ml-auto">
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
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <FaHistory className="text-gray-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-800 break-words">No bid history found matching your criteria.</span>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            /* Desktop Table View */
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Load
                      </th>
                      {userRole === 'CARGO_OWNER' && (
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Truck Owner
                        </th>
                      )}
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bid Amount
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bids.map((bid) => {
                      const truckOwnerName = bid.truckOwner?.profile
                        ? `${bid.truckOwner.profile.firstName || ''} ${bid.truckOwner.profile.lastName || ''}`.trim() || 'Unknown'
                        : bid.truckOwner?.email || 'Unknown';
                      const truckOwnerPhone = bid.truckOwner?.profile?.phone || bid.truckOwner?.phone || '';
                      const truckOwnerEmail = bid.truckOwner?.email || '';

                      return (
                        <tr key={bid.id} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-gray-900">{bid.load.title}</div>
                              <div className="text-xs sm:text-sm text-gray-500">{bid.load.weight} kg</div>
                            </div>
                          </td>
                          {userRole === 'CARGO_OWNER' && (
                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div>
                                <div className="text-xs sm:text-sm font-medium text-gray-900">{truckOwnerName}</div>
                                {bid.truckOwner?.profile?.companyName && (
                                  <div className="text-xs text-gray-500">{bid.truckOwner.profile.companyName}</div>
                                )}
                                {truckOwnerEmail && (
                                  <div className="text-xs text-blue-600">
                                    <a href={`mailto:${truckOwnerEmail}`} className="hover:underline break-all">
                                      {truckOwnerEmail}
                                    </a>
                                  </div>
                                )}
                                {truckOwnerPhone && (
                                  <div className="text-xs text-blue-600">
                                    <a href={`tel:${truckOwnerPhone}`} className="hover:underline">
                                      {truckOwnerPhone}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </td>
                          )}
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {formatCurrencyUtil(bid.bidAmount, bid.bidCurrency)}
                            </div>
                            {bid.successProbability && (
                              <div className="text-xs sm:text-sm text-gray-500">
                                {bid.successProbability}% success
                              </div>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            {getStatusBadge(bid.status)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {formatDate(bid.createdAt)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                            <div className="flex space-x-1.5 sm:space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedBid(bid);
                                  setShowDetailsModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 transition-colors touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
                                title="View Details"
                              >
                                <FaEye className="h-4 w-4" />
                              </button>
                              {bid.status === 'PENDING' && userRole === 'TRUCK_OWNER' && (
                                <button
                                  onClick={() => handleWithdrawBid(bid.id)}
                                  className="text-red-600 hover:text-red-900 transition-colors touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
                                  title="Withdraw Bid"
                                >
                                  <FaTrash className="h-4 w-4" />
                                </button>
                              )}
                              {bid.status === 'PENDING' && userRole === 'CARGO_OWNER' && (
                                <button
                                  onClick={() => handleAcceptBid(bid.id)}
                                  className="text-green-600 hover:text-green-900 transition-colors touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
                                  title="Accept Bid"
                                >
                                  <FaCheck className="h-4 w-4" />
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
            /* Card View */
            <div className="space-y-3">
              {bids.map((bid) => {
                const truckOwnerName = bid.truckOwner?.profile
                  ? `${bid.truckOwner.profile.firstName || ''} ${bid.truckOwner.profile.lastName || ''}`.trim() || 'Unknown'
                  : bid.truckOwner?.email || 'Unknown';
                const truckOwnerPhone = bid.truckOwner?.profile?.phone || bid.truckOwner?.phone || '';
                const truckOwnerEmail = bid.truckOwner?.email || '';

                return (
                  <div key={bid.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 break-words mb-1">{bid.load.title}</div>
                        <div className="text-xs text-gray-500">{bid.load.weight} kg</div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {getStatusBadge(bid.status)}
                      </div>
                    </div>

                    {userRole === 'CARGO_OWNER' && (
                      <div className="mb-2 pt-2 border-t border-gray-100">
                        <div className="text-xs font-medium text-gray-700 mb-1">Truck Owner</div>
                        <div className="text-xs text-gray-900 break-words">{truckOwnerName}</div>
                        {bid.truckOwner?.profile?.companyName && (
                          <div className="text-xs text-gray-600">{bid.truckOwner.profile.companyName}</div>
                        )}
                        {truckOwnerEmail && (
                          <a href={`mailto:${truckOwnerEmail}`} className="text-xs text-blue-600 hover:text-blue-800 break-all">
                            {truckOwnerEmail}
                          </a>
                        )}
                        {truckOwnerPhone && (
                          <a href={`tel:${truckOwnerPhone}`} className="text-xs text-blue-600 hover:text-blue-800 block">
                            {truckOwnerPhone}
                          </a>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2 pt-2 border-t border-gray-100">
                      <div>
                        <div className="text-xs text-gray-500">Bid Amount</div>
                        <div className="text-sm font-semibold text-gray-900">{formatCurrencyUtil(bid.bidAmount, bid.bidCurrency)}</div>
                        {bid.successProbability && (
                          <div className="text-xs text-gray-500">{bid.successProbability}% success</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Date</div>
                        <div className="text-xs text-gray-900">{formatDate(bid.createdAt)}</div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setSelectedBid(bid);
                          setShowDetailsModal(true);
                        }}
                        className="flex-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors touch-manipulation min-h-[44px] flex items-center justify-center gap-1.5"
                      >
                        <FaEye className="h-3.5 w-3.5" />
                        View Details
                      </button>
                      {bid.status === 'PENDING' && userRole === 'TRUCK_OWNER' && (
                        <button
                          onClick={() => handleWithdrawBid(bid.id)}
                          className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors touch-manipulation min-h-[44px] flex items-center justify-center"
                          title="Withdraw Bid"
                        >
                          <FaTrash className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {bid.status === 'PENDING' && userRole === 'CARGO_OWNER' && !bid.load.brokerId && !bid.load.broker && (
                        <button
                          onClick={() => handleAcceptBid(bid.id)}
                          className="px-3 py-2 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors touch-manipulation min-h-[44px] flex items-center justify-center"
                          title="Accept Bid"
                        >
                          <FaCheck className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {bid.status === 'PENDING' && userRole === 'CARGO_OWNER' && (bid.load.brokerId || bid.load.broker) && (
                        <button
                          disabled
                          className="px-3 py-2 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed touch-manipulation min-h-[44px] flex items-center justify-center"
                          title="This load is managed by a broker. The broker must accept bids."
                        >
                          <FaCheck className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Bid Details Modal */}
      {/* Bid Details Modal */}
      {showDetailsModal && selectedBid && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaDollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Bid Details</h2>
                  <p className="text-sm text-gray-600">ID: {selectedBid.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                {/* Cargo Info */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <h4 className="font-semibold text-gray-900 text-lg mb-1">{selectedBid.load.title}</h4>
                  <div className="flex items-center text-sm text-gray-500 gap-4 mt-2">
                     <span className="flex items-center gap-1"><FaPercentage className="w-3 h-3" /> {selectedBid.load.weight} kg</span>
                     <span className="flex items-center gap-1"><FaDollarSign className="w-3 h-3" /> Value: {formatCurrencyUtil(selectedBid.load.loadValue, 'USD')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Bid Amount</label>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrencyUtil(selectedBid.bidAmount, selectedBid.bidCurrency)}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedBid.status)}</div>
                  </div>
                </div>

                {/* Advance Payment Calculation - Show for cargo owners when bid is accepted */}
                {userRole === 'CARGO_OWNER' && selectedBid.status === 'ACCEPTED' && (
                  <div className="border border-blue-200 rounded-xl overflow-hidden">
                    <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                      <h5 className="font-semibold text-blue-900 flex items-center gap-2">
                        <FaDollarSign className="h-4 w-4" />
                        Payment Breakdown
                      </h5>
                    </div>
                    <div className="p-4 bg-white">
                    {(() => {
                      const paymentCalc = calculateAdvancePayment(
                        selectedBid.bidAmount,
                        selectedBid.advancePaymentPercentage,
                        selectedBid.requireAdvancePayment !== false, // Default to true if not specified
                        selectedBid.bidCurrency
                      );

                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Total Fee</p>
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrencyUtil(paymentCalc.transportationFee, paymentCalc.currency)}
                              </p>
                            </div>
                            {paymentCalc.requireAdvancePayment && (
                              <div>
                                <p className="text-xs text-gray-500">Advance %</p>
                                <p className="text-lg font-semibold text-blue-600">
                                  {formatPercentage(paymentCalc.advancePaymentPercentage)}
                                </p>
                              </div>
                            )}
                          </div>

                          {paymentCalc.requireAdvancePayment ? (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                  <p className="text-xs font-medium text-green-700 mb-1">Advance Payment</p>
                                  <p className="text-xl font-bold text-green-700">
                                    {formatCurrencyUtil(paymentCalc.advanceAmount, paymentCalc.currency)}
                                  </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                  <p className="text-xs font-medium text-gray-500 mb-1">Final Payment</p>
                                  <p className="text-xl font-bold text-gray-700">
                                    {formatCurrencyUtil(paymentCalc.finalAmount, paymentCalc.currency)}
                                  </p>
                                </div>
                              </div>
                              <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg flex items-start gap-2">
                                <FaEnvelope className="w-4 h-4 mt-0.5 shrink-0" />
                                <p>Advance payment is required before trip start. Remaining balance due upon successful delivery.</p>
                              </div>
                            </>
                          ) : (
                            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 text-center">
                              No advance payment required. Full payment due after completion.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    </div>
                  </div>
                )}

                {/* Dates & Notes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {selectedBid.proposedPickupDate && (
                    <div className="group">
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        <FaEdit className="w-3 h-3 text-gray-400" /> Proposed Pickup
                      </label>
                      <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg">{formatDate(selectedBid.proposedPickupDate)}</p>
                    </div>
                  )}

                  {selectedBid.proposedDeliveryDate && (
                    <div className="group">
                      <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        <FaEdit className="w-3 h-3 text-gray-400" /> Proposed Delivery
                      </label>
                      <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg">{formatDate(selectedBid.proposedDeliveryDate)}</p>
                    </div>
                  )}
                </div>

                {selectedBid.bidNotes && (
                  <div className="col-span-full">
                     <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        <FaEdit className="w-3 h-3 text-gray-400" /> Notes
                      </label>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-700 text-sm leading-relaxed">
                      {selectedBid.bidNotes}
                    </div>
                  </div>
                )}

                {userRole === 'CARGO_OWNER' && selectedBid.truckOwner && (
                  <div className="border-t border-gray-100 pt-6">
                    <h5 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FaEnvelope className="h-4 w-4 text-gray-400" /> Contact Information
                    </h5>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between py-1 border-b border-gray-200 last:border-0">
                        <span className="text-sm text-gray-500">Name</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedBid.truckOwner.profile
                            ? `${selectedBid.truckOwner.profile.firstName || ''} ${selectedBid.truckOwner.profile.lastName || ''}`.trim() || 'Unknown'
                            : selectedBid.truckOwner.email || 'Unknown'}
                        </span>
                      </div>
                      
                      {selectedBid.truckOwner.profile?.companyName && (
                         <div className="flex items-center justify-between py-1 border-b border-gray-200 last:border-0">
                          <span className="text-sm text-gray-500">Company</span>
                          <span className="text-sm font-medium text-gray-900">{selectedBid.truckOwner.profile.companyName}</span>
                         </div>
                      )}

                      {selectedBid.truckOwner.email && (
                         <div className="flex items-center justify-between py-1 border-b border-gray-200 last:border-0">
                          <span className="text-sm text-gray-500">Email</span>
                          <a href={`mailto:${selectedBid.truckOwner.email}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            {selectedBid.truckOwner.email}
                          </a>
                         </div>
                      )}

                      {(selectedBid.truckOwner.profile?.phone || selectedBid.truckOwner.phone) && (
                         <div className="flex items-center justify-between py-1 border-b border-gray-200 last:border-0">
                          <span className="text-sm text-gray-500">Phone</span>
                          <a href={`tel:${selectedBid.truckOwner.profile?.phone || selectedBid.truckOwner.phone}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            {selectedBid.truckOwner.profile?.phone || selectedBid.truckOwner.phone}
                          </a>
                         </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-center pt-4">
                  <p className="text-xs text-gray-400">Created on {formatDate(selectedBid.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0 rounded-b-lg">
              <button
                onClick={() => setShowDetailsModal(false)}
                 className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all"
              >
                Close
              </button>
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