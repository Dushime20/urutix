import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { fleetApi, type Driver, type FleetItem } from '../../services/fleetApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaEye,
  FaSync,
  FaClock,
  FaStar,
  FaMapMarkerAlt,
} from 'react-icons/fa';

interface DriverStats {
  totalDrivers: number;
  activeDrivers: number;
  inactiveDrivers: number;
  availableDrivers: number;
  inTransitDrivers: number;
  totalExperience: number;
}

const TenantAdminDrivers: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // State
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

  // Form state
  const [formData, setFormData] = useState({
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

  // Create driver mutation
  const createMutation = useMutation({
    mutationFn: async (driverData: Partial<Driver>) => {
      return await fleetApi.createDriver(driverData);
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
    let filtered = drivers.filter((driver) => {
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
      status: (driver.status || 'ACTIVE').toUpperCase(),
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
    if (s === 'ACTIVE') return <FaCheckCircle className="w-4 h-4" />;
    if (s === 'INACTIVE' || s === 'TERMINATED') return <FaTimesCircle className="w-4 h-4" />;
    if (s === 'SUSPENDED' || s === 'ON_LEAVE') return <FaExclamationTriangle className="w-4 h-4" />;
    return <FaTimesCircle className="w-4 h-4" />;
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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaUsers className="text-blue-600" />
              Driver Management
            </h1>
            <p className="text-gray-600 mt-2">Manage and monitor your tenant drivers</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetchDrivers()}
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
              New Driver
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Drivers</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalDrivers}</p>
              </div>
              <FaUsers className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active Drivers</p>
                <p className="text-2xl font-bold text-green-900">{stats.activeDrivers}</p>
              </div>
              <FaCheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Inactive Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactiveDrivers}</p>
              </div>
              <FaTimesCircle className="w-8 h-8 text-gray-600 opacity-50" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Available</p>
                <p className="text-2xl font-bold text-green-900">{stats.availableDrivers}</p>
              </div>
              <FaCheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">In Transit</p>
                <p className="text-2xl font-bold text-blue-900">{stats.inTransitDrivers}</p>
              </div>
              <FaTruck className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Experience</p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.totalExperience.toFixed(0)} yrs
                </p>
              </div>
              <FaClock className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers..."
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
            <FaFilter className="w-4 h-4" />
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </button>
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
            <FaUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No drivers found</p>
            <p className="text-gray-500 text-sm mb-4">
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
        ) : (
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
                          <FaUser className="w-5 h-5 text-blue-600" />
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
                            <FaPhone className="w-3 h-3 text-gray-400" />
                            {driver.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <FaIdCard className="w-4 h-4 text-gray-400" />
                        {driver.licenseNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <FaClock className="w-4 h-4 text-gray-400" />
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
                          <FaTruck className="w-4 h-4 text-gray-400" />
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
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(driver)}
                          className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded transition-colors"
                          title="Edit Driver"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openAssignModal(driver)}
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-colors"
                          title="Assign to Truck"
                        >
                          <FaTruck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(driver)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                          title="Delete Driver"
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

      {/* Create Driver Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaPlus className="text-blue-600" />
                Create New Driver
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
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                      Create Driver
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaEdit className="text-blue-600" />
                Edit Driver
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
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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

      {/* Driver Details Modal */}
      {showDetailsModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaUser className="text-blue-600" />
                Driver Details
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
                    <FaEnvelope className="w-4 h-4 text-gray-400" />
                    {selectedDriver.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <FaPhone className="w-4 h-4 text-gray-400" />
                    {selectedDriver.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">License Number</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <FaIdCard className="w-4 h-4 text-gray-400" />
                    {selectedDriver.licenseNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Experience</label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <FaClock className="w-4 h-4 text-gray-400" />
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
                    <FaTruck className="w-4 h-4 text-gray-400" />
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FaTruck className="text-green-600" />
                Assign Driver to Truck
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

export default TenantAdminDrivers;

