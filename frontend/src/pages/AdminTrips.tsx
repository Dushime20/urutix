import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllTrips, fetchTenants } from '../services/adminApi';
import {
  FaTruck, FaEdit, FaSearch, FaDownload,
  FaEye, FaCheck, FaTimes, FaMapMarkerAlt,
  FaSort, FaShippingFast,
  FaExclamationTriangle,
  FaUser, FaDollarSign, FaWeightHanging, FaBarcode
} from 'react-icons/fa';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { TranslatedText } from '../components/translated-text';
import { cn } from '../utils/cn';

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
  // Fetch data
  const { data: trips, isLoading, error } = useQuery({
    queryKey: ['admin-all-trips'],
    queryFn: () => fetchAllTrips()
  });
  const { data: tenantsData } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: fetchTenants
  });

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Use API data or fallback to mock data for demonstration
  const mockTrips: Trip[] = [
    {
      id: '1',
      reference: 'TRP-2024-001',
      status: 'in_progress',
      tenantId: '1',
      tenantName: 'TransCorp Rwanda',
      driverName: 'Jean Baptiste Uwimana',
      truckNumber: 'RWD-123-ABC',
      routeName: 'Kigali-Dar es Salaam Express',
      origin: 'Kigali, Rwanda',
      destination: 'Dar es Salaam, Tanzania',
      cargoType: 'Electronics',
      cargoWeight: 15.5,
      cargoVolume: 25.3,
      cargoTitle: 'Electronics Shipment',
      isFragile: true,
      loadValue: 2500000,
      numberOfPieces: 120,
      numberOfPallets: 8,
      packagingType: 'Palletized',
      distance: 1456,
      estimatedDuration: 18,
      startTime: '2024-08-09T06:00:00Z',
      priority: 'high',
      revenue: 2500000,
      fuelCost: 250000,
      tollCost: 45000,
      progress: 65,
      currentLocation: 'Mwanza, Tanzania',
      delay: 0,
      notes: 'High priority electronics shipment - fragile items',
      createdAt: '2024-08-08T14:30:00Z',
      updatedAt: '2024-08-09T10:15:00Z'
    },
    {
      id: '2',
      reference: 'TRP-2024-002',
      status: 'completed',
      tenantId: '2',
      tenantName: 'Logistics Pro',
      driverName: 'Mary Johnson Mukamana',
      truckNumber: 'KEN-456-DEF',
      routeName: 'Nairobi-Mombasa Corridor',
      origin: 'Nairobi, Kenya',
      destination: 'Mombasa, Kenya',
      cargoType: 'Consumer Goods',
      cargoWeight: 22.3,
      cargoVolume: 45.2,
      cargoTitle: 'Consumer Products',
      numberOfPallets: 15,
      packagingType: 'Palletized',
      distance: 485,
      estimatedDuration: 6,
      actualDuration: 6.5,
      startTime: '2024-08-08T08:00:00Z',
      endTime: '2024-08-08T14:30:00Z',
      priority: 'medium',
      revenue: 850000,
      fuelCost: 85000,
      tollCost: 15000,
      progress: 100,
      currentLocation: 'Mombasa, Kenya',
      delay: 0.5,
      notes: 'Delivered successfully with minor delay due to traffic',
      createdAt: '2024-08-07T16:45:00Z',
      updatedAt: '2024-08-08T14:30:00Z'
    },
    {
      id: '3',
      reference: 'TRP-2024-003',
      status: 'scheduled',
      tenantId: '3',
      tenantName: 'Enterprise Freight',
      driverName: 'David Wilson Ndahiro',
      truckNumber: 'NGR-789-GHI',
      routeName: 'Lagos-Abuja Highway',
      origin: 'Lagos, Nigeria',
      destination: 'Abuja, Nigeria',
      cargoType: 'Food Products',
      cargoWeight: 18.7,
      cargoVolume: 38.5,
      cargoTitle: 'Perishable Food Items',
      requiresRefrigeration: true,
      numberOfPallets: 12,
      packagingType: 'Refrigerated',
      distance: 760,
      estimatedDuration: 8,
      startTime: '2024-08-10T05:00:00Z',
      priority: 'low',
      revenue: 1200000,
      fuelCost: 120000,
      tollCost: 25000,
      progress: 0,
      currentLocation: 'Lagos, Nigeria',
      delay: 0,
      notes: 'Scheduled for early morning departure - perishable goods',
      createdAt: '2024-08-09T11:20:00Z',
      updatedAt: '2024-08-09T11:20:00Z'
    },
    {
      id: '4',
      reference: 'TRP-2024-004',
      status: 'delayed',
      tenantId: '1',
      tenantName: 'TransCorp Rwanda',
      driverName: 'Alice Mutoni Gasana',
      truckNumber: 'RWD-321-XYZ',
      routeName: 'Kampala City Distribution',
      origin: 'Kampala Central, Uganda',
      destination: 'Kampala Suburbs, Uganda',
      cargoType: 'Medical Supplies',
      cargoWeight: 5.2,
      cargoVolume: 8.1,
      cargoTitle: 'Urgent Medical Supplies',
      isFragile: true,
      isHazardous: true,
      loadValue: 1800000,
      numberOfPieces: 45,
      packagingType: 'Crate',
      distance: 45,
      estimatedDuration: 2,
      startTime: '2024-08-09T14:00:00Z',
      priority: 'high',
      revenue: 180000,
      fuelCost: 15000,
      tollCost: 0,
      progress: 25,
      currentLocation: 'Kampala Traffic Jam',
      delay: 1.5,
      notes: 'Delayed due to heavy traffic in city center - urgent medical supplies',
      createdAt: '2024-08-09T12:30:00Z',
      updatedAt: '2024-08-09T15:45:00Z'
    },
    {
      id: '5',
      reference: 'TRP-2024-005',
      status: 'in_progress',
      tenantId: '2',
      tenantName: 'Logistics Pro',
      driverName: 'Peter Hakizimana',
      truckNumber: 'TZA-567-JKL',
      routeName: 'Dodoma-Mwanza Industrial Route',
      origin: 'Dodoma, Tanzania',
      destination: 'Mwanza, Tanzania',
      cargoType: 'Construction Materials',
      cargoWeight: 35.8,
      distance: 425,
      estimatedDuration: 5,
      startTime: '2024-08-09T11:00:00Z',
      priority: 'medium',
      revenue: 750000,
      fuelCost: 95000,
      tollCost: 18000,
      progress: 45,
      currentLocation: 'Singida, Tanzania',
      delay: 0,
      notes: 'Heavy construction materials - driving carefully',
      createdAt: '2024-08-09T09:00:00Z',
      updatedAt: '2024-08-09T14:00:00Z'
    },
    {
      id: '6',
      reference: 'TRP-2024-006',
      status: 'scheduled',
      tenantId: '1',
      tenantName: 'TransCorp Rwanda',
      driverName: 'Sarah Nyirahabimana',
      truckNumber: 'RWD-890-MNO',
      routeName: 'Butare-Gitarama Academic Route',
      origin: 'Butare (Huye), Rwanda',
      destination: 'Gitarama (Muhanga), Rwanda',
      cargoType: 'Educational Materials',
      cargoWeight: 8.4,
      distance: 75,
      estimatedDuration: 1.5,
      startTime: '2024-08-10T09:00:00Z',
      priority: 'medium',
      revenue: 120000,
      fuelCost: 18000,
      tollCost: 5000,
      progress: 0,
      currentLocation: 'Butare, Rwanda',
      delay: 0,
      notes: 'University books and supplies delivery',
      createdAt: '2024-08-09T17:00:00Z',
      updatedAt: '2024-08-09T17:00:00Z'
    },
    {
      id: '7',
      reference: 'TRP-2024-007',
      status: 'completed',
      tenantId: '3',
      tenantName: 'Enterprise Freight',
      driverName: 'Emmanuel Nshimiyimana',
      truckNumber: 'UGA-234-PQR',
      routeName: 'Entebbe-Jinja Express',
      origin: 'Entebbe, Uganda',
      destination: 'Jinja, Uganda',
      cargoType: 'Textiles',
      cargoWeight: 12.1,
      distance: 125,
      estimatedDuration: 2,
      actualDuration: 1.8,
      startTime: '2024-08-09T07:30:00Z',
      endTime: '2024-08-09T09:18:00Z',
      priority: 'low',
      revenue: 195000,
      fuelCost: 35000,
      tollCost: 8000,
      progress: 100,
      currentLocation: 'Jinja, Uganda',
      delay: 0,
      notes: 'Early delivery - excellent performance',
      createdAt: '2024-08-09T06:00:00Z',
      updatedAt: '2024-08-09T09:20:00Z'
    },
    {
      id: '8',
      reference: 'TRP-2024-008',
      status: 'cancelled',
      tenantId: '1',
      tenantName: 'TransCorp Rwanda',
      driverName: 'Joseph Bizimungu',
      truckNumber: 'RWD-456-STU',
      routeName: 'Gisenyi-Ruhengeri Border Route',
      origin: 'Gisenyi (Rubavu), Rwanda',
      destination: 'Ruhengeri (Musanze), Rwanda',
      cargoType: 'Agricultural Products',
      cargoWeight: 28.5,
      distance: 65,
      estimatedDuration: 1.2,
      startTime: '2024-08-09T16:00:00Z',
      priority: 'low',
      revenue: 85000,
      fuelCost: 22000,
      tollCost: 3000,
      progress: 0,
      currentLocation: 'Gisenyi, Rwanda',
      delay: 0,
      notes: 'Cancelled due to vehicle mechanical issues - rescheduled',
      createdAt: '2024-08-09T15:00:00Z',
      updatedAt: '2024-08-09T16:30:00Z'
    }
  ];

  const allTrips = Array.isArray(trips) && trips.length > 0 ? trips : mockTrips;

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

  // Filter and sort trips
  const filteredTrips = useMemo(() => {
    return mappedTrips
      .filter((trip: Trip) => {
        if (!trip || typeof trip !== 'object') return false;

        const locStr = (v: any) => typeof v === 'object' && v ? (v.city || v.address || '') : (v || '');
        const searchFields = [
          trip.reference,
          trip.driverName,
          locStr(trip.origin),
          locStr(trip.destination),
          trip.cargoType,
          trip.tenantName
        ].filter(Boolean).map((field: string) => field.toLowerCase());

        const matchesSearch = searchTerm === '' || searchFields.some(field =>
          field.includes(searchTerm.toLowerCase())
        );

        const matchesStatus = statusFilter === 'all' || trip.status === statusFilter;
        const matchesTenant = tenantFilter === 'all' || trip.tenantId === tenantFilter;
        const matchesPriority = priorityFilter === 'all' || trip.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesTenant && matchesPriority;
      })
      .sort((a: Trip, b: Trip) => {
        const aValue = a[sortBy as keyof Trip] || '';
        const bValue = b[sortBy as keyof Trip] || '';
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
      });
  }, [mappedTrips, searchTerm, statusFilter, tenantFilter, priorityFilter, sortBy, sortOrder]);

  const total = filteredTrips.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedTrips = filteredTrips.slice(startIdx, endIdx);

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

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'completed') return 'bg-emerald-500';
    if (status === 'cancelled') return 'bg-rose-500';
    if (status === 'delayed') return 'bg-amber-500';
    if (progress >= 80) return 'bg-blue-600';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-blue-400';
  };

  const formatDistance = (km: number) => `${(km || 0).toLocaleString()} km`;
  const formatWeight = (kg: number) => `${((kg || 0) / 1000).toFixed(1)} t`;
  const formatCurrency = (val: number) => `$${(val || 0).toLocaleString()}`;
  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleString();
  };

  const calculateProfit = (revenue: number, fuelCost: number, tollCost: number) => {
    return (revenue ?? 0) - (fuelCost ?? 0) - (tollCost ?? 0);
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
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-all text-xs">
            <FaDownload size={14} /> <TranslatedText text="Export Report" />
          </button>
        </div>
      }
    >
      {/* Loading and Error States */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-slate-400"><TranslatedText text="Loading trips..." /></span>
        </div>
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
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-6 hover:shadow-xl hover:shadow-gray-100/50 dark:hover:shadow-none transition-all duration-300 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05] group-hover:scale-110 transition-transform duration-500">
                    <Icon size={100} className="text-gray-900 dark:text-white" />
                  </div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all duration-300">
                        <Icon size={20} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{stat.label}</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{stat.value}</h3>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-4 leading-none">{stat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters and Search */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search trips..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-transparent dark:text-slate-100 transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all"><TranslatedText text="All Status" /></option>
                <option value="scheduled"><TranslatedText text="Scheduled" /></option>
                <option value="in_progress"><TranslatedText text="In Progress" /></option>
                <option value="completed"><TranslatedText text="Completed" /></option>
                <option value="cancelled"><TranslatedText text="Cancelled" /></option>
                <option value="delayed"><TranslatedText text="Delayed" /></option>
              </select>

              <select
                className="px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 outline-none"
                value={tenantFilter}
                onChange={(e) => setTenantFilter(e.target.value)}
              >
                <option value="all"><TranslatedText text="All Tenants" /></option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
              </select>

              <select
                className="px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 outline-none"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all"><TranslatedText text="All Priorities" /></option>
                <option value="high"><TranslatedText text="High Priority" /></option>
                <option value="medium"><TranslatedText text="Medium Priority" /></option>
                <option value="low"><TranslatedText text="Low Priority" /></option>
              </select>

              <button className="px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                <FaDownload className="w-3.5 h-3.5" />
                <span><TranslatedText text="Export" /></span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-gray-100/50 dark:shadow-none overflow-hidden border border-gray-100 dark:border-slate-800">
            <div className="overflow-x-auto text-slate-900 dark:text-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#fafafa] dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                    <th className="px-6 py-4">
                      <button
                        className="flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-colors"
                        onClick={() => {
                          setSortBy('reference');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        <TranslatedText text="Trip Reference" />
                        <FaSort size={10} />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Route & Progress" /></th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Driver & Assets" /></th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Cargo Detail" /></th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Financials" /></th>
                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Action" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                  {pagedTrips.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest text-[10px]"><TranslatedText text="No trips identified." /></td>
                    </tr>
                  ) : (
                    pagedTrips.map((trip: Trip) => (
                      <tr key={trip.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-900 dark:bg-slate-950 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-900/10 dark:shadow-none border border-transparent dark:border-slate-800">
                              <FaBarcode className="text-white dark:text-blue-400 text-lg" />
                            </div>
                            <div>
                              <div className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{trip.reference}</div>
                              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">{trip.tenantName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs font-black text-gray-900 dark:text-slate-200 tracking-tight">
                                <FaMapMarkerAlt className="text-emerald-500 w-3 h-3" /> {(typeof trip.origin === 'object' ? (trip.origin?.city || trip.origin?.address || 'N/A') : (trip.origin || 'N/A')).split(',')[0]}
                              </div>
                              <div className="flex items-center gap-2 text-xs font-black text-gray-900 dark:text-slate-200 tracking-tight">
                                <FaMapMarkerAlt className="text-rose-500 w-3 h-3" /> {(typeof trip.destination === 'object' ? (trip.destination?.city || trip.destination?.address || 'N/A') : (trip.destination || 'N/A')).split(',')[0]}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-end">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm",
                                  getStatusColor(trip.status || 'scheduled'),
                                  "dark:bg-opacity-10 dark:border dark:border-current"
                                )}>
                                  {(trip.status || 'scheduled').replace('_', ' ')}
                                </span>
                                <span className="text-[10px] font-black text-gray-900 dark:text-slate-300">{trip.progress ?? 0}%</span>
                              </div>
                              <div className="w-32 bg-gray-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    getProgressColor(trip.progress, trip.status)
                                  )}
                                  style={{ width: `${trip.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
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
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-2">
                            <div className="text-xs font-black text-gray-900 dark:text-slate-200 tracking-tight">{trip.cargoType}</div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <FaWeightHanging className="text-slate-400 dark:text-slate-500 w-3 h-3" />
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{formatWeight(trip.cargoWeight)}</span>
                              </div>
                              {trip.isFragile && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 px-1.5 py-0.5 rounded border dark:border-rose-800/30"><TranslatedText text="Fragile" /></span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="text-sm font-black text-gray-900 dark:text-slate-100 tracking-tight">{formatCurrency(trip.revenue)}</div>
                            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                              <TranslatedText text="Net Profit" />: <span className="text-blue-600 dark:text-blue-400">{formatCurrency(calculateProfit(trip.revenue, trip.fuelCost, trip.tollCost))}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setSelectedTrip(trip);
                                setShowDetailsModal(true);
                              }}
                              className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all"
                            >
                              <FaEye size={16} />
                            </button>
                            <button className="p-2.5 text-slate-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                              <FaEdit size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-5 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between bg-[#fafafa] dark:bg-slate-800/30">
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                <TranslatedText text="Showing" /> <span className="text-gray-900 dark:text-white">{startIdx + 1}-{Math.min(endIdx, total)}</span> <TranslatedText text="of" /> <span className="text-gray-900 dark:text-white">{total}</span> <TranslatedText text="Records" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border border-gray-200 dark:border-slate-800 rounded-xl disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all"
                >
                  <TranslatedText text="Prev" />
                </button>
                <div className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black text-gray-900 dark:text-white">
                  {currentPage} <span className="mx-1 text-slate-300 dark:text-slate-700">/</span> {totalPages}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 border border-gray-200 dark:border-slate-800 rounded-xl disabled:opacity-30 hover:bg-white dark:hover:bg-slate-800 transition-all"
                >
                  <TranslatedText text="Next" />
                </button>
              </div>
            </div>
          </div>
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
    </AdminPageLayout>
  );
};

export default AdminTrips;
