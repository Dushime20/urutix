import React, { useState, useEffect, useCallback } from 'react';
import {
  FaBox,
  FaMapMarkerAlt,
  FaDollarSign,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaFilter,
  FaSpinner,
  FaSync,
  FaEye,
  FaWeight,
  FaRuler,
  FaSnowflake,
  FaExclamationTriangle,
  FaClock,
  FaUser,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaTruck,
  FaRoute
} from 'react-icons/fa';
import { Grid, Table } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import type { Cargo } from '../types/cargo';

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const { confirm, DialogComponent } = useConfirmDialog();
  const { user } = useAuth();

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
        bidStatus: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'accepted' : 'pending',
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
      if (showDetailsModal) {
        setShowDetailsModal(false);
      }
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
      if (showDetailsModal) {
        setShowDetailsModal(false);
      }
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUrgencyColor = (urgency?: string) => {
    // All urgency levels use gray colors for consistency
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusColor = (status?: string) => {
    // All statuses use gray colors for consistency
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Cargo Bids</h1>
            <p className="text-xs text-gray-600">View and accept cargo bids from cargo owners</p>
          </div>
          <button
            onClick={loadBids}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <FaSync className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-end gap-2 bg-white border border-gray-200 rounded-lg p-1 w-fit ml-auto mb-4">
        <button
          onClick={() => setViewMode('card')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'card'
            ? 'bg-gray-900 text-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cards</span>
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'table'
            ? 'bg-gray-900 text-white'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Table</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search by cargo title, origin, destination, or cargo owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400 w-3.5 h-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={cargoTypeFilter}
              onChange={(e) => setCargoTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="ELECTRONICS">Electronics</option>
              <option value="AGRICULTURAL">Agricultural</option>
              <option value="CONSTRUCTION">Construction</option>
              <option value="FOOD_BEVERAGES">Food & Beverages</option>
              <option value="TEXTILES">Textiles</option>
              <option value="MACHINERY">Machinery</option>
              <option value="PHARMACEUTICALS">Pharmaceuticals</option>
              <option value="FURNITURE">Furniture</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bids Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : filteredBids.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FaBox className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1.5">No Cargo Bids Found</h3>
          <p className="text-xs text-gray-600">
            {searchTerm || statusFilter !== 'all' || cargoTypeFilter !== 'all'
              ? 'No bids match your search criteria.'
              : 'There are currently no cargo bids available.'}
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredBids.map((bid) => (
                <div
                  key={bid.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <FaBox className="w-4 h-4 text-gray-600" />
                        <h3 className="text-sm font-semibold text-gray-900">{bid.title}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {bid.urgencyLevel && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {bid.urgencyLevel}
                          </span>
                        )}
                        {bid.isHazardous && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            <FaExclamationTriangle className="w-2.5 h-2.5 inline mr-0.5" />
                            Hazmat
                          </span>
                        )}
                        {bid.requiresRefrigeration && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            <FaSnowflake className="w-2.5 h-2.5 inline mr-0.5" />
                            Refrigerated
                          </span>
                        )}
                        {bid.isFragile && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            Fragile
                          </span>
                        )}
                      </div>
                    </div>
                    {bid.bidStatus && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
                        {bid.bidStatus}
                      </span>
                    )}
                  </div>

                  {/* Route */}
                  <div className="mb-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <FaMapMarkerAlt className="w-3 h-3 text-gray-500" />
                      <span className="font-medium truncate">{bid.pickupLocation?.address || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-4.5">
                      <FaRoute className="w-2.5 h-2.5" />
                      <span>{bid.distance} km • {bid.estimatedDuration} hrs</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <FaMapMarkerAlt className="w-3 h-3 text-gray-500" />
                      <span className="font-medium truncate">{bid.deliveryLocation?.address || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Cargo Details */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <FaWeight className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{bid.weight?.toLocaleString()} kg</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaRuler className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{bid.volume} m³</span>
                    </div>
                    {bid.numberOfPallets && (
                      <div className="flex items-center gap-1.5">
                        <FaBox className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">{bid.numberOfPallets} pallets</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <FaCalendarAlt className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600 truncate">{formatDate(bid.pickupDate)}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-3 p-2 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Offered Price</span>
                      <span className="text-base font-bold text-gray-900 flex items-center gap-0.5">
                        <FaDollarSign className="w-3 h-3" />
                        {formatCurrency(bid.offeredPrice || 0, bid.currencyCode)}
                      </span>
                    </div>
                  </div>

                  {/* Cargo Owner */}
                  <div className="mb-3 p-2 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex items-center gap-1.5 mb-1">
                      <FaBuilding className="w-3 h-3 text-gray-400" />
                      <span className="text-xs font-medium text-gray-900 truncate">{bid.cargoOwnerCompany}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                      <FaUser className="w-2.5 h-2.5" />
                      <span className="truncate">{bid.cargoOwnerName}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <div className="relative group">
                      <button
                        onClick={() => {
                          setSelectedBid(bid);
                          setShowDetailsModal(true);
                        }}
                        className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <FaEye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {bid.bidStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAcceptBid(bid)}
                          disabled={processingAction === bid.id}
                          className="flex-1 px-2 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center justify-center disabled:opacity-50 text-xs transition-colors"
                        >
                          {processingAction === bid.id ? (
                            <FaSpinner className="w-3 h-3 animate-spin" />
                          ) : (
                            <span>Accept</span>
                          )}
                        </button>
                        <button
                          onClick={() => handleRejectBid(bid)}
                          disabled={processingAction === bid.id}
                          className="flex-1 px-2 py-1.5 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center justify-center disabled:opacity-50 text-xs transition-colors"
                        >
                          {processingAction === bid.id ? (
                            <FaSpinner className="w-3 h-3 animate-spin" />
                          ) : (
                            <span>Reject</span>
                          )}
                        </button>
                      </>
                    )}
                    {bid.bidStatus === 'accepted' && (
                      <div className="flex-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded-md text-center text-xs font-medium">
                        Accepted
                      </div>
                    )}
                    {bid.bidStatus === 'rejected' && (
                      <div className="flex-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded-md text-center text-xs font-medium">
                        Rejected
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBids.map((bid) => (
                      <tr key={bid.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{bid.title}</div>
                          <div className="text-[10px] text-gray-500">{bid.cargoType} • {bid.weight}kg</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-gray-900 truncate max-w-[150px]">{bid.pickupLocation?.address}</div>
                          <div className="text-[10px] text-gray-400">→</div>
                          <div className="text-xs text-gray-900 truncate max-w-[150px]">{bid.deliveryLocation?.address}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{formatCurrency(bid.offeredPrice || 0, bid.currencyCode)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 rounded text-[10px] font-medium bg-gray-100 text-gray-700">
                            {bid.bidStatus || 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedBid(bid);
                              setShowDetailsModal(true);
                            }}
                            className="p-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                          >
                            <FaEye className="w-3.5 h-3.5" />
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
      {showDetailsModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Cargo Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cargo Title</label>
                    <p className="text-gray-900">{selectedBid.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cargo Type</label>
                    <p className="text-gray-900">{selectedBid.cargoType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Weight</label>
                    <p className="text-gray-900">{selectedBid.weight?.toLocaleString()} kg</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Volume</label>
                    <p className="text-gray-900">{selectedBid.volume} m³</p>
                  </div>
                  {selectedBid.length && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Dimensions</label>
                        <p className="text-gray-900">{selectedBid.length}m × {selectedBid.width}m × {selectedBid.height}m</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Pallets</label>
                        <p className="text-gray-900">{selectedBid.numberOfPallets || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
                {selectedBid.description && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-gray-900">{selectedBid.description}</p>
                  </div>
                )}
              </div>

              {/* Route Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <FaMapMarkerAlt className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Pickup Location</label>
                      <p className="text-gray-900 font-medium">{selectedBid.pickupLocation?.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <FaCalendarAlt className="w-3 h-3 inline mr-1" />
                        {formatDate(selectedBid.pickupDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-6 text-sm text-gray-600">
                    <FaRoute className="w-4 h-4" />
                    <span>Distance: {selectedBid.distance} km</span>
                    <span>•</span>
                    <span>Estimated Duration: {selectedBid.estimatedDuration} hours</span>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <FaMapMarkerAlt className="w-5 h-5 text-red-600 mt-1" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Delivery Location</label>
                      <p className="text-gray-900 font-medium">{selectedBid.deliveryLocation?.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <FaCalendarAlt className="w-3 h-3 inline mr-1" />
                        {formatDate(selectedBid.deliveryDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <label className="text-sm font-medium text-gray-500">Offered Price</label>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(selectedBid.offeredPrice || 0, selectedBid.currencyCode)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="text-sm font-medium text-gray-500">Cargo Value</label>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(selectedBid.loadValue || 0, selectedBid.currencyCode)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cargo Owner */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cargo Owner</h3>
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <FaBuilding className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{selectedBid.cargoOwnerCompany}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUser className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedBid.cargoOwnerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaPhone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedBid.cargoOwnerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedBid.cargoOwnerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Special Requirements */}
              {(selectedBid.isHazardous || selectedBid.requiresRefrigeration || selectedBid.isFragile || selectedBid.requiresGpsMonitoring) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Requirements</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedBid.isHazardous && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium border border-red-200">
                        <FaExclamationTriangle className="w-3 h-3 inline mr-1" />
                        Hazardous Materials
                      </span>
                    )}
                    {selectedBid.requiresRefrigeration && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200">
                        <FaSnowflake className="w-3 h-3 inline mr-1" />
                        Refrigeration Required
                        {selectedBid.temperatureMin && selectedBid.temperatureMax && (
                          <span className="ml-1">({selectedBid.temperatureMin}°C - {selectedBid.temperatureMax}°C)</span>
                        )}
                      </span>
                    )}
                    {selectedBid.isFragile && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium border border-yellow-200">
                        Fragile Handling Required
                      </span>
                    )}
                    {selectedBid.requiresGpsMonitoring && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium border border-purple-200">
                        GPS Monitoring Required
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedBid.bidStatus === 'pending' && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleAcceptBid(selectedBid);
                    }}
                    disabled={processingAction === selectedBid.id}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center disabled:opacity-50 font-medium"
                  >
                    {processingAction === selectedBid.id ? (
                      <>
                        <FaSpinner className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <span>Accept Cargo Bid</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      handleRejectBid(selectedBid);
                    }}
                    disabled={processingAction === selectedBid.id}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center disabled:opacity-50 font-medium"
                  >
                    {processingAction === selectedBid.id ? (
                      <FaSpinner className="w-5 h-5 animate-spin" />
                    ) : (
                      <span>Reject</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {DialogComponent}
    </div>
  );
};

export default FleetBidsPage;

