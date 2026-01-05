import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fleetApi, type Route, type FleetItem } from '../../services/fleetApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaRoute,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaMapMarkerAlt,
  FaRoad,
  FaClock,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaEye,
  FaDownload,
  FaSync,
} from 'react-icons/fa';

interface RouteStats {
  totalRoutes: number;
  activeRoutes: number;
  inactiveRoutes: number;
  totalDistance: number;
  assignedTrucks: number;
}

const TenantAdminRoutes: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'distance' | 'status' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    destination: '',
    distance: 0,
    estimatedTime: 0,
    status: 'active',
    description: '',
    isActive: true,
  });

  // Fetch routes
  const {
    data: routes = [],
    isLoading: routesLoading,
    error: routesError,
    refetch: refetchRoutes,
  } = useQuery({
    queryKey: ['tenant-routes'],
    queryFn: async () => {
      const data = await fleetApi.fetchRoutes();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch trucks for assignment
  const { data: trucks = [] } = useQuery({
    queryKey: ['tenant-trucks'],
    queryFn: async () => {
      const data = await fleetApi.getTrucks({});
      return Array.isArray(data) ? data : [];
    },
  });

  // Create route mutation
  const createMutation = useMutation({
    mutationFn: async (routeData: Partial<Route>) => {
      return await fleetApi.createRoute(routeData);
    },
    onSuccess: () => {
      toast.success('Route created successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-routes'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create route');
    },
  });

  // Update route mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Route> }) => {
      return await fleetApi.updateRoute(id, data);
    },
    onSuccess: () => {
      toast.success('Route updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-routes'] });
      setShowEditModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update route');
    },
  });

  // Delete route mutation
  const deleteMutation = useMutation({
    mutationFn: async (routeId: string) => {
      return await fleetApi.deleteRoute(routeId);
    },
    onSuccess: () => {
      toast.success('Route deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-routes'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete route');
    },
  });

  // Assign route to truck mutation
  const assignMutation = useMutation({
    mutationFn: async ({ routeId, truckId }: { routeId: string; truckId: string }) => {
      return await fleetApi.assignRouteToTruck(truckId, routeId);
    },
    onSuccess: () => {
      toast.success('Route assigned to truck successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-routes'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-trucks'] });
      setShowAssignModal(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to assign route');
    },
  });

  // Calculate statistics
  const stats: RouteStats = useMemo(() => {
    const totalRoutes = routes.length;
    const activeRoutes = routes.filter((r) => r.status?.toLowerCase() === 'active').length;
    const inactiveRoutes = totalRoutes - activeRoutes;
    const totalDistance = routes.reduce((sum, r) => {
      const distance = typeof r.distance === 'number' ? r.distance : Number(r.distance) || 0;
      return sum + distance;
    }, 0);
    const assignedTrucks = new Set(
      routes.flatMap((r) => (Array.isArray(r.assignedTrucks) ? r.assignedTrucks : [])),
    ).size;

    return {
      totalRoutes,
      activeRoutes,
      inactiveRoutes,
      totalDistance,
      assignedTrucks,
    };
  }, [routes]);

  // Filter and sort routes
  const filteredAndSortedRoutes = useMemo(() => {
    const filtered = routes.filter((route) => {
      const matchesSearch =
        !searchTerm ||
        route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.destination?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || route.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'distance':
          aValue = a.distance || 0;
          bValue = b.distance || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [routes, searchTerm, statusFilter, sortBy, sortOrder]);

  const resetForm = () => {
    setFormData({
      name: '',
      origin: '',
      destination: '',
      distance: 0,
      estimatedTime: 0,
      status: 'active',
      description: '',
      isActive: true,
    });
    setEditingRoute(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name || '',
      origin: route.origin || '',
      destination: route.destination || '',
      distance: route.distance || 0,
      estimatedTime: route.estimatedDuration || route.estimatedTime || 0,
      status: (route.status || 'active').toLowerCase(),
      description: route.description || '',
      isActive: route.isActive !== false,
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (route: Route) => {
    setSelectedRoute(route);
    setShowDetailsModal(true);
  };

  const openAssignModal = (route: Route) => {
    setSelectedRoute(route);
    setShowAssignModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      origin: formData.origin,
      destination: formData.destination,
      distance: Number(formData.distance),
      estimatedTime: Number(formData.estimatedTime),
      estimatedDuration: Number(formData.estimatedTime),
      status: formData.status,
      description: formData.description,
      isActive: formData.isActive,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;
    updateMutation.mutate({
      id: editingRoute.id,
      data: {
        name: formData.name,
        origin: formData.origin,
        destination: formData.destination,
        distance: Number(formData.distance),
        estimatedTime: Number(formData.estimatedTime),
        estimatedDuration: Number(formData.estimatedTime),
        status: formData.status,
        description: formData.description,
        isActive: formData.isActive,
      },
    });
  };

  const handleDelete = async (route: Route) => {
    if (!confirm(`Are you sure you want to delete route "${route.name}"?`)) return;
    deleteMutation.mutate(route.id);
  };

  const handleAssign = async (truckId: string) => {
    if (!selectedRoute) return;
    assignMutation.mutate({ routeId: selectedRoute.id, truckId });
  };

  const getStatusColor = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') return 'bg-green-100 text-green-800';
    if (s === 'inactive') return 'bg-gray-100 text-gray-800';
    if (s === 'maintenance') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') return <FaCheckCircle className="w-4 h-4" />;
    if (s === 'inactive') return <FaTimesCircle className="w-4 h-4" />;
    if (s === 'maintenance') return <FaExclamationTriangle className="w-4 h-4" />;
    return <FaTimesCircle className="w-4 h-4" />;
  };

  if (routesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaRoute className="text-blue-600" />
              Route Management
            </h1>
            <p className="text-gray-600 mt-2">Manage and monitor your tenant routes</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetchRoutes()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <FaSync className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              New Route
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Routes</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalRoutes}</p>
              </div>
              <FaRoute className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active Routes</p>
                <p className="text-2xl font-bold text-green-900">{stats.activeRoutes}</p>
              </div>
              <FaCheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Inactive Routes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactiveRoutes}</p>
              </div>
              <FaTimesCircle className="w-8 h-8 text-gray-600 opacity-50" />
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Distance</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.totalDistance.toFixed(0)} km
                </p>
              </div>
              <FaRoad className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Assigned Trucks</p>
                <p className="text-2xl font-bold text-orange-900">{stats.assignedTrucks}</p>
              </div>
              <FaTruck className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="name">Sort by Name</option>
            <option value="distance">Sort by Distance</option>
            <option value="status">Sort by Status</option>
            <option value="createdAt">Sort by Date</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <FaFilter className="w-4 h-4" />
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>
      </div>

      {/* Routes Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {routesError ? (
          <div className="p-6 text-center">
            <div className="text-red-600 mb-2">Failed to load routes</div>
            <button
              onClick={() => refetchRoutes()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredAndSortedRoutes.length === 0 ? (
          <div className="p-12 text-center">
            <FaRoute className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No routes found</p>
            <p className="text-gray-500 text-sm mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first route to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Route
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ETA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Trucks
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{route.name}</div>
                      {route.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {route.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FaMapMarkerAlt className="w-4 h-4 text-green-500" />
                        {route.origin}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FaMapMarkerAlt className="w-4 h-4 text-red-500" />
                        {route.destination}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      <div className="flex items-center gap-2">
                        <FaRoad className="w-4 h-4 text-gray-400" />
                        {route.distance || 0} km
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      <div className="flex items-center gap-2">
                        <FaClock className="w-4 h-4 text-gray-400" />
                        {route.estimatedDuration || route.estimatedTime || 0} hrs
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          route.status,
                        )}`}
                      >
                        {getStatusIcon(route.status)}
                        {(route.status || 'active').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FaTruck className="w-4 h-4 text-gray-400" />
                        {Array.isArray(route.assignedTrucks)
                          ? route.assignedTrucks.length
                          : route.assignedTrucks || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailsModal(route)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(route)}
                          className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded transition-colors"
                          title="Edit Route"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openAssignModal(route)}
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-colors"
                          title="Assign to Truck"
                        >
                          <FaTruck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(route)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                          title="Delete Route"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Route Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaPlus className="text-blue-600" />
                Create New Route
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Nairobi to Mombasa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Origin *</label>
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Nairobi, Kenya"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Mombasa, Kenya"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance (km) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.1}
                    value={formData.distance}
                    onChange={(e) =>
                      setFormData({ ...formData, distance: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Time (hours) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.1}
                    value={formData.estimatedTime}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedTime: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Route description, notes, or special instructions..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Route is active
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaPlus className="w-4 h-4" />
                      Create Route
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {showEditModal && editingRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaEdit className="text-blue-600" />
                Edit Route
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Origin *</label>
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance (km) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.1}
                    value={formData.distance}
                    onChange={(e) =>
                      setFormData({ ...formData, distance: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Time (hours) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.1}
                    value={formData.estimatedTime}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedTime: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveEdit"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActiveEdit" className="text-sm text-gray-700">
                  Route is active
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaEdit className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Route Details Modal */}
      {showDetailsModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaRoute className="text-blue-600" />
                Route Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Route Name</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedRoute.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      selectedRoute.status,
                    )}`}
                  >
                    {getStatusIcon(selectedRoute.status)}
                    {(selectedRoute.status || 'active').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Origin</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <FaMapMarkerAlt className="w-4 h-4 text-green-500" />
                    {selectedRoute.origin}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Destination</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <FaMapMarkerAlt className="w-4 h-4 text-red-500" />
                    {selectedRoute.destination}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Distance</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <FaRoad className="w-4 h-4 text-gray-400" />
                    {selectedRoute.distance || 0} km
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estimated Time</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <FaClock className="w-4 h-4 text-gray-400" />
                    {selectedRoute.estimatedDuration || selectedRoute.estimatedTime || 0} hours
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned Trucks</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <FaTruck className="w-4 h-4 text-gray-400" />
                    {Array.isArray(selectedRoute.assignedTrucks)
                      ? selectedRoute.assignedTrucks.length
                      : selectedRoute.assignedTrucks || 0}
                  </p>
                </div>
              </div>
              {selectedRoute.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1">{selectedRoute.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Route to Truck Modal */}
      {showAssignModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaTruck className="text-green-600" />
                Assign Route to Truck
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Select a truck to assign route: <strong>{selectedRoute.name}</strong>
                </p>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {trucks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No trucks available</p>
                ) : (
                  trucks.map((truck) => {
                    const isAssigned = Array.isArray(selectedRoute.assignedTrucks)
                      ? selectedRoute.assignedTrucks.includes(truck.id)
                      : false;
                    return (
                      <div
                        key={truck.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          isAssigned
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <FaTruck className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {truck.plateNumber} - {truck.make} {truck.model}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Status: {truck.status} | Capacity: {truck.capacityWeight} kg
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            {isAssigned ? (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-2">
                                <FaCheckCircle className="w-4 h-4" />
                                Assigned
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAssign(truck.id)}
                                disabled={assignMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Assign
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantAdminRoutes;

