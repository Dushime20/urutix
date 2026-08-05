import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FaTruck,
  FaEye,
  FaClock,
  FaGavel,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaTimes
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { toastActionSuccess, toastActionError, BID_ACCEPT_SUPPRESS_TYPES } from '../../utils/actionToast';
import { biddingAPI } from '../../services/biddingApi';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';
import ModernLoader from '../../components/common/ModernLoader';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';

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
  const { format: fmtFull } = useCurrencyFormat();
  const qc = useQueryClient();

  const { data: bidsData, isLoading: bidsLoading, error: bidsError, refetch } = useQuery({
    queryKey: ['admin-bids'],
    queryFn: async () => {
      try {
        const response = await biddingAPI.getAllBidsForAdmin();
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

  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status?.toUpperCase();
    switch (normalizedStatus) {
      case 'PENDING': return <FaClock className="text-gray-500 text-xs" />;
      case 'ACCEPTED': return <FaCheckCircle className="text-gray-600 dark:text-slate-300 text-xs" />;
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

  const { mutate: acceptBid } = useMutation({
    mutationFn: async (bidId: string) => {
      await biddingAPI.acceptBid(bidId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bids'] });
      toastActionSuccess('Bid accepted successfully', {
        id: 'accept-bid',
        suppressTypes: BID_ACCEPT_SUPPRESS_TYPES,
      });
    },
    onError: (error: any) => {
      console.error('Error accepting bid:', error);
      toastActionError(error?.response?.data?.message || 'Failed to accept bid', { id: 'accept-bid' });
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

  const columns: Column<Bid>[] = useMemo(() => [
    {
      key: 'loadId',
      label: 'Bid Details',
      alwaysVisible: true,
      render: (_v, bid) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
            <FaGavel className="text-white text-xs" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-900 dark:text-white">{getCargoTitle(bid)}</div>
            <div className="text-[10px] text-gray-500">Load: {bid.loadId?.slice(0, 8)} • Bid: {bid.id.slice(0, 8)}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'truckOwner',
      label: 'Bidder',
      render: (_v, bid) => (
        <div className="text-xs text-gray-900 dark:text-white">
          <div className="font-medium">{getBidderName(bid)}</div>
          <div className="text-[10px] text-gray-500">{getBidderCompany(bid)}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="flex text-[10px]">{getRatingStars(0)}</div>
            <span className="text-[10px] text-gray-500">(N/A)</span>
          </div>
        </div>
      ),
    },
    {
      key: 'bidAmount',
      label: 'Amount',
      sortable: true,
      render: (_v, bid) => (
        <div className="text-xs text-gray-900 dark:text-white">
          <div className="text-sm font-bold text-gray-900 dark:text-white">{fmtFull(bid.bidAmount || 0)}</div>
          <div className="text-[10px] text-gray-500 flex items-center gap-1">
            <FaTruck className="w-2.5 h-2.5" />
            {bid.load?.weight ? `${bid.load.weight.toLocaleString()} kg` : 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, bid) => (
        <StatusBadge
          status={bid.status}
          label={bid.status}
          icon={getStatusIcon(bid.status)}
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Timeline',
      sortable: true,
      render: (_v, bid) => (
        <div className="space-y-0.5 text-xs text-gray-900 dark:text-white">
          <div className="text-[10px] text-gray-600 dark:text-slate-300">Submitted: {getTimeAgo(bid.createdAt)}</div>
          <div className="text-[10px] text-gray-600 dark:text-slate-300">Pickup: {bid.proposedPickupDate ? formatDate(bid.proposedPickupDate) : 'N/A'}</div>
          <div className="text-[10px] text-gray-600 dark:text-slate-300">Delivery: {bid.proposedDeliveryDate ? formatDate(bid.proposedDeliveryDate) : 'N/A'}</div>
        </div>
      ),
    },
  ], [fmtFull]);

  const rowActions: TableAction<Bid>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: <FaEye className="w-3.5 h-3.5" />,
      onClick: (bid) => handleViewDetails(bid),
    },
    {
      key: 'accept',
      label: 'Accept Bid',
      icon: <FaCheckCircle className="w-3.5 h-3.5" />,
      variant: 'success',
      hidden: (bid) => bid.status?.toUpperCase() !== 'PENDING',
      onClick: (bid) => handleAcceptBid(bid.id),
    },
    {
      key: 'reject',
      label: 'Reject Bid',
      icon: <FaTimesCircle className="w-3.5 h-3.5" />,
      variant: 'danger',
      hidden: (bid) => bid.status?.toUpperCase() !== 'PENDING',
      onClick: (bid) => handleRejectBid(bid.id),
    },
  ], []);

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
      <div className="safe-bottom">
        <StandardDataTable
          embedded
          columns={columns}
          data={bids}
          loading={bidsLoading}
          error={bidsError ? 'Error loading bids. Please try again.' : null}
          onRetry={() => refetch()}
          getRowId={(row) => row.id}
          searchPlaceholder="Search bids..."
          searchKeys={['id', 'loadId', 'status']}
          filters={[
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'PENDING', label: 'Pending' },
                { value: 'ACCEPTED', label: 'Accepted' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'WITHDRAWN', label: 'Withdrawn' },
                { value: 'EXPIRED', label: 'Expired' },
              ],
            },
          ]}
          defaultSortKey="createdAt"
          defaultSortDirection="desc"
          rowActions={rowActions}
          onRefresh={() => refetch()}
          emptyMessage="No bids found"
          ariaLabel="Bidding management"
        />

        {showDetailsModal && selectedBid && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white"><TranslatedText text="Bid Details" /></h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-slate-300 transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                    <div className="text-[10px] text-gray-600 dark:text-slate-300 mb-0.5"><TranslatedText text="Bid ID" /></div>
                    <div className="text-xs font-medium text-gray-900 dark:text-white">{selectedBid.id}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                    <div className="text-[10px] text-gray-600 dark:text-slate-300 mb-0.5"><TranslatedText text="Load ID" /></div>
                    <div className="text-xs font-medium text-gray-900 dark:text-white">{selectedBid.loadId}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                    <div className="text-[10px] text-gray-600 dark:text-slate-300 mb-0.5"><TranslatedText text="Cargo Title" /></div>
                    <div className="text-xs font-medium text-gray-900 dark:text-white">{getCargoTitle(selectedBid)}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                    <div className="text-[10px] text-gray-600 dark:text-slate-300 mb-0.5"><TranslatedText text="Status" /></div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={selectedBid.status} label={selectedBid.status} icon={getStatusIcon(selectedBid.status)} />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                  <div className="text-xs font-medium text-gray-900 dark:text-white mb-2"><TranslatedText text="Bidder Information" /></div>
                  <div className="space-y-1.5">
                    <div>
                      <div className="text-[10px] text-gray-600 dark:text-slate-300"><TranslatedText text="Name" /></div>
                      <div className="text-xs text-gray-900 dark:text-white">{getBidderName(selectedBid)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 dark:text-slate-300"><TranslatedText text="Company" /></div>
                      <div className="text-xs text-gray-900 dark:text-white">{getBidderCompany(selectedBid)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 dark:text-slate-300"><TranslatedText text="Email" /></div>
                      <div className="text-xs text-gray-900 dark:text-white">{selectedBid.truckOwner?.email || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                    <div className="text-[10px] text-gray-600 dark:text-slate-300 mb-0.5"><TranslatedText text="Bid Amount" /></div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{fmtFull(selectedBid.bidAmount || 0)}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                    <div className="text-[10px] text-gray-600 dark:text-slate-300 mb-0.5"><TranslatedText text="Load Weight" /></div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedBid.load?.weight ? `${selectedBid.load.weight.toLocaleString()} kg` : 'N/A'}</div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                  <div className="text-xs font-medium text-gray-900 dark:text-white mb-2"><TranslatedText text="Timeline" /></div>
                  <div className="space-y-1.5">
                    <div>
                      <div className="text-[10px] text-gray-600 dark:text-slate-300"><TranslatedText text="Submitted" /></div>
                      <div className="text-xs text-gray-900 dark:text-white">{formatDateTime(selectedBid.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 dark:text-slate-300"><TranslatedText text="Proposed Pickup" /></div>
                      <div className="text-xs text-gray-900 dark:text-white">{selectedBid.proposedPickupDate ? formatDate(selectedBid.proposedPickupDate) : 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 dark:text-slate-300"><TranslatedText text="Proposed Delivery" /></div>
                      <div className="text-xs text-gray-900 dark:text-white">{selectedBid.proposedDeliveryDate ? formatDate(selectedBid.proposedDeliveryDate) : 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {selectedBid.bidNotes && (
                  <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-gray-200 dark:border-slate-700">
                    <div className="text-xs font-medium text-gray-900 dark:text-white mb-1"><TranslatedText text="Notes" /></div>
                    <div className="text-xs text-gray-700 dark:text-slate-300">{selectedBid.bidNotes}</div>
                  </div>
                )}

                {selectedBid.status?.toUpperCase() === 'PENDING' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
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
                      className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
                    >
                      <TranslatedText text="Reject Bid" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
};

export default BiddingManagement;
