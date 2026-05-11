import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createTenantRoute,
  fetchTenants,
  fetchAdminRoutes,
  updateTenantRoute,
  deleteTenantRoute,
  fetchRouteAnalytics,
  bulkUpdateRouteStatus
} from '../services/adminApi';
import { fleetApi, type FleetItem } from '../services/fleetApi';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../contexts/PermissionContext';
import {
  Map as LucideMap, Edit, Plus, Search, Download,
  Check, Ban, MapPin, Eye, X,
  ChevronsUpDown, Clock, Milestone, Truck, Settings,
  ShieldCheck, AlertTriangle,
  Play, Pause, Building2, Trash2
} from 'lucide-react';
import { FaShieldAlt } from 'react-icons/fa';
import AdminPageLayout from '../components/Admin/AdminPageLayout';
import { TranslatedText } from '../components/translated-text';
import ModernLoader from '../components/common/ModernLoader';

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
  assignedTrucks?: string[] | number; // Can be array of IDs or count
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
  const { hasPermission } = usePermission();

  // Permission-based access control with role fallback
  const canManageRoutes = hasPermission('route:manage') ||
    hasPermission('route:update') ||
    user?.role === 'ADMIN' ||
    user?.role === 'TENANT_ADMIN';

  const canCreateRoutes = hasPermission('route:create') ||
    user?.role === 'ADMIN' ||
    user?.role === 'TENANT_ADMIN';

  const canDeleteRoutes = hasPermission('route:delete') ||
    user?.role === 'ADMIN' ||
    user?.role === 'TENANT_ADMIN';


  const canAssignRoutes = hasPermission('route:assign') ||
    user?.role === 'TRUCK_OWNER' ||
    user?.role === 'FLEET_OWNER';

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
    mutationFn: () => {
      if (!tenantId) throw new Error('Please select a tenant');
      if (!name.trim()) throw new Error('Route name is required');
      if (!origin.trim()) throw new Error('Origin is required');
      if (!destination.trim()) throw new Error('Destination is required');
      if (distance <= 0) throw new Error('Distance must be greater than 0');
      if (estimatedTime <= 0) throw new Error('Estimated time must be greater than 0');

      return createTenantRoute(tenantId, {
        name: name.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        distance,
        estimatedTime,
        status: 'active',
        priority,
        routeType,
        tollCost: tollCost || 0,
        fuelCost: fuelCost || 0
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] });
      qc.invalidateQueries({ queryKey: ['route-analytics'] });
      resetForm();
      setShowCreateModal(false);
      toast.success('Route created successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to create route. Please try again.';
      toast.error(errorMessage);
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
      qc.invalidateQueries({ queryKey: ['fleet-trucks'] });
      setShowAssignTrucksModal(false);
      setRouteForAssignment(null);
      toast.success('Route assigned to truck successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to assign route to truck. Please try again.';
      toast.error(errorMessage);
    },
  });

  const { mutate: updateRoute, isPending: isUpdating } = useMutation({
    mutationFn: () => {
      if (!editingRoute) throw new Error('No route to update');
      if (!editingRoute.name?.trim()) throw new Error('Route name is required');
      if (!editingRoute.origin?.trim()) throw new Error('Origin is required');
      if (!editingRoute.destination?.trim()) throw new Error('Destination is required');
      if (editingRoute.distance <= 0) throw new Error('Distance must be greater than 0');
      if (editingRoute.estimatedTime <= 0) throw new Error('Estimated time must be greater than 0');

      return updateTenantRoute(editingRoute.id, {
        name: editingRoute.name.trim(),
        origin: editingRoute.origin.trim(),
        destination: editingRoute.destination.trim(),
        distance: editingRoute.distance,
        estimatedTime: editingRoute.estimatedTime,
        priority: editingRoute.priority,
        routeType: editingRoute.routeType,
        tollCost: editingRoute.tollCost || 0,
        fuelCost: editingRoute.fuelCost || 0
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] });
      qc.invalidateQueries({ queryKey: ['route-analytics'] });
      setShowEditModal(false);
      setEditingRoute(null);
      toast.success('Route updated successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to update route. Please try again.';
      toast.error(errorMessage);
      console.error('Error updating route:', error);
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


  // Status update mutation
  const { mutate: updateRouteStatus, isPending: isUpdatingStatus } = useMutation({
    mutationFn: ({ routeId, status }: { routeId: string; status: string }) =>
      updateTenantRoute(routeId, { status }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] });
      qc.invalidateQueries({ queryKey: ['route-analytics'] });
      toast.success(`Route status updated to ${variables.status.replace('_', ' ')}`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to update route status. Please try again.';
      toast.error(errorMessage);
    }
  });

  // Bulk status update mutation
  const { mutate: bulkUpdateStatus, isPending: isBulkUpdating } = useMutation({
    mutationFn: ({ routeIds, status }: { routeIds: string[]; status: string }) =>
      bulkUpdateRouteStatus(routeIds, status),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] });
      qc.invalidateQueries({ queryKey: ['route-analytics'] });
      setSelectedRouteIds([]);
      toast.success(`${variables.routeIds.length} route(s) status updated to ${variables.status.replace('_', ' ')}`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to update route statuses. Please try again.';
      toast.error(errorMessage);
    }
  });

  // Bulk delete mutation
  const { mutate: bulkDeleteRoutes } = useMutation({
    mutationFn: async (routeIds: string[]) => {
      await Promise.all(routeIds.map(id => deleteTenantRoute(id)));
    },
    onSuccess: (_, routeIds) => {
      qc.invalidateQueries({ queryKey: ['admin-routes'] });
      qc.invalidateQueries({ queryKey: ['route-analytics'] });
      setSelectedRouteIds([]);
      toast.success(`${routeIds.length} route(s) deleted successfully!`);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to delete routes. Please try again.';
      toast.error(errorMessage);
    }
  });

  const handleStatusUpdate = (routeId: string, newStatus: string) => {
    updateRouteStatus({ routeId, status: newStatus });
  };

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedRouteIds.length === 0) {
      toast.error('Please select at least one route');
      return;
    }
    if (window.confirm(`Update ${selectedRouteIds.length} route(s) status to ${status.replace('_', ' ')}?`)) {
      bulkUpdateStatus({ routeIds: selectedRouteIds, status });
    }
  };

  const handleBulkDelete = () => {
    if (selectedRouteIds.length === 0) {
      toast.error('Please select at least one route');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedRouteIds.length} route(s)? This action cannot be undone.`)) {
      bulkDeleteRoutes(selectedRouteIds);
    }
  };

  // Get tenants for dropdown and create tenant map
  const tenants: Tenant[] = tenantsData?.tenants || [];
  const tenantMap = new Map<string, string>();
  tenants.forEach((tenant) => {
    tenantMap.set(tenant.id, tenant.name);
  });

  // Use real data from API - ensure it's always an array and map tenant names
  const routes: Route[] = (Array.isArray(routesData) ? routesData : (routesData?.routes || [])).map((route: any) => ({
    ...route,
    tenantName: tenantMap.get(route.tenantId) || route.tenant?.name || route.tenantName || 'N/A'
  }));

  // Filter and sort routes
  const filteredRoutes = routes
    .filter((route: Route) => {
      const matchesSearch = route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.tenantName?.toLowerCase().includes(searchTerm.toLowerCase());
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

  // Use real analytics data with proper null checks
  const stats = [
    {
      label: <TranslatedText text="Total Routes" />,
      value: analyticsData?.totalRoutes ?? routes.length,
      icon: LucideMap,
      color: 'from-gray-600 to-gray-700',
      description: <TranslatedText text="All registered routes" />
    },
    {
      label: <TranslatedText text="Active Routes" />,
      value: analyticsData?.activeRoutes ?? routes.filter((r: Route) => r.status === 'active').length,
      icon: Check,
      color: 'from-gray-600 to-gray-700',
      description: <TranslatedText text="Currently operational" />
    },
    {
      label: <TranslatedText text="Total Distance" />,
      value: `${(analyticsData?.totalDistance ?? routes.reduce((sum: number, r: Route) => sum + (r.distance || 0), 0)).toLocaleString()} km`,
      icon: Milestone,
      color: 'from-gray-600 to-gray-700',
      description: <TranslatedText text="Combined route distance" />
    },
    {
      label: <TranslatedText text="Assigned Trucks" />,
      value: routes.reduce((sum: number, r: Route) => {
        if (Array.isArray(r.assignedTrucks)) {
          return sum + r.assignedTrucks.length;
        }
        return sum + (typeof r.assignedTrucks === 'number' ? r.assignedTrucks : 0);
      }, 0),
      icon: Truck,
      color: 'from-gray-600 to-gray-700',
      description: <TranslatedText text="Trucks using routes" />
    },
  ];

  // Loading state
  if (routesLoading || tenantsLoading) {
    return <ModernLoader isLoading={true} type="table" />;
  }

  // Error state
  if (routesError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="text-red-500 text-lg" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-gray-900"><TranslatedText text="Error Loading Routes" /></h2>
          <p className="mt-1.5 text-sm text-gray-600"><TranslatedText text="Failed to load route data. Please try again later." /></p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-2.5 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
          >
            <TranslatedText text="Retry" />
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
      case 'active': return <Play size={12} className="text-green-500" />;
      case 'inactive': return <Pause size={12} className="text-gray-500" />;
      case 'under_construction': return <AlertTriangle size={12} className="text-yellow-500" />;
      case 'blocked': return <Ban size={12} className="text-red-500" />;
      default: return <Pause size={12} className="text-gray-500" />;
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
    if (!canCreateRoutes) return;
    createRoute();
  };

  return (
    <AdminPageLayout
      title={<TranslatedText text="Route Management" />}
      description={<TranslatedText text="Manage logistics routes and transportation corridors" />}
      actions={
        canCreateRoutes && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all duration-200 text-sm font-bold"
          >
            <Plus size={16} />
            <span><TranslatedText text="Add Route" /></span>
          </button>
        )
      }
    >

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-black text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-gray-900 transition-colors">
                    <Icon className="text-white" size={20} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar: filters, bulk actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search routes..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all"><TranslatedText text="All Status" /></option>
            <option value="active"><TranslatedText text="Active" /></option>
            <option value="inactive"><TranslatedText text="Inactive" /></option>
            <option value="under_construction"><TranslatedText text="Under Construction" /></option>
            <option value="blocked"><TranslatedText text="Blocked" /></option>
          </select>

          <select
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
          >
            <option value="all"><TranslatedText text="All Tenants" /></option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
            ))}
          </select>

          <select
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all"><TranslatedText text="All Priorities" /></option>
            <option value="high"><TranslatedText text="High Priority" /></option>
            <option value="medium"><TranslatedText text="Medium Priority" /></option>
            <option value="low"><TranslatedText text="Low Priority" /></option>
          </select>

          <button className="px-4 py-2 text-sm border border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span><TranslatedText text="Export" /></span>
          </button>
        </div>

        {/* Bulk actions */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600">
              {selectedRouteIds.length > 0 ? `${selectedRouteIds.length} selected` : `${total} routes`}
            </div>
            {selectedRouteIds.length > 0 && canManageRoutes && (
              <div className="flex items-center gap-1.5">
                <select
                  className="px-1.5 py-0.5 text-xs border border-gray-200 rounded"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkStatusUpdate(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  disabled={isBulkUpdating}
                >
                  <option value=""><TranslatedText text="Bulk Status Update" /></option>
                  <option value="active"><TranslatedText text="Set Active" /></option>
                  <option value="inactive"><TranslatedText text="Set Inactive" /></option>
                  <option value="under_construction"><TranslatedText text="Set Under Construction" /></option>
                  <option value="blocked"><TranslatedText text="Set Blocked" /></option>
                </select>
                {canDeleteRoutes && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-1.5 py-0.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                    disabled={isBulkUpdating}
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    <TranslatedText text="Delete Selected" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedRouteIds([])}
                  className="px-1.5 py-0.5 text-xs text-gray-600 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                >
                  <TranslatedText text="Clear" />
                </button>
              </div>
            )}
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

      {/* Routes Table */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-1.5 w-8">
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
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs">
                  <button
                    className="flex items-center gap-1"
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    <span><TranslatedText text="Route" /></span>
                    <ChevronsUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs"><TranslatedText text="Tenant" /></th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs"><TranslatedText text="Distance & Time" /></th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs"><TranslatedText text="Status" /></th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs"><TranslatedText text="Priority" /></th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs"><TranslatedText text="Type" /></th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs"><TranslatedText text="Traffic" /></th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs"><TranslatedText text="Performance" /></th>
                <th className="px-2 py-1.5 text-left font-semibold text-gray-900 text-xs"><TranslatedText text="Actions" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pagedRoutes.map((route: Route) => (
                <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-1.5 w-8">
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
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <LucideMap className="text-white" size={14} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-xs">{route.name}</div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{route.origin}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{route.destination}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <Building2 className="text-gray-400" size={12} />
                      <span className="text-xs text-gray-900">{route.tenantName}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-0.5">
                        <Milestone className="text-gray-400" size={10} />
                        <span className="text-xs font-medium">{(route.distance || 0).toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Clock className="text-gray-400" size={10} />
                        <span className="text-[10px] text-gray-500">{route.estimatedTime}h</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px]">{getStatusIcon(route.status)}</span>
                      {canManageRoutes ? (
                        <select
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border-0 ${getStatusColor(route.status)} cursor-pointer`}
                          value={route.status}
                          onChange={(e) => handleStatusUpdate(route.id, e.target.value)}
                          disabled={isUpdatingStatus}
                        >
                          <option value="active"><TranslatedText text="Active" /></option>
                          <option value="inactive"><TranslatedText text="Inactive" /></option>
                          <option value="under_construction"><TranslatedText text="Under Construction" /></option>
                          <option value="blocked"><TranslatedText text="Blocked" /></option>
                        </select>
                      ) : (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(route.status)}`}>
                          {route.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getPriorityColor((route.priority || 'medium') as string)}`}>
                      {((route.priority || 'medium') as string).charAt(0).toUpperCase() + ((route.priority || 'medium') as string).slice(1)}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getRouteTypeColor((route.routeType || 'highway') as string)}`}>
                      {((route.routeType || 'highway') as string).charAt(0).toUpperCase() + ((route.routeType || 'highway') as string).slice(1)}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      {getTrafficIcon((route.trafficLevel || 'moderate') as string)}
                      <span className="text-[10px] text-gray-500 capitalize">{(route.trafficLevel || 'moderate') as string}</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-gray-900">
                        {Array.isArray(route.assignedTrucks) ? route.assignedTrucks.length : (typeof route.assignedTrucks === 'number' ? route.assignedTrucks : 0)} trucks
                      </div>
                      <div className="text-[10px] text-gray-500">{route.completedTrips || 0} trips</div>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedRoute(route);
                          setShowDetailsModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleEditRoute(route)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between p-2 border-t border-gray-200 bg-gray-50">
          <div className="text-[10px] text-gray-600">
            <TranslatedText text="Showing" /> {Math.min(endIdx, total)} <TranslatedText text="of" /> {total}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="px-1.5 py-0.5 text-xs border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <TranslatedText text="Previous" />
            </button>
            <span className="text-[10px] text-gray-700"><TranslatedText text="Page" /> {currentPage} / {totalPages}</span>
            <button
              className="px-1.5 py-0.5 text-xs border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-100"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <TranslatedText text="Next" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Route Modal */}
      {canCreateRoutes && showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900"><TranslatedText text="Create New Route" /></h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 space-y-3">
              {/* Basic Information */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-900"><TranslatedText text="Basic Information" /></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      <TranslatedText text="Route Name" /> *
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter route name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      <TranslatedText text="Tenant" /> *
                    </label>
                    <select
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                    >
                      <option value=""><TranslatedText text="Select tenant" /></option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Route Details */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-900"><TranslatedText text="Route Details" /></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      <TranslatedText text="Origin" /> *
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Starting location"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      <TranslatedText text="Destination" /> *
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="End location"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      <TranslatedText text="Distance (km)" /> *
                    </label>
                    <input
                      type="number"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={distance || ''}
                      onChange={(e) => setDistance(Number(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      <TranslatedText text="Estimated Time (hours)" /> *
                    </label>
                    <input
                      type="number"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={estimatedTime || ''}
                      onChange={(e) => setEstimatedTime(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              {/* Route Configuration */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-900"><TranslatedText text="Route Configuration" /></h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      <TranslatedText text="Priority" />
                    </label>
                    <select
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                    >
                      <option value="low"><TranslatedText text="Low Priority" /></option>
                      <option value="medium"><TranslatedText text="Medium Priority" /></option>
                      <option value="high"><TranslatedText text="High Priority" /></option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      <TranslatedText text="Route Type" />
                    </label>
                    <select
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={routeType}
                      onChange={(e) => setRouteType(e.target.value as 'highway' | 'city' | 'rural' | 'mixed')}
                    >
                      <option value="highway"><TranslatedText text="Highway" /></option>
                      <option value="city"><TranslatedText text="City" /></option>
                      <option value="rural"><TranslatedText text="Rural" /></option>
                      <option value="mixed"><TranslatedText text="Mixed" /></option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      <TranslatedText text="Toll Cost (RWF)" />
                    </label>
                    <input
                      type="number"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={tollCost || ''}
                      onChange={(e) => setTollCost(Number(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      <TranslatedText text="Estimated Fuel Cost (RWF)" />
                    </label>
                    <input
                      type="number"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={fuelCost || ''}
                      onChange={(e) => setFuelCost(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <div className="flex items-start gap-1.5">
                  <FaShieldAlt className="text-blue-600 mt-0.5 text-xs" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-xs"><TranslatedText text="Route Information" /></h4>
                    <p className="text-[10px] text-blue-700 mt-0.5">
                      <TranslatedText text="This route will be available for the selected tenant's fleet operations. Ensure all information is accurate for optimal logistics planning." />
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TranslatedText text="Cancel" />
              </button>
              <button
                onClick={handleCreateRoute}
                disabled={isCreating || !name || !tenantId || !origin || !destination || !distance || !estimatedTime}
                className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
              >
                {isCreating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isCreating ? <TranslatedText text="Creating..." /> : <TranslatedText text="Create Route" />}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {showEditModal && editingRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900"><TranslatedText text="Edit Route" /></h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRoute(null);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 space-y-3">
              {/* Basic Information */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Route Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter route name"
                      value={editingRoute.name}
                      onChange={(e) => setEditingRoute({ ...editingRoute, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tenant *
                    </label>
                    <select
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-900">Route Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Origin *
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Starting location"
                      value={editingRoute.origin}
                      onChange={(e) => setEditingRoute({ ...editingRoute, origin: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Destination *
                    </label>
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="End location"
                      value={editingRoute.destination}
                      onChange={(e) => setEditingRoute({ ...editingRoute, destination: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Distance (km) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={editingRoute.distance || ''}
                      onChange={(e) => setEditingRoute({ ...editingRoute, distance: Number(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Estimated Time (hours) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={editingRoute.estimatedTime || ''}
                      onChange={(e) => setEditingRoute({ ...editingRoute, estimatedTime: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Route Configuration */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-900">Route Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editingRoute.priority}
                      onChange={(e) => setEditingRoute({ ...editingRoute, priority: e.target.value as 'high' | 'medium' | 'low' })}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Route Type
                    </label>
                    <select
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Toll Cost (RWF)
                    </label>
                    <input
                      type="number"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={editingRoute.tollCost || ''}
                      onChange={(e) => setEditingRoute({ ...editingRoute, tollCost: Number(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Estimated Fuel Cost (RWF)
                    </label>
                    <input
                      type="number"
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                      value={editingRoute.fuelCost || ''}
                      onChange={(e) => setEditingRoute({ ...editingRoute, fuelCost: Number(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <div className="flex items-start gap-1.5">
                  <FaShieldAlt className="text-blue-600 mt-0.5 text-xs" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-xs">Route Information</h4>
                    <p className="text-[10px] text-blue-700 mt-0.5">
                      This route will be available for the selected tenant's fleet operations. Ensure all information is accurate for optimal logistics planning.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRoute(null);
                }}
                className="px-2.5 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TranslatedText text="Cancel" />
              </button>
              <button
                onClick={() => updateRoute()}
                disabled={isUpdating || !editingRoute.name || !editingRoute.tenantId || !editingRoute.origin || !editingRoute.destination || !editingRoute.distance || !editingRoute.estimatedTime}
                className="px-2.5 py-1.5 text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
              >
                {isUpdating && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                <span>{isUpdating ? <TranslatedText text="Saving..." /> : <TranslatedText text="Save Changes" />}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Route Details Modal */}
      {showDetailsModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <LucideMap className="text-white" size={16} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedRoute.name}</h2>
                    <p className="text-xs text-gray-600">{selectedRoute.origin} → {selectedRoute.destination}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 space-y-3">
              {/* Status and Type */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2 flex-wrap">
                  <div className="flex items-center space-x-1.5">
                    {getStatusIcon((selectedRoute.status || 'active') as string)}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor((selectedRoute.status || 'active') as string)}`}>
                      {((selectedRoute.status || 'active') as string).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getPriorityColor(selectedRoute.priority)}`}>
                    {((selectedRoute.priority || 'medium') as string).charAt(0).toUpperCase() + ((selectedRoute.priority || 'medium') as string).slice(1)} Priority
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getRouteTypeColor((selectedRoute.routeType || 'highway') as string)}`}>
                    {((selectedRoute.routeType || 'highway') as string).charAt(0).toUpperCase() + ((selectedRoute.routeType || 'highway') as string).slice(1)} Route
                  </span>
                </div>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => {
                      handleEditRoute(selectedRoute);
                      setShowDetailsModal(false);
                    }}
                    className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <TranslatedText text="Edit Route" />
                  </button>
                  <button className="px-2.5 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                    <TranslatedText text="View Map" />
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-2">
                  <div className="flex items-center space-x-2">
                    <Milestone className="text-indigo-600" size={14} />
                    <div>
                      <div className="text-base font-bold text-indigo-900">{(selectedRoute.distance || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-indigo-700"><TranslatedText text="Kilometers" /></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="text-emerald-600" size={14} />
                    <div>
                      <div className="text-base font-bold text-emerald-900">{selectedRoute.estimatedTime}h</div>
                      <div className="text-[10px] text-emerald-700"><TranslatedText text="Estimated Time" /></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-2">
                  <div className="flex items-center space-x-2">
                    <Truck className="text-indigo-600" size={14} />
                    <div>
                      <div className="text-base font-bold text-indigo-900">
                        {Array.isArray(selectedRoute.assignedTrucks) ? selectedRoute.assignedTrucks.length : (typeof selectedRoute.assignedTrucks === 'number' ? selectedRoute.assignedTrucks : 0)}
                      </div>
                      <div className="text-[10px] text-indigo-700"><TranslatedText text="Assigned Trucks" /></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-2">
                  <div className="flex items-center space-x-2">
                    <Check className="text-amber-600" size={14} />
                    <div>
                      <div className="text-base font-bold text-amber-900">{selectedRoute.completedTrips || 0}</div>
                      <div className="text-[10px] text-amber-700"><TranslatedText text="Completed Trips" /></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900"><TranslatedText text="Route Information" /></h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600"><TranslatedText text="Created:" /></span>
                      <span className="font-medium">{new Date(selectedRoute.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600"><TranslatedText text="Last Used:" /></span>
                      <span className="font-medium">{selectedRoute.lastUsed ? new Date(selectedRoute.lastUsed).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600"><TranslatedText text="Tenant:" /></span>
                      <span className="font-medium">{selectedRoute.tenantName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600"><TranslatedText text="Traffic Level:" /></span>
                      <div className="flex items-center space-x-1.5">
                        {getTrafficIcon(selectedRoute.trafficLevel)}
                        <span className="font-medium capitalize text-[10px]">{selectedRoute.trafficLevel || 'moderate'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-900"><TranslatedText text="Cost Information" /></h3>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600"><TranslatedText text="Toll Cost:" /></span>
                      <span className="font-medium">RWF {(selectedRoute.tollCost || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600"><TranslatedText text="Fuel Cost:" /></span>
                      <span className="font-medium">RWF {(selectedRoute.fuelCost || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600"><TranslatedText text="Total Cost:" /></span>
                      <span className="font-medium">RWF {((selectedRoute.tollCost || 0) + (selectedRoute.fuelCost || 0)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-900"><TranslatedText text="Quick Actions" /></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {canAssignRoutes && selectedRoute.tenantId === user?.tenantId && (
                    <button
                      className="w-full flex items-center space-x-2 p-3 text-left border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-sm group"
                      onClick={() => {
                        setRouteForAssignment(selectedRoute);
                        setShowAssignTrucksModal(true);
                      }}
                    >
                      <Truck className="text-gray-400 group-hover:text-indigo-600" size={18} />
                      <span className="font-medium text-gray-700 group-hover:text-indigo-600"><TranslatedText text="Assign Trucks" /></span>
                    </button>
                  )}
                  <button className="w-full flex items-center space-x-2 p-3 text-left border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-sm group">
                    <MapPin className="text-gray-400 group-hover:text-indigo-600" size={18} />
                    <span className="font-medium text-gray-700 group-hover:text-indigo-600"><TranslatedText text="View on Map" /></span>
                  </button>
                  <button className="w-full flex items-center space-x-2 p-3 text-left border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-sm group">
                    <Settings className="text-gray-400 group-hover:text-indigo-600" size={18} />
                    <span className="font-medium text-gray-700 group-hover:text-indigo-600"><TranslatedText text="Route Settings" /></span>
                  </button>
                  <button className="w-full flex items-center space-x-2 p-3 text-left border border-red-200 rounded-xl hover:bg-red-50 transition-all text-red-600 text-sm group">
                    <Ban className="text-red-400 group-hover:text-red-600" size={18} />
                    <span className="font-medium group-hover:text-red-600"><TranslatedText text="Deactivate Route" /></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {canAssignRoutes && showAssignTrucksModal && routeForAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900"><TranslatedText text="Assign Trucks to" /> {routeForAssignment.name}</h2>
              <button
                onClick={() => {
                  setShowAssignTrucksModal(false);
                  setRouteForAssignment(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={20} />
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
                    <TranslatedText text="Search" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                {trucksLoading ? (
                  <div className="p-4 text-sm text-gray-500"><TranslatedText text="Loading trucks..." /></div>
                ) : !trucksData || trucksData.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500"><TranslatedText text="No trucks found." /></div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700"><TranslatedText text="Truck" /></th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700"><TranslatedText text="Capacity" /></th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700"><TranslatedText text="Status" /></th>
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
                              {isAssigningRoute ? <TranslatedText text="Assigning..." /> : <TranslatedText text="Assign to route" />}
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
                  <TranslatedText text="Close" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modals placed outside the main layout structure if needed, or keeping them here is fine as they are portals/overlays */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          {/* Create Modal Content - kept as is */}
        </div>
      )}

      {/* ... other modals ... */}
    </AdminPageLayout>
  );
};

export default AdminRoutes;


