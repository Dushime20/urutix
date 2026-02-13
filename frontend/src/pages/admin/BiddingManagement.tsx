import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FaChartLine, FaDollarSign, FaTruck, FaSearch, FaFilter, FaDownload,
  FaEye, FaEdit, FaCalendar, FaClock,
  FaGavel, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaTimes
} from 'react-icons/fa';
import { useAdminLayout } from '../../contexts/AdminLayoutContext';
import toast from 'react-hot-toast';
import { biddingAPI } from '../../services/biddingApi';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';

interface Bid {
  id: string;
  cargoId: string;
  cargoTitle: string;
  bidderName: string;
  bidderCompany: string;
  bidAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  submittedAt: string;
  validUntil: string;
  notes: string;
  estimatedDelivery: string;
  truckCapacity: number;
  rating: number;
}

const BiddingManagement: React.FC = () => {
  const { viewMode } = useAdminLayout();
  const qc = useQueryClient();

  // Fetch bids from API
  const { data: bidsData, isLoading: bidsLoading, error: bidsError } = useQuery({
    queryKey: ['admin-bids'],
    queryFn: async () => {
      try {
        const response = await biddingAPI.getBids();
        // Handle different response structures
        const data = response.data?.data || response.data;
        if (Array.isArray(data)) {
          return data;
        }
        if (data?.items && Array.isArray(data.items)) {
          return data.items;
        }
        if (data?.bids && Array.isArray(data.bids)) {
          return data.bids;
        }
        return [];
      } catch (error: any) {
        console.error('Error fetching bids:', error);
        toast.error('Failed to fetch bids');
        return [];
      }
    }
  });

  const bids: Bid[] = bidsData || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCargoId, setFilterCargoId] = useState('');
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'accepted': return 'bg-gray-100 text-gray-700';
      case 'rejected': return 'bg-gray-100 text-gray-600';
      case 'withdrawn': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FaClock className="text-gray-500 text-xs" />;
      case 'accepted': return <FaCheckCircle className="text-gray-600 text-xs" />;
      case 'rejected': return <FaTimesCircle className="text-gray-500 text-xs" />;
      case 'withdrawn': return <FaExclamationTriangle className="text-gray-400 text-xs" />;
      default: return <FaClock className="text-gray-500 text-xs" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'text-gray-600' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    return stars;
  };

  const filteredBids = bids.filter(bid => {
    const matchesSearch = bid.cargoTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.bidderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.bidderCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.cargoId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || bid.status === filterStatus;
    const matchesCargoId = !filterCargoId || bid.cargoId === filterCargoId;
    return matchesSearch && matchesStatus && matchesCargoId;
  });

  const { mutate: acceptBid, isPending: isAccepting } = useMutation({
    mutationFn: async (bidId: string) => {
      await biddingAPI.acceptBid(bidId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bids'] });
      toast.success('Bid accepted successfully');
    },
    onError: (error: any) => {
      console.error('Error accepting bid:', error);
      toast.error(error?.response?.data?.message || 'Failed to accept bid');
    }
  });

  const { mutate: rejectBid, isPending: isRejecting } = useMutation({
    mutationFn: async (bidId: string) => {
      // Since there's no reject endpoint, we'll use updateBid to change status
      await biddingAPI.updateBid(bidId, { status: 'rejected' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bids'] });
      toast.success('Bid rejected');
    },
    onError: (error: any) => {
      console.error('Error rejecting bid:', error);
      toast.error(error?.response?.data?.message || 'Failed to reject bid');
    }
  });

  const handleAcceptBid = (bidId: string) => {
    acceptBid(bidId);
  };

  const handleRejectBid = (bidId: string) => {
    rejectBid(bidId);
  };

  const handleViewDetails = (bid: Bid) => {
    setSelectedBid(bid);
    setShowDetailsModal(true);
  };

  const stats = {
    total: bids.length,
    pending: bids.filter(b => b.status === 'pending').length,
    accepted: bids.filter(b => b.status === 'accepted').length,
    rejected: bids.filter(b => b.status === 'rejected').length,
    totalValue: bids.reduce((acc, b) => acc + b.bidAmount, 0),
    avgRating: bids.length > 0 ? (Math.round(bids.reduce((acc, b) => acc + b.rating, 0) / bids.length * 10) / 10) : 0
  };

  return (
    <AdminPageLayout
      title="Bidding Management"
      description="Monitor and manage cargo bidding processes"
    >

      {/* Bidding Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600">Total Bids</p>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FaGavel className="text-white text-xs" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FaClock className="text-white text-xs" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.accepted}</p>
              <p className="text-xs text-gray-600">Accepted</p>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="text-white text-xs" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.rejected}</p>
              <p className="text-xs text-gray-600">Rejected</p>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FaTimesCircle className="text-white text-xs" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">${stats.totalValue.toLocaleString()}</p>
              <p className="text-xs text-gray-600">Total Value</p>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FaDollarSign className="text-white text-xs" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.avgRating}</p>
              <p className="text-xs text-gray-600">Avg Rating</p>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              <FaChartLine className="text-white text-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-2.5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="relative">
            <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search bids..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <select
            value={filterCargoId}
            onChange={(e) => setFilterCargoId(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white"
          >
            <option value="">All Cargos</option>
            {Array.from(new Set(bids.map(b => b.cargoId))).map(cargoId => (
              <option key={cargoId} value={cargoId}>{cargoId}</option>
            ))}
          </select>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs">
            <FaFilter className="w-3 h-3" />
            <span>More Filters</span>
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs">
            <FaDownload className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Bids Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {bidsLoading ? (
          <div className="px-3 py-8 text-center text-xs text-gray-500">
            Loading bids...
          </div>
        ) : bidsError ? (
          <div className="px-3 py-8 text-center text-xs text-red-500">
            Error loading bids. Please try again.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Bid Details</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Bidder</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Timeline</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBids.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                      No bids found
                    </td>
                  </tr>
                ) : (
                  filteredBids.map((bid) => (
                    <tr key={bid.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                            <FaGavel className="text-white text-xs" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-900">{bid.cargoTitle}</div>
                            <div className="text-[10px] text-gray-500">ID: {bid.cargoId} • Bid: {bid.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          <div className="font-medium">{bid.bidderName}</div>
                          <div className="text-[10px] text-gray-500">{bid.bidderCompany}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="flex text-[10px]">{getRatingStars(bid.rating)}</div>
                            <span className="text-[10px] text-gray-500">({bid.rating})</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          <div className="text-sm font-bold text-gray-900">${bid.bidAmount.toLocaleString()}</div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-1">
                            <FaTruck className="w-2.5 h-2.5" />
                            {bid.truckCapacity.toLocaleString()} kg
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(bid.status)}
                          <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(bid.status)}`}>
                            {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-900">
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-gray-600">Submitted: {getTimeAgo(bid.submittedAt)}</div>
                          <div className="text-[10px] text-gray-600">Valid until: {formatDate(bid.validUntil)}</div>
                          <div className="text-[10px] text-gray-600">Est. delivery: {formatDate(bid.estimatedDelivery)}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs font-medium">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleViewDetails(bid)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                            title="View Details"
                          >
                            <FaEye className="w-3 h-3" />
                          </button>
                          {bid.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAcceptBid(bid.id)}
                                className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                                title="Accept Bid"
                              >
                                <FaCheckCircle className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleRejectBid(bid.id)}
                                className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                                title="Reject Bid"
                              >
                                <FaTimesCircle className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bid Details Modal */}
      {showDetailsModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Bid Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {/* Bid Information */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Bid ID</div>
                  <div className="text-xs font-medium text-gray-900">{selectedBid.id}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Cargo ID</div>
                  <div className="text-xs font-medium text-gray-900">{selectedBid.cargoId}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Cargo Title</div>
                  <div className="text-xs font-medium text-gray-900">{selectedBid.cargoTitle}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Status</div>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(selectedBid.status)}
                    <span className={`text-xs font-medium ${getStatusColor(selectedBid.status)}`}>
                      {selectedBid.status.charAt(0).toUpperCase() + selectedBid.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bidder Information */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-2">Bidder Information</div>
                <div className="space-y-1.5">
                  <div>
                    <div className="text-[10px] text-gray-600">Name</div>
                    <div className="text-xs text-gray-900">{selectedBid.bidderName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Company</div>
                    <div className="text-xs text-gray-900">{selectedBid.bidderCompany}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Rating</div>
                    <div className="flex items-center gap-1">
                      <div className="flex text-xs">{getRatingStars(selectedBid.rating)}</div>
                      <span className="text-xs text-gray-600">({selectedBid.rating})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bid Amount & Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Bid Amount</div>
                  <div className="text-sm font-bold text-gray-900">${selectedBid.bidAmount.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5">Truck Capacity</div>
                  <div className="text-sm font-medium text-gray-900">{selectedBid.truckCapacity.toLocaleString()} kg</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-2">Timeline</div>
                <div className="space-y-1.5">
                  <div>
                    <div className="text-[10px] text-gray-600">Submitted</div>
                    <div className="text-xs text-gray-900">{formatDateTime(selectedBid.submittedAt)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Valid Until</div>
                    <div className="text-xs text-gray-900">{formatDate(selectedBid.validUntil)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600">Estimated Delivery</div>
                    <div className="text-xs text-gray-900">{formatDate(selectedBid.estimatedDelivery)}</div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-1">Notes</div>
                <div className="text-xs text-gray-700">{selectedBid.notes}</div>
              </div>

              {/* Actions */}
              {selectedBid.status === 'pending' && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleAcceptBid(selectedBid.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-xs font-medium"
                  >
                    Accept Bid
                  </button>
                  <button
                    onClick={() => {
                      handleRejectBid(selectedBid.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
                  >
                    Reject Bid
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default BiddingManagement;
