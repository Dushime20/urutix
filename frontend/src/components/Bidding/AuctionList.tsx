import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Search,
  Star,
  ZapIcon,
  Gavel,
  Clock,
  Heart,
  Grid,
  Table,
  Download,
  X,
  AlertCircle,
  Eye,
  Truck,
  CalendarCheck,
  MapPin,
  Lock,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { biddingAPI, biddingHelpers } from '../../services/biddingApi';
import { fleetApi } from '../../services/fleetApi';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/formatNumber';
import { AvailableTruckSelect } from '../availability/AvailableTruckSelect';
import { AvailableDriverSelect } from '../availability/AvailableDriverSelect';
import { BidAvailabilityChecker } from '../availability/BidAvailabilityChecker';
import { localToUTC } from '../../utils/dateTime';
import {
  useAuctionsQuery,
  useWatchedAuctionIds,
  useToggleAuctionWatch,
  useSubmitBidMutation,
} from '../../hooks/useBiddingQueries';
import { StandardDataTable, type Column, type TableAction } from '../EnliteUI/Tables';
import { usePermission } from '../../contexts/PermissionContext';

interface LoadLocation {
  id: string;
  type: 'PICKUP' | 'DELIVERY' | 'STOP' | 'REFUEL' | 'REST';
  sequence: number;
  locationData: {
    name: string;
    address: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  scheduledDate: string;
}

interface Auction {
  id: string;
  loadId: string;
  auctionType: 'REVERSE' | 'FORWARD' | 'DUTCH' | 'SEALED';
  status: 'SCHEDULED' | 'ACTIVE' | 'CLOSED' | 'CANCELLED' | 'PAUSED';
  auctionStart: string;
  auctionEnd: string;
  reservePrice?: number;
  minimumBidIncrement?: number;
  minimumBidDecrement?: number;
  totalBids: number;
  uniqueBidders: number;
  currentHighestBid?: number;
  load: {
    title: string;
    description: string;
    weight: number;
    loadValue: number;
    pickupDate: string;
    deliveryDate: string;
    pickupLocation?: string; // Legacy field
    deliveryLocation?: string; // Legacy field
    locations?: LoadLocation[]; // New structure
    origin?: {
      address: string;
      city: string;
      state?: string;
      country: string;
    };
    destination?: {
      address: string;
      city: string;
      state?: string;
      country: string;
    };
    cargoOwner?: {
      profile?: {
        firstName?: string;
        lastName?: string;
      };
    };
  };
}

interface AuctionListProps {
  userRole: 'CARGO_OWNER' | 'TRUCK_OWNER' | 'BROKER' | 'ADMIN' | 'SUPER_ADMIN';
  showWatchedOnly?: boolean;
  /** live = bidding open now; scheduled = upcoming (visible, locked); open = both */
  board?: 'live' | 'scheduled' | 'open';
}

const AuctionList: React.FC<AuctionListProps> = ({ userRole, showWatchedOnly = false, board = 'open' }) => {
  const { can, isFeatureEnabled, isLoading: permsLoading } = usePermission();
  const canViewAuctions = can('auctions:view') && isFeatureEnabled('auctions:view');
  const canCreateBid = can('bids:create') && isFeatureEnabled('bids:create');
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [filters, setFilters] = useState({
    // Live board prefers ACTIVE; Scheduled prefers SCHEDULED; otherwise open mix
    status:
      board === 'scheduled'
        ? 'SCHEDULED'
        : board === 'live' || userRole === 'TRUCK_OWNER' || userRole === 'BROKER'
          ? 'ACTIVE'
          : 'all',
    auctionType: 'all',
    minValue: '',
    maxValue: '',
    showWatchedOnly: false,
  });
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsAuction, setDetailsAuction] = useState<Auction | null>(null);

  // Helper function to get location string from load data
  const getLocationString = (load: Auction['load'], type: 'pickup' | 'delivery'): string => {
    // Try new structure first (locations array)
    if (load.locations && load.locations.length > 0) {
      const location = load.locations.find(loc => 
        loc.type === (type === 'pickup' ? 'PICKUP' : 'DELIVERY')
      );
      if (location?.locationData) {
        const parts = [
          location.locationData.name,
          location.locationData.city,
          location.locationData.state
        ].filter(Boolean);
        return parts.join(', ') || location.locationData.address || 'N/A';
      }
    }
    
    // Try origin/destination structure
    const addressObj = type === 'pickup' ? load.origin : load.destination;
    if (addressObj) {
      const parts = [addressObj.city, addressObj.state, addressObj.country].filter(Boolean);
      return parts.join(', ') || addressObj.address || 'N/A';
    }
    
    // Fallback to legacy fields
    return type === 'pickup' ? (load.pickupLocation || 'N/A') : (load.deliveryLocation || 'N/A');
  };

  const openDetailsModal = (auction: Auction) => {
    setDetailsAuction(auction);
    setShowDetailsModal(true);
  };

  const isBiddingOpen = (auction: Auction | null | undefined) =>
    !!auction && biddingHelpers.getAuctionBidWindow(auction).canBid;

  const getBidWindow = (auction: Auction | null | undefined) =>
    auction ? biddingHelpers.getAuctionBidWindow(auction) : null;

  const guardBidAction = (auction: Auction, action: () => void) => {
    const window = biddingHelpers.getAuctionBidWindow(auction);
    if (!window.canBid) {
      toast.error(window.message);
      return;
    }
    action();
  };

  // Bid States
  const [showQuickBidModal, setShowQuickBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [quickBidAmount, setQuickBidAmount] = useState<string>('');
  const [bidNotes, setBidNotes] = useState('');
  const [proposedPickupDate, setProposedPickupDate] = useState('');
  const [proposedDeliveryDate, setProposedDeliveryDate] = useState('');
  const [advancePaymentPercentage, setAdvancePaymentPercentage] = useState<string>('');
  const [quickAdvancePaymentPercentage, setQuickAdvancePaymentPercentage] = useState<string>('');
  const [requireAdvancePayment, setRequireAdvancePayment] = useState<boolean>(true);
  const [quickRequireAdvancePayment, setQuickRequireAdvancePayment] = useState<boolean>(true);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedTruckId, setSelectedTruckId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  const {
    data: auctions = [],
    isLoading: loading,
    isError,
    error: queryError,
  } = useAuctionsQuery({ filters, enabled: canViewAuctions && !permsLoading });

  const { data: watchedAuctions = new Set<string>() } = useWatchedAuctionIds();
  const toggleWatchMutation = useToggleAuctionWatch();
  const submitBidMutation = useSubmitBidMutation();

  const error = !canViewAuctions && !permsLoading
    ? 'You do not have permission to view auctions.'
    : isError
    ? (queryError instanceof Error ? queryError.message : 'Failed to load auctions. Please try again.')
    : null;

  useEffect(() => {
    if (showWatchedOnly) {
      setFilters(prev => ({ ...prev, showWatchedOnly: true }));
    }
  }, [showWatchedOnly]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      status: board === 'scheduled' ? 'SCHEDULED' : board === 'live' || board === 'open' ? 'ACTIVE' : prev.status || 'ACTIVE',
    }));
  }, [board]);

  const boardAuctions = React.useMemo(() => {
    if (board === 'open') return auctions;
    return auctions.filter((auction) => {
      const window = biddingHelpers.getAuctionBidWindow(auction);
      if (board === 'live') return window.canBid;
      if (board === 'scheduled') return window.state === 'not_started';
      return true;
    });
  }, [auctions, board]);

  const displayedAuctions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return boardAuctions;
    return boardAuctions.filter((auction) => {
      const title = (auction.load?.title || '').toLowerCase();
      const pickup = getLocationString(auction.load, 'pickup').toLowerCase();
      const delivery = getLocationString(auction.load, 'delivery').toLowerCase();
      return (
        title.includes(q) ||
        pickup.includes(q) ||
        delivery.includes(q) ||
        auction.id.toLowerCase().includes(q)
      );
    });
  }, [boardAuctions, searchQuery]);

  const handleExport = async () => {
    try {
      const toastId = toast.loading('Exporting bid history...');

      // Clean filters
      const apiFilters: any = {};
      if (filters.status && filters.status !== 'all') apiFilters.status = filters.status;
      if (filters.auctionType && filters.auctionType !== 'all') apiFilters.auctionType = filters.auctionType;
      if (filters.minValue) apiFilters.minValue = filters.minValue;
      if (filters.maxValue) apiFilters.maxValue = filters.maxValue;
      if (filters.showWatchedOnly) apiFilters.showWatchedOnly = true;

      const response = await biddingAPI.exportBidHistory(apiFilters);

      // Create download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bid-history-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success('Bid history exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export bid history');
    }
  };

  const openQuickBidModal = (auction: Auction) => {
    setSelectedAuction(auction);
    const suggested = biddingHelpers.getSuggestedBidAmount(auction);
    setQuickBidAmount(suggested != null ? String(suggested) : '');
    setQuickAdvancePaymentPercentage('');
    setQuickRequireAdvancePayment(true);

    // Initialize dates from auction load if available
    const pickupDate = auction?.load?.pickupDate
      ? new Date(auction.load.pickupDate).toISOString().slice(0, 16)
      : '';
    const deliveryDate = auction?.load?.deliveryDate
      ? new Date(auction.load.deliveryDate).toISOString().slice(0, 16)
      : '';

    setProposedPickupDate(pickupDate);
    setProposedDeliveryDate(deliveryDate);
    setShowQuickBidModal(true);
  };

  const openBidModal = (auction: Auction) => {
    setSelectedAuction(auction);
    const suggested = biddingHelpers.getSuggestedBidAmount(auction);
    setBidAmount(suggested != null ? String(suggested) : '');
    setBidNotes('');
    // Auto-populate dates from cargo — these are read-only, not editable by the bidder
    const pickup = auction?.load?.pickupDate
      ? new Date(auction.load.pickupDate).toISOString()
      : '';
    const delivery = auction?.load?.deliveryDate
      ? new Date(auction.load.deliveryDate).toISOString()
      : '';
    setProposedPickupDate(pickup);
    setProposedDeliveryDate(delivery);
    setAdvancePaymentPercentage('');
    setRequireAdvancePayment(true);
    setSelectedTruckId('');
    setSelectedDriverId('');
    setAvailableDrivers([]);
    setShowBidModal(true);
  };

  const loadAvailableDrivers = async () => {
    if (!selectedTruckId) {
      setAvailableDrivers([]);
      return;
    }
    setLoadingDrivers(true);
    try {
      // Find the selected truck and use its assignedDrivers array
      const selectedTruck = trucks.find((t: any) => t.id === selectedTruckId);
      const assigned: { driverId: string; driverName: string }[] = selectedTruck?.assignedDrivers || [];

      if (assigned.length === 0) {
        setAvailableDrivers([]);
        setLoadingDrivers(false);
        return;
      }

      // Map to the shape the dropdown expects
      const drivers = assigned.map((d: any) => ({
        id: d.driverId,
        firstName: d.driverName?.split(' ')[0] || d.driverName || '',
        lastName: d.driverName?.split(' ').slice(1).join(' ') || '',
      }));
      setAvailableDrivers(drivers);
    } catch (error) {
      console.error('Error loading available drivers:', error);
      setAvailableDrivers([]);
      toast.error('Failed to load available drivers');
    } finally {
      setLoadingDrivers(false);
    }
  };

  useEffect(() => {
    if (selectedTruckId) {
      loadAvailableDrivers();
    }
  }, [selectedTruckId]);

  const submitQuickBid = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAuction) return;
    const window = biddingHelpers.getAuctionBidWindow(selectedAuction);
    if (!window.canBid) {
      toast.error(window.message);
      return;
    }
    const amountNum = Number(quickBidAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Enter a valid bid amount');
      return;
    }
    const bidError = biddingHelpers.validateBidAmount(amountNum, selectedAuction);
    if (bidError) {
      toast.error(bidError);
      return;
    }
    if (!proposedPickupDate || !proposedDeliveryDate) {
      toast.error('Please specify pickup and delivery dates');
      return;
    }
    const pickupDate = new Date(proposedPickupDate);
    const deliveryDate = new Date(proposedDeliveryDate);
    if (deliveryDate <= pickupDate) {
      toast.error('Delivery date must be after pickup date');
      return;
    }
    const advancePercentage = quickAdvancePaymentPercentage ? Number(quickAdvancePaymentPercentage) : undefined;
    try {
      await submitBidMutation.mutateAsync({
        loadId: selectedAuction.loadId,
        bidAmount: amountNum,
        bidCurrency: 'USD',
        proposedPickupDate: localToUTC(proposedPickupDate),
        proposedDeliveryDate: localToUTC(proposedDeliveryDate),
        bidNotes: `Quick bid from ${userRole === 'BROKER' ? 'Broker' : 'Truck Owner'}`,
        advancePaymentPercentage: quickRequireAdvancePayment ? advancePercentage : undefined,
        requireAdvancePayment: quickRequireAdvancePayment,
        bidDetails: { truckSpecifications: {} },
      });
      toast.success('Bid submitted successfully!');
      setShowQuickBidModal(false);
    } catch (e: any) {
      const payload = e?.response?.data;
      const msg =
        payload?.message ||
        (payload?.code === 'FEATURE_DISABLED'
          ? 'Cargo bidding is currently unavailable. Please contact your administrator for more information.'
          : 'Failed to submit bid');
      toast.error(typeof msg === 'string' ? msg : 'Failed to submit bid');
    }
  };

  const placeBid = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAuction) return;
    const window = biddingHelpers.getAuctionBidWindow(selectedAuction);
    if (!window.canBid) {
      toast.error(window.message);
      return;
    }
    const amountNum = Number(bidAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Enter a valid bid amount');
      return;
    }
    const bidError = biddingHelpers.validateBidAmount(amountNum, selectedAuction);
    if (bidError) {
      toast.error(bidError);
      return;
    }
    if (!selectedTruckId || !proposedPickupDate || !proposedDeliveryDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    const advancePercentage = advancePaymentPercentage ? Number(advancePaymentPercentage) : undefined;
    try {
      await submitBidMutation.mutateAsync({
        loadId: selectedAuction.loadId,
        bidAmount: amountNum,
        bidCurrency: 'USD',
        proposedPickupDate: localToUTC(proposedPickupDate),
        proposedDeliveryDate: localToUTC(proposedDeliveryDate),
        bidNotes: bidNotes || undefined,
        advancePaymentPercentage: requireAdvancePayment ? advancePercentage : undefined,
        requireAdvancePayment: requireAdvancePayment,
        bidDetails: {
          truckSpecifications: { truckId: selectedTruckId },
          driverInfo: selectedDriverId ? { driverId: selectedDriverId } : undefined,
        },
      });
      toast.success('Bid submitted successfully!');
      setShowBidModal(false);
    } catch (e: any) {
      const payload = e?.response?.data;
      const msg =
        payload?.message ||
        (payload?.code === 'FEATURE_DISABLED'
          ? 'Cargo bidding is currently unavailable. Please contact your administrator for more information.'
          : 'Failed to submit bid');
      toast.error(typeof msg === 'string' ? msg : 'Failed to submit bid');
    }
  };

  const toggleWatch = async (auctionId: string) => {
    const isWatched = watchedAuctions.has(auctionId);
    try {
      await toggleWatchMutation.mutateAsync({ auctionId, isWatched });
      toast.success(isWatched ? 'Removed from watched' : 'Added to watched');
    } catch {
      toast.error('Failed to toggle watch');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      ACTIVE: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
      SCHEDULED: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800',
      CLOSED: 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800',
      CANCELLED: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800',
      PAUSED: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    };
    return (
      <span className={cn(
        "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-sm flex items-center gap-1.5",
        variants[status] || 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800'
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {status}
      </span>
    );
  };

  const getAuctionTypeBadge = (type: string) => {
    return (
      <span className="px-3 py-1 bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-slate-900/10">
        {type}
      </span>
    );
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tableColumns: Column<Auction>[] = useMemo(() => [
    {
      key: 'load.title',
      label: 'Context',
      sortable: true,
      alwaysVisible: true,
      render: (_: any, auction: Auction) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
            <Gavel size={20} className="text-[#345E85] dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-[#0f172a] dark:text-slate-100 leading-tight truncate">
              {auction.load?.title || 'Unknown Cargo'}
            </p>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
              Ref: {auction.id.slice(0, 8)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'route',
      label: 'Route',
      render: (_: any, auction: Auction) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-900 dark:text-slate-100">
            {getLocationString(auction.load, 'pickup')}
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight italic">to</span>
          <span className="text-xs font-black text-slate-900 dark:text-slate-100">
            {getLocationString(auction.load, 'delivery')}
          </span>
        </div>
      ),
    },
    {
      key: 'currentHighestBid',
      label: 'Financials',
      sortable: true,
      render: (_: any, auction: Auction) => (
        <div>
          {auction.currentHighestBid ? (
            <>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(auction.currentHighestBid)}
              </div>
              <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mt-1">
                {auction.totalBids} BID{auction.totalBids === 1 ? '' : 'S'}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-black text-slate-400 dark:text-slate-500 italic">No bids yet</div>
              <div className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase mt-1">
                Open
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, auction: Auction) => (
        <div className="flex flex-col gap-1.5">
          {getStatusBadge(auction.status)}
          {getAuctionTypeBadge(auction.auctionType)}
        </div>
      ),
    },
    {
      key: 'auctionEnd',
      label: 'Timeline',
      sortable: true,
      render: (end: string) => (
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
          <Clock size={12} />
          <span className="text-[10px] font-black uppercase tracking-tight">{formatDate(end)}</span>
        </div>
      ),
    },
  ], []);

  const tableActions: TableAction<Auction>[] = useMemo(() => [
    {
      key: 'details',
      label: 'Details',
      icon: <Eye size={14} />,
      onClick: (auction) => openDetailsModal(auction),
    },
    {
      key: 'bid',
      label: 'Place bid',
      icon: <Gavel size={14} />,
      variant: 'success',
      hidden: () => userRole === 'BROKER' || !canCreateBid,
      disabled: (auction) => !isBiddingOpen(auction),
      onClick: (auction) => guardBidAction(auction, () => openBidModal(auction)),
    },
  ], [userRole, canCreateBid]);

  const renderFilters = () => (
    <div className="bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH AUCTIONS BY CARGO, ROUTE OR ID..."
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
            <option value="ACTIVE">Active</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="CLOSED">Closed</option>
          </select>

          <button
            onClick={() => setFilters({ ...filters, showWatchedOnly: !filters.showWatchedOnly })}
            className={cn(
              "p-3.5 rounded-2xl border transition-all flex items-center justify-center shadow-sm",
              filters.showWatchedOnly
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-500 dark:text-amber-400'
                : 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:text-amber-400'
            )}
            title="Watched only"
          >
            <Star size={16} className={filters.showWatchedOnly ? 'fill-current' : ''} />
          </button>

          <button
            onClick={handleExport}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:text-[#345E85] dark:hover:text-blue-400 transition-all shadow-sm"
            title="Export"
          >
            <Download size={16} />
          </button>

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
              title="Card view"
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
              title="Table view"
            >
              <Table size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuctionCard = (auction: Auction) => (
    <div key={auction.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-900 dark:hover:border-blue-900/50 overflow-hidden transition-all duration-300 group flex flex-col shadow-sm">
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-wrap gap-2">
            {getStatusBadge(auction.status)}
            {getAuctionTypeBadge(auction.auctionType)}
          </div>
          <button
            onClick={() => toggleWatch(auction.id)}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
              watchedAuctions.has(auction.id)
                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 hover:text-amber-500'
            )}
            title={watchedAuctions.has(auction.id) ? 'Unwatch' : 'Watch'}
          >
            <Star size={16} className={watchedAuctions.has(auction.id) ? 'fill-current' : ''} />
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight group-hover:text-indigo-600 dark:group-hover:text-blue-400 transition-colors uppercase italic">
            {auction.load?.title || 'Unknown Cargo'}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest leading-none">
            Weight: {(auction.load?.weight ?? 0).toLocaleString()} kg
          </p>
        </div>

        <div className="mb-4 pt-4 border-t border-slate-50 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Route</p>
          <p className="text-xs font-black text-slate-900 dark:text-slate-100">
            {getLocationString(auction.load, 'pickup').split(',')[0]}
            <span className="text-slate-400 dark:text-slate-500 font-bold mx-1.5">→</span>
            {getLocationString(auction.load, 'delivery').split(',')[0]}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">
              {auction.currentHighestBid ? 'Lowest Bid' : 'Bid Amount'}
            </p>
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {auction.currentHighestBid ? formatCurrency(auction.currentHighestBid) : '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Ends</p>
            <p className="text-[10px] font-black text-slate-900 dark:text-slate-100">{formatDate(auction.auctionEnd)}</p>
          </div>
        </div>

        {!isBiddingOpen(auction) && getBidWindow(auction)?.state === 'not_started' && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-900/20 px-3 py-2">
            <Lock size={12} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 leading-snug">
              Bidding opens {formatDate(auction.auctionStart)}
            </p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={() => openDetailsModal(auction)}
          className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <Eye size={14} />
          Details
        </button>
        <div className="flex gap-2">
          {userRole !== 'BROKER' && canCreateBid && (
            <button
              type="button"
              onClick={() => guardBidAction(auction, () => openBidModal(auction))}
              disabled={!isBiddingOpen(auction)}
              title={getBidWindow(auction)?.message}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Gavel size={14} />
              {getBidWindow(auction)?.state === 'not_started' ? 'Soon' : 'Bid'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!permsLoading && !canViewAuctions) {
    return (
      <div className="text-center py-16 space-y-2">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Cannot view auctions</p>
        <p className="text-xs text-slate-500">
          {error || 'Your account does not have the auctions:view permission.'}
        </p>
      </div>
    );
  }

  // Keep open bid/details modals mounted during refresh so background loading
  // does not tear down the portal and reopen the dialog.
  const isBidUiOpen = showBidModal || showQuickBidModal || showDetailsModal;
  if ((loading || permsLoading) && !isBidUiOpen) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
        <p className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">Loading auctions...</p>
      </div>
    );
  }

  return (
    <div className="auction-list">
      {renderFilters()}

      {filters.showWatchedOnly && (
        <div className="bg-red-50/50 border border-red-100 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <Heart className="text-red-500 fill-current" size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-red-900 uppercase tracking-tight italic">
              Watched Auctions <span className="text-red-400 font-light ml-2">({displayedAuctions.length} total)</span>
            </h3>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3 sm:p-4 mb-3 sm:mb-6">
          <div className="flex items-start sm:items-center">
            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle className="text-red-400 dark:text-red-500" size={18} />
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-400 break-words">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {displayedAuctions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center uppercase tracking-widest">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gavel size={24} className="text-slate-400 dark:text-slate-600" />
          </div>
          <p className="text-[10px] font-black text-slate-700 dark:text-slate-300">
            No available auctions
          </p>
          <p className="mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 normal-case tracking-normal">
            New live and scheduled auctions in your tenant will show here.
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <StandardDataTable<Auction>
              embedded
              columns={tableColumns}
              data={displayedAuctions}
              getRowId={(row) => row.id}
              searchable
              searchPlaceholder="Search auctions…"
              searchKeys={['id', 'status', 'load.title']}
              pagination
              pageSize={10}
              columnVisibility
              stickyHeader
              striped
              hoverable
              emptyMessage="No auctions found matching your criteria."
              rowActions={tableActions}
              ariaLabel="Available auctions"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedAuctions.map(renderAuctionCard)}
            </div>
          )}
        </>
      )}

      {showQuickBidModal && selectedAuction && createPortal(
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <form
            onSubmit={submitQuickBid}
            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-slate-800"
          >
            {/* Header */}
            <div className="px-10 py-8 border-b border-gray-100 dark:border-slate-800 relative">
              <h2 className="text-3xl font-extrabold text-[#111827] dark:text-slate-100 tracking-tight">Quick Bid</h2>
              <div className="mt-2 space-y-1">
                <p className="text-lg font-medium text-gray-600 dark:text-slate-400">{selectedAuction?.load?.title || 'Untitled Load'}</p>
                <p className="text-sm text-gray-400 dark:text-slate-500 font-medium italic">
                  Cargo Owner: {selectedAuction?.load?.cargoOwner?.profile?.firstName || ''} {selectedAuction?.load?.cargoOwner?.profile?.lastName || 'Admin'}
                </p>
              </div>
              {!isBiddingOpen(selectedAuction) && (
                <div className="absolute top-8 right-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border border-amber-100 dark:border-amber-800 max-w-xs text-right">
                  {getBidWindow(selectedAuction)?.label || selectedAuction.status}
                </div>
              )}
            </div>

            {/* Form Content */}
            <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
              {/* Bid Amount Input */}
              <div className="space-y-3">
                <label className="block text-base font-bold text-gray-700 dark:text-slate-300">Bid Amount (USD) *</label>
                <div className="relative group">
                  <input
                    type="number"
                    value={quickBidAmount}
                    onChange={(e) => setQuickBidAmount(e.target.value)}
                    disabled={!isBiddingOpen(selectedAuction)}
                    className="w-full h-16 px-6 bg-white dark:bg-slate-950 border-2 border-gray-200 dark:border-slate-800 rounded-2xl text-xl font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#345E85] dark:focus:border-blue-500 transition-all disabled:opacity-50"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                  {selectedAuction.currentHighestBid ? (
                    <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-lg border border-amber-100 dark:border-amber-800 font-bold">
                      Current lowest: {formatCurrency(selectedAuction.currentHighestBid)} — bid lower to win
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800 font-bold">
                      No bids yet — be first with your best price
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                  The lowest bid wins. Enter the shipping price you are willing to charge.
                </p>
                {biddingHelpers.getBidConstraintHint(selectedAuction) && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    {biddingHelpers.getBidConstraintHint(selectedAuction)}
                  </p>
                )}
              </div>

              {/* Advance Payment Section */}
              <div className="space-y-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={quickRequireAdvancePayment}
                      onChange={(e) => {
                        setQuickRequireAdvancePayment(e.target.checked);
                        if (!e.target.checked) setQuickAdvancePaymentPercentage('');
                      }}
                      className="peer appearance-none w-6 h-6 border-2 border-gray-300 dark:border-slate-700 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                    />
                    <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-base font-bold text-gray-700 dark:text-slate-300">Require advance payment before trip</span>
                </label>

                {quickRequireAdvancePayment && (
                  <div className="animate-in slide-in-from-top-2 duration-300 space-y-3">
                    <label className="block text-base font-bold text-gray-700 dark:text-slate-300">Advance Payment % (Optional)</label>
                    <input
                      type="number"
                      value={quickAdvancePaymentPercentage}
                      onChange={(e) => setQuickAdvancePaymentPercentage(e.target.value)}
                      className="w-full h-14 px-6 bg-white dark:bg-slate-950 border-2 border-gray-100 dark:border-slate-800 rounded-2xl text-sm font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="e.g., 70"
                    />
                    <p className="text-sm text-gray-400 dark:text-slate-500 leading-relaxed font-medium">
                      Percentage of transportation fee to be paid upfront.
                    </p>
                  </div>
                )}
              </div>

              {/* Schedule Delivery Box */}
              <div className="bg-[#f0f9ff]/80 p-8 rounded-[1.5rem] border border-blue-100 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#0369a1]">
                    <Clock size={18} />
                  </div>
                  <h4 className="text-lg font-extrabold text-[#0369a1]">Delivery Schedule</h4>
                </div>

                 <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Pickup Date *</label>
                    <input
                      type="datetime-local"
                      value={proposedPickupDate}
                      onChange={(e) => setProposedPickupDate(e.target.value)}
                      className="w-full h-14 px-4 bg-white dark:bg-slate-950 border-2 border-gray-200 dark:border-slate-800 rounded-xl text-sm font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-400 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Delivery Date *</label>
                    <input
                      type="datetime-local"
                      value={proposedDeliveryDate}
                      onChange={(e) => setProposedDeliveryDate(e.target.value)}
                      className="w-full h-14 px-4 bg-white dark:bg-slate-950 border-2 border-gray-200 dark:border-slate-800 rounded-xl text-sm font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-10 pt-0 flex flex-col gap-4">
              {!isBiddingOpen(selectedAuction) && (
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest text-center bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl py-3 w-full normal-case tracking-normal">
                  {getBidWindow(selectedAuction)?.message || 'Bidding is not open yet.'}
                </p>
              )}
              <div className="flex items-center justify-end gap-4 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickBidModal(false);
                    setSelectedAuction(null);
                  }}
                  className="px-10 py-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-base font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!quickBidAmount || !proposedPickupDate || !proposedDeliveryDate || !isBiddingOpen(selectedAuction)}
                  className="px-10 py-4 bg-[#345E85] text-white rounded-xl text-base font-bold hover:bg-[#2a4d6d] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Bid
                </button>
              </div>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Custom Bid Modal — hidden for brokers */}
      {showBidModal && selectedAuction && userRole !== 'BROKER' && createPortal(
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <form
            onSubmit={placeBid}
            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-slate-800"
          >
            {/* Header */}
            <div className="px-10 py-8 border-b border-gray-100 dark:border-slate-800 relative">
              <h2 className="text-3xl font-extrabold text-[#111827] dark:text-slate-100 tracking-tight">Custom Bid</h2>
              <div className="mt-2 space-y-1">
                <p className="text-lg font-medium text-gray-600 dark:text-slate-400">{selectedAuction?.load?.title || 'Untitled Shipment'}</p>
                <p className="text-sm text-gray-400 dark:text-slate-500 font-medium italic">
                  Cargo Owner: {selectedAuction?.load?.cargoOwner?.profile?.firstName || ''} {selectedAuction?.load?.cargoOwner?.profile?.lastName || 'Admin'}
                </p>
              </div>
              {!isBiddingOpen(selectedAuction) && (
                <div className="absolute top-8 right-10 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border border-amber-100 dark:border-amber-800 max-w-xs text-right">
                  {getBidWindow(selectedAuction)?.label || selectedAuction.status}
                </div>
              )}
            </div>

            {/* Form Content */}
            <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
              {/* Bid Amount */}
              <div className="space-y-3">
                <label className="block text-base font-bold text-gray-700 dark:text-slate-300">Your Shipping Price (USD) *</label>
                <div className="relative group">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    disabled={!isBiddingOpen(selectedAuction)}
                    className="w-full h-16 px-6 bg-white dark:bg-slate-950 border-2 border-gray-200 dark:border-slate-800 rounded-2xl text-xl font-bold text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#345E85] dark:focus:border-blue-500 transition-all disabled:opacity-50"
                    placeholder="0.00"
                    min={1}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                  {selectedAuction.currentHighestBid ? (
                    <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-lg border border-amber-100 dark:border-amber-800 font-bold">
                      Current lowest: {formatCurrency(selectedAuction.currentHighestBid)} — bid lower to win
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800 font-bold">
                      No bids yet — be first with your best price
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                  The lowest bid wins. Enter the shipping price you are willing to charge.
                </p>
                {biddingHelpers.getBidConstraintHint(selectedAuction) && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    {biddingHelpers.getBidConstraintHint(selectedAuction)}
                  </p>
                )}
              </div>

              {/* Asset Allocation */}
              <div className="bg-[#f0f9ff]/80 dark:bg-blue-900/10 p-8 rounded-[1.5rem] border border-blue-100 dark:border-blue-900/30 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-[#0369a1] dark:text-blue-400">
                    <Truck size={18} />
                  </div>
                  <h4 className="text-lg font-extrabold text-[#0369a1] dark:text-blue-400">Asset Selection</h4>
                  <span className="ml-auto text-[9px] font-black text-[#0369a1]/60 dark:text-blue-400/60 uppercase tracking-widest">
                    Only available for cargo dates
                  </span>
                </div>

                {/* Availability-aware truck select — filtered to cargo date window */}
                <AvailableTruckSelect
                  pickupDateTime={proposedPickupDate}
                  deliveryDateTime={proposedDeliveryDate}
                  capacityWeight={selectedAuction?.load?.weight}
                  value={selectedTruckId}
                  onChange={(id) => {
                    setSelectedTruckId(id);
                    setSelectedDriverId('');
                  }}
                  label="Select Truck"
                  required
                />

                {/* Drivers assigned to the selected truck, available for cargo dates */}
                <AvailableDriverSelect
                  pickupDateTime={proposedPickupDate}
                  deliveryDateTime={proposedDeliveryDate}
                  truckId={selectedTruckId || undefined}
                  value={selectedDriverId}
                  onChange={setSelectedDriverId}
                  label="Select Driver"
                />

                {/* Live conflict checker — fires whenever truck/driver/dates change */}
                <BidAvailabilityChecker
                  truckId={selectedTruckId || undefined}
                  driverId={selectedDriverId || undefined}
                  pickupDateTime={proposedPickupDate || undefined}
                  deliveryDateTime={proposedDeliveryDate || undefined}
                />
              </div>

              {/* Delivery Schedule — read-only, sourced from cargo */}
              <div className="bg-[#f0f9ff]/80 dark:bg-blue-900/10 p-8 rounded-[1.5rem] border border-blue-100 dark:border-blue-900/30 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-[#0369a1] dark:text-blue-400">
                    <CalendarCheck size={18} />
                  </div>
                  <h4 className="text-lg font-extrabold text-[#0369a1] dark:text-blue-400">Delivery Schedule</h4>
                  <span className="ml-auto flex items-center gap-1 text-[9px] font-black text-[#0369a1]/60 dark:text-blue-400/60 uppercase tracking-widest">
                    <Lock size={10} /> Set by cargo owner
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">Pickup Date</p>
                    <div className="flex items-center gap-3 h-14 px-4 bg-white/70 dark:bg-slate-900/70 border-2 border-blue-100 dark:border-blue-900/40 rounded-xl">
                      <CalendarCheck size={16} className="text-[#0369a1] dark:text-blue-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-800 dark:text-slate-200">
                        {proposedPickupDate
                          ? new Date(proposedPickupDate).toLocaleString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })
                          : <span className="text-gray-400 italic font-medium">Not specified</span>}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest">Delivery Date</p>
                    <div className="flex items-center gap-3 h-14 px-4 bg-white/70 dark:bg-slate-900/70 border-2 border-blue-100 dark:border-blue-900/40 rounded-xl">
                      <CalendarCheck size={16} className="text-[#0369a1] dark:text-blue-400 shrink-0" />
                      <span className="text-sm font-bold text-gray-800 dark:text-slate-200">
                        {proposedDeliveryDate
                          ? new Date(proposedDeliveryDate).toLocaleString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })
                          : <span className="text-gray-400 italic font-medium">Not specified</span>}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Route info */}
                {(selectedAuction?.load?.locations || selectedAuction?.load?.origin) && (
                  <div className="flex items-start gap-3 pt-2">
                    <MapPin size={14} className="text-[#0369a1] dark:text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 leading-relaxed">
                      {(() => {
                        const pickup = selectedAuction.load.locations?.find((l: any) => l.type === 'PICKUP');
                        const delivery = selectedAuction.load.locations?.find((l: any) => l.type === 'DELIVERY');
                        const from = pickup?.locationData?.city || pickup?.locationData?.name || selectedAuction.load.origin?.city || '—';
                        const to = delivery?.locationData?.city || delivery?.locationData?.name || selectedAuction.load.destination?.city || '—';
                        return `${from} → ${to}`;
                      })()}
                    </p>
                  </div>
                )}
              </div>

              {/* Advance Payment Section */}
              <div className="space-y-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={requireAdvancePayment}
                      onChange={(e) => {
                        setRequireAdvancePayment(e.target.checked);
                        if (!e.target.checked) setAdvancePaymentPercentage('');
                      }}
                      className="peer appearance-none w-6 h-6 border-2 border-gray-300 dark:border-slate-700 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                    />
                    <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-base font-bold text-gray-700 dark:text-slate-300">Require advance payment before trip</span>
                </label>

                {requireAdvancePayment && (
                  <div className="animate-in slide-in-from-top-2 duration-300 space-y-3">
                    <label className="block text-base font-bold text-gray-700 dark:text-slate-300">Advance Payment % (Optional)</label>
                    <input
                      type="number"
                      value={advancePaymentPercentage}
                      onChange={(e) => setAdvancePaymentPercentage(e.target.value)}
                      className="w-full h-14 px-6 bg-white dark:bg-slate-950 border-2 border-gray-100 dark:border-slate-800 rounded-2xl text-sm font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="e.g., 70"
                    />
                    <p className="text-sm text-gray-400 dark:text-slate-500 leading-relaxed font-medium">
                      Percentage of transportation fee to be paid upfront.
                    </p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <label className="block text-base font-bold text-gray-700 dark:text-slate-300">Notes</label>
                <textarea
                  value={bidNotes}
                  onChange={(e) => setBidNotes(e.target.value)}
                  className="w-full p-5 bg-white dark:bg-slate-950 border-2 border-gray-200 dark:border-slate-800 rounded-xl text-sm font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:border-[#345E85] dark:focus:border-blue-500 transition-all min-h-[120px] resize-none"
                  placeholder="Add any additional notes..."
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-10 pt-0 flex flex-col gap-4">
              {!isBiddingOpen(selectedAuction) && (
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest text-center bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl py-3 w-full normal-case tracking-normal">
                  {getBidWindow(selectedAuction)?.message || 'Bidding is not open yet.'}
                </p>
              )}
              <div className="flex items-center justify-end gap-4 w-full">
                <button
                  type="button"
                  onClick={() => setShowBidModal(false)}
                  className="px-10 py-4 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-base font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bidAmount || !selectedTruckId || !proposedPickupDate || !proposedDeliveryDate || !isBiddingOpen(selectedAuction)}
                  className="px-10 py-4 bg-[#345E85] text-white rounded-xl text-base font-bold hover:bg-[#2a4d6d] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Bid
                </button>
              </div>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Bid Details Modal */}
      {showDetailsModal && detailsAuction && createPortal(
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-100 dark:border-slate-800 flex items-start sm:items-center justify-between shrink-0 gap-3">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                  <Gavel className="text-[#345E85] dark:text-blue-400" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight line-clamp-2 break-words" title={detailsAuction.load?.title || 'Auction Details'}>
                    {detailsAuction.load?.title || 'Auction Details'}
                  </h2>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider sm:tracking-widest mt-1 break-all">Ref: {detailsAuction.id?.slice(0, 12)}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors shrink-0">
                <X size={16} />
              </button>
            </div>

            {/* Status Banner */}
            <div className="px-4 sm:px-8 py-3 sm:py-4 border-b border-slate-50 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(detailsAuction.status)}
                  {getAuctionTypeBadge(detailsAuction.auctionType)}
                </div>
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="text-left sm:text-right">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider sm:tracking-widest">Current Bid</p>
                    <p className="text-base sm:text-xl font-black text-[#345E85] dark:text-blue-400">
                      {detailsAuction.currentHighestBid ? formatCurrency(detailsAuction.currentHighestBid) : '—'}
                    </p>
                  </div>
                  <div className="h-8 sm:h-10 w-px bg-slate-200 dark:bg-slate-800" />
                  <div className="text-left sm:text-right">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider sm:tracking-widest">Bids</p>
                    <p className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100">{detailsAuction.totalBids}</p>
                  </div>
                  <div className="h-8 sm:h-10 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                  <div className="text-left sm:text-right hidden sm:block">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Bidders</p>
                    <p className="text-xl font-black text-slate-900 dark:text-slate-100">{detailsAuction.uniqueBidders}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6 custom-scrollbar">
              {/* Route */}
              <div className="relative pl-5 sm:pl-6 space-y-3 sm:space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                <h3 className="absolute -left-2 -top-1 hidden">Route</h3>
                <div className="relative">
                  <div className="absolute -left-5 sm:-left-6 top-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 bg-white dark:bg-slate-950 border-[3px] border-[#345E85] dark:border-blue-400 rounded-full" />
                  <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-800">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Pickup</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 break-words" title={getLocationString(detailsAuction.load, 'pickup')}>
                      {getLocationString(detailsAuction.load, 'pickup')}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                      <Clock size={9} /> {formatDate(detailsAuction.load?.pickupDate)}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -left-5 sm:-left-6 top-1.5 h-3 w-3 sm:h-3.5 sm:w-3.5 bg-white dark:bg-slate-950 border-[3px] border-rose-500 rounded-full" />
                  <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 dark:border-slate-800">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Delivery</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 break-words" title={getLocationString(detailsAuction.load, 'delivery')}>
                      {getLocationString(detailsAuction.load, 'delivery')}
                    </p>
                    <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                      <Clock size={9} /> {formatDate(detailsAuction.load?.deliveryDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cargo & Pricing Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-2xl space-y-1">
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Payload</p>
                  <p className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate">
                    {detailsAuction.load?.weight?.toLocaleString() || '0'} <span className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-600">kg</span>
                  </p>
                </div>
                <div className="p-3 sm:p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-2xl space-y-1">
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cargo Value</p>
                  <p className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 truncate">
                    {detailsAuction.load?.loadValue ? formatCurrency(detailsAuction.load.loadValue) : '—'}
                  </p>
                </div>
              </div>

              {/* Auction Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-2xl">
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Auction Opens</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 break-words">{formatDate(detailsAuction.auctionStart)}</p>
                </div>
                <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-2xl">
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Auction Closes</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 break-words">{formatDate(detailsAuction.auctionEnd)}</p>
                </div>
              </div>

              {/* Owner */}
              {detailsAuction.load?.cargoOwner && (
                <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl sm:rounded-2xl">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 font-black text-xs sm:text-sm shadow-sm shrink-0">
                    {(detailsAuction.load.cargoOwner.profile?.firstName?.[0] || 'C')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Cargo Owner</p>
                    <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                      {detailsAuction.load.cargoOwner.profile?.firstName} {detailsAuction.load.cargoOwner.profile?.lastName || 'Owner'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-4 sm:px-8 py-4 sm:py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col gap-3 shrink-0">
              {!isBiddingOpen(detailsAuction) && (
                <p className="text-[8px] sm:text-[9px] font-bold text-amber-600 uppercase tracking-wider sm:tracking-widest text-center bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg sm:rounded-xl py-2 normal-case tracking-normal">
                  {getBidWindow(detailsAuction)?.message || `Bidding is not open — status: ${detailsAuction.status}`}
                </p>
              )}
              {(userRole === 'TRUCK_OWNER' || userRole === 'BROKER') && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {userRole !== 'BROKER' && canCreateBid && (
                    <button
                      type="button"
                      onClick={() => guardBidAction(detailsAuction, () => { setShowDetailsModal(false); openBidModal(detailsAuction); })}
                      disabled={!isBiddingOpen(detailsAuction)}
                      title={getBidWindow(detailsAuction)?.message}
                      className="flex-1 py-3 sm:py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wide sm:tracking-widest hover:bg-black dark:hover:bg-slate-700 transition-all shadow-lg active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <Gavel size={13} className="shrink-0" /> 
                      <span className="truncate">
                        {getBidWindow(detailsAuction)?.state === 'not_started' ? 'Opens Soon' : 'Custom Bid'}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wide sm:tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                  >
                    Close
                  </button>
                </div>
              )}
              {(userRole !== 'TRUCK_OWNER' && userRole !== 'BROKER') && (
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="py-3 sm:py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wide sm:tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )
      }
    </div >
  );
};

export default AuctionList;