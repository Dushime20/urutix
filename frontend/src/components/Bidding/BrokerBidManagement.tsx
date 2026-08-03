import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Gavel, ChevronDown, ChevronUp, Check, X, Eye, RefreshCw,
  Loader2, Star, TrendingDown, User, Calendar, Truck, Clock,
  DollarSign, AlertCircle, Package, FileText, Award,
  CheckCircle2, XCircle, Info, Plus, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { toastActionSuccess, toastActionError, BID_ACCEPT_SUPPRESS_TYPES } from '../../utils/actionToast';
import { biddingAPI } from '../../services/biddingApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { cn } from '@/utils/cn';
import { useAuth } from '../../contexts/AuthContext';
import { StandardDataTable, type Column } from '../EnliteUI/Tables';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BidDetails {
  truckSpecifications?: { truckId?: string; truckType?: string; capacityWeight?: number };
  driverInfo?: { driverId?: string; experience?: number; rating?: number };
  routeOptimization?: { estimatedDistance?: number; estimatedFuelCost?: number; estimatedTime?: number };
}

interface Bid {
  id: string;
  bidAmount: number;
  bidCurrency: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  bidNotes?: string;
  proposedPickupDate?: string;
  proposedDeliveryDate?: string;
  createdAt: string;
  truckOwnerId?: string;
  truckOwner?: {
    id: string;
    email: string;
    profile?: { firstName?: string; lastName?: string; companyName?: string };
    phone?: string;
  };
  bidDetails?: BidDetails;
}

interface Auction {
  id: string;
  loadId: string;
  auctionType: string;
  status: string;
  auctionStart: string;
  auctionEnd: string;
  reservePrice?: number;
  currentBestBid?: number;
  currentHighestBid?: number;
  totalBids?: number;
  createdById?: string;
  load?: {
    id: string;
    title?: string;
    description?: string;
    weight?: number;
    cargoType?: string;
    pickupDate?: string;
    deliveryDate?: string;
    offeredPrice?: number;
    loadValue?: number;
    currencyCode?: string;
    locations?: any[];
    origin?: any;
    destination?: any;
    brokerId?: string;
    cargoOwner?: { id: string; email: string; profile?: { firstName?: string; lastName?: string; companyName?: string } };
  };
  bids?: Bid[];
}

type SortKey = 'amount' | 'date' | 'status' | 'delivery';
type SortDir = 'asc' | 'desc';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtFull(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function transitDays(pickup?: string, delivery?: string): string {
  if (!pickup || !delivery) return '—';
  const d = Math.ceil((new Date(delivery).getTime() - new Date(pickup).getTime()) / 86_400_000);
  return d > 0 ? `${d}d` : '—';
}
function timeLeft(end: string): string {
  const diff = new Date(end).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function ownerName(bid: Bid): string {
  const p = bid.truckOwner?.profile;
  if (p?.companyName) return p.companyName;
  if (p?.firstName) return `${p.firstName} ${p.lastName ?? ''}`.trim();
  return bid.truckOwner?.email ?? 'Unknown';
}
function locationStr(load: Auction['load'], type: 'pickup' | 'delivery'): string {
  if (!load) return '—';
  const loc = load.locations?.find((l: any) => l.type === (type === 'pickup' ? 'PICKUP' : 'DELIVERY'));
  if (loc?.locationData) {
    const d = loc.locationData;
    return [d.city, d.state, d.country].filter(Boolean).join(', ') || d.address || d.name || '—';
  }
  const obj = type === 'pickup' ? load.origin : load.destination;
  if (obj) return [obj.city, obj.country].filter(Boolean).join(', ') || obj.address || '—';
  return '—';
}

// ─── BidStatusBadge ───────────────────────────────────────────────────────────

function BidStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING:   'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    ACCEPTED:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    REJECTED:  'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    WITHDRAWN: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    EXPIRED:   'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700',
  };
  const icon: Record<string, React.ReactNode> = {
    PENDING:   <Clock size={9} />,
    ACCEPTED:  <CheckCircle2 size={9} />,
    REJECTED:  <XCircle size={9} />,
    WITHDRAWN: <X size={9} />,
    EXPIRED:   <AlertCircle size={9} />,
  };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider', map[status] ?? map.EXPIRED)}>
      {icon[status]}
      {status}
    </span>
  );
}

function AuctionStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:    'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    SCHEDULED: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    CLOSED:    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    CANCELLED: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    PAUSED:    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider', map[status] ?? map.CLOSED)}>
      <span className={cn('w-1.5 h-1.5 rounded-full bg-current', status === 'ACTIVE' && 'animate-pulse')} />
      {status}
    </span>
  );
}

// ─── BidDetailModal ───────────────────────────────────────────────────────────

interface BidDetailModalProps {
  bid: Bid;
  auction: Auction;
  onClose: () => void;
  onAccept: (bidId: string) => void;
  accepting: boolean;
  auctionClosed: boolean;
}

function BidDetailModal({ bid, auction, onClose, onAccept, accepting, auctionClosed }: BidDetailModalProps) {
  const { formatIn } = useCurrencyFormat();
  const currency = bid.bidCurrency || auction.load?.currencyCode || 'USD';
  const isWinner = bid.status === 'ACCEPTED';
  const canAccept = bid.status === 'PENDING' && !auctionClosed;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={cn('px-6 py-5 flex items-start justify-between gap-4', isWinner && 'bg-emerald-50 dark:bg-emerald-900/20')}>
          <div className="flex items-center gap-3">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', isWinner ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-800')}>
              {isWinner ? <Award size={20} className="text-emerald-600 dark:text-emerald-400" /> : <FileText size={20} className="text-slate-500 dark:text-slate-400" />}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Bid Details</h2>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{ownerName(bid)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <BidStatusBadge status={bid.status} />
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><X size={16} /></button>
          </div>
        </div>

        {isWinner && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">This bid has been accepted. All other bids were automatically rejected.</p>
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Bid Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Bid Amount</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{formatIn(bid.bidAmount, currency)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Transit Time</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{transitDays(bid.proposedPickupDate, bid.proposedDeliveryDate)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Submitted</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{fmt(bid.createdAt)}</p>
            </div>
          </div>

          {/* Truck Owner Info */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><User size={10} />Truck Owner</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{ownerName(bid)}</p>
            {bid.truckOwner?.email && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{bid.truckOwner.email}</p>}
            {bid.truckOwner?.phone && <p className="text-xs text-slate-500 dark:text-slate-400">{bid.truckOwner.phone}</p>}
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Calendar size={9} />Pickup</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{fmtFull(bid.proposedPickupDate)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Calendar size={9} />Delivery</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{fmtFull(bid.proposedDeliveryDate)}</p>
            </div>
          </div>

          {/* Truck & Driver Info */}
          {bid.bidDetails && (
            <div className="space-y-3">
              {bid.bidDetails.truckSpecifications && (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Truck size={10} />Truck Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {bid.bidDetails.truckSpecifications.truckType && (
                      <div><span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold block mb-0.5">Type</span><span className="font-bold text-slate-800 dark:text-slate-200">{bid.bidDetails.truckSpecifications.truckType}</span></div>
                    )}
                    {bid.bidDetails.truckSpecifications.capacityWeight && (
                      <div><span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold block mb-0.5">Capacity</span><span className="font-bold text-slate-800 dark:text-slate-200">{bid.bidDetails.truckSpecifications.capacityWeight.toLocaleString()} kg</span></div>
                    )}
                  </div>
                </div>
              )}
              {bid.bidDetails.driverInfo && (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><User size={10} />Driver Info</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {bid.bidDetails.driverInfo.experience !== undefined && (
                      <div><span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold block mb-0.5">Experience</span><span className="font-bold text-slate-800 dark:text-slate-200">{bid.bidDetails.driverInfo.experience} yrs</span></div>
                    )}
                    {bid.bidDetails.driverInfo.rating !== undefined && (
                      <div><span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold block mb-0.5">Rating</span><span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1"><Star size={11} className="text-amber-400 fill-amber-400" />{bid.bidDetails.driverInfo.rating}</span></div>
                    )}
                  </div>
                </div>
              )}
              {bid.bidDetails.routeOptimization && (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Route Estimate</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {bid.bidDetails.routeOptimization.estimatedDistance && (
                      <div><span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Distance</span><span className="font-bold text-slate-800 dark:text-slate-200">{bid.bidDetails.routeOptimization.estimatedDistance} km</span></div>
                    )}
                    {bid.bidDetails.routeOptimization.estimatedTime && (
                      <div><span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Est. Time</span><span className="font-bold text-slate-800 dark:text-slate-200">{bid.bidDetails.routeOptimization.estimatedTime}h</span></div>
                    )}
                    {bid.bidDetails.routeOptimization.estimatedFuelCost && (
                      <div><span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Fuel Cost</span><span className="font-bold text-slate-800 dark:text-slate-200">{formatIn(bid.bidDetails.routeOptimization.estimatedFuelCost, currency)}</span></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {bid.bidNotes && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Info size={9} />Notes from Truck Owner</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{bid.bidNotes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Close</button>
          {canAccept && (
            <button
              onClick={() => onAccept(bid.id)}
              disabled={accepting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Accept This Bid
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── AuctionBidPanel ──────────────────────────────────────────────────────────

interface AuctionBidPanelProps {
  auction: Auction;
  onAcceptBid: (bidId: string, auctionId: string) => void;
  accepting: string | null;
  highlightBidId?: string | null;
}

function AuctionBidPanel({ auction, onAcceptBid, accepting, highlightBidId }: AuctionBidPanelProps) {
  const queryClient = useQueryClient();
  const { formatIn } = useCurrencyFormat();
  const sortKey: SortKey = 'amount';
  const sortDir: SortDir = 'asc';
  const [viewBid, setViewBid] = useState<Bid | null>(null);
  const [bidFilter, setBidFilter] = useState<string>('all');

  const { data: bidsData, isLoading } = useQuery({
    queryKey: ['auction-bids', auction.loadId],
    queryFn: async () => {
      const r = await biddingAPI.getBidsForLoad(auction.loadId);
      const raw = r.data?.bids ?? r.data?.items ?? r.data ?? [];
      return Array.isArray(raw) ? raw as Bid[] : [];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const bids = bidsData ?? [];
  const hasAccepted = bids.some(b => b.status === 'ACCEPTED');
  // CLOSED = bidding period ended, broker still picks winner from PENDING bids
  // Only CANCELLED blocks acceptance entirely
  const auctionClosed = auction.status === 'CANCELLED';

  useEffect(() => {
    if (!highlightBidId || !bids.length) return;
    const targetBid = bids.find((b) => b.id === highlightBidId);
    if (targetBid) {
      setViewBid(targetBid);
    }
  }, [highlightBidId, bids]);

  const filtered = bids.filter(b => bidFilter === 'all' || b.status === bidFilter);

  const sorted = [...filtered].sort((a, b) => {
    let av: any, bv: any;
    if (sortKey === 'amount')   { av = a.bidAmount; bv = b.bidAmount; }
    if (sortKey === 'date')     { av = new Date(a.createdAt).getTime(); bv = new Date(b.createdAt).getTime(); }
    if (sortKey === 'status')   { av = a.status; bv = b.status; }
    if (sortKey === 'delivery') { av = a.proposedDeliveryDate ? new Date(a.proposedDeliveryDate).getTime() : Infinity; bv = b.proposedDeliveryDate ? new Date(b.proposedDeliveryDate).getTime() : Infinity; }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const lowestAmount = bids.filter(b => b.status === 'PENDING').reduce((min, b) => Math.min(min, b.bidAmount), Infinity);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={20} className="animate-spin text-slate-400" />
        <span className="ml-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Loading bids…</span>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <Gavel size={24} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase">No bids yet</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Truck Owners will appear here once they submit bids.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {(['all', 'PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'] as const).map(s => (
            <button key={s} onClick={() => setBidFilter(s)}
              className={cn('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all',
                bidFilter === s ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white' : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400')}>
              {s === 'all' ? `All (${bids.length})` : `${s} (${bids.filter(b => b.status === s).length})`}
            </button>
          ))}
        </div>
        {hasAccepted && (
          <span className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 size={10} />Winner Selected
          </span>
        )}
      </div>

      {/* Table */}
      <StandardDataTable
        embedded
        columns={[
          {
            key: 'rank',
            label: '#',
            width: '40px',
            render: (_: any, bid: Bid, index: number) => {
              const isLowest = bid.bidAmount === lowestAmount;
              return (
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black',
                  isLowest && bid.status === 'PENDING'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
                )}>
                  {index + 1}
                </span>
              );
            },
          },
          {
            key: 'truckOwner',
            label: 'Truck Owner',
            render: (_: any, bid: Bid) => (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-[10px] font-black text-slate-500 dark:text-slate-400">
                  {ownerName(bid).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{ownerName(bid)}</p>
                  {bid.bidDetails?.driverInfo?.rating && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-500">
                      <Star size={9} className="fill-amber-400 text-amber-400" />{bid.bidDetails.driverInfo.rating}
                    </span>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: 'bidAmount',
            label: 'Amount',
            sortable: true,
            render: (amount: number, bid: Bid) => {
              const currency = bid.bidCurrency || auction.load?.currencyCode || 'USD';
              const isLowest = amount === lowestAmount;
              return (
                <div>
                  <div className="flex items-center gap-1.5">
                    {isLowest && bid.status === 'PENDING' && <TrendingDown size={12} className="text-amber-500 shrink-0" />}
                    <span className={cn('text-sm font-black', isLowest && bid.status === 'PENDING' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100')}>
                      {formatIn(amount, currency)}
                    </span>
                  </div>
                  {isLowest && bid.status === 'PENDING' && (
                    <p className="text-[9px] font-bold text-amber-500 uppercase">Lowest Bid</p>
                  )}
                </div>
              );
            },
          },
          {
            key: 'proposedPickupDate',
            label: 'Pickup',
            sortable: true,
            render: (d: string) => <span className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">{fmt(d)}</span>,
          },
          {
            key: 'proposedDeliveryDate',
            label: 'Delivery',
            sortable: true,
            render: (d: string) => <span className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">{fmt(d)}</span>,
          },
          {
            key: 'transit',
            label: 'Transit',
            render: (_: any, bid: Bid) => (
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {transitDays(bid.proposedPickupDate, bid.proposedDeliveryDate)}
              </span>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (status: string) => <BidStatusBadge status={status as Bid['status']} />,
          },
          {
            key: 'winner',
            label: 'Winner',
            render: (_: any, bid: Bid) =>
              bid.status === 'ACCEPTED' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase border border-emerald-200 dark:border-emerald-800">
                  <Award size={9} />Winner
                </span>
              ) : null,
          },
          {
            key: 'actions',
            label: 'Actions',
            align: 'right',
            alwaysVisible: true,
            hideable: false,
            render: (_: any, bid: Bid) => {
              const canAccept = bid.status === 'PENDING' && !(auctionClosed || hasAccepted);
              return (
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setViewBid(bid)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="View Details"
                  >
                    <Eye size={13} />
                  </button>
                  {canAccept && (
                    <button
                      type="button"
                      onClick={() => onAcceptBid(bid.id, auction.id)}
                      disabled={accepting === bid.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {accepting === bid.id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                      Accept
                    </button>
                  )}
                </div>
              );
            },
          },
        ] as Column<Bid>[]}
        data={sorted}
        getRowId={(row) => row.id}
        searchable={false}
        pagination={false}
        columnVisibility
        stickyHeader
        striped={false}
        hoverable
        emptyMessage="No bids match this filter"
        rowClassName={(bid) =>
          bid.status === 'ACCEPTED'
            ? 'bg-emerald-50/60 dark:bg-emerald-900/10'
            : bid.bidAmount === lowestAmount && bid.status === 'PENDING'
              ? 'bg-amber-50/40 dark:bg-amber-900/5'
              : ''
        }
        ariaLabel="Auction bids"
      />

      {/* View bid detail modal */}
      {viewBid && (
        <BidDetailModal
          bid={viewBid}
          auction={auction}
          onClose={() => setViewBid(null)}
          onAccept={(id) => { onAcceptBid(id, auction.id); setViewBid(null); }}
          accepting={accepting === viewBid.id}
          auctionClosed={auctionClosed || hasAccepted}
        />
      )}
    </div>
  );
}

// ─── AuctionCard (collapsed view) ────────────────────────────────────────────

interface AuctionCardProps {
  auction: Auction;
  isExpanded: boolean;
  onToggle: () => void;
  onAcceptBid: (bidId: string, auctionId: string) => void;
  accepting: string | null;
  highlightBidId?: string | null;
}

function AuctionCard({ auction, isExpanded, onToggle, onAcceptBid, accepting, highlightBidId }: AuctionCardProps) {
  const { formatIn } = useCurrencyFormat();
  const currency = auction.load?.currencyCode || 'USD';
  const bidCount = auction.totalBids ?? 0;
  const from = locationStr(auction.load, 'pickup');
  const to   = locationStr(auction.load, 'delivery');
  const isActive = auction.status === 'ACTIVE';
  const isClosed = auction.status === 'CLOSED' || auction.status === 'CANCELLED';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-shadow hover:shadow-md dark:hover:shadow-none">
      {/* Clickable header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
      >
        {/* Status dot */}
        <div className={cn('w-2.5 h-2.5 rounded-full shrink-0 mt-0.5', isActive ? 'bg-emerald-500 animate-pulse' : isClosed ? 'bg-slate-300 dark:bg-slate-600' : 'bg-amber-400')} />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase italic truncate">
              {auction.load?.title || `Auction #${auction.id.slice(0, 8)}`}
            </h3>
            <AuctionStatusBadge status={auction.status} />
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-slate-900 dark:bg-slate-800 text-white uppercase tracking-wider">{auction.auctionType}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {from !== '—' && to !== '—' && (
              <span className="flex items-center gap-1 truncate">
                <Package size={9} />{from.split(',')[0]} → {to.split(',')[0]}
              </span>
            )}
            {auction.load?.weight && <span>{auction.load.weight.toLocaleString()} kg</span>}
            <span className="flex items-center gap-1">
              <Clock size={9} />
              {isActive ? timeLeft(auction.auctionEnd) : `Ended ${fmt(auction.auctionEnd)}`}
            </span>
            {auction.reservePrice && (
              <span className="flex items-center gap-1">
                <DollarSign size={9} />Reserve: {formatIn(auction.reservePrice, currency)}
              </span>
            )}
          </div>
        </div>

        {/* Bid count badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-center">
            <span className={cn('text-lg font-black', bidCount > 0 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-300 dark:text-slate-600')}>{bidCount}</span>
            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Bids</p>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded bids panel */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-5 bg-slate-50/30 dark:bg-slate-900/50">
          <AuctionBidPanel auction={auction} onAcceptBid={onAcceptBid} accepting={accepting} highlightBidId={highlightBidId} />
        </div>
      )}
    </div>
  );
}

// ─── Main BrokerBidManagement component ──────────────────────────────────────

interface BrokerBidManagementProps {
  onCreateAuction?: () => void;
}

const BrokerBidManagement: React.FC<BrokerBidManagementProps> = ({ onCreateAuction }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, DialogComponent } = useConfirmDialog();
  const [searchParams] = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [accepting, setAccepting] = useState<string | null>(null);
  const deepLinkLoadId = searchParams.get('loadId');
  const deepLinkBidId = searchParams.get('bidId');

  // Fetch auctions where this broker is assigned to the load
  const { data: auctionsData, isLoading, error, refetch } = useQuery({
    queryKey: ['broker-assigned-auctions', user?.id],
    queryFn: async () => {
      const r = await biddingAPI.getAuctions();
      const raw: Auction[] = r.data?.auctions ?? r.data?.items ?? r.data ?? [];
      const list = Array.isArray(raw) ? raw : [];
      // Show auctions where broker is assigned to the load (load.brokerId === user.id)
      // Backend filtering should handle this, but we also filter client-side for defense-in-depth
      return list.filter(a => a.load?.brokerId === user?.id);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const auctions: Auction[] = auctionsData ?? [];

  useEffect(() => {
    if (!deepLinkLoadId || !auctions.length) return;
    const targetAuction = auctions.find((a) => a.loadId === deepLinkLoadId);
    if (targetAuction) {
      setExpandedId(targetAuction.id);
    }
  }, [deepLinkLoadId, auctions]);

  const displayed = statusFilter === 'all' ? auctions : auctions.filter(a => a.status === statusFilter);

  // Stats
  const stats = {
    total:  auctions.length,
    active: auctions.filter(a => a.status === 'ACTIVE').length,
    totalBids: auctions.reduce((sum, a) => sum + (a.totalBids ?? 0), 0),
    closed: auctions.filter(a => a.status === 'CLOSED').length,
  };

  const handleAcceptBid = useCallback(async (bidId: string, _auctionId: string) => {
    const confirmed = await confirm({
      title: 'Accept This Bid?',
      message: 'Accepting this bid will mark it as the winner and automatically reject all other bids for this auction. This action cannot be undone.',
      confirmText: 'Accept Bid',
      cancelText: 'Cancel',
      variant: 'info',
    });
    if (!confirmed) return;

    setAccepting(bidId);
    try {
      await biddingAPI.acceptBid(bidId);
      toastActionSuccess('Bid accepted! Other bids have been rejected.', {
        id: 'accept-bid',
        suppressTypes: BID_ACCEPT_SUPPRESS_TYPES,
      });
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['broker-assigned-auctions'] });
      queryClient.invalidateQueries({ queryKey: ['auction-bids'] });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to accept bid';
      toastActionError(msg, { id: 'accept-bid' });
    } finally {
      setAccepting(null);
    }
  }, [confirm, queryClient]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={32} className="animate-spin text-primary-400" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading your auctions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 flex items-start gap-4">
        <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-black text-red-700 dark:text-red-400">Failed to load auctions</p>
          <p className="text-xs text-red-500 dark:text-red-500 mt-1">Please check your connection and try again.</p>
          <button onClick={() => refetch()} className="mt-3 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold hover:bg-red-200 transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">Bid Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Review incoming bids or start a new auction or match</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onCreateAuction}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#345E85] hover:bg-[#2c5173] text-white text-xs font-bold uppercase tracking-wide transition-colors shadow-sm"
          >
            <Plus size={14} />
            Create Auction
          </button>
          <button
            onClick={() => navigate('/dashboard/broker/smart-matching')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#345E85] dark:text-primary-400 text-xs font-bold uppercase tracking-wide hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Zap size={14} />
            Smart Match
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'My Auctions', value: stats.total,     icon: Gavel,        color: 'text-primary-600 dark:text-primary-400',  bg: 'bg-primary-50 dark:bg-primary-900/20' },
          { label: 'Active',      value: stats.active,    icon: Clock,         color: 'text-emerald-600 dark:text-emerald-400',  bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Total Bids',  value: stats.totalBids, icon: DollarSign,    color: 'text-amber-600 dark:text-amber-400',      bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Closed',      value: stats.closed,    icon: CheckCircle2,  color: 'text-slate-600 dark:text-slate-400',      bg: 'bg-slate-50 dark:bg-slate-800' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', s.bg)}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">{s.value}</p>
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Refresh */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {(['all', 'ACTIVE', 'SCHEDULED', 'CLOSED', 'CANCELLED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
                statusFilter === s
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700')}>
              {s === 'all' ? `All (${stats.total})` : `${s} (${auctions.filter(a => a.status === s).length})`}
            </button>
          ))}
        </div>
        <button onClick={() => refetch()} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700">
          <RefreshCw size={13} />Refresh
        </button>
      </div>

      {/* Auction list */}
      {displayed.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Gavel size={28} className="text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-base font-black text-slate-700 dark:text-slate-300 uppercase italic mb-1">No auctions found</h3>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-5">
            {statusFilter !== 'all' ? 'Try a different status filter.' : 'Create an auction or run smart matching to get started.'}
          </p>
          {statusFilter === 'all' && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onCreateAuction}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#345E85] hover:bg-[#2c5173] text-white text-xs font-bold uppercase tracking-wide transition-colors"
              >
                <Plus size={14} />
                Create Auction
              </button>
              <button
                onClick={() => navigate('/dashboard/broker/smart-matching')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wide hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Zap size={14} />
                Smart Match
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(auction => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              isExpanded={expandedId === auction.id}
              onToggle={() => setExpandedId(prev => prev === auction.id ? null : auction.id)}
              onAcceptBid={handleAcceptBid}
              accepting={accepting}
              highlightBidId={auction.loadId === deepLinkLoadId ? deepLinkBidId : null}
            />
          ))}
        </div>
      )}

      {DialogComponent}
    </div>
  );
};

export default BrokerBidManagement;
