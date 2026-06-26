import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  Scale,
  Ruler,
  Snowflake,
  AlertTriangle,
  Clock,
  Building2,
  Phone,
  Mail,
  Truck,
  LayoutGrid,
  List,
  Gavel,
  ArrowRight,
  ShieldAlert,
  TrendingUp
} from 'lucide-react';

import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../config/errorMessages';import { useConfirmDialog } from '../hooks/useConfirmDialog';
import ModernLoader from '../components/common/ModernLoader';
import type { Cargo } from '../types/cargo';
import StatCard from '../components/EnliteUI/Cards/StatCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { cn } from '../utils/cn';

import { FleetHeader } from '../components/FleetDashboard/FleetHeader';
import { FleetFooter } from '../components/FleetDashboard/FleetFooter';
import QuickBidModal from '../components/Fleet/QuickBidModal';
import logoUrutiX from '../assets/logo-urutix.png';
import { biddingAPI } from '../services/biddingApi';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';

interface AuctionWithLoad {
  id: string;
  loadId: string;
  auctionType: string;
  status: string;
  auctionStart: string;
  auctionEnd: string;
  reservePrice: string;
  minimumBidIncrement: string | null;
  maximumBidAmount: string | null;
  totalBids: number;
  uniqueBidders: number;
  currentHighestBid: string | null;
  winningBidId: string | null;
  winningBidderId: string | null;
  awardedAt: string | null;
  createdAt: string;
  updatedAt: string;
  load: any; // The load object from your JSON
}

interface CargoBid extends Cargo {
  bidStatus?: 'pending' | 'accepted' | 'rejected';
  bidId?: string;
  cargoOwnerName?: string;
  cargoOwnerPhone?: string;
  cargoOwnerEmail?: string;
  cargoOwnerCompany?: string;
  distance?: number;
  estimatedDuration?: number;
  auctionId?: string;
  auctionType?: string;
  auctionEnd?: string;
  reservePrice?: number;
  totalBids?: number;
}

/**
 * Build a human-readable address from a locationData object.
 * Tries the explicit `address` field first, then assembles from parts.
 * Falls back to coordinates if nothing else is available.
 */
const buildAddress = (loc: any): string => {
  if (!loc) return '—';

  // 1. Explicit full address string
  if (loc.address && loc.address.trim()) return loc.address.trim();

  // 2. Assemble from structured parts
  const parts: string[] = [];
  if (loc.name)       parts.push(loc.name);
  if (loc.street)     parts.push(loc.street);
  if (loc.city)       parts.push(loc.city);
  if (loc.state)      parts.push(loc.state);
  if (loc.country)    parts.push(loc.country);
  if (loc.postalCode) parts.push(loc.postalCode);
  if (parts.length)   return parts.join(', ');

  // 3. Fallback to coordinates
  const c = loc.coordinates;
  if (c?.latitude != null && c?.longitude != null) {
    return `${Number(c.latitude).toFixed(4)}, ${Number(c.longitude).toFixed(4)}`;
  }

  return '—';
};

/**
 * Resolve the best available origin address from a load object.
 * Priority: locations[PICKUP].locationData → load.origin
 */
const getOriginAddress = (load: any): string => {
  const pickupLoc = load?.locations?.find((l: any) => l.type === 'PICKUP');
  const fromLocations = buildAddress(pickupLoc?.locationData);
  if (fromLocations !== '—') return fromLocations;
  return buildAddress(load?.origin);
};

/**
 * Resolve the best available destination address from a load object.
 * Priority: locations[DELIVERY].locationData → load.destination
 */
const getDestinationAddress = (load: any): string => {
  const deliveryLoc = load?.locations?.find((l: any) => l.type === 'DELIVERY');
  const fromLocations = buildAddress(deliveryLoc?.locationData);
  if (fromLocations !== '—') return fromLocations;
  return buildAddress(load?.destination);
};

const FleetBidsPage: React.FC = () => {
  const { compactIn: formatCurrency } = useCurrencyFormat();
  const [bids, setBids] = useState<CargoBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [cargoTypeFilter, setCargoTypeFilter] = useState<string>('all');
  const [selectedBid, setSelectedBid] = useState<CargoBid | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showQuickBidModal, setShowQuickBidModal] = useState(false);
  const [bidCargo, setBidCargo] = useState<CargoBid | null>(null);
  const { confirm, DialogComponent } = useConfirmDialog();

  const loadBids = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch auctions from API
      const response = await biddingAPI.getAuctions({ status: 'ACTIVE' });
      console.log('✅ Auctions loaded:', response.data);
      
      const auctions: AuctionWithLoad[] = response.data || [];
      
      // Transform auctions to CargoBid format
      const transformedBids: CargoBid[] = auctions.map((auction) => {
        const load = auction.load;
        const pickupLoc = load.locations?.find((loc: any) => loc.type === 'PICKUP');
        const deliveryLoc = load.locations?.find((loc: any) => loc.type === 'DELIVERY');
        
        return {
          id: load.id,
          auctionId: auction.id,
          bidId: auction.id,
          title: load.title,
          description: load.description,
          weight: parseFloat(load.weight),
          volume: parseFloat(load.volume || '0'),
          cargoType: load.cargoType,
          pickupLocationId: pickupLoc?.id || '',
          deliveryLocationId: deliveryLoc?.id || '',
          pickupDate: load.pickupDate,
          deliveryDate: load.deliveryDate,
          status: load.status,
          loadValue: parseFloat(load.loadValue),
          offeredPrice: parseFloat(load.offeredPrice),
          currencyCode: load.currencyCode || 'USD',
          isFragile: load.isFragile,
          isHazardous: load.isHazardous,
          requiresRefrigeration: load.requiresRefrigeration,
          contactInfo: load.contactInfo || {},
          autoMatchEnabled: load.autoMatchEnabled,
          matchingCriteria: load.matchingCriteria || {},
          publishedAt: load.publishedAt,
          rating: parseFloat(load.rating || '0'),
          viewCount: load.viewCount || 0,
          createdAt: load.createdAt,
          updatedAt: load.updatedAt,
          bidStatus: auction.status === 'ACTIVE' ? 'pending' : 'accepted',
          cargoOwnerName: `${load.cargoOwner?.profile?.firstName || ''} ${load.cargoOwner?.profile?.lastName || ''}`.trim(),
          cargoOwnerPhone: load.cargoOwner?.phone || '',
          cargoOwnerEmail: load.cargoOwner?.email || '',
          cargoOwnerCompany: load.cargoOwner?.profile?.companyName || '',
          length: parseFloat(load.length || '0'),
          width: parseFloat(load.width || '0'),
          height: parseFloat(load.height || '0'),
          urgencyLevel: load.urgencyLevel,
          isTimeCritical: load.isTimeCritical,
          numberOfPallets: load.numberOfPallets || 0,
          packagingType: load.packagingType,
          requiresGpsMonitoring: load.requiresGpsMonitoring,
          requiresTemperatureMonitoring: load.requiresTemperatureMonitoring,
          temperatureMin: parseFloat(load.temperatureMin || '0'),
          temperatureMax: parseFloat(load.temperatureMax || '0'),
          pickupLocation: {
            id: pickupLoc?.id || '',
            name: pickupLoc?.locationData?.name || load.origin?.city || '',
            address: getOriginAddress(load),
            coordinates: pickupLoc?.locationData?.coordinates || { latitude: load.origin?.lat || 0, longitude: load.origin?.lng || 0 },
            locationType: 'WAREHOUSE',
          },
          deliveryLocation: {
            id: deliveryLoc?.id || '',
            name: deliveryLoc?.locationData?.name || load.destination?.city || '',
            address: getDestinationAddress(load),
            coordinates: deliveryLoc?.locationData?.coordinates || { latitude: load.destination?.lat || 0, longitude: load.destination?.lng || 0 },
            locationType: 'WAREHOUSE',
          },
          cargoOwner: load.cargoOwner,
          auctionType: auction.auctionType,
          auctionEnd: auction.auctionEnd,
          reservePrice: parseFloat(auction.reservePrice),
          totalBids: auction.totalBids,
        };
      });
      
      console.log('✅ Transformed bids:', transformedBids);
      setBids(transformedBids);
    } catch (error: any) {
      console.error('❌ Error loading bids:', error);
      toast.error(getApiErrorMessage(error));
      setBids([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBids();
  }, [loadBids]);

  const handleAcceptBid = async (bid: CargoBid) => {
    const confirmed = await confirm({
      title: 'Accept Cargo Bid',
      message: `Are you sure you want to accept this cargo bid? You will be assigned to transport "${bid.title}" from ${bid.pickupLocation?.address || 'N/A'} to ${bid.deliveryLocation?.address || 'N/A'}.`,
      confirmText: 'Accept',
      cancelText: 'Cancel',
      variant: 'info',
    });

    if (!confirmed) return;

    setProcessingAction(bid.id);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update local state
      setBids(prevBids =>
        prevBids.map(b =>
          b.id === bid.id ? { ...b, bidStatus: 'accepted' as const } : b
        )
      );

      toast.success('Cargo bid accepted successfully!');
      setSelectedBid(null);
    } catch (error: any) {
      console.error('Error accepting bid:', error);
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectBid = async (bid: CargoBid) => {
    const confirmed = await confirm({
      title: 'Reject Cargo Bid',
      message: `Are you sure you want to reject this cargo bid? This action cannot be undone.`,
      confirmText: 'Reject',
      cancelText: 'Cancel',
      variant: 'warning',
    });

    if (!confirmed) return;

    setProcessingAction(bid.id);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update local state
      setBids(prevBids =>
        prevBids.map(b =>
          b.id === bid.id ? { ...b, bidStatus: 'rejected' as const } : b
        )
      );

      toast.success('Cargo bid rejected');
      setSelectedBid(null);
    } catch (error: any) {
      console.error('Error rejecting bid:', error);
      toast.error(getApiErrorMessage(error));
    } finally {
      setProcessingAction(null);
    }
  };

  const handleQuickBid = (bid: CargoBid) => {
    setBidCargo(bid);
    setShowQuickBidModal(true);
  };

  const handleBidSubmitted = () => {
    // Refresh bids after successful submission
    loadBids();
    toast.success('Your bid has been submitted and is now pending review');
  };

  const filteredBids = bids.filter(bid => {
    const matchesSearch =
      !searchTerm ||
      bid.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.pickupLocation?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.deliveryLocation?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.cargoOwnerCompany?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      bid.bidStatus === statusFilter;

    const matchesCargoType =
      cargoTypeFilter === 'all' ||
      bid.cargoType === cargoTypeFilter;

    return matchesSearch && matchesStatus && matchesCargoType;
  });

  // formatCurrency provided by useCurrencyFormat hook above

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'accepted': return 'bg-emerald-100 text-emerald-700';
      case 'rejected': return 'bg-rose-100 text-rose-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle size={14} className="text-emerald-500" />;
      case 'rejected': return <XCircle size={14} className="text-rose-500" />;
      default: return <Clock size={14} className="text-amber-500" />;
    }
  };



  if (loading) {
    return <ModernLoader isLoading={true} type="page" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-blue-500/30">
      <FleetHeader />

      <img
        src={logoUrutiX}
        alt="UrutiX Logo Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0"
        style={{ objectPosition: 'center' }}
      />

      <main className="flex-1 max-w-[1920px] mx-auto w-full px-4 md:px-8 lg:px-12 xl:px-20 py-8 md:py-12 space-y-8 relative z-10">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#345E85] shadow-inner">
              <Gavel size={20} />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#345E85]">Bids</h2>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bids</h1>
              <p className="text-slate-500 font-medium mt-1">Review and place bids.</p>
            </div>
            <button
              onClick={loadBids}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-[#345E85] hover:border-[#345E85] transition-all text-sm font-bold active:scale-95"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Offers"
            value={bids.filter(b => b.bidStatus === 'pending' || b.auctionType === 'REVERSE').length}
            icon={<Gavel />}
            color="primary"
            subtitle="Available bids"
            variant="classic"
          />
          <StatCard
            title="Live Bids"
            value={bids.reduce((acc, b) => acc + (b.totalBids || 0), 0)}
            icon={<TrendingUp />}
            color="success"
            subtitle="Total bids placed"
            variant="classic"
          />
          <StatCard
            title="Total Volume"
            value={formatCurrency(bids.reduce((acc, curr) => acc + (curr.offeredPrice || 0), 0))}
            icon={<DollarSign />}
            color="info"
            subtitle="Combined value"
            variant="classic"
          />
          <StatCard
            title="Win Rate"
            value={`${bids.length > 0 ? Math.round((bids.filter(b => b.bidStatus === 'accepted').length / bids.length) * 100) : 0}%`}
            icon={<CheckCircle />}
            color="success"
            subtitle="Success rate"
            variant="classic"
          />
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by title, location, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#345E85] outline-none transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={14} className="text-slate-400" />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="pl-9 pr-8 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#345E85] outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <select
                value={cargoTypeFilter}
                onChange={(e) => setCargoTypeFilter(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#345E85] outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="all">All Cargo Types</option>
                <option value="ELECTRONICS">Electronics</option>
                <option value="AGRICULTURAL">Agricultural</option>
                <option value="CONSTRUCTION">Construction</option>
                <option value="FOOD_BEVERAGES">Food & Beverages</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button
                  onClick={() => setViewMode('card')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'card' ? "bg-white text-[#345E85] shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'table' ? "bg-white text-[#345E85] shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {filteredBids.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
            <div className="h-20 w-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Package size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">No bids found</h3>
            <p className="text-slate-500 font-medium max-w-xs mx-auto">
              Try adjusting your filters or search terms.
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBids.map((bid) => (
                  <div
                    key={bid.id}
                    className="bg-white rounded-[24px] border border-slate-100 p-6 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#345E85]">
                          <Package size={24} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 tracking-tight line-clamp-1" title={bid.title}>{bid.title}</h3>
                          <p className="text-xs font-medium text-slate-400">{bid.cargoType?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5",
                        getStatusColor(bid.bidStatus)
                      )}>
                        {getStatusIcon(bid.bidStatus)}
                        {bid.bidStatus}
                      </span>
                    </div>

                    <div className="space-y-4 mb-6 flex-1">
                      <div className="relative pl-6 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        <div className="relative">
                          <div className="absolute -left-6 top-1 h-3.5 w-3.5 bg-white border-2 border-emerald-500 rounded-full" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70 mb-0.5">Origin</p>
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{bid.pickupLocation?.address}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-6 top-1 h-3.5 w-3.5 bg-white border-2 border-rose-500 rounded-full" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70 mb-0.5">Destination</p>
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{bid.deliveryLocation?.address}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {bid.isHazardous && (
                          <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-rose-100 flex items-center gap-1">
                            <ShieldAlert size={10} /> Hazmat
                          </span>
                        )}
                        {bid.requiresRefrigeration && (
                          <span className="px-2 py-1 bg-sky-50 text-sky-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-sky-100 flex items-center gap-1">
                            <Snowflake size={10} /> Cold Chain
                          </span>
                        )}
                        <span className="px-2 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-100 flex items-center gap-1">
                          <Scale size={10} /> {bid.weight?.toLocaleString()} kg
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 mt-auto border-t border-slate-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pricing</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-[#345E85]">{formatCurrency(bid.offeredPrice || 0, bid.currencyCode)}</span>
                          {bid.reservePrice && (
                            <span className="text-xs font-medium text-slate-400">
                              Reserve: {formatCurrency(bid.reservePrice, bid.currencyCode)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuickBid(bid)}
                          className="px-4 py-2 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4d6d] transition-colors flex items-center gap-2"
                        >
                          <Gavel size={14} />
                          Bid
                        </button>
                        <button
                          onClick={() => setSelectedBid(bid)}
                          className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#345E85] hover:bg-blue-50 transition-colors"
                        >
                          <ArrowRight size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Cargo</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Route</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                      {filteredBids.map((bid) => (
                        <tr key={bid.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#345E85]">
                                <Package size={14} />
                              </div>
                              <div className="max-w-[180px]">
                                <p className="text-sm font-bold text-slate-900 truncate">{bid.title}</p>
                                <p className="text-[10px] font-medium text-slate-400">{bid.cargoOwnerCompany}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 max-w-[200px]">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-xs font-medium text-slate-600 truncate">{bid.pickupLocation?.address}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span className="text-xs font-medium text-slate-600 truncate">{bid.deliveryLocation?.address}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                                <Scale size={12} className="text-slate-400" />
                                {bid.weight?.toLocaleString()} kg
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-black text-[#345E85]">{formatCurrency(bid.offeredPrice || 0, bid.currencyCode)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5",
                              getStatusColor(bid.bidStatus)
                            )}>
                              {getStatusIcon(bid.bidStatus)}
                              {bid.bidStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleQuickBid(bid)}
                                className="px-3 py-2 bg-[#345E85] text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-[#2a4d6d] transition-all flex items-center gap-1.5"
                              >
                                <Gavel size={14} />
                                Bid
                              </button>
                              <button
                                onClick={() => setSelectedBid(bid)}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#345E85] transition-colors"
                              >
                                <ArrowRight size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Details Modal */}
        <Dialog open={!!selectedBid} onOpenChange={(open) => !open && setSelectedBid(null)}>
          <DialogContent className="max-w-4xl bg-white rounded-[32px] p-0 border-0 overflow-hidden shadow-2xl h-[85vh] flex flex-col">
            <DialogHeader className="p-8 pb-4 border-b border-slate-50 shrink-0">
              <DialogTitle className="flex items-center gap-3">
                <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#345E85]">
                  <Gavel size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bid Details</h2>
                  <p className="text-sm font-medium text-slate-400">Ref: {selectedBid?.bidId}</p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedBid && (
              <div className="flex-1 overflow-y-auto p-8 pt-6">
                <div className="space-y-8">
                  {/* Status & ID */}
                  <div className={cn(
                    "p-6 rounded-[24px] flex flex-col md:flex-row items-center justify-between gap-6",
                    getStatusColor(selectedBid.bidStatus).replace('text-', 'bg-').replace('100', '50/50')
                  )}>
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center bg-white shadow-sm",
                        getStatusColor(selectedBid.bidStatus).split(' ')[1]
                      )}>
                        {getStatusIcon(selectedBid.bidStatus)}
                      </span>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Auction Type</p>
                        <p className="text-xl font-black tracking-tight">{selectedBid.auctionType || 'REVERSE'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Offered Price</p>
                        <p className="text-2xl font-black tracking-tight">{formatCurrency(selectedBid.offeredPrice || 0, selectedBid.currencyCode)}</p>
                      </div>
                      {selectedBid.reservePrice && (
                        <>
                          <div className="h-10 w-px bg-current opacity-20 hidden md:block" />
                          <div className="text-right hidden md:block">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Reserve Price</p>
                            <p className="text-lg font-bold tracking-tight opacity-80">{formatCurrency(selectedBid.reservePrice, selectedBid.currencyCode)}</p>
                          </div>
                        </>
                      )}
                      <div className="h-10 w-px bg-current opacity-20 hidden md:block" />
                      <div className="text-right hidden md:block">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Cargo Value</p>
                        <p className="text-lg font-bold tracking-tight opacity-80">{formatCurrency(selectedBid.loadValue || 0, selectedBid.currencyCode)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Route & Cargo */}
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-xs font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                          <MapPin size={14} /> Route Information
                        </h3>
                        <div className="relative pl-6 space-y-8 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                          <div className="relative">
                            <div className="absolute -left-[27px] top-1 h-4 w-4 bg-white border-[3px] border-emerald-500 rounded-full" />
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Pickup</p>
                              <p className="text-sm font-bold text-slate-900 mb-2">{selectedBid.pickupLocation?.address}</p>
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <Calendar size={12} /> {formatDate(selectedBid.pickupDate)}
                              </div>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="absolute -left-[27px] top-1 h-4 w-4 bg-white border-[3px] border-rose-500 rounded-full" />
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Delivery</p>
                              <p className="text-sm font-bold text-slate-900 mb-2">{selectedBid.deliveryLocation?.address}</p>
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                <Calendar size={12} /> {formatDate(selectedBid.deliveryDate)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-xs font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                          <Package size={14} /> Cargo Specs
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Weight</p>
                            <p className="text-lg font-black text-slate-900">{selectedBid.weight?.toLocaleString()} <span className="text-sm text-slate-500 font-medium">kg</span></p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Volume</p>
                            <p className="text-lg font-black text-slate-900">{selectedBid.volume} <span className="text-sm text-slate-500 font-medium">m³</span></p>
                          </div>
                          {selectedBid.length && (
                            <div className="col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Dimensions</p>
                                <p className="text-sm font-bold text-slate-900">{selectedBid.length}x{selectedBid.width}x{selectedBid.height}m</p>
                              </div>
                              <Ruler size={24} className="text-slate-300" />
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    {/* Right Column: Owner & Requirements & Actions */}
                    <div className="space-y-8 flex flex-col h-full">
                      <section>
                        <h3 className="text-xs font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                          <Building2 size={14} /> Cargo Owner
                        </h3>
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                              <Building2 size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-extrabold text-slate-900">{selectedBid.cargoOwnerCompany}</p>
                              <p className="text-xs font-medium text-slate-500">{selectedBid.cargoOwnerName}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                            <a href={`tel:${selectedBid.cargoOwnerPhone}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors text-xs font-medium text-slate-600">
                              <Phone size={14} /> {selectedBid.cargoOwnerPhone}
                            </a>
                            <a href={`mailto:${selectedBid.cargoOwnerEmail}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors text-xs font-medium text-slate-600">
                              <Mail size={14} /> Email
                            </a>
                          </div>
                        </div>
                      </section>

                      <section className="flex-1">
                        <h3 className="text-xs font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                          <AlertTriangle size={14} /> Requirements
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedBid.isHazardous && (
                            <span className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2">
                              <ShieldAlert size={14} /> Hazmat
                            </span>
                          )}
                          {selectedBid.requiresRefrigeration && (
                            <span className="px-3 py-1.5 bg-sky-50 text-sky-700 rounded-xl text-xs font-bold border border-sky-100 flex items-center gap-2">
                              <Snowflake size={14} /> Cold Chain
                            </span>
                          )}
                          <span className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 flex items-center gap-2">
                            <Truck size={14} /> {selectedBid.packagingType?.replace('_', ' ') || 'Standard'}
                          </span>
                        </div>
                      </section>

                      {/* Action Buttons */}
                      {selectedBid.bidStatus === 'pending' && (
                        <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 mt-auto">
                          <button
                            onClick={() => handleAcceptBid(selectedBid)}
                            disabled={processingAction === selectedBid.id}
                            className="py-4 bg-[#345E85] text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[#2a4d6d] active:scale-95 transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2"
                          >
                            {processingAction === selectedBid.id ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                            Accept Bid
                          </button>
                          <button
                            onClick={() => handleRejectBid(selectedBid)}
                            disabled={processingAction === selectedBid.id}
                            className="py-4 bg-white text-rose-600 border border-rose-100 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-rose-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                            {processingAction === selectedBid.id ? <Loader2 className="animate-spin" /> : <XCircle />}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedBid(null)}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Close Details
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </main >
      <FleetFooter />
      {DialogComponent}

      {/* Quick Bid Modal */}
      <QuickBidModal
        isOpen={showQuickBidModal}
        onClose={() => setShowQuickBidModal(false)}
        cargo={bidCargo}
        onBidSubmitted={handleBidSubmitted}
      />
    </div >
  );
};

export default FleetBidsPage;
