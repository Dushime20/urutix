import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  Filter,
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
  Timer,
  Users,
  FileText,
  Thermometer,
  TrendingDown,
  Loader2,
} from 'lucide-react';

import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../config/errorMessages';
import ModernLoader from '../components/common/ModernLoader';
import type { Cargo } from '../types/cargo';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { cn } from '../utils/cn';

import { FleetHeader } from '../components/FleetDashboard/FleetHeader';
import { FleetFooter } from '../components/FleetDashboard/FleetFooter';
import QuickBidModal from '../components/Fleet/QuickBidModal';
import logoUrutiX from '../assets/logo-urutix.png';
import { biddingAPI } from '../services/biddingApi';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../components/EnliteUI/Tables';

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
  load: any;
}

interface LoadCompetingBid {
  id: string;
  bidAmount: number;
  bidCurrency: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
  createdAt: string;
  proposedPickupDate?: string;
  proposedDeliveryDate?: string;
  truckOwnerId?: string;
  truckOwner?: {
    id?: string;
    profile?: { firstName?: string; lastName?: string; companyName?: string };
  };
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
  auctionStart?: string;
  auctionEnd?: string;
  reservePrice?: number;
  totalBids?: number;
  uniqueBidders?: number;
  currentHighestBid?: number | null;
  minimumBidIncrement?: number | null;
  maximumBidAmount?: number | null;
  winningBidId?: string | null;
  specialHandlingInstructions?: string;
  loadingInstructions?: string;
  unloadingInstructions?: string;
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
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showQuickBidModal, setShowQuickBidModal] = useState(false);
  const [bidCargo, setBidCargo] = useState<CargoBid | null>(null);
  const [loadCompetingBids, setLoadCompetingBids] = useState<LoadCompetingBid[]>([]);
  const [loadingCompetingBids, setLoadingCompetingBids] = useState(false);

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
          auctionStart: auction.auctionStart,
          auctionEnd: auction.auctionEnd,
          reservePrice: auction.reservePrice != null ? parseFloat(auction.reservePrice) : undefined,
          totalBids: auction.totalBids,
          uniqueBidders: auction.uniqueBidders,
          currentHighestBid: auction.currentHighestBid != null ? parseFloat(auction.currentHighestBid) : null,
          minimumBidIncrement: auction.minimumBidIncrement != null ? parseFloat(auction.minimumBidIncrement) : null,
          maximumBidAmount: auction.maximumBidAmount != null ? parseFloat(auction.maximumBidAmount) : null,
          winningBidId: auction.winningBidId,
          specialHandlingInstructions: load.specialHandlingInstructions,
          loadingInstructions: load.loadingInstructions,
          unloadingInstructions: load.unloadingInstructions,
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

  useEffect(() => {
    if (!selectedBid?.id) {
      setLoadCompetingBids([]);
      return;
    }

    let cancelled = false;
    const fetchCompetingBids = async () => {
      setLoadingCompetingBids(true);
      try {
        const response = await biddingAPI.getBidsForLoad(selectedBid.id);
        const raw = response.data?.bids ?? response.data?.items ?? response.data ?? [];
        const list: LoadCompetingBid[] = (Array.isArray(raw) ? raw : []).map((b: any) => ({
          id: b.id,
          bidAmount: parseFloat(b.bidAmount),
          bidCurrency: b.bidCurrency || selectedBid.currencyCode || 'USD',
          status: b.status,
          createdAt: b.createdAt,
          proposedPickupDate: b.proposedPickupDate,
          proposedDeliveryDate: b.proposedDeliveryDate,
          truckOwnerId: b.truckOwnerId,
          truckOwner: b.truckOwner,
        }));
        if (!cancelled) setLoadCompetingBids(list);
      } catch (error: any) {
        console.error('Error loading competing bids:', error);
        if (!cancelled) setLoadCompetingBids([]);
      } finally {
        if (!cancelled) setLoadingCompetingBids(false);
      }
    };

    fetchCompetingBids();
    return () => {
      cancelled = true;
    };
  }, [selectedBid?.id, selectedBid?.currencyCode]);

  const pendingCompetingBids = useMemo(() => {
    return loadCompetingBids
      .filter((b) => b.status === 'PENDING')
      .sort((a, b) => a.bidAmount - b.bidAmount);
  }, [loadCompetingBids]);

  const hasWinningBid = useMemo(() => {
    return Boolean(selectedBid?.winningBidId) || loadCompetingBids.some((b) => b.status === 'ACCEPTED');
  }, [selectedBid?.winningBidId, loadCompetingBids]);

  const currentLowestBid = useMemo(() => {
    if (pendingCompetingBids.length > 0) return pendingCompetingBids[0].bidAmount;
    if (selectedBid?.currentHighestBid != null) return selectedBid.currentHighestBid;
    return null;
  }, [pendingCompetingBids, selectedBid?.currentHighestBid]);

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${mins}m left`;
    return `${mins}m left`;
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

  const tableColumns: Column<CargoBid>[] = useMemo(() => [
    {
      key: 'title',
      label: 'Cargo',
      sortable: true,
      render: (_v, bid) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#345E85]">
            <Package size={14} />
          </div>
          <div className="max-w-[180px]">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{bid.title}</p>
            <p className="text-[10px] font-medium text-slate-400">{bid.cargoOwnerCompany}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (_v, bid) => (
        <div className="flex flex-col gap-1 max-w-[200px]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">{bid.pickupLocation?.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">{bid.deliveryLocation?.address}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'weight',
      label: 'Details',
      render: (_v, bid) => (
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg w-fit">
          <Scale size={12} className="text-slate-400" />
          {bid.weight?.toLocaleString()} kg
        </span>
      ),
    },
    {
      key: 'offeredPrice',
      label: 'Price',
      sortable: true,
      render: (_v, bid) => (
        <span className="text-sm font-black text-[#345E85]">{formatCurrency(bid.offeredPrice || 0, bid.currencyCode)}</span>
      ),
    },
    {
      key: 'bidStatus',
      label: 'Status',
      sortable: true,
      render: (_v, bid) => (
        <StatusBadge
          status={bid.bidStatus}
          label={<>{getStatusIcon(bid.bidStatus)} {bid.bidStatus}</>}
        />
      ),
    },
  ], [formatCurrency]);

  const tableActions: TableAction<CargoBid>[] = useMemo(() => [
    {
      key: 'bid',
      label: 'Bid',
      icon: <Gavel size={14} />,
      onClick: (bid) => handleQuickBid(bid),
    },
    {
      key: 'details',
      label: 'Details',
      icon: <ArrowRight size={14} />,
      onClick: (bid) => setSelectedBid(bid),
    },
  ], []);

  if (loading) {
    return <ModernLoader isLoading={true} type="page" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans selection:bg-blue-500/30">
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
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Bids</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Review and place bids.</p>
            </div>
            <button
              onClick={loadBids}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-[#345E85] hover:border-[#345E85] transition-all text-sm font-bold active:scale-95"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by title, location, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-[#345E85] outline-none transition-all"
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
                  className="pl-9 pr-8 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-[#345E85] outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
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
                className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-100 focus:border-[#345E85] outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <option value="all">All Cargo Types</option>
                <option value="ELECTRONICS">Electronics</option>
                <option value="AGRICULTURAL">Agricultural</option>
                <option value="CONSTRUCTION">Construction</option>
                <option value="FOOD_BEVERAGES">Food & Beverages</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setViewMode('card')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'card' ? "bg-white dark:bg-slate-900 text-[#345E85] shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'table' ? "bg-white dark:bg-slate-900 text-[#345E85] shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800/50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Package size={40} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No bids found</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
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
                    className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 p-6 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#345E85]">
                          <Package size={24} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight line-clamp-1" title={bid.title}>{bid.title}</h3>
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
                          <div className="absolute -left-6 top-1 h-3.5 w-3.5 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-full" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70 mb-0.5">Origin</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{bid.pickupLocation?.address}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-6 top-1 h-3.5 w-3.5 bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-full" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70 mb-0.5">Destination</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{bid.deliveryLocation?.address}</p>
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
                        <span className="px-2 py-1 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-100 dark:border-slate-800 flex items-center gap-1">
                          <Scale size={10} /> {bid.weight?.toLocaleString()} kg
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 mt-auto border-t border-slate-50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {bid.currentHighestBid != null ? 'Current low' : 'Offered'}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-black text-[#345E85]">
                            {formatCurrency(
                              bid.currentHighestBid != null ? bid.currentHighestBid : (bid.offeredPrice || 0),
                              bid.currencyCode
                            )}
                          </span>
                          {bid.currentHighestBid != null && bid.totalBids != null && bid.totalBids > 0 && (
                            <span className="text-xs font-medium text-slate-400">
                              {bid.totalBids} bid{bid.totalBids === 1 ? '' : 's'}
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
              <StandardDataTable
                columns={tableColumns}
                data={filteredBids}
                getRowId={(row) => row.id}
                searchable={false}
                pagination
                columnVisibility
                stickyHeader
                striped
                hoverable
                rowActions={tableActions}
                emptyMessage="No bids found"
                ariaLabel="Fleet bids"
                embedded
              />
            )}
          </>
        )}

        {/* Details Modal */}
        <Dialog open={!!selectedBid} onOpenChange={(open) => !open && setSelectedBid(null)}>
          <DialogContent className="max-w-3xl bg-white dark:bg-slate-900 rounded-[32px] p-0 border-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <DialogTitle className="flex items-start sm:items-center gap-3">
                <div className="h-11 w-11 sm:h-12 sm:w-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-[#345E85] shrink-0">
                  <Gavel size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight line-clamp-2">
                    {selectedBid?.title || 'Bid Details'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 break-all">
                    Ref: {selectedBid?.auctionId || selectedBid?.bidId || '—'}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedBid && (
              <div className="flex-1 overflow-y-auto">
                {/* Status / Pricing strip */}
                <div className="px-6 sm:px-8 py-4 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5',
                        getStatusColor(selectedBid.bidStatus)
                      )}>
                        {getStatusIcon(selectedBid.bidStatus)}
                        {selectedBid.bidStatus || 'pending'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#345E85] border border-blue-100">
                        {selectedBid.auctionType || 'REVERSE'}
                      </span>
                      {selectedBid.urgencyLevel && selectedBid.urgencyLevel !== 'NORMAL' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                          {selectedBid.urgencyLevel}
                        </span>
                      )}
                      {getTimeRemaining(selectedBid.auctionEnd) && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                          <Timer size={11} />
                          {getTimeRemaining(selectedBid.auctionEnd)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {selectedBid.auctionType === 'FORWARD' ? 'Current High' : 'Current Low'}
                        </p>
                        <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                          {currentLowestBid != null
                            ? formatCurrency(currentLowestBid, selectedBid.currencyCode)
                            : '—'}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Bids</p>
                        <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                          {loadingCompetingBids ? '…' : pendingCompetingBids.length || selectedBid.totalBids || 0}
                        </p>
                      </div>
                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                      <div className="hidden sm:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bidders</p>
                        <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{selectedBid.uniqueBidders ?? 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Auction window */}
                  <section>
                    <h3 className="text-xs font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                      <Timer size={14} /> Auction Window
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Auction Starts</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Calendar size={14} className="text-emerald-500 shrink-0" />
                          {formatDateTime(selectedBid.auctionStart)}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Auction Ends</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Clock size={14} className="text-rose-500 shrink-0" />
                          {formatDateTime(selectedBid.auctionEnd)}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Competing bids */}
                  <section>
                    <h3 className="text-xs font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                      <TrendingDown size={14} /> Live Bidding
                    </h3>

                    {hasWinningBid ? (
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-sm font-medium text-amber-800 dark:text-amber-200">
                        This load already has a winning bid. Bidding is closed.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                              <TrendingDown size={12} /> Current lowest bid
                            </p>
                            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                              {currentLowestBid != null
                                ? formatCurrency(currentLowestBid, selectedBid.currencyCode)
                                : 'No bids yet'}
                            </p>
                            {currentLowestBid != null && (
                              <p className="text-[11px] font-medium text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                                Bid lower than this to compete for the win
                              </p>
                            )}
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Open for bidding</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">
                              {pendingCompetingBids.length} active
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 mt-1">
                              Load not awarded yet — you can still place a bid
                            </p>
                          </div>
                        </div>

                        {loadingCompetingBids ? (
                          <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
                            <Loader2 size={18} className="animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest">Loading bids…</span>
                          </div>
                        ) : pendingCompetingBids.length === 0 ? (
                          <div className="text-center py-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                            <Gavel size={22} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No bids placed yet</p>
                            <p className="text-xs text-slate-400 mt-1">Be the first to bid on this load.</p>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                            <div className="grid grid-cols-[40px_1fr_auto] gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-[9px] font-black uppercase tracking-widest text-slate-400">
                              <span>#</span>
                              <span>Bidder</span>
                              <span className="text-right">Amount</span>
                            </div>
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                              {pendingCompetingBids.map((bid, index) => {
                                const isLowest = index === 0;
                                const company =
                                  bid.truckOwner?.profile?.companyName ||
                                  [bid.truckOwner?.profile?.firstName, bid.truckOwner?.profile?.lastName]
                                    .filter(Boolean)
                                    .join(' ') ||
                                  `Bidder ${index + 1}`;
                                return (
                                  <li
                                    key={bid.id}
                                    className={cn(
                                      'grid grid-cols-[40px_1fr_auto] gap-2 px-4 py-3 items-center',
                                      isLowest && 'bg-emerald-50/60 dark:bg-emerald-900/10'
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black',
                                        isLowest
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                      )}
                                    >
                                      {index + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                        {company}
                                        {isLowest && (
                                          <span className="ml-2 text-[9px] font-black uppercase tracking-wider text-emerald-600">
                                            Lowest
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[10px] font-medium text-slate-400">
                                        Placed {formatDateTime(bid.createdAt)}
                                      </p>
                                    </div>
                                    <p
                                      className={cn(
                                        'text-sm font-black tabular-nums',
                                        isLowest ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                                      )}
                                    >
                                      {formatCurrency(bid.bidAmount, bid.bidCurrency || selectedBid.currencyCode)}
                                    </p>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </section>

                  {/* Pricing */}
                  <section>
                    <h3 className="text-xs font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                      <Gavel size={14} /> Pricing
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Offered Price</p>
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {formatCurrency(selectedBid.offeredPrice || 0, selectedBid.currencyCode)}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Reserve Price</p>
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {selectedBid.reservePrice != null
                            ? formatCurrency(selectedBid.reservePrice, selectedBid.currencyCode)
                            : '—'}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Cargo Value</p>
                        <p className="text-base font-black text-slate-900 dark:text-white">
                          {formatCurrency(selectedBid.loadValue || 0, selectedBid.currencyCode)}
                        </p>
                      </div>
                      {selectedBid.minimumBidIncrement != null && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Min Increment</p>
                          <p className="text-base font-black text-slate-900 dark:text-white">
                            {formatCurrency(selectedBid.minimumBidIncrement, selectedBid.currencyCode)}
                          </p>
                        </div>
                      )}
                      {selectedBid.maximumBidAmount != null && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Max Bid</p>
                          <p className="text-base font-black text-slate-900 dark:text-white">
                            {formatCurrency(selectedBid.maximumBidAmount, selectedBid.currencyCode)}
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Route */}
                  <section>
                    <h3 className="text-xs font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                      <MapPin size={14} /> Route
                    </h3>
                    <div className="relative pl-6 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                      <div className="relative">
                        <div className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 bg-white dark:bg-slate-900 border-[3px] border-emerald-500 rounded-full" />
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Pickup</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white break-words">{selectedBid.pickupLocation?.address || '—'}</p>
                          <p className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-1.5">
                            <Calendar size={12} /> {formatDate(selectedBid.pickupDate)}
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[27px] top-1.5 h-3.5 w-3.5 bg-white dark:bg-slate-900 border-[3px] border-rose-500 rounded-full" />
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Delivery</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white break-words">{selectedBid.deliveryLocation?.address || '—'}</p>
                          <p className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-1.5">
                            <Calendar size={12} /> {formatDate(selectedBid.deliveryDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Cargo specs */}
                  <section>
                    <h3 className="text-xs font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                      <Package size={14} /> Cargo Specs
                    </h3>
                    {selectedBid.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">{selectedBid.description}</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Type</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedBid.cargoType?.replace(/_/g, ' ') || '—'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Weight</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedBid.weight?.toLocaleString() || 0} <span className="text-slate-400 font-medium">kg</span>
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Volume</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedBid.volume ?? 0} <span className="text-slate-400 font-medium">m³</span>
                        </p>
                      </div>
                      {(selectedBid.length || selectedBid.width || selectedBid.height) && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Dimensions</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {selectedBid.length || 0}×{selectedBid.width || 0}×{selectedBid.height || 0} m
                            </p>
                          </div>
                          <Ruler size={20} className="text-slate-300 shrink-0" />
                        </div>
                      )}
                      {selectedBid.numberOfPallets != null && selectedBid.numberOfPallets > 0 && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Pallets</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedBid.numberOfPallets}</p>
                        </div>
                      )}
                      {selectedBid.packagingType && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Packaging</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedBid.packagingType.replace(/_/g, ' ')}</p>
                        </div>
                      )}
                      {selectedBid.requiresRefrigeration && (
                        <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-2xl border border-sky-100 dark:border-sky-800">
                          <p className="text-[10px] font-black text-sky-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Thermometer size={11} /> Temperature
                          </p>
                          <p className="text-sm font-bold text-sky-800 dark:text-sky-200">
                            {selectedBid.temperatureMin ?? '—'}° to {selectedBid.temperatureMax ?? '—'}°
                          </p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Requirements */}
                  <section>
                    <h3 className="text-xs font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                      <AlertTriangle size={14} /> Requirements
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBid.isHazardous && (
                        <span className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2">
                          <ShieldAlert size={14} /> Hazmat
                        </span>
                      )}
                      {selectedBid.isFragile && (
                        <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-100 flex items-center gap-2">
                          Fragile
                        </span>
                      )}
                      {selectedBid.requiresRefrigeration && (
                        <span className="px-3 py-1.5 bg-sky-50 text-sky-700 rounded-xl text-xs font-bold border border-sky-100 flex items-center gap-2">
                          <Snowflake size={14} /> Cold Chain
                        </span>
                      )}
                      {selectedBid.requiresGpsMonitoring && (
                        <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-100 flex items-center gap-2">
                          GPS Monitoring
                        </span>
                      )}
                      {selectedBid.requiresTemperatureMonitoring && (
                        <span className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-xl text-xs font-bold border border-cyan-100 flex items-center gap-2">
                          Temp Monitoring
                        </span>
                      )}
                      {selectedBid.isTimeCritical && (
                        <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl text-xs font-bold border border-orange-100 flex items-center gap-2">
                          <Timer size={14} /> Time Critical
                        </span>
                      )}
                      {selectedBid.packagingType && (
                        <span className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          <Truck size={14} /> {selectedBid.packagingType.replace(/_/g, ' ')}
                        </span>
                      )}
                      {!selectedBid.isHazardous &&
                        !selectedBid.isFragile &&
                        !selectedBid.requiresRefrigeration &&
                        !selectedBid.requiresGpsMonitoring &&
                        !selectedBid.requiresTemperatureMonitoring &&
                        !selectedBid.isTimeCritical &&
                        !selectedBid.packagingType && (
                          <span className="text-xs font-medium text-slate-400">No special requirements</span>
                        )}
                    </div>
                  </section>

                  {/* Instructions */}
                  {(selectedBid.specialHandlingInstructions || selectedBid.loadingInstructions || selectedBid.unloadingInstructions) && (
                    <section>
                      <h3 className="text-xs font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                        <FileText size={14} /> Instructions
                      </h3>
                      <div className="space-y-3">
                        {selectedBid.specialHandlingInstructions && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Special Handling</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{selectedBid.specialHandlingInstructions}</p>
                          </div>
                        )}
                        {selectedBid.loadingInstructions && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Loading</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{selectedBid.loadingInstructions}</p>
                          </div>
                        )}
                        {selectedBid.unloadingInstructions && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Unloading</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{selectedBid.unloadingInstructions}</p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Cargo owner */}
                  <section>
                    <h3 className="text-xs font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
                      <Building2 size={14} /> Cargo Owner
                    </h3>
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 font-black text-sm shrink-0">
                          {(selectedBid.cargoOwnerCompany || selectedBid.cargoOwnerName || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                            {selectedBid.cargoOwnerCompany || '—'}
                          </p>
                          <p className="text-xs font-medium text-slate-500 truncate flex items-center gap-1">
                            <Users size={12} />
                            {selectedBid.cargoOwnerName || 'Owner'}
                          </p>
                        </div>
                      </div>
                      {(selectedBid.cargoOwnerPhone || selectedBid.cargoOwnerEmail) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                          {selectedBid.cargoOwnerPhone && (
                            <a
                              href={`tel:${selectedBid.cargoOwnerPhone}`}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-medium text-slate-600 dark:text-slate-300"
                            >
                              <Phone size={14} /> {selectedBid.cargoOwnerPhone}
                            </a>
                          )}
                          {selectedBid.cargoOwnerEmail && (
                            <a
                              href={`mailto:${selectedBid.cargoOwnerEmail}`}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-medium text-slate-600 dark:text-slate-300"
                            >
                              <Mail size={14} /> {selectedBid.cargoOwnerEmail}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            )}

            <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col sm:flex-row gap-3 shrink-0">
              {selectedBid?.bidStatus === 'pending' && !hasWinningBid && (
                <button
                  onClick={() => {
                    const bid = selectedBid;
                    setSelectedBid(null);
                    handleQuickBid(bid);
                  }}
                  className="flex-1 py-3.5 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#2a4d6d] active:scale-95 transition-all shadow-lg shadow-blue-900/10 flex items-center justify-center gap-2"
                >
                  <Gavel size={16} />
                  {currentLowestBid != null ? 'Bid to Beat Lowest' : 'Place Bid'}
                </button>
              )}
              <button
                onClick={() => setSelectedBid(null)}
                className={cn(
                  'py-3.5 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                  (selectedBid?.bidStatus !== 'pending' || hasWinningBid) && 'flex-1'
                )}
              >
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </main >
      <FleetFooter />

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
