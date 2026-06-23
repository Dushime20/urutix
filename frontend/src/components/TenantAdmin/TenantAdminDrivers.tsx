import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fleetApi, type Driver } from '../../services/fleetApi';
import { driverApi } from '../../services/driverApi';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  User,
  Mail,
  Phone,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  RefreshCw,
  Clock,
  Briefcase,
  UserX,
  X,
  LayoutGrid,
  List
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';

interface DriverStats {
  totalDrivers: number;
  activeDrivers: number;
  inactiveDrivers: number;
  availableDrivers: number;
  inTransitDrivers: number;
  totalExperience: number;
}

const TenantAdminDrivers: React.FC = () => {
  const queryClient = useQueryClient();

  // State
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'experience' | 'status' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Driver creation mode: 'new' or 'existing'
  const [driverCreationMode, setDriverCreationMode] = useState<'new' | 'existing'>('new');
  const [existingDriverSearch, setExistingDriverSearch] = useState('');
  const [selectedExistingDriver, setSelectedExistingDriver] = useState<any | null>(null);

  // Form state
  const [formData, setFormData] = useState<Pick<Driver, 'firstName' | 'lastName' | 'email' | 'phone' | 'licenseNumber' | 'status' | 'availabilityStatus'>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    status: 'ACTIVE',
    availabilityStatus: 'AVAILABLE',
  });

  // Fetch drivers
  const {
    data: drivers = [],
    isLoading: driversLoading,
    error: driversError,
    refetch: refetchDrivers,
  } = useQuery({
    queryKey: ['tenant-drivers'],
    queryFn: async () => {
      const data = await fleetApi.getDrivers({});
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

  // Fetch all available drivers for selection (when adding existing driver)
  const { data: allAvailableDrivers = [] } = useQuery({
    queryKey: ['all-available-drivers', existingDriverSearch],
    queryFn: async () => {
      try {
        const data = await driverApi.getDrivers({
          search: existingDriverSearch,
          status: 'ACTIVE'
        });
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching available drivers:', error);
        return [];
      }
    },
    enabled: driverCreationMode === 'existing' && existingDriverSearch.length > 0,
  });

  // Create driver mutation
  const createMutation = useMutation({
    mutationFn: async (driverData: Partial<Driver>) => {
      return await fleetApi.createDriver(driverData as any);
    },
    onSuccess: () => {
      toast.success('Driver created successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-drivers'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create driver');
    },
  });

  // Add existing driver mutation (assign to tenant)
  const addExistingDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      // Update the driver to assign them to the current tenant
      // This assumes the backend will handle tenant assignment
      await driverApi.getDriverProfile(driverId);
      return await fleetApi.updateDriver(driverId, {
        // The backend should handle tenant/employer assignment based on the authenticated user
        status: 'ACTIVE',
        availabilityStatus: 'AVAILABLE',
      });
    },
    onSuccess: () => {
      toast.success('Driver added successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['all-available-drivers'] });
      setShowCreateModal(false);
      resetForm();
      setSelectedExistingDriver(null);
      setExistingDriverSearch('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add existing driver');
    },
  });

  // Update driver mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Driver> }) => {
      return await fleetApi.updateDriver(id, data);
    },
    onSuccess: () => {
      toast.success('Driver updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-drivers'] });
      setShowEditModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update driver');
    },
  });

  // Delete driver mutation
  const deleteMutation = useMutation({
    mutationFn: async (driverId: string) => {
      return await fleetApi.deleteDriver(driverId);
    },
    onSuccess: () => {
      toast.success('Driver deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-drivers'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete driver');
    },
  });

  // Assign driver to truck mutation
  const assignMutation = useMutation({
    mutationFn: async ({ driverId, truckId }: { driverId: string; truckId: string }) => {
      return await fleetApi.assignDriverToTruck(truckId, driverId);
    },
    onSuccess: () => {
      toast.success('Driver assigned to truck successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-drivers'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-trucks'] });
      setShowAssignModal(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to assign driver');
    },
  });

  // Calculate statistics
  const stats: DriverStats = useMemo(() => {
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter((d) => d.status?.toUpperCase() === 'ACTIVE').length;
    const inactiveDrivers = totalDrivers - activeDrivers;
    const availableDrivers = drivers.filter(
      (d) => d.availabilityStatus?.toUpperCase() === 'AVAILABLE',
    ).length;
    const inTransitDrivers = drivers.filter(
      (d) => d.availabilityStatus?.toUpperCase() === 'IN_TRANSIT',
    ).length;
    const totalExperience = drivers.reduce((sum, d) => {
      const exp = typeof d.experience === 'number' ? d.experience : Number(d.experience) || 0;
      return sum + exp;
    }, 0);

    return {
      totalDrivers,
      activeDrivers,
      inactiveDrivers,
      availableDrivers,
      inTransitDrivers,
      totalExperience,
    };
  }, [drivers]);

  // Filter and sort drivers
  const filteredAndSortedDrivers = useMemo(() => {
    const filtered = drivers.filter((driver) => {
      const matchesSearch =
        !searchTerm ||
        driver.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || driver.status?.toUpperCase() === statusFilter.toUpperCase();

      const matchesAvailability =
        availabilityFilter === 'all' ||
        driver.availabilityStatus?.toUpperCase() === availabilityFilter.toUpperCase();

      return matchesSearch && matchesStatus && matchesAvailability;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName || ''} ${a.lastName || ''}`.trim();
          bValue = `${b.firstName || ''} ${b.lastName || ''}`.trim();
          break;
        case 'experience':
          aValue = typeof a.experience === 'number' ? a.experience : Number(a.experience) || 0;
          bValue = typeof b.experience === 'number' ? b.experience : Number(b.experience) || 0;
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
  }, [drivers, searchTerm, statusFilter, availabilityFilter, sortBy, sortOrder]);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      status: 'ACTIVE',
      availabilityStatus: 'AVAILABLE',
    });
    setEditingDriver(null);
    setDriverCreationMode('new');
    setSelectedExistingDriver(null);
    setExistingDriverSearch('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      firstName: driver.firstName || '',
      lastName: driver.lastName || '',
      email: driver.email || '',
      phone: driver.phone || '',
      licenseNumber: driver.licenseNumber || '',
      status: (driver.status || 'ACTIVE'),
      availabilityStatus: (driver.availabilityStatus || 'AVAILABLE').toUpperCase(),
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
  };

  const openAssignModal = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowAssignModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (driverCreationMode === 'existing') {
      if (!selectedExistingDriver) {
        toast.error('Please select a driver to add');
        return;
      }
      addExistingDriverMutation.mutate(selectedExistingDriver.id);
      return;
    }

    createMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      licenseNumber: formData.licenseNumber,
      status: formData.status,
      availabilityStatus: formData.availabilityStatus,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    updateMutation.mutate({
      id: editingDriver.id,
      data: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        status: formData.status,
        availabilityStatus: formData.availabilityStatus,
      },
    });
  };

  const handleDelete = async (driver: Driver) => {
    if (!confirm(`Are you sure you want to delete driver "${driver.firstName} ${driver.lastName}"?`))
      return;
    deleteMutation.mutate(driver.id);
  };

  const handleAssign = async (truckId: string) => {
    if (!selectedDriver) return;
    assignMutation.mutate({ driverId: selectedDriver.id, truckId });
  };

  const getStatusColor = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE') return 'bg-green-100 text-green-800';
    if (s === 'INACTIVE') return 'bg-gray-100 text-gray-800';
    if (s === 'SUSPENDED') return 'bg-red-100 text-red-800';
    if (s === 'ON_LEAVE') return 'bg-yellow-100 text-yellow-800';
    if (s === 'TERMINATED') return 'bg-red-100 text-red-800';
    if (s === 'IN_TRANSIT') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE') return <CheckCircle2 className="w-4 h-4" />;
    if (s === 'INACTIVE' || s === 'TERMINATED') return <XCircle className="w-4 h-4" />;
    if (s === 'SUSPENDED' || s === 'ON_LEAVE') return <AlertTriangle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const getAvailabilityColor = (availability?: string) => {
    const a = (availability || '').toUpperCase();
    if (a === 'AVAILABLE') return 'bg-green-100 text-green-800';
    if (a === 'UNAVAILABLE') return 'bg-gray-100 text-gray-800';
    if (a === 'IN_TRANSIT') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (driversLoading) {
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
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-inner">
                <Users size={20} />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Driver Management</h2>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fleet Drivers</h1>
            <p className="text-gray-500 font-medium mt-1">Manage and monitor your tenant drivers</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetchDrivers()}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              New Driver
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Drivers"
            value={stats.totalDrivers}
            icon={<Users />}
            color="primary"
            subtitle="Fleet Size"
            variant="classic"
          />
          <StatCard
            title="Active Drivers"
            value={stats.activeDrivers}
            icon={<CheckCircle2 />}
            color="success"
            subtitle="Operational"
            variant="classic"
          />
          <StatCard
            title="Inactive"
            value={stats.inactiveDrivers}
            icon={<UserX />}
            color="secondary"
            subtitle="Off Duty"
            variant="classic"
          />
          <StatCard
            title="Available"
            value={stats.availableDrivers}
            icon={<Clock />}
            color="info"
            subtitle="Ready"
            variant="classic"
          />
          <StatCard
            title="In Transit"
            value={stats.inTransitDrivers}
            icon={<Truck />}
            color="warning"
            subtitle="On Job"
            variant="classic"
          />
          <StatCard
            title="Experience"
            value={`${stats.totalExperience.toFixed(0)} yrs`}
            icon={<Briefcase />}
            variant="classic"
            color="accent"
            subtitle="Cumulative"
          />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="TERMINATED">Terminated</option>
              <option value="IN_TRANSIT">In Transit</option>
            </select>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Availability</option>
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
              <option value="IN_TRANSIT">In Transit</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="experience">Sort by Experience</option>
              <option value="status">Sort by Status</option>
              <option value="createdAt">Sort by Date</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </button>

            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-all ${viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {driversError ? (
          <div className="p-6 text-center">
            <div className="text-red-600 mb-2">Failed to load drivers</div>
            <button
              onClick={() => refetchDrivers()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredAndSortedDrivers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg mb-2">No drivers found</p>
            <p className="text-slate-500 text-sm mb-4">
              {searchTerm || statusFilter !== 'all' || availabilityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first driver to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && availabilityFilter === 'all' && (
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Driver
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Availability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Truck
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {driver.firstName} {driver.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{driver.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {driver.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {driver.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        {driver.licenseNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        {typeof driver.experience === 'number'
                          ? `${driver.experience} yrs`
                          : driver.experience || '0 yrs'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          driver.status,
                        )}`}
                      >
                        {getStatusIcon(driver.status)}
                        {(driver.status || 'ACTIVE').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(
                          driver.availabilityStatus,
                        )}`}
                      >
                        {(driver.availabilityStatus || 'AVAILABLE').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {driver.currentTruckId ? (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Truck className="w-4 h-4 text-gray-400" />
                          <span className="text-xs">Assigned</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailsModal(driver)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(driver)}
                          className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded transition-colors"
                          title="Edit Driver"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openAssignModal(driver)}
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-colors"
                          title="Assign to Truck"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(driver)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                          title="Delete Driver"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
            {filteredAndSortedDrivers.map((driver) => (
              <div
                key={driver.id}
                className="bg-white rounded-[24px] border border-slate-100 p-6 hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(
                      driver.status,
                    )}`}
                  >
                    {getStatusIcon(driver.status)}
                    {(driver.status || 'ACTIVE')}
                  </span>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">
                    {driver.firstName} {driver.lastName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <CreditCard className="w-3 h-3" />
                    {driver.licenseNumber}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span className="truncate">{driver.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span>{driver.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Truck className="w-4 h-4 text-blue-400" />
                    <span className="truncate">
                      {driver.currentTruckId ? 'Assigned to Truck' : 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center pt-4 border-t border-slate-50 gap-2">
                  <button
                    onClick={() => openDetailsModal(driver)}
                    className="flex-1 h-9 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => openEditModal(driver)}
                    className="h-9 w-9 flex items-center justify-center bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(driver)}
                    className="h-9 w-9 flex items-center justify-center bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Driver Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Plus className="text-blue-600" />
                {driverCreationMode === 'new' ? 'Create New Driver' : 'Add Existing Driver'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Mode Selection Toggle */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Option
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="driverMode"
                      value="new"
                      checked={driverCreationMode === 'new'}
                      onChange={(e) => setDriverCreationMode(e.target.value as 'new' | 'existing')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Create New Driver</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="driverMode"
                      value="existing"
                      checked={driverCreationMode === 'existing'}
                      onChange={(e) => setDriverCreationMode(e.target.value as 'new' | 'existing')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Add Existing Driver</span>
                  </label>
                </div>
              </div>

              {/* Existing Driver Selection */}
              {driverCreationMode === 'existing' && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search for Driver *
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={existingDriverSearch}
                        onChange={(e) => setExistingDriverSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Search by name, email, phone, or license number..."
                      />
                    </div>
                  </div>

                  {/* Driver Results */}
                  {existingDriverSearch.length > 0 && (
                    <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                      {allAvailableDrivers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No drivers found. Try a different search term.
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {allAvailableDrivers.map((driver) => (
                            <div
                              key={driver.id}
                              onClick={() => {
                                setSelectedExistingDriver(driver);
                                setExistingDriverSearch(`${driver.firstName} ${driver.lastName} - ${driver.email}`);
                              }}
                              className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors ${selectedExistingDriver?.id === driver.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {driver.firstName} {driver.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {driver.email} • {driver.phone}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    License: {driver.licenseNumber}
                                  </div>
                                </div>
                                {selectedExistingDriver?.id === driver.id && (
                                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedExistingDriver && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">
                          Selected: {selectedExistingDriver.firstName} {selectedExistingDriver.lastName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* New Driver Form */}
              {driverCreationMode === 'new' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="DL123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Driver['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="ON_LEAVE">On Leave</option>
                      <option value="TERMINATED">Terminated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability Status *
                    </label>
                    <select
                      value={formData.availabilityStatus}
                      onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="UNAVAILABLE">Unavailable</option>
                      <option value="IN_TRANSIT">In Transit</option>
                    </select>
                  </div>
                </div>
              )}
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
                  disabled={createMutation.isPending || addExistingDriverMutation.isPending || (driverCreationMode === 'existing' && !selectedExistingDriver)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(createMutation.isPending || addExistingDriverMutation.isPending) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {driverCreationMode === 'existing' ? 'Adding...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {driverCreationMode === 'existing' ? 'Add Driver' : 'Create Driver'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {showEditModal && editingDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="text-blue-600" />
                Edit Driver
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Driver['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability Status *
                  </label>
                  <select
                    value={formData.availabilityStatus}
                    onChange={(e) => setFormData({ ...formData, availabilityStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                    <option value="IN_TRANSIT">In Transit</option>
                  </select>
                </div>
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
                      <Edit2 className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Details Modal */}
      {showDetailsModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <User className="text-blue-600" />
                Driver Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedDriver.firstName} {selectedDriver.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      selectedDriver.status,
                    )}`}
                  >
                    {getStatusIcon(selectedDriver.status)}
                    {(selectedDriver.status || 'ACTIVE').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {selectedDriver.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {selectedDriver.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">License Number</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    {selectedDriver.licenseNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Experience</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {typeof selectedDriver.experience === 'number'
                      ? `${selectedDriver.experience} years`
                      : selectedDriver.experience || '0 years'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Availability Status</label>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getAvailabilityColor(
                      selectedDriver.availabilityStatus,
                    )}`}
                  >
                    {(selectedDriver.availabilityStatus || 'AVAILABLE').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned Truck</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    {selectedDriver.currentTruckId ? 'Assigned' : 'Not assigned'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver to Truck Modal */}
      {showAssignModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Truck className="text-green-600" />
                Assign Driver to Truck
              </h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Select a truck to assign driver: <strong>{selectedDriver.firstName} {selectedDriver.lastName}</strong>
                </p>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {trucks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No trucks available</p>
                ) : (
                  trucks.map((truck) => {
                    const isAssigned = truck.assignedDrivers?.some(
                      (d: any) => d.driverId === selectedDriver.id,
                    );
                    return (
                      <div
                        key={truck.id}
                        className={`p-4 border rounded-lg transition-colors ${isAssigned
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Truck className="w-5 h-5 text-gray-400" />
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
                                <CheckCircle2 className="w-4 h-4" />
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

export default TenantAdminDrivers;

