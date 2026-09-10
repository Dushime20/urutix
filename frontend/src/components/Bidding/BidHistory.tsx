import React, { useState, useMemo } from 'react';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import {
  Eye,
  Trash2,
  CheckCircle,
  History,
  Grid,
  Table,
  Truck,
  Search,
  Clock
} from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { toastActionSuccess, toastActionError, BID_ACCEPT_SUPPRESS_TYPES } from '../../utils/actionToast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { calculateAdvancePayment, formatCurrency as formatCurrencyUtil, formatPercentage } from '../../utils/paymentCalculations';
import {
  useBidHistoryQuery,
  useWithdrawBidMutation,
  useAcceptBidMutation,
} from '../../hooks/useBiddingQueries';
import {
  StandardDataTable,
  StatusBadge,
  type Column,
  type TableAction,
} from '../EnliteUI/Tables';

interface BidTruck {
  id: string;
  plateNumber: string;
  make?: string;
  model?: string;
  year?: number;
  truckType?: string;
  trailerType?: string;
  capacityWeight?: number;
  capacityVolume?: number;
  status?: string;
  color?: string;
}

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
  truck?: BidTruck;
  bidDetails?: {
    truckSpecifications?: {
      truckId?: string;
      truckType?: string;
      capacityWeight?: number;
      capacityVolume?: number;
      hasRefrigeration?: boolean;
      hasHazmatPermit?: boolean;
    };
  };
}

const formatEnumLabel = (value?: string) =>
  value ? value.replace(/_/g, ' ') : '—';

interface BidHistoryProps {
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER' | 'BROKER' | 'ADMIN' | 'SUPER_ADMIN';
  initialStatusFilter?: string;
  /** past = non-accepted; completed = accepted wins; all = everything */
  scope?: 'all' | 'past' | 'completed';
  emptyTitle?: string;
  emptyDescription?: string;
}

const BidHistory: React.FC<BidHistoryProps> = ({
  userRole,
  initialStatusFilter,
  scope = 'all',
  emptyTitle,
  emptyDescription,
}) => {
  const { compactIn: fmtBid, format: fmtFull } = useCurrencyFormat();
  const formatCurrency = (amount: number, _currency?: string) => fmtFull(amount);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    status: initialStatusFilter ?? 'all',
    dateRange: 'all',
    minAmount: '',
    maxAmount: '',
    scope,
  });
  const { confirm, DialogComponent } = useConfirmDialog();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

  React.useEffect(() => {
    setFilters((prev) => ({ ...prev, scope, status: initialStatusFilter ?? prev.status }));
  }, [scope, initialStatusFilter]);

  const {
    data: bids = [],
    isLoading: loading,
    isError,
  } = useBidHistoryQuery(userRole, filters);

  const withdrawBidMutation = useWithdrawBidMutation();
  const acceptBidMutation = useAcceptBidMutation();
  const error = isError ? 'Failed to load bid history' : null;

  const handleWithdrawBid = async (bidId: string) => {
    try {
      await withdrawBidMutation.mutateAsync(bidId);
      toast.success('Bid withdrawn');
    } catch (error) {
      console.error('Withdraw bid error:', error);
      toast.error('Failed to withdraw bid');
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
      await acceptBidMutation.mutateAsync(bidId);
      toastActionSuccess(
        'Bid accepted successfully! The load has been assigned to the truck owner. The assigned driver will see it in their cargo management dashboard.',
        { id: 'accept-bid', suppressTypes: BID_ACCEPT_SUPPRESS_TYPES },
      );
    } catch (error: any) {
      console.error('Accept bid error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to accept bid';
      toastActionError(errorMessage, { id: 'accept-bid' });
    }
  };

   const getStatusBadge = (status: string) => (
    <StatusBadge status={status} label={status} />
  );

  const getAINegotiationBadge = () => (
    <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full bg-blue-500 dark:bg-blue-600 text-white border border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/20 flex items-center gap-1.5 animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)]" />
      Neural AI Counter
    </span>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tableColumns: Column<Bid>[] = useMemo(() => {
    const cols: Column<Bid>[] = [
      {
        key: 'load.title',
        label: 'Context',
        sortable: true,
        alwaysVisible: true,
        render: (_: any, bid: Bid) => (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
              <Truck size={20} className="text-[#345E85] dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-[#0f172a] dark:text-slate-100 leading-tight truncate">{bid.load.title}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Ref: {bid.id.slice(0, 8)}</p>
            </div>
          </div>
        ),
      },
    ];

    if (userRole === 'CARGO_OWNER' || userRole === 'BROKER') {
      cols.push({
        key: 'truckOwner',
        label: 'Bidder',
        render: (_: any, bid: Bid) => {
          const truckOwnerName = bid.truckOwner?.profile
            ? `${bid.truckOwner.profile.firstName || ''} ${bid.truckOwner.profile.lastName || ''}`.trim() || 'Unknown'
            : bid.truckOwner?.email || 'Unknown';
          return (
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">{truckOwnerName}</span>
              {bid.truckOwner?.profile?.companyName && (
                <span className="text-[9px] font-black text-[#345E85] dark:text-blue-400 uppercase tracking-widest mt-1 opacity-70">
                  {bid.truckOwner.profile.companyName}
                </span>
              )}
            </div>
          );
        },
      });
    }

    cols.push({
      key: 'truck',
      label: 'Truck',
      render: (_: unknown, bid: Bid) => (
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
            {bid.truck?.plateNumber || '—'}
          </span>
          {(bid.truck?.truckType || bid.bidDetails?.truckSpecifications?.truckType) && (
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 truncate">
              {formatEnumLabel(bid.truck?.truckType || bid.bidDetails?.truckSpecifications?.truckType)}
              {bid.status === 'ACCEPTED' ? ' · Assigned' : ''}
            </span>
          )}
        </div>
      ),
    });

    cols.push(
      {
        key: 'bidAmount',
        label: 'Financials',
        sortable: true,
        render: (_: any, bid: Bid) => (
          <div>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(bid.bidAmount, bid.bidCurrency)}</div>
            {bid.successProbability && (
              <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mt-1">{bid.successProbability}% MATCH</div>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (_: any, bid: Bid) => (
          <div className="flex flex-col gap-1.5">
            {getStatusBadge(bid.status)}
            {bid.isCounterOffer && getAINegotiationBadge()}
          </div>
        ),
      },
      {
        key: 'createdAt',
        label: 'Timeline',
        sortable: true,
        render: (value: string) => (
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <Clock size={12} />
            <span className="text-[10px] font-black uppercase tracking-tight">{formatDate(value)}</span>
          </div>
        ),
      },
    );

    return cols;
  }, [userRole, formatCurrency]);

  const tableActions: TableAction<Bid>[] = useMemo(() => [
    {
      key: 'details',
      label: 'Details',
      icon: <Eye size={14} />,
      onClick: (bid) => {
        setSelectedBid(bid);
        setShowDetailsModal(true);
      },
    },
    {
      key: 'withdraw',
      label: 'Withdraw',
      icon: <Trash2 size={14} />,
      variant: 'danger',
      hidden: (bid) => !(bid.status === 'PENDING' && userRole === 'TRUCK_OWNER'),
      onClick: (bid) => handleWithdrawBid(bid.id),
    },
    {
      key: 'accept',
      label: 'Accept',
      icon: <CheckCircle size={14} />,
      variant: 'success',
      hidden: (bid) => !(bid.status === 'PENDING' && (userRole === 'CARGO_OWNER' || userRole === 'BROKER')),
      onClick: (bid) => handleAcceptBid(bid.id),
    },
  ], [userRole]);

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
          <p className="text-[10px] font-black text-slate-700 dark:text-slate-300">
            {emptyTitle || 'No bidding history found'}
          </p>
          {emptyDescription && (
            <p className="mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 normal-case tracking-normal">
              {emptyDescription}
            </p>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <StandardDataTable<Bid>
              embedded
              columns={tableColumns}
              data={bids}
              getRowId={(row) => row.id}
              searchable
              searchPlaceholder="Search offers…"
              searchKeys={['id', 'status', 'load.title']}
              pagination
              pageSize={10}
              columnVisibility
              stickyHeader
              striped
              hoverable
              emptyMessage="No bidding history found"
              rowActions={tableActions}
              ariaLabel="Bid history"
            />
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

                      {(bid.truck?.plateNumber || bid.bidDetails?.truckSpecifications?.truckType) && (
                        <div className="mb-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">
                            {bid.status === 'ACCEPTED' ? 'Winning Truck' : 'Proposed Truck'}
                          </p>
                          <p className="text-xs font-black text-slate-900 dark:text-slate-100">
                            {bid.truck?.plateNumber || formatEnumLabel(bid.bidDetails?.truckSpecifications?.truckType)}
                          </p>
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

       {/* Bid Intelligence Modal */}
      <Dialog
        open={showDetailsModal && !!selectedBid}
        onOpenChange={(open) => { if (!open) setShowDetailsModal(false); }}
      >
        <DialogContent className="max-w-3xl bg-white dark:bg-slate-900 rounded-[32px] p-0 border-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-slate-50 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-[#345E85] dark:text-blue-400">
                <History size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Bid Intelligence</h2>
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                  {selectedBid ? `Ref: ${selectedBid.id.slice(0, 12)}` : 'Full operational record'}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedBid && (() => {
            const paymentCalc = calculateAdvancePayment(
              selectedBid.bidAmount,
              selectedBid.advancePaymentPercentage,
              selectedBid.requireAdvancePayment !== false,
              selectedBid.bidCurrency
            );
            const truckOwnerName = `${selectedBid.truckOwner?.profile?.firstName || ''} ${selectedBid.truckOwner?.profile?.lastName || ''}`.trim() || '—';
            const statusTone =
              selectedBid.status === 'ACCEPTED' ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300" :
              selectedBid.status === 'PENDING' ? "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300" :
              selectedBid.status === 'IN_PROGRESS' ? "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300" :
              "bg-slate-50 border-slate-100 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300";

            return (
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className={cn("p-4 rounded-2xl border flex items-center justify-between", statusTone)}>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white/80 dark:bg-slate-900/60 flex items-center justify-center border border-current">
                      <History size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Status</p>
                      <p className="text-sm font-black">{selectedBid.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-wider">Bid Amount</p>
                    <p className="text-xs font-black">{formatCurrency(selectedBid.bidAmount, selectedBid.bidCurrency)}</p>
                  </div>
                </div>

                <BidTSection title="Shipment">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <BidDR label="Title" value={selectedBid.load?.title || '—'} />
                    <BidDR label="Payload" value={selectedBid.load?.weight != null ? `${Number(selectedBid.load.weight).toLocaleString()} kg` : '—'} />
                    <BidDR label="Cargo Value" value={selectedBid.load?.loadValue ? formatCurrency(selectedBid.load.loadValue, selectedBid.bidCurrency) : '—'} />
                    <BidDR label="Auction Type" value={selectedBid.auction?.auctionType || '—'} />
                    <BidDR label="Auction Status" value={selectedBid.auction?.status || '—'} />
                    <BidDR label="Placed" value={formatDate(selectedBid.createdAt)} />
                  </div>
                </BidTSection>

                <BidTSection title="Valuation">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <BidDR label="Bid Amount" value={formatCurrency(selectedBid.bidAmount, selectedBid.bidCurrency)} highlight />
                    <BidDR label="Currency" value={selectedBid.bidCurrency || 'USD'} />
                    <BidDR label="Status" value={selectedBid.status.replace('_', ' ')} />
                    {selectedBid.successProbability != null && (
                      <BidDR label="Win Probability" value={`${Math.round(selectedBid.successProbability)}%`} />
                    )}
                    <BidDR label="Counter Offer" value={selectedBid.isCounterOffer ? 'Yes' : 'No'} />
                    <BidDR
                      label="Advance Required"
                      value={selectedBid.requireAdvancePayment !== false ? 'Yes' : 'No'}
                    />
                  </div>
                </BidTSection>

                {(userRole === 'CARGO_OWNER' || userRole === 'BROKER') && selectedBid.status === 'ACCEPTED' && (
                  <BidTSection title="Settlement Breakdown">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <BidDR
                        label="Advance Commitment"
                        value={formatCurrencyUtil(paymentCalc.advanceAmount, paymentCalc.currency)}
                        highlight
                      />
                      <BidDR
                        label="Advance Share"
                        value={paymentCalc.requireAdvancePayment ? `${formatPercentage(paymentCalc.advancePaymentPercentage)} of total` : '—'}
                      />
                      <BidDR
                        label="Final Settlement"
                        value={formatCurrencyUtil(paymentCalc.finalAmount, paymentCalc.currency)}
                      />
                      <BidDR
                        label="Final Share"
                        value={paymentCalc.requireAdvancePayment ? `${formatPercentage(100 - paymentCalc.advancePaymentPercentage)} of total` : '—'}
                      />
                    </div>
                  </BidTSection>
                )}

                {(selectedBid.proposedPickupDate || selectedBid.proposedDeliveryDate) && (
                  <BidTSection title="Route & Schedule">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                        {selectedBid.proposedPickupDate && (
                          <div className="relative">
                            <div className="absolute -left-6 top-1 h-3 w-3 bg-white dark:bg-slate-950 border-2 border-emerald-500 rounded-full" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Pickup</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatDate(selectedBid.proposedPickupDate)}</p>
                          </div>
                        )}
                        {selectedBid.proposedDeliveryDate && (
                          <div className="relative">
                            <div className="absolute -left-6 top-1 h-3 w-3 bg-white dark:bg-slate-950 border-2 border-rose-500 rounded-full" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Delivery</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatDate(selectedBid.proposedDeliveryDate)}</p>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <BidDR label="Pickup Date" value={selectedBid.proposedPickupDate ? formatDate(selectedBid.proposedPickupDate) : '—'} />
                        <BidDR label="Delivery Date" value={selectedBid.proposedDeliveryDate ? formatDate(selectedBid.proposedDeliveryDate) : '—'} />
                        <BidDR label="Auction Closes" value={selectedBid.auction?.auctionEnd ? formatDate(selectedBid.auction.auctionEnd) : '—'} />
                      </div>
                    </div>
                  </BidTSection>
                )}

                {selectedBid.bidNotes && (
                  <BidTSection title="Notes">
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{selectedBid.bidNotes}</p>
                  </BidTSection>
                )}

                {(userRole === 'CARGO_OWNER' || userRole === 'BROKER') && selectedBid.truckOwner && (
                  <BidTSection title="Carrier Contact">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <BidDR label="Full Name" value={truckOwnerName} />
                      <BidDR label="Email" value={selectedBid.truckOwner.email || '—'} />
                      <BidDR label="Phone" value={selectedBid.truckOwner.profile?.phone || selectedBid.truckOwner.phone || '—'} />
                      {selectedBid.truckOwner.profile?.companyName && (
                        <BidDR label="Company" value={selectedBid.truckOwner.profile.companyName} />
                      )}
                    </div>
                  </BidTSection>
                )}

                {(selectedBid.truck || selectedBid.bidDetails?.truckSpecifications) && (
                  <BidTSection title={selectedBid.status === 'ACCEPTED' ? 'Winning Truck' : 'Proposed Truck'}>
                    {selectedBid.status === 'ACCEPTED' && (
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mb-3">
                        Assigned to ship this cargo after the bid was awarded.
                      </p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <BidDR
                        label="Plate Number"
                        value={selectedBid.truck?.plateNumber || '—'}
                        highlight={selectedBid.status === 'ACCEPTED'}
                      />
                      <BidDR
                        label="Vehicle"
                        value={
                          [selectedBid.truck?.year, selectedBid.truck?.make, selectedBid.truck?.model]
                            .filter(Boolean)
                            .join(' ') || '—'
                        }
                      />
                      <BidDR
                        label="Type"
                        value={formatEnumLabel(selectedBid.truck?.truckType || selectedBid.bidDetails?.truckSpecifications?.truckType)}
                      />
                      {(selectedBid.truck?.trailerType || selectedBid.truck?.color) && (
                        <BidDR
                          label={selectedBid.truck?.trailerType ? 'Trailer' : 'Color'}
                          value={formatEnumLabel(selectedBid.truck?.trailerType || selectedBid.truck?.color)}
                        />
                      )}
                      <BidDR
                        label="Capacity"
                        value={
                          selectedBid.truck?.capacityWeight != null
                            ? `${Number(selectedBid.truck.capacityWeight).toLocaleString()} kg`
                            : selectedBid.bidDetails?.truckSpecifications?.capacityWeight != null
                              ? `${Number(selectedBid.bidDetails.truckSpecifications.capacityWeight).toLocaleString()} kg`
                              : '—'
                        }
                      />
                      {(selectedBid.truck?.capacityVolume != null || selectedBid.bidDetails?.truckSpecifications?.capacityVolume != null) && (
                        <BidDR
                          label="Volume"
                          value={`${Number(selectedBid.truck?.capacityVolume ?? selectedBid.bidDetails?.truckSpecifications?.capacityVolume).toLocaleString()} m³`}
                        />
                      )}
                      {selectedBid.truck?.status && (
                        <BidDR label="Truck Status" value={formatEnumLabel(selectedBid.truck.status)} />
                      )}
                      {selectedBid.bidDetails?.truckSpecifications?.hasRefrigeration && (
                        <BidDR label="Refrigeration" value="Yes" />
                      )}
                      {selectedBid.bidDetails?.truckSpecifications?.hasHazmatPermit && (
                        <BidDR label="Hazmat Permit" value="Yes" />
                      )}
                    </div>
                  </BidTSection>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-50 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Styled Confirmation Dialog */}
      {DialogComponent}
    </div>
  );
};

const BidTSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
    <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
      {children}
    </div>
  </div>
);

const BidDR = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex flex-col gap-0.5 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    <span className={`text-[11px] font-bold truncate ${highlight ? 'text-[#345E85]' : 'text-slate-800 dark:text-slate-200'}`}>{value}</span>
  </div>
);

export default BidHistory; 