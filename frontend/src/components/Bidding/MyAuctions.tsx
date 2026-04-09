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
    Trash2,
} from 'lucide-react';
import { biddingAPI } from '../../services/biddingApi';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

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
    const { confirm, DialogComponent } = useConfirmDialog();

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
        } catch (error: any) {
            console.error('Failed to accept bid:', error);
            const errorMessage = error?.response?.data?.message || 'Failed to accept bid';
            toast.error(errorMessage);
        } finally {
            setAcceptingBid(null);
        }
    };

    const handleDeleteAuction = async (auctionId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const isConfirmed = await confirm({
            title: 'Delete Auction',
            message: 'Are you sure you want to delete this auction? It will no longer be visible to truck owners.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger',
        });

        if (!isConfirmed) return;

        try {
            toast.loading('Deleting auction...', { id: 'deleteAuction' });
            await biddingAPI.deleteAuction(auctionId);
            toast.success('Auction deleted successfully', { id: 'deleteAuction' });
            setAuctions(prev => prev.filter(a => a.id !== auctionId));
        } catch (error) {
            console.error('Failed to delete auction:', error);
            toast.error('Failed to delete auction', { id: 'deleteAuction' });
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            ACTIVE: 'bg-emerald-100 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30',
            SCHEDULED: 'bg-amber-100 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',
            CLOSED: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
            CANCELLED: 'bg-red-100 dark:bg-red-900/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30',
            PAUSED: 'bg-blue-100 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30',
        };
        return styles[status] || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    };

    const getBidStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400',
            ACCEPTED: 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400',
            REJECTED: 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400',
            WITHDRAWN: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
            EXPIRED: 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500',
        };
        return styles[status] || 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400';
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
                <Loader2 className="w-8 h-8 animate-spin text-[#345E85] dark:text-blue-400" />
                <span className="ml-3 text-sm text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest">Loading manifests...</span>
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
                            ? "bg-[#345E85] dark:bg-blue-600 text-white shadow-md shadow-blue-500/10"
                            : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                                    ? "bg-[#345E85] dark:bg-blue-600 text-white shadow-md shadow-blue-500/10"
                                    : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            {status} ({count})
                        </button>
                    );
                })}

                <button
                    onClick={loadAuctions}
                    className="ml-auto px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#345E85] dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center gap-2"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Auctions List */}
            {filteredAuctions.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center mx-auto mb-4">
                        <Gavel className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    </div>
                    <h3 className="text-lg font-black text-slate-700 dark:text-slate-100 uppercase italic mb-1">No auctions found</h3>
                    <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Create your first auction to start receiving bids.</p>
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
                                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-none"
                            >
                                {/* Auction Header - Clickable */}
                                <button
                                    onClick={() => toggleAuction(auction.id, auction)}
                                    className="w-full px-6 py-5 flex items-center gap-4 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
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
                                            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase italic truncate">
                                                {auction.load?.title || `Auction #${auction.id.slice(0, 8)}`}
                                            </h3>
                                            <span className={cn(
                                                "px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border",
                                                getStatusBadge(auction.status)
                                            )}>
                                                {auction.status}
                                            </span>
                                             <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-slate-900 dark:bg-slate-950 text-white dark:text-slate-300 border border-slate-800">
                                                {auction.auctionType}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
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

                                     {/* Bid Count and Actions */}
                                    <div className="flex items-center gap-4 shrink-0">
                                        {auction.status !== 'CLOSED' && (
                                            <button
                                                onClick={(e) => handleDeleteAuction(auction.id, e)}
                                                className="hidden sm:flex w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors border border-red-100 dark:border-red-900/30 items-center justify-center"
                                                title="Delete Auction"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                        {pendingBids.length > 0 && (
                                            <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase border border-amber-200 dark:border-amber-900/30">
                                                {pendingBids.length} pending
                                            </span>
                                        )}
                                        <div className="text-center">
                                            <span className="text-xl font-black text-[#345E85] dark:text-blue-400">{bidCount}</span>
                                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Bids</p>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp size={18} className="text-slate-400 dark:text-slate-600" />
                                        ) : (
                                            <ChevronDown size={18} className="text-slate-400 dark:text-slate-600" />
                                        )}
                                    </div>
                                </button>

                                 {/* Expanded: Bids List */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
                                        {isLoadingBids ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="w-5 h-5 animate-spin text-slate-400 dark:text-slate-600" />
                                                <span className="ml-2 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Loading bids...</span>
                                            </div>
                                        ) : bids.length === 0 ? (
                                            <div className="text-center py-12">
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">No bids received yet for this auction.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {/* Bids Header */}
                                                <div className="px-6 py-3 flex items-center gap-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] bg-slate-50 dark:bg-slate-900/50">
                                                    <div className="w-8" />
                                                    <div className="flex-1">Bidder</div>
                                                    <div className="w-32 text-right">Valuation</div>
                                                    <div className="w-28 text-center">Status</div>
                                                    <div className="w-36 text-center">Timestamp</div>
                                                    <div className="w-40 text-center">Operations</div>
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
                                                                "px-6 py-4 flex items-center gap-4 hover:bg-white dark:hover:bg-slate-800/50 transition-colors",
                                                                isLowest && bid.status === 'PENDING' && "bg-emerald-50/30 dark:bg-emerald-900/5"
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
                                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                                                        <User size={14} className="text-slate-400 dark:text-slate-600" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">{bidderName}</p>
                                                                        {bid.truckOwner?.profile?.companyName && (
                                                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{bid.truckOwner.profile.companyName}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Bid Amount */}
                                                            <div className="w-32 text-right">
                                                                <span className={cn(
                                                                    "text-base font-black",
                                                                    isLowest ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200"
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
                                                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
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
                                                                            className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-1.5 disabled:opacity-50"
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
                                                                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-500 transition-all flex items-center gap-1.5"
                                                                        >
                                                                            <X size={12} />
                                                                            Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {bid.status === 'ACCEPTED' && (
                                                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
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
            {DialogComponent}
        </div>
    );
};

export default MyAuctions;
