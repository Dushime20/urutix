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
  FaSync
} from 'react-icons/fa';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../EnliteUI/Tables';

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
    <div className="space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="ui-page-title flex items-center gap-3">
              <FaRoute className="text-blue-600 flex-shrink-0" />
              Route Management
            </h1>
            <p className="ui-body-small mt-2">Manage and monitor your tenant routes</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => refetchRoutes()}
              className="px-3 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm"
            >
              <FaSync className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={openCreateModal}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
            >
              <FaPlus className="w-4 h-4" />
              <span className="hidden sm:inline">New Route</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="distance">Sort by Distance</option>
            <option value="status">Sort by Status</option>
            <option value="createdAt">Sort by Date</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <FaFilter className="w-4 h-4" />
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>
      </div>

      {/* Routes Table */}
      <StandardDataTable
        title="Routes"
        icon={<FaRoute className="w-5 h-5" />}
        headerColor="primary"
        columns={[
          {
            key: 'name',
            label: 'Route Name',
            sortable: true,
            render: (_: any, route: Route) => (
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{route.name}</div>
                {route.description && (
                  <div className="text-xs text-slate-500 truncate max-w-xs">{route.description}</div>
                )}
              </div>
            ),
          },
          {
            key: 'origin',
            label: 'Origin',
            sortable: true,
            render: (origin: string) => (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <FaMapMarkerAlt className="w-3.5 h-3.5 text-emerald-500" />
                {origin}
              </div>
            ),
          },
          {
            key: 'destination',
            label: 'Destination',
            sortable: true,
            render: (destination: string) => (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <FaMapMarkerAlt className="w-3.5 h-3.5 text-rose-500" />
                {destination}
              </div>
            ),
          },
          {
            key: 'distance',
            label: 'Distance',
            sortable: true,
            render: (distance: number) => (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <FaRoad className="w-3.5 h-3.5 text-slate-400" />
                {distance || 0} km
              </div>
            ),
          },
          {
            key: 'estimatedTime',
            label: 'ETA',
            sortable: true,
            render: (_: any, route: Route) => (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <FaClock className="w-3.5 h-3.5 text-slate-400" />
                {(route as any).estimatedDuration || route.estimatedTime || 0} hrs
              </div>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (status: string) => (
              <StatusBadge
                label={(status || 'active').toUpperCase()}
                status={status || 'active'}
                icon={getStatusIcon(status)}
              />
            ),
          },
          {
            key: 'assignedTrucks',
            label: 'Assigned Trucks',
            render: (assigned: any) => (
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <FaTruck className="w-3.5 h-3.5 text-slate-400" />
                {Array.isArray(assigned) ? assigned.length : assigned || 0}
              </div>
            ),
          },
        ] as Column<Route>[]}
        data={filteredAndSortedRoutes}
        loading={routesLoading}
        error={routesError ? 'Failed to load routes' : null}
        onRetry={() => refetchRoutes()}
        getRowId={(row) => row.id}
        searchable={false}
        pagination
        pageSize={10}
        columnVisibility
        stickyHeader
        striped
        hoverable
        emptyMessage={
          searchTerm || statusFilter !== 'all'
            ? 'No routes match your current filters'
            : 'Create your first route to get started'
        }
        rowActions={[
          {
            key: 'view',
            label: 'View Details',
            icon: <FaEye className="w-3.5 h-3.5" />,
            onClick: openDetailsModal,
          },
          {
            key: 'edit',
            label: 'Edit Route',
            icon: <FaEdit className="w-3.5 h-3.5" />,
            onClick: openEditModal,
          },
          {
            key: 'assign',
            label: 'Assign to Truck',
            icon: <FaTruck className="w-3.5 h-3.5" />,
            onClick: openAssignModal,
          },
          {
            key: 'delete',
            label: 'Delete Route',
            icon: <FaTrash className="w-3.5 h-3.5" />,
            variant: 'danger',
            divider: true,
            onClick: handleDelete,
          },
        ] as TableAction<Route>[]}
        ariaLabel="Tenant routes"
      />

      {/* Create Route Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaPlus className="text-blue-600" />
                Create New Route
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-300 transition-colors"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Status *</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Origin *</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Description</label>
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
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-slate-300">
                  Route is active
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 transition-colors"
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
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaEdit className="text-blue-600" />
                Edit Route
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-300 transition-colors"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Status *</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Origin *</label>
                  <input
                    type="text"
                    required
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Description</label>
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
                <label htmlFor="isActiveEdit" className="text-sm text-gray-700 dark:text-slate-300">
                  Route is active
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 transition-colors"
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
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaRoute className="text-blue-600" />
                Route Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-300 transition-colors"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Route Name</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedRoute.name}</p>
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
                  <p className="text-gray-900 dark:text-white flex items-center gap-2">
                    <FaMapMarkerAlt className="w-4 h-4 text-green-500" />
                    {selectedRoute.origin}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Destination</label>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2">
                    <FaMapMarkerAlt className="w-4 h-4 text-red-500" />
                    {selectedRoute.destination}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Distance</label>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2">
                    <FaRoad className="w-4 h-4 text-gray-400" />
                    {selectedRoute.distance || 0} km
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estimated Time</label>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2">
                    <FaClock className="w-4 h-4 text-gray-400" />
                    {selectedRoute.estimatedDuration || selectedRoute.estimatedTime || 0} hours
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned Trucks</label>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2">
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
                  <p className="text-gray-900 dark:text-white mt-1">{selectedRoute.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Route to Truck Modal */}
      {showAssignModal && selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaTruck className="text-green-600" />
                Assign Route to Truck
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-300 transition-colors"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">
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
                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <FaTruck className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
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

