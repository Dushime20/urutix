import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllTrips, fetchTenants } from '../services/adminApi';
import {
  FaTruck, FaEdit, FaPlus, FaSearch, FaDownload,
  FaEye, FaCheck, FaTimes, FaBan, FaMapMarkerAlt,
  FaSort, FaClock, FaRoad, FaShippingFast,
  FaExclamationTriangle, FaBuilding, FaBox,
  FaRoute, FaUser, FaDollarSign, FaWeightHanging, FaBarcode
} from 'react-icons/fa';
import AdminPageLayout from '../components/Admin/AdminPageLayout';

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
  const [pageSize, setPageSize] = useState(10);

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
  const tenantMap = new Map<string, string>();
  tenants.forEach((tenant) => {
    tenantMap.set(tenant.id, tenant.name);
  });

  // Map trips with tenant names
  const mappedTrips: Trip[] = useMemo(() => {
    return allTrips.map((trip: any) => ({
      ...trip,
      tenantName: trip.tenantId ? (tenantMap.get(trip.tenantId) || trip.tenantName || 'N/A') : trip.tenantName || 'N/A'
    }));
  }, [allTrips, tenantMap]);

  // Filter and sort trips
  const filteredTrips = mappedTrips
    .filter((trip: Trip) => {
      if (!trip || typeof trip !== 'object') return false;

      const searchFields = [
        trip.reference,
        trip.driverName,
        trip.origin,
        trip.destination,
        trip.cargoType,
        trip.tenantName
      ].filter(Boolean).map(field => field.toLowerCase());

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

  const total = filteredTrips.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedTrips = filteredTrips.slice(startIdx, endIdx);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-gray-100 text-gray-700';
      case 'in_progress': return 'bg-gray-100 text-gray-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-gray-100 text-gray-500';
      case 'delayed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-gray-100 text-gray-700';
      case 'medium': return 'bg-gray-100 text-gray-700';
      case 'low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <FaClock className="text-gray-500 text-[10px]" />;
      case 'in_progress': return <FaShippingFast className="text-gray-600 text-[10px]" />;
      case 'completed': return <FaCheck className="text-gray-500 text-[10px]" />;
      case 'cancelled': return <FaBan className="text-gray-400 text-[10px]" />;
      case 'delayed': return <FaExclamationTriangle className="text-gray-500 text-[10px]" />;
      default: return <FaClock className="text-gray-500 text-[10px]" />;
    }
  };

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'completed') return 'bg-gray-400';
    if (status === 'cancelled') return 'bg-gray-300';
    if (status === 'delayed') return 'bg-gray-400';
    if (progress >= 80) return 'bg-gray-500';
    if (progress >= 50) return 'bg-gray-400';
    return 'bg-gray-300';
  };

  // Helper functions for better data display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const getTimeUntil = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) return 'Past';
    if (diffMins < 60) return `In ${diffMins}m`;
    if (diffHours < 24) return `In ${diffHours}h`;
    if (diffDays < 7) return `In ${diffDays}d`;
    return formatDate(dateString);
  };

  const formatCurrency = (amount: number) => {
    if (!amount && amount !== 0) return 'N/A';
    return `RWF ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDistance = (distance: number) => {
    if (!distance && distance !== 0) return 'N/A';
    return `${distance.toLocaleString('en-US')} km`;
  };

  const formatWeight = (weight: number) => {
    if (!weight && weight !== 0) return 'N/A';
    return `${weight.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}T`;
  };

  const formatVolume = (volume: number) => {
    if (!volume && volume !== 0) return null;
    return `${volume.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m³`;
  };

  const formatDuration = (hours: number) => {
    if (!hours && hours !== 0) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours.toFixed(1)}h` : `${days}d`;
  };

  const calculateProfit = (revenue: number, fuelCost: number, tollCost: number) => {
    return (revenue ?? 0) - (fuelCost ?? 0) - (tollCost ?? 0);
  };

  const getProfitMargin = (revenue: number, fuelCost: number, tollCost: number) => {
    const profit = calculateProfit(revenue, fuelCost, tollCost);
    if (!revenue || revenue === 0) return 0;
    return ((profit / revenue) * 100).toFixed(1);
  };

  const stats = [
    {
      label: 'Total Trips',
      value: mappedTrips.length,
      icon: FaTruck,
      color: 'from-gray-600 to-gray-700',
      description: 'All registered trips'
    },
    {
      label: 'Active Trips',
      value: mappedTrips.filter((t: Trip) => ['in_progress', 'scheduled'].includes(t.status)).length,
      icon: FaShippingFast,
      color: 'from-gray-600 to-gray-700',
      description: 'Currently active'
    },
    {
      label: 'Total Revenue',
      value: `RWF ${mappedTrips.reduce((sum: number, t: Trip) => sum + (t.revenue ?? 0), 0).toLocaleString()}`,
      icon: FaDollarSign,
      color: 'from-gray-600 to-gray-700',
      description: 'Combined trip revenue'
    },
    {
      label: 'Completed Today',
      value: mappedTrips.filter((t: Trip) => t.status === 'completed' &&
        new Date(t.endTime || '').toDateString() === new Date().toDateString()).length,
      icon: FaCheck,
      color: 'from-gray-600 to-gray-700',
      description: 'Trips completed today'
    },
  ];

  return (
    <AdminPageLayout
      title="Trip Management"
      description="Monitor and manage all logistics trips across tenants"
      actions={
        <div className="flex items-center gap-2">
          <div className="text-sm text-slate-400 mr-2">
            <span className="font-bold text-white">{mappedTrips.filter(t => t.status === 'in_progress').length}</span> active trips
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-600/20 transition-all">
            <FaDownload size={14} /> Export Report
          </button>
        </div>
      }
    >
      {/* Loading and Error States */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading trips...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="text-red-600" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Error Loading Trips</h3>
              <p className="text-xs text-red-700 mt-0.5">Failed to load trip data. Please try again.</p>
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
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50"></div>
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                      <p className="text-2xl font-black text-slate-800 mb-1">{stat.value}</p>
                      <p className="text-xs text-slate-400">{stat.description}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors text-slate-600">
                      <Icon size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-2.5 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="relative">
                <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search trips..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="delayed">Delayed</option>
              </select>

              <select
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                value={tenantFilter}
                onChange={(e) => setTenantFilter(e.target.value)}
              >
                <option value="all">All Tenants</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
              </select>

              <select
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <button className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
                <FaDownload className="w-3 h-3" />
                <span>Export</span>
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-gray-600">
                {total} trips
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  className="px-1.5 py-0.5 text-xs border border-gray-200 rounded"
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Trips Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">
                      <button
                        className="flex items-center gap-1"
                        onClick={() => {
                          setSortBy('reference');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        <span>Trip</span>
                        <FaSort className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Route & Schedule</th>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Driver & Truck</th>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Cargo Details</th>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Status & Progress</th>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Financial</th>
                    <th className="px-2 py-1.5 text-left text-xs font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pagedTrips.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-2 py-8 text-center text-xs text-gray-500">
                        No trips found
                      </td>
                    </tr>
                  ) : (
                    pagedTrips.map((trip: Trip) => {
                      const profit = calculateProfit(trip.revenue ?? 0, trip.fuelCost ?? 0, trip.tollCost ?? 0);
                      const profitMargin = getProfitMargin(trip.revenue ?? 0, trip.fuelCost ?? 0, trip.tollCost ?? 0);
                      const totalCost = (trip.fuelCost ?? 0) + (trip.tollCost ?? 0);

                      return (
                        <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FaBarcode className="text-white text-xs" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-gray-900 text-xs truncate">{trip.reference}</div>
                                <div className="text-[10px] text-gray-500 flex items-center gap-0.5">
                                  <FaBuilding className="text-[10px] flex-shrink-0" />
                                  <span className="truncate">{trip.tenantName}</span>
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  Created {getTimeAgo(trip.createdAt)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-gray-900 truncate">{trip.routeName || 'N/A'}</div>
                              <div className="space-y-0.5">
                                <div className="text-[10px] text-gray-600 flex items-center gap-0.5">
                                  <FaMapMarkerAlt className="text-green-500 text-[10px] flex-shrink-0" />
                                  <span className="truncate">{trip.origin}</span>
                                </div>
                                <div className="text-[10px] text-gray-600 flex items-center gap-0.5">
                                  <FaMapMarkerAlt className="text-red-500 text-[10px] flex-shrink-0" />
                                  <span className="truncate">{trip.destination}</span>
                                </div>
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {formatDistance(trip.distance ?? 0)} • {formatDuration(trip.estimatedDuration ?? 0)}
                              </div>
                              <div className="text-[10px] text-gray-500 space-y-0.5">
                                <div>Start: {formatDateTime(trip.startTime)}</div>
                                {trip.endTime && (
                                  <div>End: {formatDateTime(trip.endTime)}</div>
                                )}
                                {!trip.endTime && trip.status === 'in_progress' && (
                                  <div className="text-gray-400">ETA: {trip.estimatedDuration ? getTimeUntil(new Date(new Date(trip.startTime).getTime() + (trip.estimatedDuration * 3600000)).toISOString()) : 'N/A'}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-0.5">
                                <FaUser className="text-gray-400 text-[10px] flex-shrink-0" />
                                <span className="text-xs font-medium text-gray-900 truncate">{trip.driverName}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <FaTruck className="text-gray-400 text-[10px] flex-shrink-0" />
                                <span className="text-[10px] text-gray-500 truncate">{trip.truckNumber}</span>
                              </div>
                              {trip.currentLocation && (
                                <div className="text-[10px] text-gray-500 truncate" title={trip.currentLocation}>
                                  📍 {trip.currentLocation}
                                </div>
                              )}
                              {trip.actualDuration && (
                                <div className="text-[10px] text-gray-500">
                                  Actual: {formatDuration(trip.actualDuration)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="space-y-1">
                              {/* Cargo Title or Type */}
                              {trip.cargoTitle ? (
                                <div className="text-xs font-semibold text-gray-900 truncate" title={trip.cargoTitle}>
                                  {trip.cargoTitle}
                                </div>
                              ) : (
                                <div className="flex items-center gap-0.5">
                                  <FaBox className="text-gray-400 text-[10px] flex-shrink-0" />
                                  <span className="text-xs font-medium text-gray-900 truncate">{trip.cargoType || 'N/A'}</span>
                                </div>
                              )}

                              {/* Cargo Type (if title exists) */}
                              {trip.cargoTitle && (
                                <div className="text-[10px] text-gray-500 truncate">
                                  {trip.cargoType || 'General'}
                                </div>
                              )}

                              {/* Weight and Volume */}
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-0.5">
                                  <FaWeightHanging className="text-gray-400 text-[10px] flex-shrink-0" />
                                  <span className="text-[10px] text-gray-600">{formatWeight(trip.cargoWeight ?? 0)}</span>
                                </div>
                                {trip.cargoVolume && (
                                  <div className="text-[10px] text-gray-500">
                                    Vol: {formatVolume(trip.cargoVolume)}
                                  </div>
                                )}
                              </div>

                              {/* Special Requirements Badges */}
                              <div className="flex items-center gap-0.5 flex-wrap">
                                {trip.isFragile && (
                                  <span className="px-1 py-0.5 rounded text-[9px] font-medium bg-red-50 text-red-700 border border-red-200" title="Fragile cargo - handle with care">
                                    ⚠️ Fragile
                                  </span>
                                )}
                                {trip.isHazardous && (
                                  <span className="px-1 py-0.5 rounded text-[9px] font-medium bg-orange-50 text-orange-700 border border-orange-200" title="Hazardous materials">
                                    ☢️ Hazmat
                                  </span>
                                )}
                                {trip.requiresRefrigeration && (
                                  <span className="px-1 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700 border border-blue-200" title="Requires refrigeration">
                                    ❄️ Refrigerated
                                  </span>
                                )}
                              </div>

                              {/* Additional Info */}
                              <div className="space-y-0.5">
                                {(trip.numberOfPieces || trip.numberOfPallets) && (
                                  <div className="text-[10px] text-gray-500">
                                    {trip.numberOfPieces && `${trip.numberOfPieces} pieces`}
                                    {trip.numberOfPieces && trip.numberOfPallets && ' • '}
                                    {trip.numberOfPallets && `${trip.numberOfPallets} pallets`}
                                  </div>
                                )}
                                {trip.packagingType && (
                                  <div className="text-[10px] text-gray-500">
                                    📦 {trip.packagingType}
                                  </div>
                                )}
                                {trip.loadValue && (
                                  <div className="text-[10px] text-gray-500">
                                    Value: {formatCurrency(trip.loadValue)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1 flex-wrap">
                                {getStatusIcon(trip.status)}
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(trip.status || 'scheduled')}`}>
                                  {trip.status ? trip.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Scheduled'}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getPriorityColor(trip.priority || 'medium')}`}>
                                  {trip.priority ? (trip.priority.charAt(0).toUpperCase() + trip.priority.slice(1)) : 'Medium'}
                                </span>
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-gray-600">Progress</span>
                                  <span className="text-xs font-medium text-gray-900">{trip.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(trip.progress, trip.status)}`}
                                    style={{ width: `${trip.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                              {trip.delay && trip.delay > 0 && (
                                <div className="text-[10px] text-gray-500">
                                  ⚠️ +{formatDuration(trip.delay)} delay
                                </div>
                              )}
                              {trip.actualDuration && trip.estimatedDuration && (
                                <div className="text-[10px] text-gray-500">
                                  {trip.actualDuration > trip.estimatedDuration ? (
                                    <span className="text-gray-600">+{formatDuration(trip.actualDuration - trip.estimatedDuration)} over</span>
                                  ) : (
                                    <span className="text-gray-600">-{formatDuration(trip.estimatedDuration - trip.actualDuration)} under</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="space-y-1">
                              <div className="text-xs font-semibold text-gray-900">
                                {formatCurrency(trip.revenue ?? 0)}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                Cost: {formatCurrency(totalCost)}
                              </div>
                              <div className={`text-[10px] font-medium ${profit >= 0 ? 'text-gray-700' : 'text-gray-600'}`}>
                                Profit: {formatCurrency(profit)}
                              </div>
                              {profitMargin !== '0.0' && (
                                <div className="text-[10px] text-gray-500">
                                  Margin: {profitMargin}%
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedTrip(trip);
                                  setShowDetailsModal(true);
                                }}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="View Details"
                              >
                                <FaEye className="w-3 h-3" />
                              </button>
                              <button
                                className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                title="Edit"
                              >
                                <FaEdit className="w-3 h-3" />
                              </button>
                              <button
                                className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                title="Track"
                              >
                                <FaMapMarkerAlt className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between p-2 border-t border-gray-200 bg-gray-50">
              <div className="text-[10px] text-gray-600">
                Showing {Math.min(endIdx, total)} of {total}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  className="px-1.5 py-0.5 text-xs border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="text-[10px] text-gray-700">Page {currentPage} / {totalPages}</span>
                <button
                  className="px-1.5 py-0.5 text-xs border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100"
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip Details Modal */}
      {showDetailsModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <FaBarcode className="text-white text-sm" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedTrip.reference}</h2>
                    <p className="text-xs text-gray-600">{selectedTrip.routeName}</p>
                    <p className="text-[10px] text-gray-500">{selectedTrip.origin} → {selectedTrip.destination}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 space-y-3">
              {/* Status and Progress */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2 flex-wrap">
                  <div className="flex items-center space-x-1.5">
                    {getStatusIcon(selectedTrip.status)}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(selectedTrip.status || 'scheduled')}`}>
                      {selectedTrip.status ? selectedTrip.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Scheduled'}
                    </span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getPriorityColor(selectedTrip.priority || 'medium')}`}>
                    {selectedTrip.priority ? (selectedTrip.priority.charAt(0).toUpperCase() + selectedTrip.priority.slice(1)) : 'Medium'} Priority
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs text-gray-600">Progress:</span>
                    <div className="w-24 bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${getProgressColor(selectedTrip.progress, selectedTrip.status)}`}
                        style={{ width: `${selectedTrip.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-gray-900">{selectedTrip.progress}%</span>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FaRoad className="text-gray-600 text-xs" />
                    <div>
                      <div className="text-base font-bold text-gray-900">{formatDistance(selectedTrip.distance ?? 0)}</div>
                      <div className="text-[10px] text-gray-700">Total Distance</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FaClock className="text-gray-600 text-xs" />
                    <div>
                      <div className="text-base font-bold text-gray-900">{formatDuration(selectedTrip.estimatedDuration ?? 0)}</div>
                      <div className="text-[10px] text-gray-700">
                        {selectedTrip.actualDuration ? 'Actual' : 'Est. Duration'}
                      </div>
                      {selectedTrip.actualDuration && (
                        <div className="text-[10px] text-gray-500">
                          Est: {formatDuration(selectedTrip.estimatedDuration ?? 0)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FaWeightHanging className="text-gray-600 text-xs" />
                    <div>
                      <div className="text-base font-bold text-gray-900">{formatWeight(selectedTrip.cargoWeight ?? 0)}</div>
                      <div className="text-[10px] text-gray-700">Cargo Weight</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FaDollarSign className="text-gray-600 text-xs" />
                    <div>
                      <div className="text-base font-bold text-gray-900">{formatCurrency(selectedTrip.revenue ?? 0)}</div>
                      <div className="text-[10px] text-gray-700">Revenue</div>
                      <div className="text-[10px] text-gray-500">
                        Margin: {getProfitMargin(selectedTrip.revenue ?? 0, selectedTrip.fuelCost ?? 0, selectedTrip.tollCost ?? 0)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Trip Details */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900">Trip Details</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tenant:</span>
                      <span className="font-medium">{selectedTrip.tenantName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Driver:</span>
                      <span className="font-medium">{selectedTrip.driverName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Truck:</span>
                      <span className="font-medium">{selectedTrip.truckNumber}</span>
                    </div>
                    {selectedTrip.cargoTitle && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cargo Title:</span>
                        <span className="font-medium">{selectedTrip.cargoTitle}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cargo Type:</span>
                      <span className="font-medium">{selectedTrip.cargoType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Weight:</span>
                      <span className="font-medium">{formatWeight(selectedTrip.cargoWeight ?? 0)}</span>
                    </div>
                    {selectedTrip.cargoVolume && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Volume:</span>
                        <span className="font-medium">{formatVolume(selectedTrip.cargoVolume)}</span>
                      </div>
                    )}
                    {selectedTrip.loadValue && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Load Value:</span>
                        <span className="font-medium">{formatCurrency(selectedTrip.loadValue)}</span>
                      </div>
                    )}
                    {(selectedTrip.numberOfPieces || selectedTrip.numberOfPallets) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium">
                          {selectedTrip.numberOfPieces && `${selectedTrip.numberOfPieces} pieces`}
                          {selectedTrip.numberOfPieces && selectedTrip.numberOfPallets && ' • '}
                          {selectedTrip.numberOfPallets && `${selectedTrip.numberOfPallets} pallets`}
                        </span>
                      </div>
                    )}
                    {selectedTrip.packagingType && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Packaging:</span>
                        <span className="font-medium">{selectedTrip.packagingType}</span>
                      </div>
                    )}
                    {(selectedTrip.isFragile || selectedTrip.isHazardous || selectedTrip.requiresRefrigeration) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Special Requirements:</span>
                        <span className="font-medium">
                          {[
                            selectedTrip.isFragile && 'Fragile',
                            selectedTrip.isHazardous && 'Hazardous',
                            selectedTrip.requiresRefrigeration && 'Refrigerated'
                          ].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {selectedTrip.currentLocation && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Location:</span>
                        <span className="font-medium text-gray-700">{selectedTrip.currentLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule Information */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900">Schedule</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedTrip.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Time:</span>
                      <span className="font-medium">{formatDateTime(selectedTrip.startTime)}</span>
                    </div>
                    {selectedTrip.endTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">End Time:</span>
                        <span className="font-medium">{formatDateTime(selectedTrip.endTime)}</span>
                      </div>
                    )}
                    {selectedTrip.actualDuration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Actual Duration:</span>
                        <span className="font-medium">{formatDuration(selectedTrip.actualDuration)}</span>
                      </div>
                    )}
                    {selectedTrip.delay && selectedTrip.delay > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delay:</span>
                        <span className="font-medium text-gray-600">+{formatDuration(selectedTrip.delay)}</span>
                      </div>
                    )}
                    {selectedTrip.actualDuration && selectedTrip.estimatedDuration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Difference:</span>
                        <span className={`font-medium ${selectedTrip.actualDuration > selectedTrip.estimatedDuration ? 'text-gray-600' : 'text-gray-700'}`}>
                          {selectedTrip.actualDuration > selectedTrip.estimatedDuration ? '+' : '-'}
                          {formatDuration(Math.abs(selectedTrip.actualDuration - selectedTrip.estimatedDuration))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Information */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900">Financial</h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-medium text-gray-700">{formatCurrency(selectedTrip.revenue ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Cost:</span>
                      <span className="font-medium text-gray-600">{formatCurrency(selectedTrip.fuelCost ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Toll Cost:</span>
                      <span className="font-medium text-gray-600">{formatCurrency(selectedTrip.tollCost ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Cost:</span>
                      <span className="font-medium text-gray-600">{formatCurrency((selectedTrip.fuelCost ?? 0) + (selectedTrip.tollCost ?? 0))}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5">
                      <span className="text-gray-600 font-semibold">Net Profit:</span>
                      <span className={`font-bold ${calculateProfit(selectedTrip.revenue ?? 0, selectedTrip.fuelCost ?? 0, selectedTrip.tollCost ?? 0) >= 0 ? 'text-gray-700' : 'text-gray-600'}`}>
                        {formatCurrency(calculateProfit(selectedTrip.revenue ?? 0, selectedTrip.fuelCost ?? 0, selectedTrip.tollCost ?? 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profit Margin:</span>
                      <span className="font-medium text-gray-700">
                        {getProfitMargin(selectedTrip.revenue ?? 0, selectedTrip.fuelCost ?? 0, selectedTrip.tollCost ?? 0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Notes */}
              {selectedTrip.notes && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-700">{selectedTrip.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default AdminTrips;
