import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import { tripsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { cn } from '../utils/cn';

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
  const [filter, setFilter] = useState<'all' | 'planned' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
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
          pod: trip.load?.metadata?.pod || undefined
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
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#345E85] mx-auto"></div>
          <p className="mt-4 text-slate-500 font-medium">Loading trips...</p>
        </div>
      </div>
    );
  }

  const CircularStatsCard = ({ title, value, icon: Icon, colorClass, secondaryColor }: any) => {
    return (
      <div className="flex flex-col items-center group">
        <div className="relative w-40 h-40 rounded-full bg-white border-[8px] border-slate-50 flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50">
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
              className={cn("opacity-10 transition-all duration-1000 group-hover:stroke-dashoffset-[200]", secondaryColor)}
            />
          </svg>

          <div className={cn("p-2 rounded-2xl mb-2 bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-inherit transition-all duration-500 shadow-sm", colorClass)}>
            <Icon size={18} />
          </div>

          <div className="flex flex-col items-center px-4 w-full overflow-hidden">
            <span className="text-xl font-black text-[#0f172a] tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
              {value}
            </span>
          </div>

          <div className="absolute inset-4 rounded-full border border-dashed border-slate-100 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
        </div>

        <div className="mt-4 text-center px-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-[#345E85] transition-colors duration-300 line-clamp-1">
            {title}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#345E85] shadow-inner">
            <Route size={20} />
          </div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#345E85]">Logistics</h2>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trip Management</h1>
        <p className="text-slate-500 font-medium mt-1">Monitor active trips, schedule shipments, and track fleet performance.</p>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 place-items-center bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <CircularStatsCard
          title="Total Trips"
          value={trips.length}
          icon={Route}
          colorClass="bg-blue-50 text-[#345E85]"
          secondaryColor="text-[#345E85]"
        />
        <CircularStatsCard
          title="In Progress"
          value={trips.filter((t: Trip) => t.status === 'IN_PROGRESS').length}
          icon={Truck}
          colorClass="bg-info-50 text-blue-500"
          secondaryColor="text-blue-500"
        />
        <CircularStatsCard
          title="Planned"
          value={trips.filter((t: Trip) => t.status === 'PLANNED').length}
          icon={Clock}
          colorClass="bg-amber-50 text-amber-500"
          secondaryColor="text-amber-500"
        />
        <CircularStatsCard
          title="Completed"
          value={trips.filter((t: Trip) => t.status === 'COMPLETED').length}
          icon={CheckCircle}
          colorClass="bg-emerald-50 text-emerald-600"
          secondaryColor="text-emerald-600"
        />
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by ID, driver, truck, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#345E85] outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              {(['all', 'planned', 'in_progress', 'completed'] as const).map((statusOption) => (
                <button
                  key={statusOption}
                  onClick={() => setFilter(statusOption)}
                  className={cn(
                    "px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap",
                    filter === statusOption
                      ? "bg-white text-[#345E85] shadow-sm"
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  )}
                >
                  {statusOption === 'all' ? 'All' : statusOption.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button
                onClick={() => setView('list')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  view === 'list' ? "bg-white text-[#345E85] shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setView('grid')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  view === 'grid' ? "bg-white text-[#345E85] shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortConfig({ ...sortConfig, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
              className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-[#345E85] hover:border-[#345E85] transition-all"
              title={sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}
            >
              <ArrowUpDown size={18} className={sortConfig.direction === 'asc' ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {sortedTrips.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
          <div className="h-20 w-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-slate-300">
            <Route size={40} />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">No trips found</h3>
          <p className="text-slate-500 font-medium max-w-xs mx-auto">
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
                  className="bg-white rounded-[24px] border border-slate-100 p-6 hover:shadow-xl transition-all group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#345E85] group-hover:scale-110 transition-transform">
                        <Route size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">{trip.tripNumber}</h3>
                        <p className="text-xs font-medium text-slate-400">Ref: {trip.loadId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-1",
                        getStatusColor(trip.status)
                      )}>
                        {getStatusIcon(trip.status)}
                        {trip.status.replace('_', ' ')}
                      </span>
                      {trip.pod && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1 shadow-sm">
                          <CheckCircle size={8} />
                          POD
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                      <div className="relative">
                        <div className="absolute -left-6 top-1 h-3.5 w-3.5 bg-white border-2 border-emerald-500 rounded-full" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Origin</p>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1" title={trip.pickupLocation}>
                          {trip.pickupLocation}
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-6 top-1 h-3.5 w-3.5 bg-white border-2 border-rose-500 rounded-full" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Destination</p>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1" title={trip.deliveryLocation}>
                          {trip.deliveryLocation}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <Truck size={14} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Vehicle</p>
                          <p className="text-xs font-bold text-slate-900 truncate">{trip.truckPlate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          <User size={14} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Driver</p>
                          <p className="text-xs font-bold text-slate-900 truncate">{trip.driverName}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar size={14} />
                      <span className="text-xs font-medium">{formatDate(trip.plannedStartTime)}</span>
                    </div>
                    <div className="text-sm font-black text-[#345E85]">
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
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Trip ID</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Route</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Vehicle & Driver</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Schedule</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {sortedTrips.map((trip: Trip) => (
                      <tr key={trip.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-[#345E85]">
                              <Route size={14} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900">{trip.tripNumber}</div>
                              <div className="text-[10px] font-medium text-slate-400">Ref: {trip.loadId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5",
                              getStatusColor(trip.status)
                            )}>
                              {getStatusIcon(trip.status)}
                              {trip.status.replace('_', ' ')}
                            </span>
                            {trip.pod && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100 flex items-center justify-center w-fit shadow-sm">
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
                              <span className="text-xs font-medium text-slate-600 truncate max-w-[150px]" title={trip.pickupLocation}>
                                {trip.pickupLocation}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span className="text-xs font-medium text-slate-600 truncate max-w-[150px]" title={trip.deliveryLocation}>
                                {trip.deliveryLocation}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                              <Truck size={12} className="text-slate-400" />
                              {trip.truckPlate}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                              <User size={12} className="text-slate-400" />
                              {trip.driverName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-medium text-slate-600">
                            {formatDate(trip.plannedStartTime)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            to {formatDate(trip.plannedEndTime)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-[#345E85]">{formatCurrency(trip.agreedPrice)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setSelectedTrip(trip)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#345E85] transition-colors"
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

      {/* Trip Details Modal - Restyled */}
      <Dialog open={!!selectedTrip} onOpenChange={(open) => !open && setSelectedTrip(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-[32px] p-0 border-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 pb-4 border-b border-slate-50">
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#345E85]">
                <Route size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Trip Details</h2>
                <p className="text-sm font-medium text-slate-400">{selectedTrip?.tripNumber}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedTrip && (
            <div className="p-8 space-y-8">
              {/* Status Banner */}
              <div className={cn(
                "p-4 rounded-2xl flex items-center justify-between",
                getStatusColor(selectedTrip.status).replace('text-', 'bg-').replace('100', '50/50')
              )}>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center bg-white shadow-sm",
                    getStatusColor(selectedTrip.status).split(' ')[1] // Extract text color class for icon
                  )}>
                    {getStatusIcon(selectedTrip.status)}
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p>
                    <p className="font-bold text-sm tracking-tight">{selectedTrip.status.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Load Ref</p>
                  <p className="font-bold text-sm tracking-tight">{selectedTrip.loadId}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Route Info */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 pb-2">Route Information</h4>
                  <div className="space-y-6 relative pl-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    <div className="relative">
                      <div className="absolute -left-4 top-1 h-3.5 w-3.5 bg-white border-2 border-emerald-500 rounded-full" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70 mb-1">From</p>
                      <p className="text-sm font-bold text-slate-900">{selectedTrip.pickupLocation}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{formatDate(selectedTrip.plannedStartTime)}</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-4 top-1 h-3.5 w-3.5 bg-white border-2 border-rose-500 rounded-full" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70 mb-1">To</p>
                      <p className="text-sm font-bold text-slate-900">{selectedTrip.deliveryLocation}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{formatDate(selectedTrip.plannedEndTime)}</p>
                    </div>
                  </div>
                </div>

                {/* Assignment Info */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 pb-2">Assignment & Financials</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                        <Truck size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vehicle</p>
                        <p className="text-sm font-bold text-slate-900">{selectedTrip.truckPlate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Driver</p>
                        <p className="text-sm font-bold text-slate-900">{selectedTrip.driverName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-emerald-500 shadow-sm">
                        <DollarSign size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Agreed Price</p>
                        <p className="text-lg font-black text-emerald-700">{formatCurrency(selectedTrip.agreedPrice)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Proof of Delivery Section */}
              {selectedTrip.pod && (
                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <h4 className="text-[11px] font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                    <CheckCircle size={12} className="text-[#345E85]" />
                    Proof of Delivery (POD)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recipient</p>
                          <p className="text-sm font-bold text-slate-900">{selectedTrip.pod.recipientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completed At</p>
                          <p className="text-xs font-medium text-slate-500">
                            {new Date(selectedTrip.pod.completedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {selectedTrip.pod.signatureBase64 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Signature</p>
                          <div className="bg-white p-2 rounded-xl border border-slate-200">
                            <img 
                              src={selectedTrip.pod.signatureBase64} 
                              alt="Recipient Signature" 
                              className="max-h-24 mx-auto object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedTrip.pod.photoUrl && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Photo</p>
                        <div className="bg-white p-1 rounded-xl border border-slate-200 overflow-hidden h-40">
                          <img 
                            src={selectedTrip.pod.photoUrl} 
                            alt="Delivery Proof" 
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end pt-6 border-t border-slate-50">
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                >
                  Close Details
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripManagement;
