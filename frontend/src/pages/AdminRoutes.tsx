import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  createTenantRoute, 
  fetchTenants, 
  fetchAdminRoutes, 
  updateTenantRoute, 
  deleteTenantRoute,
  fetchRouteAnalytics
} from '../services/adminApi';
import { fleetApi, type FleetItem } from '../services/fleetApi';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaRoute, FaEdit, FaPlus, FaSearch, FaDownload,
  FaEye, FaCheck, FaTimes, FaBan, FaMapMarkerAlt,
  FaSort, FaEllipsisV, FaClock, FaRoad, FaTruck,
  FaCog, FaShieldAlt, FaExclamationTriangle,
  FaPlay, FaPause, FaBuilding, FaTrash
} from 'react-icons/fa';

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedTime: number;
  status: 'active' | 'inactive' | 'under_construction' | 'blocked';
  tenantId: string;
  tenantName: string;
  createdAt: string;
  lastUsed: string;
  priority: 'high' | 'medium' | 'low';
  routeType: 'highway' | 'city' | 'rural' | 'mixed';
  trafficLevel: 'light' | 'moderate' | 'heavy';
  tollCost?: number;
  fuelCost?: number;
  assignedTrucks?: number;
  completedTrips?: number;
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
}

const AdminRoutes: React.FC = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isTruckOwner = user?.role === 'TRUCK_OWNER' || user?.role === 'FLEET_OWNER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'TENANT_ADMIN';
  
  // Fetch data with real APIs
  const { data: routesData, isLoading: routesLoading, error: routesError } = useQuery({ 
    queryKey: ['admin-routes'], 
    queryFn: () => fetchAdminRoutes() 
  });
  
  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({ 
    queryKey: ['admin-tenants'], 
    queryFn: fetchTenants 
  });
  
  const { data: analyticsData } = useQuery({ 
    queryKey: ['route-analytics'], 
    queryFn: () => fetchRouteAnalytics() 
  });
  
  // Form state
  const [tenantId, setTenantId] = useState('');
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [routeType, setRouteType] = useState<'highway' | 'city' | 'rural' | 'mixed'>('highway');
  const [tollCost, setTollCost] = useState<number>(0);
  const [fuelCost, setFuelCost] = useState<number>(0);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [showAssignTrucksModal, setShowAssignTrucksModal] = useState(false);
  const [routeForAssignment, setRouteForAssignment] = useState<Route | null>(null);
  const [truckSearchTerm, setTruckSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);

  // Trucks list for assignment (enabled only when modal is open)
  const { data: trucksData, isLoading: trucksLoading } = useQuery({
    queryKey: ['fleet-trucks', truckSearchTerm],
    queryFn: () => fleetApi.getTrucks({ search: truckSearchTerm }),
    enabled: showAssignTrucksModal,
  });

  // Mutations
  const { mutate: createRoute, isPending: isCreating } = useMutation({
    mutationFn: () => createTenantRoute(tenantId, { 
      name, 
      origin, 
      destination, 
      distance, 
      estimatedTime, 
      status: 'active',
      priority,
      routeType,
      tollCost,
      fuelCost
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] });
      qc.invalidateQueries({ queryKey: ['route-analytics'] });
      resetForm();
      setShowCreateModal(false);
    },
    onError: (error: any) => {
      console.error('Error creating route:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
    }
  });

  // Assign route to truck
  const { mutate: doAssignRouteToTruck, isPending: isAssigningRoute } = useMutation({
    mutationFn: ({ truckId, routeId }: { truckId: string; routeId: string }) =>
      fleetApi.assignRouteToTruck(truckId, routeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] });
      setShowAssignTrucksModal(false);
      setRouteForAssignment(null);
    },
  });

  const { mutate: updateRoute, isPending: isUpdating } = useMutation({
    mutationFn: () => {
      if (!editingRoute) throw new Error('No route to update');
      return updateTenantRoute(editingRoute.id, {
        name: editingRoute.name,
        origin: editingRoute.origin,
        destination: editingRoute.destination,
        distance: editingRoute.distance,
        estimatedTime: editingRoute.estimatedTime,
        priority: editingRoute.priority,
        routeType: editingRoute.routeType,
        tollCost: editingRoute.tollCost,
        fuelCost: editingRoute.fuelCost
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] });
      qc.invalidateQueries({ queryKey: ['route-analytics'] });
      setShowEditModal(false);
      setEditingRoute(null);
    },
    onError: (error) => {
      console.error('Error updating route:', error);
      // You can add toast notification here
    }
  });

  const { mutate: deleteRoute } = useMutation({
    mutationFn: (routeId: string) => deleteTenantRoute(routeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] });
      qc.invalidateQueries({ queryKey: ['route-analytics'] });
      setShowDetailsModal(false);
      setSelectedRoute(null);
    },
    onError: (error) => {
      console.error('Error deleting route:', error);
      // You can add toast notification here
    }
  });

  const resetForm = () => {
    setTenantId('');
    setName('');
    setOrigin('');
    setDestination('');
    setDistance(0);
    setEstimatedTime(0);
    setPriority('medium');
    setRouteType('highway');
    setTollCost(0);
    setFuelCost(0);
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute({ ...route });
    setShowEditModal(true);
  };

  const handleDeleteRoute = (routeId: string) => {
    if (window.confirm('Are you sure you want to delete this route? This action cannot be undone.')) {
      deleteRoute(routeId);
    }
  };

  // Use real data from API
  const routes = routesData || [];
  
  // Filter and sort routes
  const filteredRoutes = routes
    .filter((route: Route) => {
      const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          route.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          route.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          route.tenantName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
      const matchesTenant = tenantFilter === 'all' || route.tenantId === tenantFilter;
      const matchesPriority = priorityFilter === 'all' || route.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesTenant && matchesPriority;
    })
    .sort((a: Route, b: Route) => {
      const aValue = a[sortBy as keyof Route] || '';
      const bValue = b[sortBy as keyof Route] || '';
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

  const total = filteredRoutes.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedRoutes = filteredRoutes.slice(startIdx, endIdx);

  // Get tenants for dropdown
  const tenants: Tenant[] = tenantsData?.tenants || [];

  // Use real analytics data
  const stats = [
    { 
      label: 'Total Routes', 
      value: analyticsData?.totalRoutes || routes.length, 
      icon: FaRoute, 
      color: 'from-blue-500 to-blue-600',
      description: 'All registered routes'
    },
    { 
      label: 'Active Routes', 
      value: analyticsData?.activeRoutes || routes.filter((r: Route) => r.status === 'active').length, 
      icon: FaCheck, 
      color: 'from-green-500 to-green-600',
      description: 'Currently operational'
    },
    { 
      label: 'Total Distance', 
      value: `${(analyticsData?.totalDistance || routes.reduce((sum: number, r: Route) => sum + r.distance, 0)).toLocaleString()} km`, 
      icon: FaRoad, 
      color: 'from-purple-500 to-purple-600',
      description: 'Combined route distance'
    },
    { 
      label: 'Assigned Trucks', 
      value: routes.reduce((sum: number, r: Route) => sum + (r.assignedTrucks || 0), 0), 
      icon: FaTruck, 
      color: 'from-yellow-500 to-yellow-600',
      description: 'Trucks using routes'
    },
  ];

  // Loading state
  if (routesLoading || tenantsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (routesError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <FaExclamationTriangle className="text-red-500 text-2xl" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Error Loading Routes</h2>
          <p className="mt-2 text-gray-600">Failed to load route data. Please try again later.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'under_construction': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
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

  const getRouteTypeColor = (routeType: string) => {
    switch (routeType) {
      case 'highway': return 'bg-blue-100 text-blue-800';
      case 'city': return 'bg-purple-100 text-purple-800';
      case 'rural': return 'bg-green-100 text-green-800';
      case 'mixed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaPlay className="text-green-500" />;
      case 'inactive': return <FaPause className="text-gray-500" />;
      case 'under_construction': return <FaExclamationTriangle className="text-yellow-500" />;
      case 'blocked': return <FaBan className="text-red-500" />;
      default: return <FaPause className="text-gray-500" />;
    }
  };

  const getTrafficIcon = (trafficLevel: string) => {
    switch (trafficLevel) {
      case 'light': return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'moderate': return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'heavy': return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      default: return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  const handleCreateRoute = () => {
    if (!isAdmin) return;
    createRoute();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Route Management</h1>
          <p className="text-gray-600 mt-1">Manage logistics routes and transportation corridors</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
          >
            <FaPlus />
            <span>Add Route</span>
          </button>
        )}
      </div>

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

      {/* Toolbar: filters, bulk actions */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search routes... (name, origin, destination, tenant)"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="under_construction">Under Construction</option>
            <option value="blocked">Blocked</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
          >
            <option value="all">All Tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>

          <select
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <button className="px-3 py-2 border border-gray-200 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors">
            <FaDownload />
            <span>Export</span>
          </button>
        </div>

        {/* Bulk actions */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedRouteIds.length > 0 ? `${selectedRouteIds.length} selected` : `${total} routes`}
          </div>
          <div className="flex items-center space-x-2">
            <select
              className="px-2 py-1 border border-gray-200 rounded"
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

      {/* Routes Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRouteIds.length > 0 && selectedRouteIds.length === pagedRoutes.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRouteIds(pagedRoutes.map((r: Route) => r.id));
                      } else {
                        setSelectedRouteIds([]);
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">
                  <button 
                    className="flex items-center space-x-1"
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span>Route</span>
                    <FaSort />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Tenant</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Distance & Time</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Priority</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Traffic</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Performance</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagedRoutes.map((route: Route) => (
                <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedRouteIds.includes(route.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRouteIds([...selectedRouteIds, route.id]);
                        } else {
                          setSelectedRouteIds(selectedRouteIds.filter(id => id !== route.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <FaRoute className="text-white text-sm" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{route.name}</div>
                        <div className="text-sm text-gray-500 flex items-center space-x-1">
                          <FaMapMarkerAlt className="text-xs" />
                          <span>{route.origin}</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center space-x-1">
                          <FaMapMarkerAlt className="text-xs" />
                          <span>{route.destination}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <FaBuilding className="text-gray-400 text-sm" />
                      <span className="text-sm text-gray-900">{route.tenantName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <FaRoad className="text-gray-400 text-xs" />
                        <span className="text-sm font-medium">{route.distance.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FaClock className="text-gray-400 text-xs" />
                        <span className="text-xs text-gray-500">{route.estimatedTime}h estimated</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(route.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                        {route.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor((route.priority || 'medium') as string)}`}>
                      {((route.priority || 'medium') as string).charAt(0).toUpperCase() + ((route.priority || 'medium') as string).slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRouteTypeColor((route.routeType || 'highway') as string)}`}>
                      {((route.routeType || 'highway') as string).charAt(0).toUpperCase() + ((route.routeType || 'highway') as string).slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      {getTrafficIcon((route.trafficLevel || 'moderate') as string)}
                      <span className="text-xs text-gray-500 capitalize">{(route.trafficLevel || 'moderate') as string}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">{route.assignedTrucks} trucks</div>
                      <div className="text-xs text-gray-500">{route.completedTrips} trips</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedRoute(route);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button 
                        onClick={() => handleEditRoute(route)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDeleteRoute(route.id)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                      <button 
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Settings"
                      >
                        <FaCog />
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
        {/* Pagination */}
        <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            Showing {Math.min(endIdx, total)} of {total}
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="text-xs text-gray-700">Page {currentPage} / {totalPages}</span>
            <button
              className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Route Modal */}
      {isAdmin && showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Route</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Route Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter route name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tenant *
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                    >
                      <option value="">Select tenant</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Route Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Route Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Origin *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Starting location"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Destination *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="End location"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Distance (km) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={distance || ''}
                      onChange={(e) => setDistance(Number(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estimated Time (hours) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={estimatedTime || ''}
                      onChange={(e) => setEstimatedTime(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              {/* Route Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Route Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Route Type
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={routeType}
                      onChange={(e) => setRouteType(e.target.value as 'highway' | 'city' | 'rural' | 'mixed')}
                    >
                      <option value="highway">Highway</option>
                      <option value="city">City</option>
                      <option value="rural">Rural</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Toll Cost (RWF)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={tollCost || ''}
                      onChange={(e) => setTollCost(Number(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estimated Fuel Cost (RWF)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={fuelCost || ''}
                      onChange={(e) => setFuelCost(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <FaShieldAlt className="text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Route Information</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      This route will be available for the selected tenant's fleet operations. Ensure all information is accurate for optimal logistics planning.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-6 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoute}
                disabled={isCreating || !name || !tenantId || !origin || !destination || !distance || !estimatedTime}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCreating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isCreating ? 'Creating...' : 'Create Route'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {showEditModal && editingRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Route</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRoute(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Route Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter route name"
                      value={editingRoute.name}
                      onChange={(e) => setEditingRoute({ ...editingRoute, name: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tenant *
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editingRoute.tenantId}
                      onChange={(e) => setEditingRoute({ ...editingRoute, tenantId: e.target.value })}
                    >
                      <option value="">Select tenant</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Route Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Route Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Origin *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Starting location"
                      value={editingRoute.origin}
                      onChange={(e) => setEditingRoute({ ...editingRoute, origin: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Destination *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="End location"
                      value={editingRoute.destination}
                      onChange={(e) => setEditingRoute({ ...editingRoute, destination: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Distance (km) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={editingRoute.distance || ''}
                      onChange={(e) => setEditingRoute({ ...editingRoute, distance: Number(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estimated Time (hours) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={editingRoute.estimatedTime || ''}
                      onChange={(e) => setEditingRoute({ ...editingRoute, estimatedTime: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Route Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Route Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editingRoute.priority}
                      onChange={(e) => setEditingRoute({ ...editingRoute, priority: e.target.value as 'high' | 'medium' | 'low' })}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Route Type
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editingRoute.routeType}
                      onChange={(e) => setEditingRoute({ ...editingRoute, routeType: e.target.value as 'highway' | 'city' | 'rural' | 'mixed' })}
                    >
                      <option value="highway">Highway</option>
                      <option value="city">City</option>
                      <option value="rural">Rural</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Toll Cost (RWF)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={editingRoute.tollCost || ''}
                      onChange={(e) => setEditingRoute({ ...editingRoute, tollCost: Number(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estimated Fuel Cost (RWF)
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={editingRoute.fuelCost || ''}
                      onChange={(e) => setEditingRoute({ ...editingRoute, fuelCost: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <FaShieldAlt className="text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Route Information</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      This route will be available for the selected tenant's fleet operations. Ensure all information is accurate for optimal logistics planning.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRoute(null);
                }}
                className="px-6 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updateRoute()}
                disabled={isUpdating || !editingRoute.name || !editingRoute.tenantId || !editingRoute.origin || !editingRoute.destination || !editingRoute.distance || !editingRoute.estimatedTime}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isUpdating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Details Modal */}
      {showDetailsModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <FaRoute className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedRoute.name}</h2>
                    <p className="text-gray-600">{selectedRoute.origin} → {selectedRoute.destination}</p>
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
              {/* Status and Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                      {getStatusIcon((selectedRoute.status || 'active') as string)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor((selectedRoute.status || 'active') as string)}`}>
                        {((selectedRoute.status || 'active') as string).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedRoute.priority)}`}>
                    {((selectedRoute.priority || 'medium') as string).charAt(0).toUpperCase() + ((selectedRoute.priority || 'medium') as string).slice(1)} Priority
                  </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRouteTypeColor((selectedRoute.routeType || 'highway') as string)}`}>
                    {((selectedRoute.routeType || 'highway') as string).charAt(0).toUpperCase() + ((selectedRoute.routeType || 'highway') as string).slice(1)} Route
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Edit Route
                  </button>
                  <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                    View Map
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <FaRoad className="text-blue-600 text-lg" />
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{selectedRoute.distance.toLocaleString()}</div>
                      <div className="text-sm text-blue-700">Kilometers</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <FaClock className="text-green-600 text-lg" />
                    <div>
                      <div className="text-2xl font-bold text-green-900">{selectedRoute.estimatedTime}h</div>
                      <div className="text-sm text-green-700">Estimated Time</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <FaTruck className="text-purple-600 text-lg" />
                    <div>
                      <div className="text-2xl font-bold text-purple-900">{selectedRoute.assignedTrucks}</div>
                      <div className="text-sm text-purple-700">Assigned Trucks</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4">
                  <div className="flex items-center space-x-3">
                    <FaCheck className="text-yellow-600 text-lg" />
                    <div>
                      <div className="text-2xl font-bold text-yellow-900">{selectedRoute.completedTrips}</div>
                      <div className="text-sm text-yellow-700">Completed Trips</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Route Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedRoute.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Used:</span>
                      <span className="font-medium">{new Date(selectedRoute.lastUsed).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tenant:</span>
                      <span className="font-medium">{selectedRoute.tenantName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Traffic Level:</span>
                      <div className="flex items-center space-x-2">
                        {getTrafficIcon(selectedRoute.trafficLevel)}
                        <span className="font-medium capitalize">{selectedRoute.trafficLevel}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cost Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Toll Cost:</span>
                      <span className="font-medium">RWF {selectedRoute.tollCost?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Cost:</span>
                      <span className="font-medium">RWF {selectedRoute.fuelCost?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Cost:</span>
                      <span className="font-medium">RWF {((selectedRoute.tollCost || 0) + (selectedRoute.fuelCost || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {isTruckOwner && selectedRoute.tenantId === user?.tenantId && (
                  <button 
                    className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setRouteForAssignment(selectedRoute);
                      setShowAssignTrucksModal(true);
                    }}
                  >
                    <FaTruck className="text-gray-400" />
                    <span>Assign Trucks</span>
                  </button>
                  )}
                  <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span>View on Map</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <FaCog className="text-gray-400" />
                    <span>Route Settings</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 text-left border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-600">
                    <FaBan className="text-red-400" />
                    <span>Deactivate Route</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTruckOwner && showAssignTrucksModal && routeForAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Assign Trucks to {routeForAssignment.name}</h2>
              <button
                onClick={() => {
                  setShowAssignTrucksModal(false);
                  setRouteForAssignment(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Search trucks by plate number, status..."
                    value={truckSearchTerm}
                    onChange={(e) => setTruckSearchTerm(e.target.value)}
                  />
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    onClick={() => setTruckSearchTerm((s) => s.trim())}
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                {trucksLoading ? (
                  <div className="p-4 text-sm text-gray-500">Loading trucks...</div>
                ) : !trucksData || trucksData.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No trucks found.</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Truck</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Capacity</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(trucksData as FleetItem[]).map((truck) => (
                        <tr key={truck.id}>
                          <td className="px-4 py-2">
                            <div className="font-medium text-gray-900">{truck.plateNumber}</div>
                            <div className="text-xs text-gray-500">{truck.make} {truck.model} • {truck.year}</div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {truck.capacityWeight?.toLocaleString()} kg / {truck.capacityVolume?.toLocaleString()} m³
                          </td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 capitalize">{truck.status}</span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 disabled:opacity-50"
                              disabled={isAssigningRoute}
                              onClick={() => doAssignRouteToTruck({ truckId: truck.id, routeId: routeForAssignment.id })}
                            >
                              {isAssigningRoute ? 'Assigning...' : 'Assign to route'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
                  onClick={() => {
                    setShowAssignTrucksModal(false);
                    setRouteForAssignment(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoutes;


