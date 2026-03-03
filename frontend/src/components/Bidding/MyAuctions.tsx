import React, { useState, useEffect } from 'react';
import {
    Gavel,
    Clock,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    User,
    DollarSign,
    Loader2,
    RefreshCw,
    Star,
} from 'lucide-react';
import { biddingAPI } from '../../services/biddingApi';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';

interface Bid {
    id: string;
    bidAmount: number;
    bidCurrency: string;
    status: string;
    bidNotes?: string;
    proposedPickupDate?: string;
    proposedDeliveryDate?: string;
    createdAt: string;
    truckOwnerId?: string;
    truckOwner?: {
        id: string;
        email: string;
        profile?: {
            firstName?: string;
            lastName?: string;
            companyName?: string;
        };
    };
    bidDetails?: {
        truckSpecifications?: {
            truckType?: string;
            capacityWeight?: number;
        };
        driverInfo?: {
            experience?: number;
            rating?: number;
        };
    };
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
    totalBids?: number;
    load?: {
        id: string;
        title?: string;
        description?: string;
        weight?: number;
        pickupDate?: string;
        deliveryDate?: string;
        offeredPrice?: number;
        loadValue?: number;
    };
    bids?: Bid[];
}

const MyAuctions: React.FC = () => {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedAuction, setExpandedAuction] = useState<string | null>(null);
    const [auctionBids, setAuctionBids] = useState<{ [auctionId: string]: Bid[] }>({});
    const [loadingBids, setLoadingBids] = useState<{ [auctionId: string]: boolean }>({});
    const [acceptingBid, setAcceptingBid] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        loadAuctions();
    }, []);

    const loadAuctions = async () => {
        setLoading(true);
        try {
            const response = await biddingAPI.getAuctions();
            const auctionData = response.data?.auctions || response.data?.items || response.data || [];
            setAuctions(Array.isArray(auctionData) ? auctionData : []);
        } catch (error) {
            console.error('Failed to load auctions:', error);
            toast.error('Failed to load your auctions');
        } finally {
            setLoading(false);
        }
    };

    const loadBidsForAuction = async (auction: Auction) => {
        const loadId = auction.loadId || auction.load?.id;
        if (!loadId) return;

        setLoadingBids(prev => ({ ...prev, [auction.id]: true }));
        try {
            const response = await biddingAPI.getBidsForLoad(loadId);
            const bids = response.data?.bids || response.data?.items || response.data || [];
            setAuctionBids(prev => ({ ...prev, [auction.id]: Array.isArray(bids) ? bids : [] }));
        } catch (error) {
            console.error('Failed to load bids:', error);
            setAuctionBids(prev => ({ ...prev, [auction.id]: [] }));
        } finally {
            setLoadingBids(prev => ({ ...prev, [auction.id]: false }));
        }
    };

    const toggleAuction = (auctionId: string, auction: Auction) => {
        if (expandedAuction === auctionId) {
            setExpandedAuction(null);
        } else {
            setExpandedAuction(auctionId);
            if (!auctionBids[auctionId]) {
                loadBidsForAuction(auction);
            }
        }
    };

    const handleAcceptBid = async (bidId: string) => {
        setAcceptingBid(bidId);
        try {
            await biddingAPI.acceptBid(bidId);
            toast.success('Bid accepted successfully!');
            loadAuctions();
            // Refresh bids for the expanded auction
            if (expandedAuction) {
                const auction = auctions.find(a => a.id === expandedAuction);
                if (auction) loadBidsForAuction(auction);
            }
        } catch (error) {
            console.error('Failed to accept bid:', error);
            toast.error('Failed to accept bid');
        } finally {
            setAcceptingBid(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            SCHEDULED: 'bg-amber-100 text-amber-700 border-amber-200',
            CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
            CANCELLED: 'bg-red-100 text-red-700 border-red-200',
            PAUSED: 'bg-blue-100 text-blue-700 border-blue-200',
        };
        return styles[status] || 'bg-slate-100 text-slate-600 border-slate-200';
    };

    const getBidStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-amber-50 text-amber-700',
            ACCEPTED: 'bg-emerald-50 text-emerald-700',
            REJECTED: 'bg-red-50 text-red-700',
            WITHDRAWN: 'bg-slate-50 text-slate-500',
            EXPIRED: 'bg-slate-50 text-slate-400',
        };
        return styles[status] || 'bg-slate-50 text-slate-500';
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount?: number) => {
        if (!amount && amount !== 0) return '$--.--';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const getTimeRemaining = (endDate: string) => {
        const now = new Date();
        const end = new Date(endDate);
        const diff = end.getTime() - now.getTime();
        if (diff <= 0) return 'Ended';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h remaining`;
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours}h ${minutes}m remaining`;
        return `${minutes}m remaining`;
    };

    const filteredAuctions = statusFilter === 'all'
        ? auctions
        : auctions.filter(a => a.status === statusFilter);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#345E85]" />
                <span className="ml-3 text-sm text-slate-500">Loading your auctions...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                        statusFilter === 'all'
                            ? "bg-[#345E85] text-white shadow-md"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    )}
                >
                    All ({auctions.length})
                </button>
                {['ACTIVE', 'SCHEDULED', 'CLOSED', 'CANCELLED'].map(status => {
                    const count = auctions.filter(a => a.status === status).length;
                    return (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                                statusFilter === status
                                    ? "bg-[#345E85] text-white shadow-md"
                                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                            )}
                        >
                            {status} ({count})
                        </button>
                    );
                })}

                <button
                    onClick={loadAuctions}
                    className="ml-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-[#345E85] hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Auctions List */}
            {filteredAuctions.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                        <Gavel className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-1">No auctions found</h3>
                    <p className="text-sm text-slate-400">Create your first auction to start receiving bids from truck owners.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAuctions.map(auction => {
                        const isExpanded = expandedAuction === auction.id;
                        const bids = auctionBids[auction.id] || [];
                        const isLoadingBids = loadingBids[auction.id];
                        const bidCount = auction.totalBids || bids.length;
                        const pendingBids = bids.filter(b => b.status === 'PENDING');

                        return (
                            <div
                                key={auction.id}
                                className="bg-white border border-slate-100 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md"
                            >
                                {/* Auction Header - Clickable */}
                                <button
                                    onClick={() => toggleAuction(auction.id, auction)}
                                    className="w-full px-6 py-5 flex items-center gap-4 text-left hover:bg-slate-50/50 transition-colors"
                                >
                                    {/* Status Indicator */}
                                    <div className={cn(
                                        "w-3 h-3 rounded-full shrink-0",
                                        auction.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' :
                                            auction.status === 'SCHEDULED' ? 'bg-amber-500' :
                                                'bg-slate-300'
                                    )} />

                                    {/* Auction Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-base font-bold text-slate-900 truncate">
                                                {auction.load?.title || `Auction #${auction.id.slice(0, 8)}`}
                                            </h3>
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border",
                                                getStatusBadge(auction.status)
                                            )}>
                                                {auction.status}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-slate-800 text-white">
                                                {auction.auctionType}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {auction.status === 'ACTIVE' ? getTimeRemaining(auction.auctionEnd) : formatDate(auction.auctionEnd)}
                                            </span>
                                            {auction.reservePrice && (
                                                <span className="flex items-center gap-1">
                                                    <DollarSign size={12} />
                                                    Reserve: {formatCurrency(auction.reservePrice)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bid Count */}
                                    <div className="flex items-center gap-4 shrink-0">
                                        {pendingBids.length > 0 && (
                                            <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                                                {pendingBids.length} pending
                                            </span>
                                        )}
                                        <div className="text-center">
                                            <span className="text-xl font-black text-[#345E85]">{bidCount}</span>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Bids</p>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp size={18} className="text-slate-400" />
                                        ) : (
                                            <ChevronDown size={18} className="text-slate-400" />
                                        )}
                                    </div>
                                </button>

                                {/* Expanded: Bids List */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 bg-slate-50/30">
                                        {isLoadingBids ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                                <span className="ml-2 text-sm text-slate-400">Loading bids...</span>
                                            </div>
                                        ) : bids.length === 0 ? (
                                            <div className="text-center py-12">
                                                <p className="text-sm text-slate-400">No bids received yet for this auction.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {/* Bids Header */}
                                                <div className="px-6 py-3 flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50">
                                                    <div className="w-8" />
                                                    <div className="flex-1">Bidder</div>
                                                    <div className="w-32 text-right">Bid Amount</div>
                                                    <div className="w-28 text-center">Status</div>
                                                    <div className="w-36 text-center">Date</div>
                                                    <div className="w-40 text-center">Actions</div>
                                                </div>

                                                {bids.map((bid, index) => {
                                                    const bidderName = bid.truckOwner?.profile
                                                        ? `${bid.truckOwner.profile.firstName || ''} ${bid.truckOwner.profile.lastName || ''}`.trim()
                                                        : bid.truckOwner?.email || 'Anonymous';
                                                    const isLowest = bids.every(b => bid.bidAmount <= b.bidAmount);

                                                    return (
                                                        <div
                                                            key={bid.id}
                                                            className={cn(
                                                                "px-6 py-4 flex items-center gap-4 hover:bg-white transition-colors",
                                                                isLowest && bid.status === 'PENDING' && "bg-emerald-50/30"
                                                            )}
                                                        >
                                                            {/* Rank */}
                                                            <div className="w-8 text-center">
                                                                {isLowest && bid.status === 'PENDING' ? (
                                                                    <Star size={16} className="text-amber-500 fill-amber-500 mx-auto" />
                                                                ) : (
                                                                    <span className="text-xs font-bold text-slate-300">#{index + 1}</span>
                                                                )}
                                                            </div>

                                                            {/* Bidder Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                                        <User size={14} className="text-slate-400" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-bold text-slate-800 truncate">{bidderName}</p>
                                                                        {bid.truckOwner?.profile?.companyName && (
                                                                            <p className="text-[10px] text-slate-400 truncate">{bid.truckOwner.profile.companyName}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Bid Amount */}
                                                            <div className="w-32 text-right">
                                                                <span className={cn(
                                                                    "text-base font-black",
                                                                    isLowest ? "text-emerald-600" : "text-slate-800"
                                                                )}>
                                                                    {formatCurrency(bid.bidAmount)}
                                                                </span>
                                                            </div>

                                                            {/* Status */}
                                                            <div className="w-28 text-center">
                                                                <span className={cn(
                                                                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase inline-block",
                                                                    getBidStatusBadge(bid.status)
                                                                )}>
                                                                    {bid.status}
                                                                </span>
                                                            </div>

                                                            {/* Date */}
                                                            <div className="w-36 text-center">
                                                                <span className="text-xs text-slate-400">
                                                                    {formatDate(bid.createdAt)}
                                                                </span>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="w-40 flex items-center justify-center gap-2">
                                                                {bid.status === 'PENDING' && (
                                                                    <>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleAcceptBid(bid.id);
                                                                            }}
                                                                            disabled={acceptingBid === bid.id}
                                                                            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-all flex items-center gap-1.5 disabled:opacity-50"
                                                                        >
                                                                            {acceptingBid === bid.id ? (
                                                                                <Loader2 size={12} className="animate-spin" />
                                                                            ) : (
                                                                                <Check size={12} />
                                                                            )}
                                                                            Accept
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toast('Reject functionality coming soon', { icon: '🚧' });
                                                                            }}
                                                                            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-1.5"
                                                                        >
                                                                            <X size={12} />
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {bid.status === 'ACCEPTED' && (
                                                                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                                                        <Check size={14} />
                                                                        Accepted
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyAuctions;
