import React, { useState, useEffect } from 'react';
import { FaEye, FaEdit, FaTrash, FaCheck, FaTimes, FaHistory, FaEnvelope, FaPhone } from 'react-icons/fa';
import { biddingAPI, biddingHelpers } from '../../services/biddingApi';

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

  useEffect(() => {
    loadBidHistory();
  }, [filters]);

  const loadBidHistory = async () => {
    setLoading(true);
    try {
      const response = await biddingAPI.getBidHistory(filters);
      setBids(response.data);
    } catch (error) {
      setError('Failed to load bid history - using demo data');
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
    try {
      await biddingAPI.acceptBid(bidId);
      loadBidHistory(); // Refresh the list
    } catch (error) {
      console.error('Accept bid error:', error);
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
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
          <input
            type="number"
            placeholder="Min amount"
            value={filters.minAmount}
            onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
          <input
            type="number"
            placeholder="Max amount"
            value={filters.maxAmount}
            onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-3 text-gray-600">Loading bid history...</p>
      </div>
    );
  }

  return (
    <div className="bid-history">
      {renderFilters()}

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
          </div>
        </div>
      )}

      {bids.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <FaHistory className="text-blue-400 mr-2 mt-0.5" />
            <span className="text-blue-800">No bid history found matching your criteria.</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Load
                  </th>
                  {userRole === 'CARGO_OWNER' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Truck Owner
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bid Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{bid.load.title}</div>
                          <div className="text-sm text-gray-500">{bid.load.weight} kg</div>
                        </div>
                      </td>
                      {userRole === 'CARGO_OWNER' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{truckOwnerName}</div>
                            {bid.truckOwner?.profile?.companyName && (
                              <div className="text-xs text-gray-500">{bid.truckOwner.profile.companyName}</div>
                            )}
                            {truckOwnerEmail && (
                              <div className="text-xs text-blue-600">
                                <a href={`mailto:${truckOwnerEmail}`} className="hover:underline">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(bid.bidAmount, bid.bidCurrency)}
                        </div>
                        {bid.successProbability && (
                          <div className="text-sm text-gray-500">
                            {bid.successProbability}% success
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(bid.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(bid.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBid(bid);
                              setShowDetailsModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <FaEye className="h-4 w-4" />
                          </button>
                          {bid.status === 'PENDING' && userRole === 'TRUCK_OWNER' && (
                            <button
                              onClick={() => handleWithdrawBid(bid.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Withdraw Bid"
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          )}
                          {bid.status === 'PENDING' && userRole === 'CARGO_OWNER' && (
                            <button
                              onClick={() => handleAcceptBid(bid.id)}
                              className="text-green-600 hover:text-green-900"
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
      )}

      {/* Bid Details Modal */}
      {showDetailsModal && selectedBid && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Bid Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedBid.load.title}</h4>
                  <p className="text-sm text-gray-500">{selectedBid.load.weight} kg</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bid Amount</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(selectedBid.bidAmount, selectedBid.bidCurrency)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedBid.status)}</div>
                  </div>
                </div>

                {selectedBid.proposedPickupDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Proposed Pickup</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedBid.proposedPickupDate)}</p>
                  </div>
                )}

                {selectedBid.proposedDeliveryDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Proposed Delivery</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedBid.proposedDeliveryDate)}</p>
                  </div>
                )}

                {selectedBid.bidNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-sm text-gray-900">{selectedBid.bidNotes}</p>
                  </div>
                )}

                {userRole === 'CARGO_OWNER' && selectedBid.truckOwner && (
                  <div className="border-t pt-4 mt-4">
                    <h5 className="text-sm font-semibold text-gray-900 mb-3">Truck Owner Contact Information</h5>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="text-sm text-gray-900">
                          {selectedBid.truckOwner.profile 
                            ? `${selectedBid.truckOwner.profile.firstName || ''} ${selectedBid.truckOwner.profile.lastName || ''}`.trim() || 'Unknown'
                            : selectedBid.truckOwner.email || 'Unknown'}
                        </p>
                      </div>
                      {selectedBid.truckOwner.profile?.companyName && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Company</label>
                          <p className="text-sm text-gray-900">{selectedBid.truckOwner.profile.companyName}</p>
                        </div>
                      )}
                      {selectedBid.truckOwner.email && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <a 
                            href={`mailto:${selectedBid.truckOwner.email}`}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
                          >
                            <FaEnvelope className="h-3 w-3" />
                            {selectedBid.truckOwner.email}
                          </a>
                        </div>
                      )}
                      {(selectedBid.truckOwner.profile?.phone || selectedBid.truckOwner.phone) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <a 
                            href={`tel:${selectedBid.truckOwner.profile?.phone || selectedBid.truckOwner.phone}`}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2"
                          >
                            <FaPhone className="h-3 w-3" />
                            {selectedBid.truckOwner.profile?.phone || selectedBid.truckOwner.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedBid.createdAt)}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidHistory; 