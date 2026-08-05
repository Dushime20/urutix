import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllTrips, fetchTenants, cancelTrip } from '../services/adminApi';
import toast from 'react-hot-toast';
import ModernLoader from '../components/common/ModernLoader';
import {
  FaTruck,
  FaEdit,
  FaDownload,
  FaEye,
  FaCheck,
  FaTimes,
  FaMapMarkerAlt,
  FaShippingFast,
  FaExclamationTriangle,
  FaUser,
  FaDollarSign,
  FaWeightHanging,
  FaBarcode
} from 'react-icons/fa';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { TranslatedText } from '../components/translated-text';
import { cn } from '../utils/cn';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../components/EnliteUI/Tables';

interface Trip {
  id: string;
  reference: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  tenantId: string;
  tenantName: string;
  driverName: string;
  truckNumber: string;
  routeName: string;
  origin: string;
  destination: string;
  cargoType: string;
  cargoWeight: number;
  cargoVolume?: number;
  cargoTitle?: string;
  cargoDescription?: string;
  loadValue?: number;
  isFragile?: boolean;
  isHazardous?: boolean;
  requiresRefrigeration?: boolean;
  numberOfPieces?: number;
  numberOfPallets?: number;
  packagingType?: string;
  distance: number;
  estimatedDuration: number;
  actualDuration?: number;
  startTime: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
  priority: 'high' | 'medium' | 'low';
  revenue: number;
  fuelCost: number;
  tollCost: number;
  progress: number;
  currentLocation?: string;
  delay?: number;
  notes?: string;
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
}

const AdminTrips: React.FC = () => {
  const { format: formatCurrency } = useCurrencyFormat();
  
  // Fetch data
  const { data: trips, isLoading, error } = useQuery({
    queryKey: ['admin-all-trips'],
    queryFn: () => fetchAllTrips()
  });
  const { data: tenantsData } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: fetchTenants
  });

  const qc = useQueryClient();

  // Cancel trip mutation
  const cancelTripMutation = useMutation({
    mutationFn: (data: { tripId: string; reason: string }) => cancelTrip(data.tripId, data.reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-all-trips'] });
      toast.success('Trip cancelled successfully');
      setShowCancelModal(false);
      setTripToCancel(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel trip');
    }
  });

  // UI state
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [tripToCancel, setTripToCancel] = useState<Trip | null>(null);

  // Use API data or fallback to mock data for demonstration
  const mockTrips: Trip[] = [];

  // Transform backend trip data to frontend format
  const transformTrip = (backendTrip: any): Trip => {
    const status = backendTrip.status?.toLowerCase().replace('_', '_') || 'scheduled';
    const plannedStart = new Date(backendTrip.plannedStartTime || backendTrip.createdAt);
    const plannedEnd = new Date(backendTrip.plannedEndTime || backendTrip.estimatedEndTime || Date.now());
    const actualStart = backendTrip.actualStartTime ? new Date(backendTrip.actualStartTime) : null;
    const actualEnd = backendTrip.actualEndTime ? new Date(backendTrip.actualEndTime) : null;

    // ── Resolve origin / destination ──────────────────────────────────────────
    // Priority 1: load.origin / load.destination (direct jsonb columns)
    // Priority 2: load.locations array (PICKUP / DELIVERY entries)
    // Priority 3: fallback 'N/A'

    const loadOrigin = backendTrip.load?.origin;       // { city, address, lat, lng, ... }
    const loadDest   = backendTrip.load?.destination;  // { city, address, lat, lng, ... }

    const pickupFromLocations  = backendTrip.load?.locations?.find((l: any) => l.type === 'PICKUP');
    const deliveryFromLocations = backendTrip.load?.locations?.find((l: any) => l.type === 'DELIVERY');

    const resolveLabel = (direct: any, fromArr: any): string => {
      if (direct?.city)    return direct.city;
      if (direct?.address) return direct.address;
      if (fromArr?.locationData?.city)    return fromArr.locationData.city;
      if (fromArr?.locationData?.address) return fromArr.locationData.address;
      return 'N/A';
    };

    const originLabel      = resolveLabel(loadOrigin, pickupFromLocations);
    const destinationLabel = resolveLabel(loadDest,   deliveryFromLocations);

    // ── Calculate distance from coordinates ───────────────────────────────────
    const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    let calculatedDistance = Number(backendTrip.totalDistance) || Number(backendTrip.distance) || 0;

    if (!calculatedDistance) {
      const oLat = loadOrigin?.lat ?? pickupFromLocations?.locationData?.lat;
      const oLng = loadOrigin?.lng ?? pickupFromLocations?.locationData?.lng;
      const dLat = loadDest?.lat   ?? deliveryFromLocations?.locationData?.lat;
      const dLng = loadDest?.lng   ?? deliveryFromLocations?.locationData?.lng;

      if (oLat && oLng && dLat && dLng) {
        calculatedDistance = Math.round(haversineKm(oLat, oLng, dLat, dLng));
      }
    }

    // ── Calculate progress ────────────────────────────────────────────────────
    let progress = 0;
    if (status === 'completed') {
      progress = 100;
    } else if (status === 'in_progress' && actualStart) {
      const now = Date.now();
      const totalDuration = plannedEnd.getTime() - plannedStart.getTime();
      const elapsed = now - actualStart.getTime();
      progress = Math.min(95, Math.max(5, Math.round((elapsed / totalDuration) * 100)));
    }

    return {
      id: backendTrip.id,
      reference: backendTrip.tripNumber || `TRP-${backendTrip.id.slice(0, 8)}`,
      status: status as any,
      tenantId: backendTrip.tenantId,
      tenantName: backendTrip.tenant?.name || 'N/A',
      driverName: backendTrip.driver
        ? `${backendTrip.driver.firstName || ''} ${backendTrip.driver.lastName || ''}`.trim() || 'Unassigned'
        : 'Unassigned',
      truckNumber: backendTrip.truck?.licensePlate || backendTrip.truck?.truckNumber || 'N/A',
      routeName: backendTrip.load?.routeName || `${originLabel} → ${destinationLabel}`,
      origin: originLabel,
      destination: destinationLabel,
      cargoType: backendTrip.load?.cargoType || 'General Cargo',
      cargoWeight: backendTrip.load?.weight || 0,
      cargoVolume: backendTrip.load?.volume,
      cargoTitle: backendTrip.load?.title || backendTrip.load?.cargoType,
      cargoDescription: backendTrip.load?.description,
      loadValue: backendTrip.load?.value,
      isFragile: backendTrip.load?.isFragile,
      isHazardous: backendTrip.load?.isHazardous,
      requiresRefrigeration: backendTrip.load?.requiresRefrigeration,
      numberOfPieces: backendTrip.load?.numberOfPieces,
      numberOfPallets: backendTrip.load?.numberOfPallets,
      packagingType: backendTrip.load?.packagingType,
      distance: calculatedDistance,
      estimatedDuration: (plannedEnd.getTime() - plannedStart.getTime()) / (1000 * 60 * 60),
      actualDuration: actualStart && actualEnd
        ? (actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60)
        : undefined,
      startTime: backendTrip.actualStartTime || backendTrip.plannedStartTime,
      endTime: backendTrip.actualEndTime,
      createdAt: backendTrip.createdAt,
      updatedAt: backendTrip.updatedAt,
      priority: backendTrip.load?.priority || 'medium',
      revenue: Number(backendTrip.agreedPrice) || 0,
      fuelCost: Number(backendTrip.fuelCost) || 0,
      tollCost: Number(backendTrip.tollsCost) || 0,
      progress,
      currentLocation: backendTrip.currentLocation ||
        (status === 'completed' ? destinationLabel : originLabel),
      delay: 0,
      notes: backendTrip.notes,
    };
  };

  const allTrips = Array.isArray(trips) && trips.length > 0 
    ? trips.map(transformTrip)
    : mockTrips;

  // Get tenants for dropdown
  const tenants: Tenant[] = tenantsData?.tenants || [];
  const tenantMap = useMemo(() => {
    const map = new Map<string, string>();
    tenants.forEach((tenant) => {
      map.set(tenant.id, tenant.name);
    });
    return map;
  }, [tenants]);

  // Map trips with tenant names
  const mappedTrips: Trip[] = useMemo(() => {
    return allTrips.map((trip: any) => ({
      ...trip,
      tenantName: trip.tenantId ? (tenantMap.get(trip.tenantId) || trip.tenantName || 'N/A') : trip.tenantName || 'N/A'
    }));
  }, [allTrips, tenantMap]);

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'completed') return 'bg-emerald-500';
    if (status === 'cancelled') return 'bg-rose-500';
    if (status === 'delayed') return 'bg-amber-500';
    if (progress >= 80) return 'bg-blue-600';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-blue-400';
  };

  const formatWeight = (kg: number) => `${((kg || 0) / 1000).toFixed(1)} t`;

  const calculateProfit = (revenue: number, fuelCost: number, tollCost: number) => {
    return (revenue ?? 0) - (fuelCost ?? 0) - (tollCost ?? 0);
  };

  const locLabel = (v: string | { city?: string; address?: string }) => {
    if (typeof v === 'object' && v) return (v.city || v.address || 'N/A').split(',')[0];
    return (v || 'N/A').split(',')[0];
  };

  const tripColumns = useMemo<Column<Trip>[]>(() => [
    {
      key: 'reference',
      label: 'Trip Reference',
      sortable: true,
      render: (_value, trip) => (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-900 dark:bg-slate-950 rounded-2xl flex items-center justify-center border border-transparent dark:border-slate-800">
            <FaBarcode className="text-white dark:text-blue-400 text-lg" />
          </div>
          <div>
            <div className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{trip.reference}</div>
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{trip.tenantName}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'routeName',
      label: 'Route & Progress',
      sortable: false,
      render: (_value, trip) => (
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-black text-gray-900 dark:text-slate-200 tracking-tight">
              <FaMapMarkerAlt className="text-emerald-500 w-3 h-3" /> {locLabel(trip.origin)}
            </div>
            <div className="flex items-center gap-2 text-xs font-black text-gray-900 dark:text-slate-200 tracking-tight">
              <FaMapMarkerAlt className="text-rose-500 w-3 h-3" /> {locLabel(trip.destination)}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-end">
              <StatusBadge
                label={(trip.status || 'scheduled').replace('_', ' ')}
                status={trip.status}
              />
              <span className="text-[10px] font-black text-gray-900 dark:text-slate-300">{trip.progress ?? 0}%</span>
            </div>
            <div className="w-32 bg-gray-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  getProgressColor(trip.progress, trip.status)
                )}
                style={{ width: `${trip.progress}%` }}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'driverName',
      label: 'Driver & Assets',
      sortable: true,
      render: (_value, trip) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FaUser className="text-slate-400 dark:text-slate-500 w-3 h-3" />
            <span className="text-xs font-black text-gray-900 dark:text-slate-200 tracking-tight">{trip.driverName}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaTruck className="text-slate-400 dark:text-slate-500 w-3 h-3" />
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{trip.truckNumber}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'cargoType',
      label: 'Cargo Detail',
      sortable: true,
      render: (_value, trip) => (
        <div className="space-y-2">
          <div className="text-xs font-black text-gray-900 dark:text-slate-200 tracking-tight">{trip.cargoType}</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <FaWeightHanging className="text-slate-400 dark:text-slate-500 w-3 h-3" />
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{formatWeight(trip.cargoWeight)}</span>
            </div>
            {trip.isFragile && (
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 px-1.5 py-0.5 rounded border dark:border-rose-800/30">
                <TranslatedText text="Fragile" />
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'revenue',
      label: 'Financials',
      sortable: true,
      render: (_value, trip) => (
        <div className="space-y-1">
          <div className="text-sm font-black text-gray-900 dark:text-slate-100 tracking-tight">{formatCurrency(trip.revenue)}</div>
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <TranslatedText text="Net Profit" />:{' '}
            <span className="text-blue-600 dark:text-blue-400">
              {formatCurrency(calculateProfit(trip.revenue, trip.fuelCost, trip.tollCost))}
            </span>
          </div>
        </div>
      ),
    },
  ], [formatCurrency, formatWeight, calculateProfit, getProgressColor]);

  const tripRowActions = useMemo<TableAction<Trip>[]>(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: <FaEye size={14} />,
      onClick: (trip) => {
        setSelectedTrip(trip);
        setShowDetailsModal(true);
      },
    },
    {
      key: 'cancel',
      label: 'Cancel Trip',
      icon: <FaTimes size={14} />,
      variant: 'danger',
      hidden: (trip) => trip.status === 'completed' || trip.status === 'cancelled',
      onClick: (trip) => {
        setTripToCancel(trip);
        setShowCancelModal(true);
      },
    },
  ], []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/30';
      case 'in_progress': return 'bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-blue-400 border-indigo-100 dark:border-blue-800/30';
      case 'completed': return 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/30';
      case 'cancelled': return 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800/30';
      case 'delayed': return 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/30';
      default: return 'bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400 border-gray-100 dark:border-slate-700/30';
    }
  };

  const formatDistance = (km: number) => `${(km || 0).toLocaleString()} km`;
  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleString();
  };

  const stats = [
    {
      label: <TranslatedText text="Total Trips" />,
      value: mappedTrips.length,
      icon: FaTruck,
      description: <TranslatedText text="All registered trips" />
    },
    {
      label: <TranslatedText text="Active Trips" />,
      value: mappedTrips.filter((t: Trip) => ['in_progress', 'scheduled'].includes(t.status)).length,
      icon: FaShippingFast,
      description: <TranslatedText text="Currently active" />
    },
    {
      label: <TranslatedText text="Total Revenue" />,
      value: formatCurrency(mappedTrips.reduce((sum: number, t: Trip) => sum + (t.revenue ?? 0), 0)),
      icon: FaDollarSign,
      description: <TranslatedText text="Combined trip revenue" />
    },
    {
      label: <TranslatedText text="Completed Today" />,
      value: mappedTrips.filter((t: Trip) => t.status === 'completed' &&
        new Date(t.endTime || '').toDateString() === new Date().toDateString()).length,
      icon: FaCheck,
      description: <TranslatedText text="Trips completed today" />
    },
  ];

  return (
    <AdminPageLayout
      title={<TranslatedText text="Trip Management" />}
      description={<TranslatedText text="Monitor and manage all logistics trips across tenants" />}
      actions={
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-400 mr-2">
            <span className="font-bold text-slate-100">{mappedTrips.filter(t => t.status === 'in_progress').length}</span> <TranslatedText text="active trips" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold transition-all text-xs">
            <FaDownload size={14} /> <TranslatedText text="Export Report" />
          </button>
        </div>
      }
    >
      {/* Loading and Error States */}
      {isLoading && (
        <ModernLoader isLoading={true} type="page" showStats={true} />
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="text-rose-500" />
            <div>
              <h3 className="text-sm font-semibold text-rose-200"><TranslatedText text="Error Loading Trips" /></h3>
              <p className="text-xs text-rose-300 mt-0.5"><TranslatedText text="Failed to load trip data. Please try again." /></p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-6">
          <StandardDataTable<Trip>
            embedded
            className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-transparent dark:border-slate-800"
            columns={tripColumns}
            data={mappedTrips}
            getRowId={(row) => row.id}
            searchPlaceholder="Search trips…"
            searchKeys={['reference', 'driverName', 'origin', 'destination', 'cargoType', 'tenantName']}
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                  { value: 'delayed', label: 'Delayed' },
                ],
              },
              {
                key: 'tenantId',
                label: 'Tenant',
                options: tenants.map((t) => ({ value: t.id, label: t.name })),
              },
              {
                key: 'priority',
                label: 'Priority',
                options: [
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ],
              },
            ]}
            defaultSortKey="createdAt"
            defaultSortDirection="desc"
            rowActions={tripRowActions}
            emptyMessage="No trips identified."
            stickyHeader
            columnVisibility
            pagination
            ariaLabel="Trip management"
          />
        </div>
      )}

      {/* Modern Perspective Modal */}
      {showDetailsModal && selectedTrip && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
            <div className="p-10 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between bg-[#fafafa]/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gray-900 dark:bg-slate-950 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-gray-900/20 dark:shadow-none border border-transparent dark:border-slate-800">
                  <FaBarcode className="text-white dark:text-blue-400 text-2xl" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">{selectedTrip!.reference}</h2>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      getStatusColor(selectedTrip!.status),
                      "dark:bg-opacity-10 dark:border dark:border-current"
                    )}>
                      {(selectedTrip!.status || 'scheduled').replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <TranslatedText text="Tenant" />: <span className="text-gray-900 dark:text-slate-200">{selectedTrip!.tenantName}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-12 h-12 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-[1rem] transition-all"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-10 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-[#fafafa] dark:bg-slate-950 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 group hover:border-blue-100 dark:hover:border-blue-900 transition-all">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4"><TranslatedText text="Route Distance" /></p>
                  <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{formatDistance(selectedTrip!.distance)}</h4>
                </div>
                <div className="bg-[#fafafa] dark:bg-slate-950 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 group hover:border-blue-100 dark:hover:border-blue-900 transition-all">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4"><TranslatedText text="Progress" /></p>
                  <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{selectedTrip!.progress}%</h4>
                </div>
                <div className="bg-[#fafafa] dark:bg-slate-950 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 group hover:border-blue-100 dark:hover:border-blue-900 transition-all">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4"><TranslatedText text="Cargo Weight" /></p>
                  <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{formatWeight(selectedTrip!.cargoWeight)}</h4>
                </div>
                <div className="bg-[#fafafa] dark:bg-slate-950 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 group hover:border-blue-100 dark:hover:border-blue-900 transition-all">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4"><TranslatedText text="Gross Revenue" /></p>
                  <h4 className="text-3xl font-black text-indigo-600 dark:text-blue-400 tracking-tight">{formatCurrency(selectedTrip!.revenue)}</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  <section>
                    <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                      <span className="w-8 h-px bg-slate-900 dark:bg-blue-500/50"></span>
                      <TranslatedText text="Journey Route Overview" />
                    </h3>
                    <div className="bg-[#fafafa] dark:bg-slate-950 rounded-[2.5rem] p-8 border border-gray-100 dark:border-slate-800 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                      <div className="relative flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 text-center md:text-left">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1"><TranslatedText text="Origin" /></p>
                          <h5 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{selectedTrip!.origin}</h5>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2">{formatDateTime(selectedTrip!.startTime)}</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="px-4 py-1.5 bg-white dark:bg-slate-900 rounded-full border border-gray-100 dark:border-slate-800 text-[10px] font-black text-gray-900 dark:text-blue-400 shadow-sm z-10">
                            {formatDistance(selectedTrip!.distance)}
                          </div>
                          <div className="w-32 h-px border-t-2 border-dashed border-gray-200 dark:border-slate-800"></div>
                          <FaShippingFast className="text-indigo-600 dark:text-blue-500 my-2" size={24} />
                        </div>
                        <div className="flex-1 text-center md:text-right">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1"><TranslatedText text="Destination" /></p>
                          <h5 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{selectedTrip!.destination}</h5>
                          <p className="text-xs font-bold text-emerald-500 dark:text-emerald-400 mt-2">
                            {selectedTrip!.endTime ? formatDateTime(selectedTrip!.endTime) : <TranslatedText text="In Transit" />}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                      <span className="w-8 h-px bg-slate-900 dark:bg-blue-500/50"></span>
                      <TranslatedText text="Cargo & Logistics Data" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 bg-gray-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-gray-400 dark:text-slate-500">
                            <FaTruck size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Vehicle" /></p>
                            <p className="text-sm font-black text-gray-900 dark:text-white">{selectedTrip!.truckNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-gray-400 dark:text-slate-500">
                            <FaUser size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Driver" /></p>
                            <p className="text-sm font-black text-gray-900 dark:text-white">{selectedTrip!.driverName}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 bg-gray-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-gray-400 dark:text-slate-500">
                            <FaWeightHanging size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Type" /></p>
                            <p className="text-sm font-black text-gray-900 dark:text-white">{selectedTrip!.cargoType}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={cn(
                            "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest",
                            selectedTrip!.priority === 'high' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30' : 'bg-gray-50 dark:bg-slate-900 text-gray-600 dark:text-slate-400 border border-gray-100 dark:border-slate-800'
                          )}>
                            {selectedTrip!.priority} <TranslatedText text="Priority" />
                          </span>
                          {selectedTrip!.isFragile && (
                            <span className="px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30">
                              <TranslatedText text="Fragile" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section>
                    <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                      <span className="w-8 h-px bg-slate-900 dark:bg-blue-500/50"></span>
                      <TranslatedText text="Fleet Analytics" />
                    </h3>
                    <div className="bg-gray-900 dark:bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden group border border-transparent dark:border-slate-800">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="space-y-6 relative">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1"><TranslatedText text="Revenue" /></p>
                          <h4 className="text-3xl font-black tracking-tight">{formatCurrency(selectedTrip!.revenue)}</h4>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-white/10">
                          <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                            <span><TranslatedText text="Fuel" /></span>
                            <span className="text-gray-200">{formatCurrency(selectedTrip!.fuelCost)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                            <span><TranslatedText text="Tolls" /></span>
                            <span className="text-gray-200">{formatCurrency(selectedTrip!.tollCost)}</span>
                          </div>
                          <div className="pt-3 flex justify-between items-center border-t border-white/5">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest"><TranslatedText text="Profit" /></span>
                            <span className="text-xl font-black text-blue-400">{formatCurrency(calculateProfit(selectedTrip!.revenue, selectedTrip!.fuelCost, selectedTrip!.tollCost))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  
                  <div className="bg-[#fafafa] dark:bg-slate-950 rounded-3xl p-6 border border-gray-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3"><TranslatedText text="Dispatcher Notes" /></p>
                    <p className="text-xs font-bold text-gray-600 dark:text-slate-400 leading-relaxed italic">
                      "{selectedTrip!.notes || <TranslatedText text="No additional notes for this trip profile." />}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-gray-50 dark:border-slate-800 bg-[#fafafa]/50 dark:bg-slate-800/30 flex justify-between gap-4">
              <div className="flex gap-2">
                <button className="px-6 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
                  <FaEdit size={12} /> <TranslatedText text="Modify" />
                </button>
                <button className="px-6 py-3 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2">
                  <FaDownload size={12} /> <TranslatedText text="Report" />
                </button>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-10 py-3 bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-gray-900/20 dark:shadow-blue-600/20 transition-all hover:-translate-y-0.5"
              >
                <TranslatedText text="Dismiss Panel" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Trip Modal */}
      {showCancelModal && tripToCancel && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md border border-white/20 dark:border-slate-800">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-100 dark:border-rose-800/30">
                <FaExclamationTriangle className="text-rose-600 dark:text-rose-400" size={40} />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase mb-2">Cancel Trip</h2>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed px-4">
                Are you sure you want to cancel trip <span className="text-gray-900 dark:text-white">{tripToCancel.reference}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="p-8 bg-gray-50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-800 flex gap-4">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setTripToCancel(null);
                }}
                className="flex-1 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border border-gray-200 dark:border-slate-800 rounded-2xl hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-800 transition-all"
              >
                Keep Trip
              </button>
              <button
                onClick={() => {
                  if (tripToCancel) {
                    cancelTripMutation.mutate({
                      tripId: tripToCancel.id,
                      reason: 'Cancelled by admin'
                    });
                  }
                }}
                disabled={cancelTripMutation.isPending}
                className="flex-1 py-4 text-[10px] font-black bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all uppercase tracking-widest shadow-lg shadow-rose-200 dark:shadow-rose-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {cancelTripMutation.isPending ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FaTimes size={14} />
                )}
                {cancelTripMutation.isPending ? 'Cancelling...' : 'Cancel Trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AdminTrips;
