import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Search,
  Route,
  Calendar,
  DollarSign,
  ArrowUpDown,
  LayoutGrid,
  List,
  UserPlus,
} from 'lucide-react';
import { tripsAPI } from '../services/api';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { cn } from '../utils/cn';
import ModernLoader from '../components/common/ModernLoader';

interface Trip {
  id: string;
  tripNumber: string;
  loadId: string;
  truckId: string;
  driverId: string;
  status: string;
  plannedStartTime: string | Date;
  plannedEndTime: string | Date;
  actualStartTime?: string | Date;
  actualEndTime?: string | Date;
  agreedPrice: number;
  pickupLocation: string;
  deliveryLocation: string;
  driverName: string;
  truckPlate: string;
  pod?: {
    recipientName: string;
    signatureBase64: string;
    completedAt: string;
    completedBy: string;
    photoUrl?: string;
  };
}

interface SortConfig {
  key: keyof Trip | 'date';
  direction: 'asc' | 'desc';
}

const TripManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'planned' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [assigningDriver, setAssigningDriver] = useState(false);
  const [truckDrivers, setTruckDrivers] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const { data: tripsData, isLoading: loading, error } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripsAPI.getAll({ limit: 100 }),
    select: (response) => {
      // Map the API response to the component's Trip interface
      return response.data.data.map((trip: any) => {
        // Extract pickup location from multiple possible sources
        const getPickupLocation = () => {
          // 1. Check trip's pickupLocation relation
          if (trip.pickupLocation?.city) return trip.pickupLocation.city;
          if (trip.pickupLocation?.address) return trip.pickupLocation.address;

          // 2. Check load's origin field (jsonb Address type)
          if (trip.load?.origin?.city) return trip.load.origin.city;
          if (trip.load?.origin?.address) return trip.load.origin.address;

          // 3. Check load's locations array for PICKUP type
          const pickupLoc = trip.load?.locations?.find((loc: any) => loc.type === 'PICKUP');
          if (pickupLoc?.locationData?.city) return pickupLoc.locationData.city;
          if (pickupLoc?.locationData?.name) return pickupLoc.locationData.name;
          if (pickupLoc?.locationData?.address) return pickupLoc.locationData.address;

          return 'Unknown Origin';
        };

        // Extract delivery location from multiple possible sources
        const getDeliveryLocation = () => {
          // 1. Check trip's deliveryLocation relation
          if (trip.deliveryLocation?.city) return trip.deliveryLocation.city;
          if (trip.deliveryLocation?.address) return trip.deliveryLocation.address;

          // 2. Check load's destination field (jsonb Address type)
          if (trip.load?.destination?.city) return trip.load.destination.city;
          if (trip.load?.destination?.address) return trip.load.destination.address;

          // 3. Check load's locations array for DELIVERY type
          const deliveryLoc = trip.load?.locations?.find((loc: any) => loc.type === 'DELIVERY');
          if (deliveryLoc?.locationData?.city) return deliveryLoc.locationData.city;
          if (deliveryLoc?.locationData?.name) return deliveryLoc.locationData.name;
          if (deliveryLoc?.locationData?.address) return deliveryLoc.locationData.address;

          return 'Unknown Destination';
        };

        return {
          id: trip.id,
          tripNumber: trip.tripNumber || 'N/A',
          loadId: trip.load?.reference || trip.loadId || 'N/A',
          truckId: trip.truckId,
          driverId: trip.driverId,
          status: trip.status,
          plannedStartTime: new Date(trip.plannedStartTime),
          plannedEndTime: new Date(trip.plannedEndTime),
          actualStartTime: trip.actualStartTime ? new Date(trip.actualStartTime) : undefined,
          actualEndTime: trip.actualEndTime ? new Date(trip.actualEndTime) : undefined,
          agreedPrice: Number(trip.agreedPrice) || 0,
          pickupLocation: getPickupLocation(),
          deliveryLocation: getDeliveryLocation(),
          driverName: trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : 'Unassigned',
          truckPlate: trip.truck?.plateNumber || 'Unassigned',
          pod: trip.load?.metadata?.pod || undefined,
          // Preserve full raw objects for the detail modal
          _raw: trip,
        };
      });
    }
  });

  if (error) {
    toast.error('Failed to load trips');
  }

  const trips = tripsData || [];

  // Filter Logic
  const filteredTrips = trips.filter((trip: Trip) => {
    // Status Filter
    if (filter !== 'all' && trip.status.toLowerCase() !== filter) return false;

    // Search Filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        trip.tripNumber.toLowerCase().includes(searchLower) ||
        trip.driverName.toLowerCase().includes(searchLower) ||
        trip.truckPlate.toLowerCase().includes(searchLower) ||
        trip.pickupLocation.toLowerCase().includes(searchLower) ||
        trip.deliveryLocation.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Sort Logic
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    let aValue: any = a[sortConfig.key as keyof Trip];
    let bValue: any = b[sortConfig.key as keyof Trip];

    if (sortConfig.key === 'date') {
      aValue = new Date(a.plannedStartTime).getTime();
      bValue = new Date(b.plannedStartTime).getTime();
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Helper Functions
  const loadTruckDrivers = async (truckId: string) => {
    if (!truckId) return;
    setLoadingDrivers(true);
    try {
      // Fetch all drivers in tenant â€” response shape: { drivers: [...] }
      const driversRes = await api.get('/fleet/drivers');
      const body = driversRes.data;
      const allDrivers: any[] = Array.isArray(body?.drivers)
        ? body.drivers
        : Array.isArray(body?.data)
          ? body.data
          : Array.isArray(body)
            ? body
            : [];

      // Try to get drivers specifically assigned to this truck
      let filtered = allDrivers;
      try {
        const truckRes = await api.get(`/fleet/trucks/${truckId}`);
        const truck = truckRes.data?.data || truckRes.data;
        const assignedIds: string[] = (truck?.assignedDrivers || []).map((d: any) => d.driverId);
        if (assignedIds.length > 0) {
          filtered = allDrivers.filter((d: any) => assignedIds.includes(d.id));
        }
      } catch {
        // fallback to all active drivers
        filtered = allDrivers.filter((d: any) => d.status === 'ACTIVE' || d.availabilityStatus === 'AVAILABLE');
      }

      setTruckDrivers(filtered);
    } catch {
      toast.error('Failed to load drivers');
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedTrip || !selectedDriverId) return;
    setAssigningDriver(true);
    try {
      await api.patch(`/trips/${selectedTrip.id}/assign-driver`, { driverId: selectedDriverId });
      toast.success('Driver assigned successfully');
      setSelectedDriverId('');
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign driver');
    } finally {
      setAssigningDriver(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'PLANNED': return 'bg-amber-100 text-amber-700';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700';
      case 'DELAYED': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="text-emerald-500" size={16} />;
      case 'IN_PROGRESS': return <Truck className="text-blue-500" size={16} />;
      case 'PLANNED': return <Clock className="text-amber-500" size={16} />;
      case 'CANCELLED': return <AlertTriangle className="text-rose-500" size={16} />;
      case 'DELAYED': return <AlertTriangle className="text-orange-500" size={16} />;
      default: return <Clock className="text-slate-400" size={16} />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <ModernLoader isLoading={true} type="dashboard" showStats={true} />;
  }

  const CircularStatsCard = ({ title, value, icon: Icon, colorClass, secondaryColor }: any) => {
    return (
      <div className="flex flex-col items-center group">
        <div className="relative w-40 h-40 rounded-full bg-white dark:bg-slate-900 border-[8px] border-slate-50 dark:border-slate-800 flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none">
          <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
            <circle
              cx="80"
              cy="80"
              r="72"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="452"
              strokeDashoffset="350"
              className={cn("opacity-10 dark:opacity-20 transition-all duration-1000 group-hover:stroke-dashoffset-[200]", secondaryColor)}
            />
          </svg>

          <div className={cn("p-2 rounded-2xl mb-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-inherit transition-all duration-500 shadow-sm", colorClass)}>
            <Icon size={18} />
          </div>

          <div className="flex flex-col items-center px-4 w-full overflow-hidden">
            <span className="text-xl font-black text-[#0f172a] dark:text-white tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
              {value}
            </span>
          </div>

          <div className="absolute inset-4 rounded-full border border-dashed border-slate-100 dark:border-slate-800 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
        </div>

        <div className="mt-4 text-center px-2">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] group-hover:text-[#345E85] dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-1">
            {title}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-[#345E85] dark:text-blue-400 shadow-inner">
            <Route size={20} />
          </div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#345E85] dark:text-blue-400">Logistics</h2>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Trip Management</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Monitor active trips, schedule shipments, and track fleet performance.</p>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 place-items-center bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <CircularStatsCard
          title="Total Trips"
          value={trips.length}
          icon={Route}
          colorClass="bg-blue-50 dark:bg-blue-900/30 text-[#345E85] dark:text-blue-400"
          secondaryColor="text-[#345E85] dark:text-blue-400"
        />
        <CircularStatsCard
          title="In Progress"
          value={trips.filter((t: Trip) => t.status === 'IN_PROGRESS').length}
          icon={Truck}
          colorClass="bg-info-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400"
          secondaryColor="text-blue-500 dark:text-blue-400"
        />
        <CircularStatsCard
          title="Planned"
          value={trips.filter((t: Trip) => t.status === 'PLANNED').length}
          icon={Clock}
          colorClass="bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400"
          secondaryColor="text-amber-500 dark:text-amber-400"
        />
        <CircularStatsCard
          title="Completed"
          value={trips.filter((t: Trip) => t.status === 'COMPLETED').length}
          icon={CheckCircle}
          colorClass="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          secondaryColor="text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by ID, driver, truck, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-[#345E85] dark:focus:border-blue-500 outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
              {(['all', 'planned', 'in_progress', 'completed'] as const).map((statusOption) => (
                <button
                  key={statusOption}
                  onClick={() => setFilter(statusOption)}
                  className={cn(
                    "px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap",
                    filter === statusOption
                      ? "bg-white dark:bg-slate-800 text-[#345E85] dark:text-blue-400 shadow-sm"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50"
                  )}
                >
                  {statusOption === 'all' ? 'All' : statusOption.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setView('list')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  view === 'list' ? "bg-white dark:bg-slate-800 text-[#345E85] dark:text-blue-400 shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setView('grid')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  view === 'grid' ? "bg-white dark:bg-slate-800 text-[#345E85] dark:text-blue-400 shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-[#345E85] dark:hover:text-blue-400 hover:border-[#345E85] dark:hover:border-blue-500 transition-all shadow-sm"
              title={sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}
            >
              <ArrowUpDown size={18} className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {sortedTrips.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
            <Route size={40} />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No trips found</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
            Try adjusting filters or search terms to find what you're looking for.
          </p>
        </div>
      ) : (
        <>
          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedTrips.map((trip: Trip) => (
                <div
                  key={trip.id}
                  className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 p-6 hover:shadow-xl dark:hover:shadow-none transition-all group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-[#345E85] dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <Route size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{trip.tripNumber}</h3>
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Ref: {trip.loadId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-1 shadow-sm",
                        getStatusColor(trip.status),
                        "dark:bg-opacity-10 dark:border dark:border-current"
                      )}>
                        {getStatusIcon(trip.status)}
                        {trip.status.replace('_', ' ')}
                      </span>
                      {trip.pod && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800 flex items-center gap-1 shadow-sm">
                          <CheckCircle size={8} />
                          POD
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                      <div className="relative">
                        <div className="absolute -left-6 top-1 h-3.5 w-3.5 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-full" />
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Origin</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1" title={trip.pickupLocation}>
                          {trip.pickupLocation}
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-6 top-1 h-3.5 w-3.5 bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-full" />
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Destination</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1" title={trip.deliveryLocation}>
                          {trip.deliveryLocation}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                          <Truck size={14} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Vehicle</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{trip.truckPlate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                          <User size={14} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Driver</p>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{trip.driverName}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Calendar size={14} />
                      <span className="text-xs font-medium">{formatDate(trip.plannedStartTime)}</span>
                    </div>
                    <div className="text-sm font-black text-[#345E85] dark:text-blue-400">
                      {formatCurrency(trip.agreedPrice)}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTrip(trip)}
                    className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                    aria-label="View Details"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Trip ID</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Route</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Vehicle & Driver</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Schedule</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
                    {sortedTrips.map((trip: Trip) => (
                      <tr key={trip.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-[#345E85] dark:text-blue-400">
                              <Route size={14} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{trip.tripNumber}</div>
                              <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Ref: {trip.loadId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border border-transparent shadow-sm",
                              getStatusColor(trip.status),
                              "dark:bg-opacity-10 dark:border-current"
                            )}>
                              {getStatusIcon(trip.status)}
                              {trip.status.replace('_', ' ')}
                            </span>
                            {trip.pod && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800 flex items-center justify-center w-fit shadow-sm">
                                <CheckCircle size={8} className="mr-1" />
                                POD Ready
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 min-w-[180px]">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[150px]" title={trip.pickupLocation}>
                                {trip.pickupLocation}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[150px]" title={trip.deliveryLocation}>
                                {trip.deliveryLocation}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                              <Truck size={12} className="text-slate-400 dark:text-slate-500" />
                              {trip.truckPlate}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                              <User size={12} className="text-slate-400 dark:text-slate-500" />
                              {trip.driverName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {formatDate(trip.plannedStartTime)}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            to {formatDate(trip.plannedEndTime)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-[#345E85] dark:text-blue-400">{formatCurrency(trip.agreedPrice)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setSelectedTrip(trip)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 hover:text-[#345E85] dark:hover:text-blue-400 transition-colors"
                          >
                            <Eye size={18} />
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



      {/* Trip Details Modal */}
      <Dialog open={!!selectedTrip} onOpenChange={(open) => !open && setSelectedTrip(null)}>
        <DialogContent className="max-w-3xl bg-white dark:bg-slate-900 rounded-[32px] p-0 border-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-slate-50 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-[#345E85] dark:text-blue-400">
                <Route size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Trip Details</h2>
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500">{selectedTrip?.tripNumber}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedTrip && (() => {
            const raw: any = (selectedTrip as any)._raw ?? {};
            const load = raw.load ?? {};
            const truck = raw.truck ?? {};
            const driver = raw.driver ?? {};

            const fmtD = (d: any) => {
              if (!d) return '—';
              const dt = new Date(d);
              return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            };
            const fmtDT = (d: any) => {
              if (!d) return '—';
              const dt = new Date(d);
              return isNaN(dt.getTime()) ? '—' : dt.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            };
            const fmtC = (v: any) => v != null && !isNaN(Number(v)) ? formatCurrency(Number(v)) : '—';

            const pickupLoc = load.locations?.find((l: any) => l.type === 'PICKUP');
            const deliveryLoc = load.locations?.find((l: any) => l.type === 'DELIVERY');
            const pickupAddr = load.origin?.address || pickupLoc?.locationData?.address || selectedTrip.pickupLocation;
            const deliveryAddr = load.destination?.address || deliveryLoc?.locationData?.address || selectedTrip.deliveryLocation;

            return (
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

                {/* Status Banner */}
                <div className={cn(
                  "p-4 rounded-2xl border flex items-center justify-between",
                  selectedTrip.status === 'COMPLETED' ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                  selectedTrip.status === 'IN_PROGRESS' ? "bg-blue-50 border-blue-100 text-blue-700" :
                  "bg-amber-50 border-amber-100 text-amber-700"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white/80 flex items-center justify-center border border-current">
                      {getStatusIcon(selectedTrip.status)}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider opacity-60">Status</p>
                      <p className="text-sm font-black">{selectedTrip.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black opacity-60 uppercase tracking-wider">Trip #</p>
                    <p className="text-xs font-black">{selectedTrip.tripNumber}</p>
                  </div>
                </div>

                {/* ── Route & Schedule ── */}
                <TSection title="Route & Schedule">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                      <div className="relative">
                        <div className="absolute -left-6 top-1 h-3 w-3 bg-white border-2 border-emerald-500 rounded-full" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Pickup</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{pickupAddr}</p>
                        {pickupLoc?.locationData?.name && <p className="text-[10px] text-slate-400">{pickupLoc.locationData.name}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">📅 {fmtD(raw.plannedStartTime || load.pickupDate)}</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-6 top-1 h-3 w-3 bg-white border-2 border-rose-500 rounded-full" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Delivery</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{deliveryAddr}</p>
                        {deliveryLoc?.locationData?.name && <p className="text-[10px] text-slate-400">{deliveryLoc.locationData.name}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">📅 {fmtD(raw.plannedEndTime || load.deliveryDate)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <DR label="Planned Start" value={fmtDT(raw.plannedStartTime)} />
                      <DR label="Planned End" value={fmtDT(raw.plannedEndTime)} />
                      <DR label="Actual Start" value={fmtDT(raw.actualStartTime)} />
                      <DR label="Actual End" value={fmtDT(raw.actualEndTime)} />
                      <DR label="ETA" value={fmtDT(raw.estimatedArrival ?? raw.eta)} />
                      <DR label="Distance" value={raw.totalDistance ? `${raw.totalDistance} km` : raw.distance ? `${raw.distance} km` : '—'} />
                      <DR label="Duration" value={raw.duration ? `${raw.duration} hrs` : '—'} />
                      <DR label="Avg Speed" value={raw.averageSpeed ? `${raw.averageSpeed} km/h` : '—'} />
                    </div>
                  </div>
                </TSection>

                {/* ── Cargo ── */}
                <TSection title="Cargo Information">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <DR label="Title" value={load.title || '—'} />
                    <DR label="Type" value={load.cargoType || '—'} />
                    <DR label="Load Type" value={load.loadType || '—'} />
                    <DR label="Weight" value={load.weight ? `${Number(load.weight).toLocaleString()} kg` : '—'} />
                    <DR label="Volume" value={load.volume ? `${load.volume} m³` : '—'} />
                    <DR label="Urgency" value={load.urgencyLevel || '—'} />
                    <DR label="Packaging" value={load.packagingType || '—'} />
                    <DR label="Pieces" value={load.numberOfPieces ? String(load.numberOfPieces) : '—'} />
                    <DR label="Pallets" value={load.numberOfPallets ? String(load.numberOfPallets) : '—'} />
                    <DR label="Fragile" value={load.isFragile ? '⚠️ Yes' : 'No'} />
                    <DR label="Hazardous" value={load.isHazardous ? '☢️ Yes' : 'No'} />
                    <DR label="Refrigeration" value={load.requiresRefrigeration ? '❄️ Yes' : 'No'} />
                    <DR label="GPS Monitoring" value={load.requiresGpsMonitoring ? '✅ Yes' : 'No'} />
                    <DR label="Cargo Value" value={fmtC(load.loadValue)} />
                    <DR label="Insurance Value" value={fmtC(load.insuranceValue)} />
                  </div>
                  {(load.loadingInstructions || load.unloadingInstructions) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {load.loadingInstructions && <DR label="Loading Instructions" value={load.loadingInstructions} />}
                      {load.unloadingInstructions && <DR label="Unloading Instructions" value={load.unloadingInstructions} />}
                    </div>
                  )}
                </TSection>

                {/* ── Vehicle & Driver ── */}
                <TSection title="Vehicle & Driver">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Truck</p>
                      <div className="grid grid-cols-2 gap-2">
                        <DR label="Plate" value={truck.plateNumber || selectedTrip.truckPlate} />
                        <DR label="Make / Model" value={`${truck.make || ''} ${truck.model || ''}`.trim() || '—'} />
                        <DR label="Year" value={truck.year ? String(truck.year) : '—'} />
                        <DR label="Type" value={truck.truckType || '—'} />
                        <DR label="Fuel" value={truck.fuelType || '—'} />
                        <DR label="Capacity" value={truck.capacityWeight ? `${Number(truck.capacityWeight).toLocaleString()} kg` : '—'} />
                        <DR label="Mileage" value={truck.mileage ? `${truck.mileage.toLocaleString()} km` : '—'} />
                        <DR label="GPS" value={truck.hasGps ? '✅ Yes' : '❌ No'} />
                        <DR label="Tracking" value={truck.hasTracking ? '✅ Yes' : '❌ No'} />
                        <DR label="Insurance Exp." value={fmtD(truck.insuranceExpiry)} />
                        <DR label="Reg. Expiry" value={fmtD(truck.registrationExpiry)} />
                        <DR label="Roadworthy Exp." value={fmtD(truck.roadworthyCertExpiry)} />
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Driver</p>
                      {driver.firstName ? (
                        <div className="grid grid-cols-2 gap-2">
                          <DR label="Name" value={`${driver.firstName} ${driver.lastName}`} />
                          <DR label="Phone" value={driver.phone || '—'} />
                          <DR label="Email" value={driver.email || '—'} />
                          <DR label="License No." value={driver.licenseNumber || '—'} />
                          <DR label="License Exp." value={fmtD(driver.licenseExpiry)} />
                          <DR label="Experience" value={driver.experience ? `${driver.experience} yrs` : '—'} />
                          <DR label="Safety Score" value={driver.safetyScore ? `${driver.safetyScore}/100` : '—'} />
                          <DR label="On-Time Rate" value={driver.onTimeDeliveryRate ? `${Number(driver.onTimeDeliveryRate).toFixed(1)}%` : '—'} />
                          <DR label="Rating" value={driver.rating ? `${Number(driver.rating).toFixed(1)} ⭐` : '—'} />
                          <DR label="Status" value={driver.availabilityStatus || driver.status || '—'} />
                          <DR label="Hours This Week" value={driver.hoursWorkedThisWeek ? `${driver.hoursWorkedThisWeek} h` : '—'} />
                          <DR label="Medical Cert Exp." value={fmtD(driver.medicalCertExpiry)} />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-amber-500">No driver assigned</p>
                          {!showAssignPanel ? (
                            <button onClick={async () => { setShowAssignPanel(true); await loadTruckDrivers(selectedTrip.truckId); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#345E85] hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">
                              <UserPlus size={11} /> Assign Driver
                            </button>
                          ) : (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                              {loadingDrivers ? (
                                <div className="flex items-center gap-2 py-2">
                                  <div className="w-3.5 h-3.5 border-2 border-slate-200 border-t-[#345E85] rounded-full animate-spin" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Loading...</span>
                                </div>
                              ) : truckDrivers.length === 0 ? (
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest py-1">No drivers found</p>
                              ) : (
                                <div className="space-y-2">
                                  {truckDrivers.map((d: any) => (
                                    <label key={d.id} className={cn('flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all', selectedDriverId === d.id ? 'border-[#345E85] bg-[#345E85]/5' : 'border-slate-200 hover:border-slate-300 bg-white')}>
                                      <input type="radio" name="driver" value={d.id} checked={selectedDriverId === d.id} onChange={() => setSelectedDriverId(d.id)} className="accent-[#345E85]" />
                                      <div>
                                        <p className="text-xs font-black text-slate-900">{d.firstName} {d.lastName}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{d.status || 'Available'}</p>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2 pt-1">
                                <button onClick={handleAssignDriver} disabled={!selectedDriverId || assigningDriver}
                                  className="flex-1 py-2 bg-[#345E85] hover:bg-slate-800 disabled:bg-slate-200 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                                  {assigningDriver ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Assigning...</> : <><CheckCircle size={11} /> Confirm</>}
                                </button>
                                <button onClick={() => { setShowAssignPanel(false); setSelectedDriverId(''); setTruckDrivers([]); }}
                                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TSection>

                {/* ── Financials ── */}
                <TSection title="Financials">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <DR label="Agreed Price" value={formatCurrency(selectedTrip.agreedPrice)} highlight />
                    <DR label="Currency" value={raw.currencyCode || 'USD'} />
                    <DR label="Payment Terms" value={load.paymentTerms || '—'} />
                    <DR label="Fuel Cost" value={fmtC(raw.fuelCost)} />
                    <DR label="Tolls Cost" value={fmtC(raw.tollsCost)} />
                    <DR label="Other Expenses" value={fmtC(raw.otherExpenses)} />
                    <DR label="Total Cost" value={fmtC(raw.totalCost)} />
                    <DR label="Profit Margin" value={raw.profitMargin ? `${raw.profitMargin}%` : '—'} />
                    <DR label="Fuel Efficiency" value={raw.fuelEfficiency ? `${raw.fuelEfficiency} L/100km` : '—'} />
                  </div>
                </TSection>

                {/* ── Performance ── */}
                <TSection title="Performance & Feedback">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <DR label="On-Time Performance" value={raw.onTimePerformance ? `${raw.onTimePerformance}%` : '—'} />
                    <DR label="Cargo Owner Rating" value={raw.cargoOwnerRating ? `${raw.cargoOwnerRating} ⭐` : '—'} />
                    <DR label="Driver Rating" value={raw.driverRating ? `${raw.driverRating} ⭐` : '—'} />
                    <DR label="Issues Reported" value={raw.issuesReported?.length ? String(raw.issuesReported.length) : '0'} />
                  </div>
                  {raw.notes && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{raw.notes}</p>
                    </div>
                  )}
                  {raw.cargoOwnerFeedback && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Cargo Owner Feedback</p>
                      <p className="text-xs text-blue-700 leading-relaxed">{raw.cargoOwnerFeedback}</p>
                    </div>
                  )}
                </TSection>

                {/* ── POD ── */}
                {selectedTrip.pod && (
                  <TSection title="Proof of Delivery" badge="VERIFIED">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between mb-3">
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Recipient</p>
                            <p className="text-sm font-bold text-slate-900">{selectedTrip.pod.recipientName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Completed</p>
                            <p className="text-xs font-bold text-slate-600">{new Date(selectedTrip.pod.completedAt).toLocaleString()}</p>
                          </div>
                        </div>
                        {selectedTrip.pod.signatureBase64 && (
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Signature</p>
                            <div className="bg-white p-2 rounded-xl border border-slate-200">
                              <img src={selectedTrip.pod.signatureBase64} alt="Signature" className="max-h-20 mx-auto object-contain" />
                            </div>
                          </div>
                        )}
                      </div>
                      {selectedTrip.pod.photoUrl && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Delivery Photo</p>
                          <div className="bg-white p-1 rounded-xl border border-slate-200 overflow-hidden h-36">
                            <img src={selectedTrip.pod.photoUrl} alt="Delivery Proof" className="w-full h-full object-cover rounded-lg" />
                          </div>
                        </div>
                      )}
                    </div>
                  </TSection>
                )}

                <div className="flex justify-end pt-4 border-t border-slate-50">
                  <button onClick={() => { setSelectedTrip(null); setTruckDrivers([]); setSelectedDriverId(''); setShowAssignPanel(false); }}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors">
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Helper sub-components ─────────────────────────────────────────────────────
const TSection = ({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
      {badge && (
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black border border-emerald-100 flex items-center gap-1">
          <CheckCircle size={10} /> {badge}
        </span>
      )}
    </div>
    <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
      {children}
    </div>
  </div>
);

const DR = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex flex-col gap-0.5 py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
    <span className={`text-[11px] font-bold truncate ${highlight ? 'text-[#345E85]' : 'text-slate-800 dark:text-slate-200'}`}>{value}</span>
  </div>
);

export default TripManagement;
