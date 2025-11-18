import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllTrips, fetchTenants } from '../services/adminApi';
import { 
  FaTruck, FaEdit, FaPlus, FaSearch, FaDownload,
  FaEye, FaCheck, FaTimes, FaBan, FaMapMarkerAlt,
  FaSort, FaEllipsisV, FaClock, FaRoad, FaShippingFast,
  FaCog, FaExclamationTriangle, FaBuilding, FaBox, 
  FaRoute, FaUser, FaDollarSign, FaWeightHanging, FaBarcode
} from 'react-icons/fa';

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

  // Filter and sort trips
  const filteredTrips = allTrips
    .filter((trip: Trip) => {
      // Defensive checks for trip properties
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'delayed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <FaClock className="text-blue-500" />;
      case 'in_progress': return <FaShippingFast className="text-green-500" />;
      case 'completed': return <FaCheck className="text-gray-500" />;
      case 'cancelled': return <FaBan className="text-red-500" />;
      case 'delayed': return <FaExclamationTriangle className="text-yellow-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'completed') return 'bg-gray-400';
    if (status === 'cancelled') return 'bg-red-400';
    if (status === 'delayed') return 'bg-yellow-400';
    if (progress >= 80) return 'bg-green-400';
    if (progress >= 50) return 'bg-blue-400';
    return 'bg-gray-300';
  };

  // Get tenants for dropdown
  const tenants: Tenant[] = tenantsData?.tenants || [];

  const stats = [
    { 
      label: 'Total Trips', 
      value: allTrips.length, 
      icon: FaTruck, 
      color: 'from-blue-500 to-blue-600',
      description: 'All registered trips'
    },
    { 
      label: 'Active Trips', 
      value: allTrips.filter((t: Trip) => ['in_progress', 'scheduled'].includes(t.status)).length, 
      icon: FaShippingFast, 
      color: 'from-green-500 to-green-600',
      description: 'Currently active'
    },
    { 
      label: 'Total Revenue', 
      value: `RWF ${allTrips.reduce((sum: number, t: Trip) => sum + t.revenue, 0).toLocaleString()}`, 
      icon: FaDollarSign, 
      color: 'from-purple-500 to-purple-600',
      description: 'Combined trip revenue'
    },
    { 
      label: 'Completed Today', 
      value: allTrips.filter((t: Trip) => t.status === 'completed' && 
        new Date(t.endTime || '').toDateString() === new Date().toDateString()).length, 
      icon: FaCheck, 
      color: 'from-yellow-500 to-yellow-600',
      description: 'Trips completed today'
    },
  ];
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trip Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage all logistics trips across tenants</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg">
            <FaPlus />
            <span>Create Trip</span>
          </button>
          <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg">
            <FaRoute />
            <span>Trip Planner</span>
          </button>
        </div>
      </div>

      {/* Loading and Error States */}
      {isLoading && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trips...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <FaExclamationTriangle className="text-red-500" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Trips</h3>
              <p className="text-red-700 text-sm mt-1">Failed to load trip data. Please try again.</p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                    </div>
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="text-white text-lg" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trips..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={tenantFilter}
                onChange={(e) => setTenantFilter(e.target.value)}
              >
                <option value="all">All Tenants</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
              </select>

              <select
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              <button className="px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors">
                <FaDownload />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Trips Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      <button 
                        className="flex items-center space-x-1"
                        onClick={() => {
                          setSortBy('reference');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        <span>Trip</span>
                        <FaSort />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Route</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Driver & Truck</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Cargo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Progress</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Priority</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Revenue</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTrips.map((trip: Trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <FaBarcode className="text-white text-sm" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{trip.reference}</div>
                            <div className="text-sm text-gray-500 flex items-center space-x-1">
                              <FaBuilding className="text-xs" />
                              <span>{trip.tenantName}</span>
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(trip.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{trip.routeName}</div>
                          <div className="text-sm text-gray-500 flex items-center space-x-1">
                            <FaMapMarkerAlt className="text-xs text-green-500" />
                            <span>{trip.origin}</span>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-1">
                            <FaMapMarkerAlt className="text-xs text-red-500" />
                            <span>{trip.destination}</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {trip.distance.toLocaleString()} km • {trip.estimatedDuration}h
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <FaUser className="text-gray-400 text-xs" />
                            <span className="text-sm font-medium text-gray-900">{trip.driverName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FaTruck className="text-gray-400 text-xs" />
                            <span className="text-sm text-gray-500">{trip.truckNumber}</span>
                          </div>
                          {trip.currentLocation && (
                            <div className="text-xs text-blue-600">
                              📍 {trip.currentLocation}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <FaBox className="text-gray-400 text-xs" />
                            <span className="text-sm font-medium text-gray-900">{trip.cargoType}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FaWeightHanging className="text-gray-400 text-xs" />
                            <span className="text-sm text-gray-500">{trip.cargoWeight}T</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(trip.status)}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                            {trip.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </span>
                        </div>
                        {trip.delay && trip.delay > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            +{trip.delay}h delay
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">{trip.progress}%</span>
                            <span className="text-xs text-gray-500">
                              {trip.status === 'completed' ? 'Completed' : 
                               trip.status === 'cancelled' ? 'Cancelled' : 'In Progress'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(trip.progress, trip.status)}`}
                              style={{ width: `${trip.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(trip.priority)}`}>
                          {trip.priority.charAt(0).toUpperCase() + trip.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-gray-900">
                            RWF {trip.revenue.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Cost: RWF {(trip.fuelCost + trip.tollCost).toLocaleString()}
                          </div>
                          <div className="text-xs text-green-600">
                            Profit: RWF {(trip.revenue - trip.fuelCost - trip.tollCost).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedTrip(trip);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button 
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Track"
                          >
                            <FaMapMarkerAlt />
                          </button>
                          <button 
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="More"
                          >
                            <FaEllipsisV />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Trip Details Modal */}
      {showDetailsModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <FaBarcode className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTrip.reference}</h2>
                    <p className="text-gray-600">{selectedTrip.routeName}</p>
                    <p className="text-sm text-gray-500">{selectedTrip.origin} → {selectedTrip.destination}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status and Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedTrip.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTrip.status)}`}>
                      {selectedTrip.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTrip.priority)}`}>
                    {selectedTrip.priority.charAt(0).toUpperCase() + selectedTrip.priority.slice(1)} Priority
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Progress:</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(selectedTrip.progress, selectedTrip.status)}`}
                        style={{ width: `${selectedTrip.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{selectedTrip.progress}%</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Track Live
                  </button>
                  <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                    Edit Trip
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <FaRoad className="text-blue-600 text-lg" />
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{selectedTrip.distance.toLocaleString()}</div>
                      <div className="text-sm text-blue-700">Kilometers</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <FaClock className="text-green-600 text-lg" />
                    <div>
                      <div className="text-2xl font-bold text-green-900">{selectedTrip.estimatedDuration}h</div>
                      <div className="text-sm text-green-700">Estimated Duration</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <FaWeightHanging className="text-purple-600 text-lg" />
                    <div>
                      <div className="text-2xl font-bold text-purple-900">{selectedTrip.cargoWeight}T</div>
                      <div className="text-sm text-purple-700">Cargo Weight</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <FaDollarSign className="text-yellow-600 text-lg" />
                    <div>
                      <div className="text-2xl font-bold text-yellow-900">RWF {selectedTrip.revenue.toLocaleString()}</div>
                      <div className="text-sm text-yellow-700">Revenue</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Trip Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Trip Details</h3>
                  <div className="space-y-3">
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cargo Type:</span>
                      <span className="font-medium">{selectedTrip.cargoType}</span>
                    </div>
                    {selectedTrip.currentLocation && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Location:</span>
                        <span className="font-medium text-blue-600">{selectedTrip.currentLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Schedule Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedTrip.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Time:</span>
                      <span className="font-medium">{new Date(selectedTrip.startTime).toLocaleString()}</span>
                    </div>
                    {selectedTrip.endTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">End Time:</span>
                        <span className="font-medium">{new Date(selectedTrip.endTime).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedTrip.actualDuration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Actual Duration:</span>
                        <span className="font-medium">{selectedTrip.actualDuration}h</span>
                      </div>
                    )}
                    {selectedTrip.delay && selectedTrip.delay > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delay:</span>
                        <span className="font-medium text-red-600">+{selectedTrip.delay}h</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Financial Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Financial</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-medium text-green-600">RWF {selectedTrip.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Cost:</span>
                      <span className="font-medium text-red-600">RWF {selectedTrip.fuelCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Toll Cost:</span>
                      <span className="font-medium text-red-600">RWF {selectedTrip.tollCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600 font-semibold">Net Profit:</span>
                      <span className="font-bold text-green-600">
                        RWF {(selectedTrip.revenue - selectedTrip.fuelCost - selectedTrip.tollCost).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Notes */}
              {selectedTrip.notes && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700">{selectedTrip.notes}</p>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span>Track Location</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FaUser className="text-gray-400" />
                    <span>Contact Driver</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FaDownload className="text-gray-400" />
                    <span>Download Report</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FaCog className="text-gray-400" />
                    <span>Trip Settings</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FaEdit className="text-gray-400" />
                    <span>Edit Details</span>
                  </button>
                  {selectedTrip.status !== 'completed' && selectedTrip.status !== 'cancelled' && (
                    <button className="w-full flex items-center space-x-3 p-3 text-left border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600">
                      <FaBan className="text-red-400" />
                      <span>Cancel Trip</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTrips;


