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
  ShieldAlert
} from 'lucide-react';

import toast from 'react-hot-toast';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import type { Cargo } from '../types/cargo';
import StatCard from '../components/EnliteUI/Cards/StatCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { cn } from '../utils/cn';

import { FleetHeader } from '../components/FleetDashboard/FleetHeader';
import { FleetFooter } from '../components/FleetDashboard/FleetFooter';

interface CargoBid extends Cargo {
  bidStatus?: 'pending' | 'accepted' | 'rejected';
  bidId?: string;
  cargoOwnerName?: string;
  cargoOwnerPhone?: string;
  cargoOwnerEmail?: string;
  cargoOwnerCompany?: string;
  distance?: number;
  estimatedDuration?: number;
}

const FleetBidsPage: React.FC = () => {
  const [bids, setBids] = useState<CargoBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [cargoTypeFilter, setCargoTypeFilter] = useState<string>('all');
  const [selectedBid, setSelectedBid] = useState<CargoBid | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const { confirm, DialogComponent } = useConfirmDialog();

  // Generate dummy cargo bids based on the Cargo interface
  const generateDummyBids = (): CargoBid[] => {
    const cargoTypes = [
      { type: 'ELECTRONICS', title: 'Electronics Shipment', requiresRefrigeration: false, isFragile: true },
      { type: 'AGRICULTURAL', title: 'Agricultural Products', requiresRefrigeration: true, isFragile: false },
      { type: 'CONSTRUCTION', title: 'Construction Materials', requiresRefrigeration: false, isFragile: false },
      { type: 'FOOD_BEVERAGES', title: 'Food & Beverages', requiresRefrigeration: true, isFragile: false },
      { type: 'TEXTILES', title: 'Textiles & Clothing', requiresRefrigeration: false, isFragile: false },
      { type: 'MACHINERY', title: 'Machinery & Equipment', requiresRefrigeration: false, isFragile: true },
      { type: 'PHARMACEUTICALS', title: 'Pharmaceuticals', requiresRefrigeration: true, isFragile: true },
      { type: 'FURNITURE', title: 'Furniture & Home Goods', requiresRefrigeration: false, isFragile: true },
    ];

    const origins = [
      { city: 'Nairobi', address: 'Industrial Area, Nairobi' },
      { city: 'Mombasa', address: 'Port of Mombasa, Mombasa' },
      { city: 'Kisumu', address: 'Kisumu Industrial Park, Kisumu' },
      { city: 'Nakuru', address: 'Nakuru CBD, Nakuru' },
      { city: 'Eldoret', address: 'Eldoret Industrial Area, Eldoret' },
    ];

    const destinations = [
      { city: 'Mombasa', address: 'Port of Mombasa, Mombasa' },
      { city: 'Nairobi', address: 'Westlands, Nairobi' },
      { city: 'Kisumu', address: 'Kisumu CBD, Kisumu' },
      { city: 'Nakuru', address: 'Nakuru Industrial Area, Nakuru' },
      { city: 'Eldoret', address: 'Eldoret CBD, Eldoret' },
    ];

    const owners = [
      { name: 'John Kamau', company: 'ABC Logistics Ltd', phone: '+254712345678', email: 'john.kamau@abclogistics.com' },
      { name: 'Mary Wanjiku', company: 'XYZ Transport Co', phone: '+254723456789', email: 'mary.w@xyztransport.com' },
      { name: 'Peter Ochieng', company: 'Global Shipping Inc', phone: '+254734567890', email: 'peter.o@globalshipping.com' },
      { name: 'Sarah Muthoni', company: 'Kenya Cargo Services', phone: '+254745678901', email: 'sarah.m@kenyacargo.com' },
      { name: 'David Kipchoge', company: 'East Africa Freight', phone: '+254756789012', email: 'david.k@eastafricafreight.com' },
    ];

    const prices = [50000, 75000, 100000, 125000, 150000, 180000, 200000, 250000];
    const weights = [5000, 7500, 10000, 12500, 15000, 20000, 25000, 30000];
    const volumes = [100, 150, 200, 250, 300, 400, 500, 600];

    const now = new Date();
    const bids: CargoBid[] = [];

    for (let i = 0; i < 12; i++) {
      const cargoType = cargoTypes[i % cargoTypes.length];
      const origin = origins[i % origins.length];
      const destination = destinations[(i + 2) % destinations.length];
      const owner = owners[i % owners.length];
      const price = prices[i % prices.length];
      const weight = weights[i % weights.length];
      const volume = volumes[i % volumes.length];

      // Ensure origin and destination are different
      const dest = destination.city === origin.city
        ? destinations[(i + 3) % destinations.length]
        : destination;

      const pickupDate = new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000);
      const deliveryDate = new Date(pickupDate.getTime() + (2 + i % 3) * 24 * 60 * 60 * 1000);

      bids.push({
        id: `cargo-bid-${i + 1}`,
        bidId: `bid-${i + 1}`,
        title: cargoType.title,
        description: `Transport ${cargoType.title.toLowerCase()} from ${origin.city} to ${dest.city}. ${i % 3 === 0 ? 'Urgent delivery required.' : 'Standard delivery.'}`,
        weight,
        volume,
        cargoType: cargoType.type,
        pickupLocationId: `loc-pickup-${i + 1}`,
        deliveryLocationId: `loc-delivery-${i + 1}`,
        pickupDate: pickupDate.toISOString(),
        deliveryDate: deliveryDate.toISOString(),
        status: 'PUBLISHED',
        loadValue: price * 1.5,
        offeredPrice: price,
        currencyCode: 'KES',
        isFragile: cargoType.isFragile,
        isHazardous: i % 4 === 0,
        requiresRefrigeration: cargoType.requiresRefrigeration,
        contactInfo: {
          phone: owner.phone,
          email: owner.email,
        },
        autoMatchEnabled: true,
        matchingCriteria: {},
        publishedAt: new Date(now.getTime() - i * 2 * 60 * 60 * 1000).toISOString(),
        rating: 4.5 + (i % 5) * 0.1,
        viewCount: 10 + i * 5,
        createdAt: new Date(now.getTime() - i * 3 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - i * 2 * 60 * 60 * 1000).toISOString(),
        bidStatus: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'accepted' : 'rejected', // Adjusted logic for distribution
        cargoOwnerName: owner.name,
        cargoOwnerPhone: owner.phone,
        cargoOwnerEmail: owner.email,
        cargoOwnerCompany: owner.company,
        distance: 200 + (i % 5) * 100,
        estimatedDuration: 4 + (i % 4) * 2,
        length: 6 + (i % 3),
        width: 2.4,
        height: 2.6,
        urgencyLevel: i % 4 === 0 ? 'HIGH' : i % 4 === 1 ? 'CRITICAL' : 'NORMAL',
        isTimeCritical: i % 3 === 0,
        numberOfPallets: 10 + (i % 10),
        packagingType: i % 2 === 0 ? 'PALLETIZED' : 'LOOSE',
        requiresGpsMonitoring: i % 2 === 0,
        requiresTemperatureMonitoring: cargoType.requiresRefrigeration,
        temperatureMin: cargoType.requiresRefrigeration ? 2 : undefined,
        temperatureMax: cargoType.requiresRefrigeration ? 8 : undefined,
        pickupLocation: {
          id: `loc-pickup-${i + 1}`,
          name: `Pickup Location ${i + 1}`,
          address: origin.address,
          coordinates: {
            latitude: -1.2921 + (i * 0.01),
            longitude: 36.8219 + (i * 0.01),
          },
          locationType: 'WAREHOUSE',
        },
        deliveryLocation: {
          id: `loc-delivery-${i + 1}`,
          name: `Delivery Location ${i + 1}`,
          address: dest.address,
          coordinates: {
            latitude: -4.0435 + (i * 0.01),
            longitude: 39.6682 + (i * 0.01),
          },
          locationType: 'WAREHOUSE',
        },
        cargoOwner: {
          id: `owner-${i + 1}`,
          email: owner.email,
          profile: {
            firstName: owner.name.split(' ')[0],
            lastName: owner.name.split(' ')[1] || '',
            companyName: owner.company,
          },
        },
      });
    }

    return bids;
  };

  const loadBids = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app, this would fetch from API
      // For now, use dummy data
      const dummyBids = generateDummyBids();
      setBids(dummyBids);
    } catch (error: any) {
      console.error('Error loading bids:', error);
      toast.error('Failed to load cargo bids');
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
      toast.error('Failed to accept bid');
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
      toast.error('Failed to reject bid');
    } finally {
      setProcessingAction(null);
    }
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

  const formatCurrency = (amount: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-blue-500/30">
      <FleetHeader />

      <main className="flex-1 max-w-[1920px] mx-auto w-full px-4 md:px-8 lg:px-12 xl:px-20 py-8 md:py-12 space-y-8">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#345E85] shadow-inner">
              <Gavel size={20} />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#345E85]">Marketplace</h2>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cargo Bids</h1>
              <p className="text-slate-500 font-medium mt-1">Review opportunities, place bids, and secure new shipments.</p>
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
            title="Active Bids"
            value={bids.filter(b => b.bidStatus === 'pending').length}
            icon={<Gavel />}
            color="primary"
            subtitle="Opportunities awaiting action"
          />
          <StatCard
            title="Accepted"
            value={bids.filter(b => b.bidStatus === 'accepted').length}
            icon={<CheckCircle />}
            color="success"
            subtitle="Secured shipments"
          />
          <StatCard
            title="Rejected"
            value={bids.filter(b => b.bidStatus === 'rejected').length}
            icon={<XCircle />}
            color="error" // Will map to error/rose
            subtitle="Passed opportunities"
          />
          <StatCard
            title="Total Value"
            value={formatCurrency(bids.reduce((acc, curr) => acc + (curr.offeredPrice || 0), 0))}
            icon={<DollarSign />}
            color="info"
            subtitle="Potential revenue pipeline"
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
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Offered Price</span>
                        <span className="text-lg font-black text-[#345E85]">{formatCurrency(bid.offeredPrice || 0, bid.currencyCode)}</span>
                      </div>
                      <button
                        onClick={() => setSelectedBid(bid)}
                        className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#345E85] hover:bg-blue-50 transition-colors"
                      >
                        <ArrowRight size={20} />
                      </button>
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
                            <button
                              onClick={() => setSelectedBid(bid)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#345E85] transition-colors"
                            >
                              <ArrowRight size={18} />
                            </button>
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
                        <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">Current Status</p>
                        <p className="text-xl font-black tracking-tight">{selectedBid.bidStatus?.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Offered Price</p>
                        <p className="text-2xl font-black tracking-tight">{formatCurrency(selectedBid.offeredPrice || 0, selectedBid.currencyCode)}</p>
                      </div>
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
      </main>
      <FleetFooter />
      {DialogComponent}
    </div>
  );
};

export default FleetBidsPage;
