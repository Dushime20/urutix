import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FaChartLine, FaDollarSign, FaTruck, FaSearch, FaFilter, FaDownload,
  FaEye, FaClock,
  FaGavel, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaTimes
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { biddingAPI } from '../../services/biddingApi';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';
import { StatCard } from '../../components/EnliteUI';
import ModernLoader from '../../components/common/ModernLoader';

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
  updatedAt: string;
  load?: {
    id: string;
    title: string;
    origin?: string;
    destination?: string;
    weight: number;
    loadValue: number;
    cargoOwner?: {
      id: string;
      email: string;
      profile?: {
        firstName: string;
        lastName: string;
        companyName?: string;
      };
    };
  };
  truckOwner?: {
    id: string;
    email: string;
    role?: string;
    profile?: {
      firstName: string;
      lastName: string;
      companyName?: string;
    };
  };
}

const BiddingManagement: React.FC = () => {
  const qc = useQueryClient();

  // Fetch bids from API
  const { data: bidsData, isLoading: bidsLoading, error: bidsError } = useQuery({
    queryKey: ['admin-bids'],
    queryFn: async () => {
      try {
        const response = await biddingAPI.getAllBidsForAdmin();
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
    const normalizedStatus = status?.toUpperCase();
    switch (normalizedStatus) {
      case 'PENDING': return 'bg-gray-100 text-gray-700';
      case 'ACCEPTED': return 'bg-gray-100 text-gray-700';
      case 'REJECTED': return 'bg-gray-100 text-gray-600';
      case 'WITHDRAWN': return 'bg-gray-100 text-gray-500';
      case 'EXPIRED': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status?.toUpperCase();
    switch (normalizedStatus) {
      case 'PENDING': return <FaClock className="text-gray-500 text-xs" />;
      case 'ACCEPTED': return <FaCheckCircle className="text-gray-600 text-xs" />;
      case 'REJECTED': return <FaTimesCircle className="text-gray-500 text-xs" />;
      case 'WITHDRAWN': return <FaExclamationTriangle className="text-gray-400 text-xs" />;
      case 'EXPIRED': return <FaExclamationTriangle className="text-gray-400 text-xs" />;
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

  const getRatingStars = (rating: number = 0) => {
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

  const getBidderName = (bid: Bid) => {
    if (bid.truckOwner?.profile) {
      const { firstName, lastName } = bid.truckOwner.profile;
      return `${firstName || ''} ${lastName || ''}`.trim() || bid.truckOwner.email || 'Unknown';
    }
    return bid.truckOwner?.email || 'Unknown';
  };

  const getBidderCompany = (bid: Bid) => {
    return bid.truckOwner?.profile?.companyName || '-';
  };

  const getCargoTitle = (bid: Bid) => {
    return bid.load?.title || 'Unknown Cargo';
  };

  const filteredBids = bids.filter(bid => {
    const bidderName = getBidderName(bid);
    const bidderCompany = getBidderCompany(bid);
    const cargoTitle = getCargoTitle(bid);
    const cargoId = bid.loadId || '';
    
    const matchesSearch = cargoTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bidderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bidderCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cargoId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || bid.status?.toUpperCase() === filterStatus.toUpperCase();
    const matchesCargoId = !filterCargoId || bid.loadId === filterCargoId;
    return matchesSearch && matchesStatus && matchesCargoId;
  });

  const { mutate: acceptBid } = useMutation({
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

  const { mutate: rejectBid } = useMutation({
    mutationFn: async (bidId: string) => {
      await (biddingAPI as any).updateBid(bidId, { status: 'rejected' });
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
    pending: bids.filter(b => b.status?.toUpperCase() === 'PENDING').length,
    accepted: bids.filter(b => b.status?.toUpperCase() === 'ACCEPTED').length,
    rejected: bids.filter(b => b.status?.toUpperCase() === 'REJECTED').length,
    totalValue: bids.reduce((acc, b) => {
      const amount = parseFloat(String(b.bidAmount || 0));
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0),
    avgRating: 0 // Rating not available in current API response
  };

  if (bidsLoading && bids.length === 0) {
    return (
      <AdminPageLayout
        title={<TranslatedText text="Bidding Management" />}
        description={<TranslatedText text="Monitor and manage cargo bidding processes" />}
      >
        <ModernLoader isLoading={true} type="page" showStats={true} />
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout
      title={<TranslatedText text="Bidding Management" />}
      description={<TranslatedText text="Monitor and manage cargo bidding processes" />}
    >

      {/* Bidding Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard
          title={<TranslatedText text="Total Bids" />}
          value={stats.total}
          icon={<FaGavel />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title={<TranslatedText text="Pending" />}
          value={stats.pending}
          icon={<FaClock />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title={<TranslatedText text="Accepted" />}
          value={stats.accepted}
          icon={<FaCheckCircle />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title={<TranslatedText text="Rejected" />}
          value={stats.rejected}
          icon={<FaTimesCircle />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title={<TranslatedText text="Total Value" />}
          value={`$${stats.totalValue.toLocaleString()}`}
          icon={<FaDollarSign />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title={<TranslatedText text="Avg Rating" />}
          value={stats.avgRating}
          icon={<FaChartLine />}
          color="primary"
          variant="classic"
        />
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
              className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2c5173] focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2c5173] focus:border-transparent bg-white"
          >
            <option value=""><TranslatedText text="All Status" /></option>
            <option value="pending"><TranslatedText text="Pending" /></option>
            <option value="accepted"><TranslatedText text="Accepted" /></option>
            <option value="rejected"><TranslatedText text="Rejected" /></option>
            <option value="withdrawn"><TranslatedText text="Withdrawn" /></option>
          </select>
          <select
            value={filterCargoId}
            onChange={(e) => setFilterCargoId(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2c5173] focus:border-transparent bg-white"
          >
            <option value=""><TranslatedText text="All Cargos" /></option>
            {Array.from(new Set(bids.map(b => b.loadId).filter(Boolean))).map(loadId => (
              <option key={loadId} value={loadId}>{loadId}</option>
            ))}
          </select>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs">
            <FaFilter className="w-3 h-3" />
            <span><TranslatedText text="More Filters" /></span>
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs">
            <FaDownload className="w-3 h-3" />
            <span><TranslatedText text="Export" /></span>
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
                  <th className="px-3 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"><TranslatedText text="Bid Details" /></th>
                  <th className="px-3 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"><TranslatedText text="Bidder" /></th>
                  <th className="px-3 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"><TranslatedText text="Amount" /></th>
                  <th className="px-3 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"><TranslatedText text="Status" /></th>
                  <th className="px-3 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"><TranslatedText text="Timeline" /></th>
                  <th className="px-3 py-2 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"><TranslatedText text="Actions" /></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBids.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                      <TranslatedText text="No bids found" />
                    </td>
                  </tr>
                ) : (
                  filteredBids.map((bid) => {
                    const bidderName = getBidderName(bid);
                    const bidderCompany = getBidderCompany(bid);
                    const cargoTitle = getCargoTitle(bid);
                    
                    return (
                    <tr key={bid.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                            <FaGavel className="text-white text-xs" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-900">{cargoTitle}</div>
                            <div className="text-[10px] text-gray-500">Load: {bid.loadId?.slice(0, 8)} • Bid: {bid.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          <div className="font-medium">{bidderName}</div>
                          <div className="text-[10px] text-gray-500">{bidderCompany}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="flex text-[10px]">{getRatingStars(0)}</div>
                            <span className="text-[10px] text-gray-500">(N/A)</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          <div className="text-sm font-bold text-gray-900">${(bid.bidAmount || 0).toLocaleString()}</div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-1">
                            <FaTruck className="w-2.5 h-2.5" />
                            {bid.load?.weight ? `${bid.load.weight.toLocaleString()} kg` : 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(bid.status)}
                          <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-full ${getStatusColor(bid.status)}`}>
                            {bid.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-xs text-gray-900">
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-gray-600">Submitted: {getTimeAgo(bid.createdAt)}</div>
                          <div className="text-[10px] text-gray-600">Pickup: {bid.proposedPickupDate ? formatDate(bid.proposedPickupDate) : 'N/A'}</div>
                          <div className="text-[10px] text-gray-600">Delivery: {bid.proposedDeliveryDate ? formatDate(bid.proposedDeliveryDate) : 'N/A'}</div>
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
                          {bid.status?.toUpperCase() === 'PENDING' && (
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
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bid Details Modal */}
      {showDetailsModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900"><TranslatedText text="Bid Details" /></h3>
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
                  <div className="text-[10px] text-gray-600 mb-0.5"><TranslatedText text="Bid ID" /></div>
                  <div className="text-xs font-medium text-gray-900">{selectedBid.id}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5"><TranslatedText text="Load ID" /></div>
                  <div className="text-xs font-medium text-gray-900">{selectedBid.loadId}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5"><TranslatedText text="Cargo Title" /></div>
                  <div className="text-xs font-medium text-gray-900">{getCargoTitle(selectedBid)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5"><TranslatedText text="Status" /></div>
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(selectedBid.status)}
                    <span className={`text-xs font-medium ${getStatusColor(selectedBid.status)}`}>
                      {selectedBid.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bidder Information */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-2"><TranslatedText text="Bidder Information" /></div>
                <div className="space-y-1.5">
                  <div>
                    <div className="text-[10px] text-gray-600"><TranslatedText text="Name" /></div>
                    <div className="text-xs text-gray-900">{getBidderName(selectedBid)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600"><TranslatedText text="Company" /></div>
                    <div className="text-xs text-gray-900">{getBidderCompany(selectedBid)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600"><TranslatedText text="Email" /></div>
                    <div className="text-xs text-gray-900">{selectedBid.truckOwner?.email || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Bid Amount & Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5"><TranslatedText text="Bid Amount" /></div>
                  <div className="text-sm font-bold text-gray-900">${(selectedBid.bidAmount || 0).toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[10px] text-gray-600 mb-0.5"><TranslatedText text="Load Weight" /></div>
                  <div className="text-sm font-medium text-gray-900">{selectedBid.load?.weight ? `${selectedBid.load.weight.toLocaleString()} kg` : 'N/A'}</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                <div className="text-xs font-medium text-gray-900 mb-2"><TranslatedText text="Timeline" /></div>
                <div className="space-y-1.5">
                  <div>
                    <div className="text-[10px] text-gray-600"><TranslatedText text="Submitted" /></div>
                    <div className="text-xs text-gray-900">{formatDateTime(selectedBid.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600"><TranslatedText text="Proposed Pickup" /></div>
                    <div className="text-xs text-gray-900">{selectedBid.proposedPickupDate ? formatDate(selectedBid.proposedPickupDate) : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600"><TranslatedText text="Proposed Delivery" /></div>
                    <div className="text-xs text-gray-900">{selectedBid.proposedDeliveryDate ? formatDate(selectedBid.proposedDeliveryDate) : 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBid.bidNotes && (
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-xs font-medium text-gray-900 mb-1"><TranslatedText text="Notes" /></div>
                  <div className="text-xs text-gray-700">{selectedBid.bidNotes}</div>
                </div>
              )}

              {/* Actions */}
              {selectedBid.status?.toUpperCase() === 'PENDING' && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleAcceptBid(selectedBid.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-3 py-1.5 bg-[#2c5173] text-white rounded-lg hover:bg-[#1e3850] transition-colors text-xs font-medium"
                  >
                    <TranslatedText text="Accept Bid" />
                  </button>
                  <button
                    onClick={() => {
                      handleRejectBid(selectedBid.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
                  >
                    <TranslatedText text="Reject Bid" />
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
