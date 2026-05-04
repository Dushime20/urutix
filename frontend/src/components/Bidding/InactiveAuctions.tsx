import React, { useState, useEffect, useCallback } from 'react';
import { biddingAPI } from '../../services/biddingApi';
import toast from 'react-hot-toast';
import { RefreshCw, RotateCcw, Calendar, DollarSign, Package, MapPin, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface InactiveAuction {
  id: string;
  loadId: string;
  auctionType: string;
  status: string;
  auctionStart: string;
  auctionEnd: string;
  reservePrice?: number;
  totalBids: number;
  deletedAt: string;
  cancellationReason?: string;
  load: {
    id: string;
    title: string;
    description?: string;
    weight?: number;
    loadValue?: number;
    pickupLocation?: string;
    deliveryLocation?: string;
    status: string;
  };
}

const InactiveAuctions: React.FC = () => {
  const [auctions, setAuctions] = useState<InactiveAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactivating, setReactivating] = useState<string | null>(null);

  const loadInactiveAuctions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await biddingAPI.getInactiveAuctions();
      setAuctions(response.data);
    } catch (error: any) {
      console.error('Error loading inactive auctions:', error);
      toast.error(error.response?.data?.message || 'Failed to load inactive auctions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInactiveAuctions();
  }, [loadInactiveAuctions]);

  const handleReactivate = async (auctionId: string) => {
    try {
      setReactivating(auctionId);
      await biddingAPI.reactivateAuction(auctionId);
      toast.success('Auction reactivated successfully!');
      // Remove from inactive list
      setAuctions(auctions.filter(a => a.id !== auctionId));
    } catch (error: any) {
      console.error('Error reactivating auction:', error);
      const message = error.response?.data?.message || 'Failed to reactivate auction';
      toast.error(message);
    } finally {
      setReactivating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAuctionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      REVERSE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      FORWARD: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      DUTCH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      SEALED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#345E85] dark:border-blue-400"></div>
        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Loading inactive auctions...</p>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <RotateCcw className="w-10 h-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">No Inactive Auctions</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
          You don't have any deleted auctions. Deleted auctions will appear here and can be reactivated.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Inactive Auctions</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {auctions.length} deleted {auctions.length === 1 ? 'auction' : 'auctions'} available for reactivation
          </p>
        </div>
        <button
          onClick={loadInactiveAuctions}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Auctions List */}
      <div className="grid grid-cols-1 gap-4">
        {auctions.map((auction) => (
          <div
            key={auction.id}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Auction Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {auction.load.title || 'Untitled Load'}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {auction.load.description || 'No description'}
                    </p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                    getAuctionTypeColor(auction.auctionType)
                  )}>
                    {auction.auctionType}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Deleted</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatDate(auction.deletedAt)}
                      </p>
                    </div>
                  </div>

                  {auction.reservePrice && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Reserve Price</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          ${auction.reservePrice.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total Bids</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {auction.totalBids}
                      </p>
                    </div>
                  </div>

                  {auction.load.weight && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Weight</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {auction.load.weight} kg
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cancellation Reason */}
                {auction.cancellationReason && (
                  <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">Cancellation Reason</p>
                      <p className="text-sm text-amber-800 dark:text-amber-400 mt-0.5">
                        {auction.cancellationReason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Auction Period */}
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Period:</span> {formatDate(auction.auctionStart)} → {formatDate(auction.auctionEnd)}
                </div>
              </div>

              {/* Reactivate Button */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleReactivate(auction.id)}
                  disabled={reactivating === auction.id}
                  className={cn(
                    "flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all",
                    reactivating === auction.id
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl"
                  )}
                >
                  {reactivating === auction.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Reactivating...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Reactivate</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  Restore this auction
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InactiveAuctions;
